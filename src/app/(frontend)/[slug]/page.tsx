import type { Metadata } from 'next'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import config from '@/payload.config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'
import { redirect, notFound } from 'next/navigation'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { getCachedDocument } from '@/utilities/getDocument'

import type { Page as PageType, Post } from '@/payload-types'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

type Args = {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  
  // Get pages
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    pagination: false,
    select: {
      slug: true,
    },
  })

  // Get posts
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    pagination: false,
    select: {
      slug: true,
    },
  })

  // Ensure we have valid slugs
  const params = [
    ...(pages.docs || []),
    ...(posts.docs || []),
  ]
    .filter((doc) => {
      return doc.slug && doc.slug !== 'home'
    })
    .map(({ slug }) => {
      if (!slug) return null
      return { slug }
    })
    .filter((param): param is { slug: string } => param !== null)

  return params
}

export default async function Page({ params }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = params
  const url = '/' + (slug === 'home' ? '' : slug)

  const redirects = await getCachedRedirects()()
  const redirectItem = redirects.find((r) => r.from === url)

  if (redirectItem) {
    if (redirectItem.to?.url) {
      redirect(redirectItem.to.url)
    }

    if (redirectItem.to?.reference?.value) {
      let redirectUrl: string | undefined;
      const { relationTo, value } = redirectItem.to.reference;

      if (typeof value === 'string') {
        const document = (await getCachedDocument(relationTo, value)()) as PageType | Post;
        if (document?.slug) {
          redirectUrl = `${relationTo !== 'pages' ? `/${relationTo}` : ''}/${document.slug}`; 
        }
      } else if (typeof value === 'object' && value?.slug) {
         redirectUrl = `${relationTo !== 'pages' ? `/${relationTo}` : ''}/${value.slug}`;
      }

      if (redirectUrl) {
        redirect(redirectUrl);
      }
    }
    console.warn(`Redirect found for ${url} but has invalid target.`);
  }

  // First try to find a page
  const page = await queryPageBySlug({
    slug,
  })

  if (!page && slug === 'home') {
    return <PageClient page={homeStatic} draft={draft} url={url} />
  }

  if (!page) {
    // If no page found, try to find a post
    const post = await queryPostBySlug({
      slug,
    })

    if (post) {
      // If it's a post, redirect to the posts route
      redirect(`/posts/${slug}`)
    }

    return <PageClient page={null} draft={draft} url={url} />
  }

  return <PageClient page={page} draft={draft} url={url} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = 'home' } = params
  const page = await queryPageBySlug({
    slug,
  })

  if (!page) {
    return {}
  }

  return generateMeta({ doc: page })
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }): Promise<PageType | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'pages',
    draft,
    depth: 2,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

const queryPostBySlug = cache(async ({ slug }: { slug: string }): Promise<Post | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'posts',
    draft,
    depth: 2,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
