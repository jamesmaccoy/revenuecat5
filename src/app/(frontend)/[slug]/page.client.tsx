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
  const { currentUser, isLoading: isUserLoading } = useUserContext()
  const { isSubscribed, isLoading: isSubscriptionLoading, error: subscriptionError } = useSubscription()

  const isPublicPage = url === '/' || url === '/terms-and-conditions';

  useEffect(() => {
    setHeaderTheme('light')
  }, [setHeaderTheme])

  useEffect(() => {
    // Skip checks for public pages
    if (isPublicPage) {
      return;
    }

    // Wait for user context to finish loading
    if (isUserLoading) {
      console.log('User context loading...')
      return; // Don't proceed until user context is loaded
    }

    // For protected pages, *after* user context has loaded, check authentication status
    if (!currentUser) {
      console.log('User context loaded, user not found, redirecting to login.')
      router.push('/login');
      return; // Don't proceed to subscription checks if not logged in
    }

    // Wait for subscription check to finish loading (if user is logged in)
    if (isSubscriptionLoading) {
      console.log('Subscription context loading...');
      return; // Don't proceed until subscription check is done
    }

    // If authenticated, subscription loaded, no error, *then* check if subscribed
    if (!subscriptionError && !isSubscribed) {
      console.log('User authenticated but not subscribed, redirecting to subscribe.')
      router.push('/subscribe');
    }

  }, [currentUser, isUserLoading, isSubscribed, isSubscriptionLoading, subscriptionError, router, isPublicPage, url]); // Updated dependencies

  if (!page) {
    return <PayloadRedirects url={url} disableNotFound={false} />
  }

  // Show loading/error only for pages that require subscription check
  if (!isPublicPage) { // Simplified check using isPublicPage
    if (isUserLoading || isSubscriptionLoading) { // Check both loading states
      return (
        <div className="container py-12">
          <p>Loading user data...</p> // Preparing your booking
        </div>
      )
    }

    if (subscriptionError) { // Show subscription error only if it occurs
      return (
        <div className="container py-12">
          <p className="text-error">Error loading subscription: {subscriptionError.message}</p>
        </div>
      )
    }
  }

  // Allow rendering for public pages or authenticated+subscribed users (after loading)
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
