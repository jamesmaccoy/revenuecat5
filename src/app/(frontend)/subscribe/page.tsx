'use client'

import React, { useEffect, useState } from 'react'
import { useUserContext } from '@/context/UserContext'
import { useRevenueCat } from '@/providers/RevenueCat'
import { useSubscription } from '@/hooks/useSubscription'
import { Purchases, Package, PurchasesError, ErrorCode } from '@revenuecat/purchases-js'
import { useRouter } from 'next/navigation'

export default function SubscribePage() {
  const router = useRouter()
  const { currentUser } = useUserContext()
  const { customerInfo, isInitialized } = useRevenueCat()
  const { isSubscribed, isLoading } = useSubscription()
  const [offerings, setOfferings] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isInitialized) {
      loadOfferings()
    }
  }, [isInitialized])

  // Redirect to dashboard if already subscribed
  useEffect(() => {
    if (!isLoading && isSubscribed) {
      console.log('User already subscribed, redirecting to /admin from useEffect.');
      router.push('/admin')
    }
  }, [isLoading, isSubscribed, router])

  const loadOfferings = async () => {
    try {
      const fetchedOfferings = await Purchases.getSharedInstance().getOfferings()
      console.log("Fetched Offerings Object:", fetchedOfferings); // Log the whole offerings object
      if (fetchedOfferings.current && fetchedOfferings.current.availablePackages.length > 0) {
        // Set the state with the packages from the CURRENT offering
        setOfferings(fetchedOfferings.current.availablePackages)
      } else {
        console.warn("No current offering or packages found.");
        setOfferings([]); // Ensure offerings is empty if none found
      }
      setLoading(false)
    } catch (err) {
      setError('Failed to load subscription offerings')
      setLoading(false)
      console.error('Error loading offerings:', err)
    }
  }

  const handlePurchase = async (pkg: Package) => {
    try {
      await Purchases.getSharedInstance().purchase({
        rcPackage: pkg
      });
      router.push('/admin');
    } catch (error) {
      if (error.code === 'RECEIPT_ALREADY_IN_USE') {
        router.push('/admin');
        return;
      }
      if (error.code === 'CANCELLED') {
        return;
      }
      console.error('Error purchasing package:', error);
      setError('Failed to complete purchase. Please try again.');
    }
  };

  // Filter the packages state based on the web billing product identifier
  // Use the 'offerings' state which now holds the available packages
  const monthly_subscription_plan = offerings.find(pkg => pkg.webBillingProduct?.identifier === 'monthly_subscription'); 
  const annual_subscription_plan = offerings.find(pkg => pkg.webBillingProduct?.identifier === 'annual_subscription');
  const professional_plan = offerings.find(pkg => pkg.webBillingProduct?.identifier === 'subscription_pro');
  
  // Log the results of filtering
  console.log("Monthly Plan Found:", monthly_subscription_plan);
  console.log("Annual Plan Found:", annual_subscription_plan);
  console.log("Professional Plan Found:", professional_plan);

  if (!currentUser) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Payment options</h1>
        <p>Please log in to view subscription options.</p>
      </div>
    )
  }

  if (!isInitialized || loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Payment options</h1>
        <p>Loading subscription options...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Payment options</h1>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-12 text-center">
        <p>Checking subscription status...</p>
      </div>
    )
  }

  if (isSubscribed) {
    return (
      <div className="container py-12 text-center">
        <p>Loading your access...</p>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="container py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">30% off your booking</h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              simple unique accomodation
            </p>
        </div>

        {/* Monthly and Annual Plans Pricing Table */}  
        <div className="mx-auto max-w-4xl grid grid-cols-1 gap-8 md:grid-cols-2 items-start">
          
          {/* Monthly Plan Card - Use monthly_subscription_plan */}  
          {monthly_subscription_plan && (() => {
              const product = monthly_subscription_plan.webBillingProduct;
              return (
                <div key={monthly_subscription_plan.identifier} className="rounded-2xl border border-border p-8 shadow-sm">
                  <h2 className="text-lg font-semibold leading-8 text-foreground">{product.displayName}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{product.description || 'Access all standard features.'}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">{product.currentPrice.formattedPrice}</span>
                    <span className="text-sm font-semibold leading-6 text-muted-foreground">/month</span>
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground xl:mt-10">
                    {/* Add your feature list items here */}  
                    <li className="flex gap-x-3">Calendar booking request</li>
                    <li className="flex gap-x-3">Mates rates for memebers</li>
                    <li className="flex gap-x-3">Yearly free stay</li>
                  </ul>
                  <button
                    onClick={() => handlePurchase(monthly_subscription_plan)}
                    className="mt-8 block w-full rounded-md bg-secondary px-3.5 py-2.5 text-center text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Choose Monthly
                  </button>
                </div>
              );
          })()}

          {/* Annual Plan Card (Highlighted) - Use annual_subscription_plan */}  
          {annual_subscription_plan && (() => {
              const product = annual_subscription_plan.webBillingProduct;
              return (
                <div key={annual_subscription_plan.identifier} className="relative rounded-2xl border border-primary p-8 shadow-lg">
                  <div className="absolute top-0 -translate-y-1/2 transform rounded-full bg-primary px-3 py-1 text-xs font-semibold tracking-wide text-primary-foreground">
                    Most popular
                  </div>
                  <h2 className="text-lg font-semibold leading-8 text-foreground">{product.displayName}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{product.description || 'Get the best value with annual billing.'}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">{product.currentPrice.formattedPrice}</span>
                    <span className="text-sm font-semibold leading-6 text-muted-foreground">/year</span>
                  </p>
                   <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground xl:mt-10">
                    {/* Add your feature list items here */}  
                    <li className="flex gap-x-3">Calendar booking request</li>
                    <li className="flex gap-x-3">Mates rates for memebers</li>
                    <li className="flex gap-x-3">Free stay</li>
                    <li className="flex gap-x-3">+ Immediatly reserve your stay</li> 
                  </ul>
                  <button
                    onClick={() => handlePurchase(annual_subscription_plan)}
                    className="mt-8 block w-full rounded-md bg-primary px-3.5 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Choose Annual
                  </button>
                </div>
              );
          })()}
        </div>

        {/* Professional Plan Section - Use professional_plan */}  
        {professional_plan && (() => {
            const product = professional_plan.webBillingProduct;
            return (
              <div className="mt-16 pt-8 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    {/* Placeholder Image */}  
                    <img 
                      src="/api/media/679e003fcba48ad2a9224890?depth=2&draft=false&locale=undefined" 
                      alt="Professional Plan illustration" 
                      className="w-full h-auto rounded-lg shadow-md mb-4 md:mb-0"
                    />
                  </div>
                  <div className="rounded-2xl border border-border p-8 shadow-sm">
                    <h2 className="text-lg font-semibold leading-8 text-foreground">{product.displayName}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{product.description || 'Advanced features for professionals.'}</p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                      <span className="text-4xl font-bold tracking-tight text-foreground">{product.currentPrice.formattedPrice}</span>
                       {/* Adjust term display based on product */} 
                      <span className="text-sm font-semibold leading-6 text-muted-foreground">/term</span>
                    </p>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground xl:mt-10">
                      {/* Add your feature list items here */}  
                      <li className="flex gap-x-3">Calendar booking request</li>
                      <li className="flex gap-x-3">Legally binding comunication with customers</li>
                      <li className="flex gap-x-3">Insight report</li>
                      <li className="flex gap-x-3">Host your plek</li>
                    </ul>
                    <button
                      onClick={() => handlePurchase(professional_plan)}
                      className="mt-8 block w-full rounded-md bg-secondary px-3.5 py-2.5 text-center text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Choose Professional
                    </button>
                  </div>
                </div>
              </div>
            );
        })()}
      </div>
    )
  }

  return (
    <div className="container py-12 text-center">
      <p>Loading...</p>
    </div>
  );
}