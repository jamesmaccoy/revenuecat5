'use client'

import { Button } from '@/components/ui/button'
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Card,
} from '@/components/ui/card'
import { Booking } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

import { CheckIcon, Loader2Icon } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  booking: Pick<Booking, 'post' | 'fromDate' | 'createdAt' | 'customer'>
  tokenPayload: Record<string, string>
  token: string
}

export default function InviteClientPage({ booking, tokenPayload, token }: Props) {
  if (
    typeof booking.post === 'string' ||
    typeof booking.customer === 'string' ||
    !('bookingId' in tokenPayload)
  ) {
    notFound()
  }

  const router = useRouter()

  const [isLoading, setIsLoading] = React.useState(false)

  const handleInviteAccept = async () => {
    try {
      setIsLoading(true)
      const data = await fetch(`/api/bookings/${tokenPayload.bookingId}/accept-invite/${token}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!data.ok) {
        console.error('Error accepting invite:', data.statusText)
        return
      }

      router.push(`/bookings/${tokenPayload.bookingId}`)
    } catch (err) {
      console.error('Error accepting invite:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-screen-md my-10">
      <Card>
        <CardHeader>
          <CardTitle>
            Join <strong>{booking.post.title}</strong> as a guest
          </CardTitle>
          <CardDescription>
            You have been invited by <strong>{booking.customer?.name}</strong> to join them on this
            booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-10">
            <p className="text-lg font-medium">Date Booked: {formatDateTime(booking.createdAt)}</p>
            <p className="text-lg font-medium">Arrival Date: {formatDateTime(booking.fromDate)}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleInviteAccept} disabled={isLoading}>
            {!isLoading ? (
              <>
                <CheckIcon className="size-4 mr-2" />
                Accept Invitation
              </>
            ) : (
              <>
                <Loader2Icon className="animate-spin mr-2" />
                <span>Accepting...</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
