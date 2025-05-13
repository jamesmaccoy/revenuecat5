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

// Add type for RevenueCat error with code
interface RevenueCatError extends Error {
  code?: ErrorCode;
}

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

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(1)

  const packageDetails = {
    per_night: {
      title: "Per Night",
      description: "Stay just 1 night",
      priceMultiplier: 1,
      minNights: 1,
      maxNights: 1,
      features: [
        "Standard accommodation",
        "Basic amenities",
        "Self-service"
      ]
    },
    per_night_luxury: {
      title: "Per Day VIP",
      description: "Assign a host for drinks and activities",
      priceMultiplier: 2,
      minNights: 1,
      maxNights: 7,
      features: [
        "Dedicated host",
        "Premium amenities",
        "Drinks service",
        "Activity planning",
        "Priority support"
      ]
    }
  }

  const calculateTotalPrice = () => {
    if (!bookingTotal || !selectedPackage) return null
    const basePrice = Number(bookingTotal)
    const multiplier = packageDetails[selectedPackage]?.priceMultiplier || 1
    return basePrice * multiplier * selectedDuration
  }

  const handlePackageSelect = (packageId: string, duration: number) => {
    setSelectedPackage(packageId)
    setSelectedDuration(duration)
  }

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
      console.log("All Offerings:", fetchedOfferings.all)
      
      // Get the per_night offering specifically
      const perNightOffering = fetchedOfferings.all["per_night"]
      
      if (perNightOffering && perNightOffering.availablePackages.length > 0) {
        console.log("Per Night packages:", perNightOffering.availablePackages.map(pkg => ({
          identifier: pkg.webBillingProduct?.identifier,
          product: pkg.webBillingProduct
        })))
        setOfferings(perNightOffering.availablePackages)
      } else {
        console.warn("No packages found in per_night offering")
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
      // Find the appropriate package based on RevenueCat configuration
      const bookingPackage = offerings.find(pkg => {
        const identifier = pkg.webBillingProduct?.identifier
        console.log("Checking package:", identifier)
        return identifier === selectedPackage
      })
      
      if (!bookingPackage) {
        console.error("Available packages:", offerings.map(pkg => ({
          identifier: pkg.webBillingProduct?.identifier,
          product: pkg.webBillingProduct
        })))
        throw new Error("Booking package not found. Please contact support.")
      }

      // Log which package was found
      console.log("Selected package:", {
        identifier: bookingPackage.webBillingProduct?.identifier,
        product: bookingPackage.webBillingProduct
      })
      
      // Process the purchase with better error handling
      try {
        const purchaseResult = await Purchases.getSharedInstance().purchase({
          rcPackage: bookingPackage,
        })
        
        console.log("Purchase successful:", purchaseResult)
        
        // Calculate dates for the booking
        const fromDate = new Date()
        const toDate = new Date()
        toDate.setDate(toDate.getDate() + selectedDuration)
        
        // After successful purchase, save booking to your backend
        const bookingData = {
          postId: postId,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
          duration: selectedDuration,
          packageType: selectedPackage,
          totalAmount: calculateTotalPrice(),
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
          router.push(`/booking-confirmation?total=${calculateTotalPrice()}&duration=${selectedDuration}`)
        }, 1500)
        
      } catch (purchaseError) {
        console.error("Purchase error details:", purchaseError)
        
        // Handle specific RevenueCat error codes
        if (purchaseError instanceof Error) {
          const rcError = purchaseError as RevenueCatError
          
          if (rcError.code === ErrorCode.UserCancelledError) {
            console.log("User cancelled the purchase")
            setPaymentError("Purchase was cancelled. Please try again if you'd like to complete your booking.")
            return
          }
          
          if (rcError.code === ErrorCode.PurchaseInvalidError) {
            console.log("Invalid purchase")
            setPaymentError("There was an issue with the purchase. Please try again or contact support.")
            return
          }
          
          if (rcError.code === ErrorCode.NetworkError) {
            console.log("Network error during purchase")
            setPaymentError("Network error occurred. Please check your connection and try again.")
            return
          }
        }
        
        // Generic error handling
        setPaymentError("Failed to complete purchase. Please try again or contact support.")
        console.error("Purchase error:", purchaseError)
      }
      
    } catch (error) {
      console.error("Booking error:", error)
      setPaymentError(error instanceof Error ? error.message : "An unexpected error occurred")
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
          <h3 className="text-red-800 font-semibold">Booking Error</h3>
          <p className="text-red-700">
            {paymentError}
          </p>
        </div>
      )}

      {/* Package Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Select Your Package</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Per Night Package */}
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPackage === "per_night" && selectedDuration === 1
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handlePackageSelect("per_night", 1)}
          >
            <h3 className="text-xl font-semibold mb-2">{packageDetails.per_night.title}</h3>
            <p className="text-muted-foreground mb-4">{packageDetails.per_night.description}</p>
            <ul className="mb-4 space-y-2">
              {packageDetails.per_night.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">•</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">R{bookingTotal}/night</span>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedPackage === "per_night" && selectedDuration === 1
                  ? "border-primary bg-primary" 
                  : "border-border"
              }`} />
            </div>
          </div>

          {/* 3 Day Package */}
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPackage === "per_night" && selectedDuration === 3
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handlePackageSelect("per_night", 3)}
          >
            <h3 className="text-xl font-semibold mb-2">3 Day Package</h3>
            <p className="text-muted-foreground mb-4">Stay the long weekend</p>
            <ul className="mb-4 space-y-2">
              {packageDetails.per_night.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">•</span>
                  {feature}
                </li>
              ))}
              <li className="flex items-center text-sm text-primary">
                <span className="mr-2">•</span>
                Special weekend rate
              </li>
            </ul>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">R{Number(bookingTotal) * 3}/3 nights</span>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedPackage === "per_night" && selectedDuration === 3
                  ? "border-primary bg-primary" 
                  : "border-border"
              }`} />
            </div>
          </div>

          {/* 7 Day Package */}
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPackage === "per_night" && selectedDuration === 7
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handlePackageSelect("per_night", 7)}
          >
            <h3 className="text-xl font-semibold mb-2">7 Day Package</h3>
            <p className="text-muted-foreground mb-4">Enjoy the entire week</p>
            <ul className="mb-4 space-y-2">
              {packageDetails.per_night.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">•</span>
                  {feature}
                </li>
              ))}
              <li className="flex items-center text-sm text-primary">
                <span className="mr-2">•</span>
                Weekly discount
              </li>
            </ul>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">R{Number(bookingTotal) * 7}/7 nights</span>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedPackage === "per_night" && selectedDuration === 7
                  ? "border-primary bg-primary" 
                  : "border-border"
              }`} />
            </div>
          </div>

          {/* VIP Package */}
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPackage === "per_night_luxury"
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handlePackageSelect("per_night_luxury", 1)}
          >
            <h3 className="text-xl font-semibold mb-2">{packageDetails.per_night_luxury.title}</h3>
            <p className="text-muted-foreground mb-4">{packageDetails.per_night_luxury.description}</p>
            <ul className="mb-4 space-y-2">
              {packageDetails.per_night_luxury.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">•</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">R{Number(bookingTotal) * 2}/night</span>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedPackage === "per_night_luxury"
                  ? "border-primary bg-primary" 
                  : "border-border"
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="mb-8 bg-muted p-6 rounded-lg border border-border">
        <h2 className="text-2xl font-semibold mb-4">Booking Summary</h2>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Package:</span>
          <span className="font-medium">
            {selectedPackage ? packageDetails[selectedPackage]?.title : "Not selected"}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Rate per night:</span>
          <span className="font-medium">
            R{selectedPackage ? Number(bookingTotal) * (packageDetails[selectedPackage]?.priceMultiplier || 1) : "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-medium">{selectedDuration} nights</span>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-muted-foreground">Total:</span>
          <span className="text-2xl font-bold">
            R{calculateTotalPrice() || "N/A"}
          </span>
        </div>

        {/* Complete Booking Button */}
        <Button
          onClick={handleBooking}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={paymentLoading || paymentSuccess || !postId || !selectedPackage}
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
          ) : !selectedPackage ? (
            "Please Select a Package"
          ) : (
            `Complete Booking - R${calculateTotalPrice() || "N/A"}`
          )}
        </Button>
        
        {!postId && (
          <p className="text-red-500 text-sm mt-2">
            Property information is missing. Please start from the property page.
          </p>
        )}
        {!selectedPackage && (
          <p className="text-red-500 text-sm mt-2">
            Please select a package to continue.
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