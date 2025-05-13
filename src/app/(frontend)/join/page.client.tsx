// app/(frontend)/join/page.client.tsx
"use client"

import { useState, useEffect } from "react"
import type { User } from "@/payload-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRevenueCat } from "@/providers/RevenueCat"
import { Purchases, type Package, type PurchasesError, ErrorCode } from "@revenuecat/purchases-js"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from 'lucide-react'

export default function JoinClient({ bookingTotal = 'N/A', bookingDuration = 'N/A' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isInitialized } = useRevenueCat()
  
  const [guests, setGuests] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Payment states
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [offerings, setOfferings] = useState<Package[]>([])
  const [loadingOfferings, setLoadingOfferings] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  
  // Get postId from URL if available
  const postId = searchParams?.get('postId') || ''

  // Calculate total price
  const totalPrice = 
    !isNaN(Number(bookingTotal)) && !isNaN(Number(bookingDuration))
      ? Number(bookingTotal) * Number(bookingDuration)
      : null

  useEffect(() => {
    // Fetch guests
    const fetchGuests = async () => {
      try {
        const response = await fetch('/api/guests')
        if (!response.ok) {
          throw new Error('Failed to fetch guests')
        }
        const data = await response.json()
        setGuests(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGuests()
  }, [])

  // Load RevenueCat offerings when initialized
  useEffect(() => {
    if (isInitialized) {
      loadOfferings()
    }
  }, [isInitialized])

  const loadOfferings = async () => {
    setLoadingOfferings(true)
    try {
      const fetchedOfferings = await Purchases.getSharedInstance().getOfferings()
      console.log("Fetched Offerings Object:", fetchedOfferings)
      if (fetchedOfferings.current && fetchedOfferings.current.availablePackages.length > 0) {
        setOfferings(fetchedOfferings.current.availablePackages)
      } else {
        console.warn("No current offering or packages found.")
        setOfferings([])
      }
    } catch (err) {
      setPaymentError("Failed to load booking options")
      console.error("Error loading offerings:", err)
    } finally {
      setLoadingOfferings(false)
    }
  }

  const handleBooking = async () => {
    setPaymentLoading(true)
    setPaymentError(null)
    
    try {
      // Find the booking package - adjust the identifier to match your RevenueCat setup
      // You might need to change this identifier based on your RevenueCat setup
      const bookingPackage = offerings.find(pkg => 
        pkg.webBillingProduct?.identifier === "booking_package" || 
        pkg.webBillingProduct?.identifier === "monthly_subscription"
      )
      
      if (!bookingPackage) {
        throw new Error("Booking package not found. Please contact support.")
      }
      
      // Process the payment
      await Purchases.getSharedInstance().purchase({
        rcPackage: bookingPackage,
      })
      
      // Calculate dates for the booking
      const fromDate = new Date()
      const toDate = new Date()
      toDate.setDate(toDate.getDate() + parseInt(bookingDuration))
      
      // After successful purchase, save booking to your backend
      const bookingData = {
        postId: postId, // This is required in your schema
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        duration: bookingDuration,
        // You can add selected guests here if you implement that feature
        // guestIds: selectedGuests.map(guest => guest.id),
      }
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save booking')
      }
      
      // Set success state
      setPaymentSuccess(true)
      
      // Redirect to confirmation page after a short delay
      setTimeout(() => {
        router.push(`/booking-confirmation?total=${bookingTotal}&duration=${bookingDuration}`)
      }, 1500)
      
    } catch (purchaseError) {
      const rcError = purchaseError as PurchasesError
      console.error("RevenueCat Purchase Error:", rcError)

      let isCancelled = false
      try {
        if ((rcError as any).code === ErrorCode.UserCancelledError) {
          isCancelled = true
        }
      } catch (e) {
        /* Silently ignore if .code access fails */
      }

      if (isCancelled) {
        console.log("User cancelled the booking flow.")
        setPaymentLoading(false)
        return
      }

      setPaymentError("Failed to complete booking. Please try again or contact support.")
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleShare = () => {
    const urlToShare = window.location.href
    navigator.clipboard
      .writeText(urlToShare)
      .then(() => {
        console.log("Booking URL copied to clipboard:", urlToShare)
      })
      .catch((err) => {
        console.error("Failed to copy URL: ", err)
      })
  }

  if (loading || loadingOfferings) {
    return (
      <div className="container py-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-8">Start your curated stay</h1>
        <p>Loading booking details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-8">Start your curated stay</h1>
        <p className="text-error">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold tracking-tighter mb-8">Start your curated stay</h1>

      {/* Payment Success Message */}
      {paymentSuccess && (
        <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-md">
          <h3 className="text-green-800 font-semibold">Booking Successful!</h3>
          <p className="text-green-700">
            Your booking has been confirmed. Redirecting to confirmation page...
          </p>
        </div>
      )}

      {/* Payment Error Message */}
      {paymentError && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
          <h3 className="text-red-800 font-semibold">Payment Error</h3>
          <p className="text-red-700">
            {paymentError}
          </p>
        </div>
      )}

      {/* Booking Summary */}
      <div className="mb-8 bg-muted p-6 rounded-lg border border-border">
        <h2 className="text-2xl font-semibold mb-4">Booking Summary</h2>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Rate per night:</span>
          <span className="font-medium">R{bookingTotal}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-medium">{bookingDuration} nights</span>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-muted-foreground">Total:</span>
          <span className="text-2xl font-bold">R{totalPrice !== null ? totalPrice : "N/A"}</span>
        </div>

        {/* Complete Booking Button */}
        <Button
          onClick={handleBooking}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={paymentLoading || paymentSuccess || !postId}
        >
          {paymentLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : paymentSuccess ? (
            "Booking Confirmed!"
          ) : !postId ? (
            "Missing Property Information"
          ) : (
            `Complete Booking - R${totalPrice !== null ? totalPrice : "N/A"}`
          )}
        </Button>
        
        {!postId && (
          <p className="text-red-500 text-sm mt-2">
            Property information is missing. Please start from the property page.
          </p>
        )}
      </div>

      {/* Share Booking Section */}
      <div className="mb-8 flex items-center gap-3 bg-muted p-4 rounded-lg border border-border">
        <Input
          type="text"
          value={typeof window !== 'undefined' ? window.location.href : ''}
          readOnly
          className="flex-grow bg-background cursor-default"
        />
        <Button variant="secondary" onClick={handleShare}>Share Booking</Button>
      </div>

      {/* Guests Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4">Available Guests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guests.map((guest) => (
          <div key={guest.id} className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <h3 className="text-xl font-semibold mb-3">{guest.name}</h3>
            <p className="text-muted-foreground mb-2">Email: {guest.email}</p>
            <p className="text-muted-foreground">Role: {guest.role?.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}