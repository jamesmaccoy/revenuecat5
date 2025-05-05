'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import type { Page as PageType } from '@/payload-types'
import { RenderHero } from '@/heros/RenderHero'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'

interface PageClientProps {
  page: PageType | null
  draft: boolean
  url: string
}

const PageClient: React.FC<PageClientProps> = ({ page, draft, url }) => {
  const { setHeaderTheme } = useHeaderTheme()
  const router = useRouter()
  const { currentUser } = useUserContext()
  const { isSubscribed, isLoading, error } = useSubscription()

  const isPublicPage = url === '/';

  useEffect(() => {
    setHeaderTheme('light')
  }, [setHeaderTheme])

  useEffect(() => {
    // If it's the homepage or terms-and-conditions, don't enforce login/subscription
    if (isPublicPage || url === '/terms-and-conditions') {
      return;
    }

    // For all other pages, check user and subscription status
    if (page && !isLoading && !error) {
      if (!currentUser) {
        router.push('/login')
      } else if (!isSubscribed) {
        router.push('/subscribe')
      }
    }
    // Ensure all dependencies used in the effect are listed
  }, [page, currentUser, isSubscribed, isLoading, error, router, isPublicPage, url])

  if (!page) {
    return <PayloadRedirects url={url} disableNotFound={false} />
  }

  if (!isPublicPage && url !== '/terms-and-conditions') {
    if (isLoading) {
      return (
        <div className="container py-12">
          <p>Loading user data...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="container py-12">
          <p className="text-error">Error loading subscription: {error.message}</p>
        </div>
      )
    }
  }

  const shouldRenderContent = isPublicPage || url === '/terms-and-conditions' || (currentUser && isSubscribed)

  if (shouldRenderContent) {
    const { hero, layout } = page

    return (
      <article className="pt-16 pb-24">
        {draft && <LivePreviewListener />}

        <RenderHero {...hero} />
        <RenderBlocks blocks={layout} />
      </article>
    )
  }

  return (
    <div className="container py-12">
      <p>Checking access...</p>
    </div>
  )
}

export default PageClient
