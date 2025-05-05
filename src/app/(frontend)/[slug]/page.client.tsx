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

  const isPublicPage = url === '/' || url === '/terms-and-conditions';

  useEffect(() => {
    setHeaderTheme('light')
  }, [setHeaderTheme])

  useEffect(() => {
    // Skip checks for public pages
    if (isPublicPage) {
      return;
    }

    // For protected pages, first check authentication status
    // Assuming currentUser being null means user is not logged in (or context is loading)
    // TODO: Consider adding a loading state from useUserContext if available to prevent premature redirect
    if (!currentUser) {
      console.log('User not found, redirecting to login from page client effect.')
      router.push('/login');
      return; // Don't proceed to subscription checks if not logged in
    }

    // If authenticated, *then* check subscription status (once loaded and no other errors)
    if (!isLoading && !error && !isSubscribed) {
      console.log('User authenticated but not subscribed, redirecting to subscribe.')
      router.push('/subscribe');
    }

  }, [currentUser, isSubscribed, isLoading, error, router, isPublicPage, url]); // Add isPublicPage back to dependencies

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

  const shouldRenderContent = isPublicPage || (currentUser && isSubscribed)

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
