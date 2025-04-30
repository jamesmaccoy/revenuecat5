'use client'

import { useEffect, useState } from 'react'
import { useRevenueCat } from '@/providers/RevenueCat'

export type SubscriptionStatus = {
  isSubscribed: boolean
  entitlements: string[]
  expirationDate: Date | null
  isLoading: boolean
  error: Error | null
}

export const useSubscription = (entitlementId?: string): SubscriptionStatus => {
  const { customerInfo, isLoading: isRevenueCatLoading, error: revenueCatError } = useRevenueCat()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    entitlements: [],
    expirationDate: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // First check with RevenueCat client-side
        if (customerInfo) {
          const entitlements = customerInfo.entitlements || {}
          const activeEntitlements = Object.keys(entitlements).filter(
            key => entitlements[key]?.isActive
          )

          const isSubscribed = entitlementId
            ? activeEntitlements.includes(entitlementId)
            : activeEntitlements.length > 0

          if (isSubscribed) {
            setSubscriptionStatus({
              isSubscribed: true,
              entitlements: activeEntitlements,
              expirationDate: entitlementId && entitlements[entitlementId]?.expirationDate
                ? new Date(entitlements[entitlementId].expirationDate)
                : activeEntitlements.length > 0 && entitlements[activeEntitlements[0]]?.expirationDate
                  ? new Date(entitlements[activeEntitlements[0]].expirationDate)
                  : null,
              isLoading: false,
              error: null,
            })
            return
          }
        }

        // If not subscribed client-side, check with the API
        const response = await fetch('/api/check-subscription', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to check subscription status')
        }

        const { hasActiveSubscription } = await response.json()

        setSubscriptionStatus({
          isSubscribed: hasActiveSubscription,
          entitlements: [],
          expirationDate: null,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        console.error('Error checking subscription status:', err)
        setSubscriptionStatus(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err : new Error('Unknown error checking subscription status'),
        }))
      }
    }

    if (!isRevenueCatLoading) {
      checkSubscription()
    }
  }, [customerInfo, isRevenueCatLoading, entitlementId, revenueCatError])

  return subscriptionStatus
} 