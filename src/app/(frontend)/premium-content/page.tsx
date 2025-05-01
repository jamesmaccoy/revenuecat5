'use client'

import React, { Suspense, useState } from 'react' // Import Suspense and useState
import { useRouter, useSearchParams } from 'next/navigation'
import { Purchases, Package } from '@revenuecat/purchases-js' // Use web SDK and Package type
import { useUserContext } from '@/context/UserContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button' // Assuming you have a Button component
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

  return (
    <>
      {/* Wrap the part using useSearchParams in Suspense */}
      <Suspense fallback={<PremiumContentClient />}>
        <PremiumContentInner />
      </Suspense>
    </>
  )
} 

// New component to contain logic using useSearchParams
function PremiumContentInner() {
  const searchParams = useSearchParams()
  const bookingTotal = searchParams.get('total') ?? 'N/A'
  const bookingDuration = searchParams.get('duration') ?? 'N/A'
  // State for per-night cost fetching
  const [perNightCost, setPerNightCost] = useState<string | null>(null)
  const [isLoadingCost, setIsLoadingCost] = useState(false)
  const [costError, setCostError] = useState<string | null>(null)

  return (
    <>
      {/* Booking Summary Header */}
      <div className="pt-12 pb-6">
        <div className="bg-muted p-6 rounded-lg border border-border mb-6 text-center">
          <h2 className="text-3xl font-semibold mb-2">${bookingTotal}</h2>
          <p className="text-lg text-muted-foreground">Total for {bookingDuration} nights</p>

          {/* Section for Per Night Cost */}
          <div className="mt-4 pt-4 border-t border-border">
            {!perNightCost && !isLoadingCost && !costError && (
              <Button variant="outline" onClick={handleFetchPerNightCost}>
                Show Per Night Cost
              </Button>
            )}
            {isLoadingCost && <p className="text-sm text-muted-foreground">Loading cost...</p>}
            {costError && <p className="text-sm text-error">Error fetching cost: {costError}</p>}
            {perNightCost && (
              <p className="text-lg font-medium">
                Cost per night: {perNightCost}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* The actual premium content */}
      <PremiumContentClient />
    </>
  )

  // --- Helper Functions ---

  async function handleFetchPerNightCost() {
    setIsLoadingCost(true)
    setCostError(null)
    setPerNightCost(null)
    try {
      // --- RevenueCat Logic ---
      // 1. Fetch Offerings
      const offerings = await Purchases.getOfferings()

      // 2. Find your specific offering (e.g., 'booking_extras')
      //    Replace 'booking_extras' with your actual offering identifier
      const currentOffering = offerings.current // Or offerings.all['booking_extras']

      if (!currentOffering) {
        throw new Error('No active RevenueCat offering found.')
      }

      // 3. Find the package representing the "per night" cost
      //    Replace 'per_night_rate' with your actual package identifier
      const perNightPackage = currentOffering.availablePackages.find(
        (pkg: Package) => pkg.identifier === 'per_night_rate' // Use Package type
      )

      if (!perNightPackage) {
        throw new Error("Could not find the 'per_night_rate' package.")
      }

      // 4. Extract the price string
      const costString = perNightPackage.product.priceString
      setPerNightCost(costString)
      // --- End RevenueCat Logic ---

    } catch (error: any) {
      console.error("RevenueCat Error:", error)
      setCostError(error.message || 'Failed to fetch cost.')
    } finally {
      setIsLoadingCost(false)
    }
  } // End of handleFetchPerNightCost
}

// Simple loading component for the Suspense fallback
function PremiumContentLoading() {
  return (
    <div className="container py-12 text-center">
      <p>Loading booking details...</p>
    </div>
  )
}