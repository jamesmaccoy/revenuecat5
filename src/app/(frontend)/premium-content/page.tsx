'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/UserContext'
import { useSubscription } from '@/hooks/useSubscription'
import PremiumContentClient from './page.client'

export default function PremiumContentPage() {
  const router = useRouter()
  const { currentUser } = useUserContext()
  const { isSubscribed, isLoading, error } = useSubscription()

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

  return <PremiumContentClient />
} 