"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import type { Page as PageType } from '@/payload-types'
import { RenderHero } from '@/heros/RenderHero'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { DatePicker } from "@/components/ui/date-picker"

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

  const isPublicPage = url === '/' || url === '/terms-and-conditions'

  // State for date picker
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 5)))

  useEffect(() => {
    setHeaderTheme('light')
  }, [setHeaderTheme])

  useEffect(() => {
    if (isPublicPage) return

    if (isUserLoading) {
      console.log('User context loading...')
      return
    }

    if (!currentUser) {
      console.log('User context loaded, user not found, redirecting to subscribe.')
      router.push('/subscribe')
      return
    }

    if (isSubscriptionLoading) {
      console.log('Subscription context loading...')
      return
    }

    if (!subscriptionError && !isSubscribed) {
      console.log('User authenticated but not subscribed, redirecting to subscribe.')
      router.push('/subscribe')
    }
  }, [currentUser, isUserLoading, isSubscribed, isSubscriptionLoading, subscriptionError, router, isPublicPage, url])

  if (!page) {
    return <PayloadRedirects url={url} disableNotFound={false} />
  }

  if (!isPublicPage) {
    if (isUserLoading || isSubscriptionLoading) {
      return (
        <div className="container py-12">
          <p>Loading user data...</p>
        </div>
      )
    }

    if (subscriptionError) {
      return (
        <div className="container py-12">
          <p className="text-error">Error loading subscription: {subscriptionError.message}</p>
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
        
        <div className="container mt-8 flex flex-col items-center space-y-4">
          {/* Date Picker for Stay Length */}
          <div className="flex flex-col space-y-2 w-full max-w-md">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Stay Length
            </label>
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <DatePicker
                  date={startDate}
                  onSelect={(date) => setStartDate(date || null)}
                  placeholder="Start date"
                  minDate={new Date()}
                />
              </div>
              <span className="text-muted-foreground">to</span>
              <div className="relative w-full">
                <DatePicker
                  date={endDate}
                  onSelect={(date) => setEndDate(date || null)}
                  placeholder="End date"
                  minDate={startDate || undefined}
                />
              </div>
            </div>
          </div>

          {/* Request Availability Button */}
          <button
            className="px-4 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-100"
            onClick={() => {
              // Get rate from the page content
              let rate = '150' // Default rate
              const rateElement = document.querySelector('[data-rate], h1, h2, h3, [class*="per-night"], [class*="perNight"]')
              if (rateElement) {
                const rateText = rateElement.textContent || ''
                const rateMatch = rateText.match(/[R$]?(\d+)/)
                if (rateMatch && rateMatch[1]) {
                  rate = rateMatch[1]
                }
              }

              // Calculate duration from selected dates
              let duration = '5' // Default duration
              if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (diffDays > 0) {
                  duration = diffDays.toString()
                }
              }

              // Navigate to join page with parameters
              router.push(`/join?total=${rate}&duration=${duration}&postId=${page?.id || ''}`)
            }}
          >
            Request Availability
          </button>
        </div>
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