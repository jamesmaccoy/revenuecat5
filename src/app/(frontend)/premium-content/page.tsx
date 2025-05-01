'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUserContext } from '@/context/UserContext'
import { useSubscription } from '@/hooks/useSubscription'
import PremiumContentClient from './page.client'

export default function PremiumContentPage() {
  const router = useRouter()
  const { currentUser } = useUserContext()
  const { isSubscribed, isLoading, error } = useSubscription()
  const searchParams = useSearchParams()

  // Get booking details from query params (provide defaults or handle missing params)
  const bookingTotal = searchParams.get('total') ?? 'N/A'
  const bookingDuration = searchParams.get('duration') ?? 'N/A'

  // Only redirect if we're certain about the subscription status
  React.useEffect(() => {
    if (!isLoading && !error) {
      if (!currentUser) {
        router.push('/login')
      } else if (!isSubscribed) {
        router.push('/subscribe')
      }
    }
  }, [currentUser, isSubscribed, isLoading, error, router])

  if (isLoading) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Premium Content</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Premium Content</h1>
        <p className="text-error">Error: {error.message}</p>
      </div>
    )
  }

  // Don't return null here - wait for the useEffect to handle redirects
  if (!currentUser || !isSubscribed) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Premium Content</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      {/* Removed container, added padding directly */}
      <div className="pt-12 pb-6">
        <div className="bg-muted p-6 rounded-lg border border-border mb-6 text-center"> {/* Added text-center and increased padding */}
          <h2 className="text-3xl font-semibold mb-2">${bookingTotal}</h2> {/* Increased size, added $ */}
          <p className="text-lg text-muted-foreground">Total for {bookingDuration} nights</p> {/* Increased size, added muted color */}
        </div>
      </div>
      <PremiumContentClient />
    </>
  )
} 