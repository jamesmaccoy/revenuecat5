import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle, Card } from '@/components/ui/card'
import { getMeUser } from '@/utilities/getMeUser'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import configPromise from '@/payload.config'

import InviteClientPage from './page.client'

type SearchParams = Promise<{
  token: string
}>

export default async function GuestInvite({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const { user } = await getMeUser()

  if (!user) {
    return (
      <div className="max-w-screen-md mx-auto mt-20">
        <Card>
          <CardHeader>
            <CardTitle>You are not logged in</CardTitle>
            <CardDescription>
              Please log in or create an account to accept the invite as a guest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Button asChild variant="default">
                <Link href={`/login?next=/guest/invite?token=${token}`}>Login</Link>
              </Button>

              <Button asChild variant="secondary">
                <Link href={`/register?next=/guest/invite?token=${token}`}>Register</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tokenData = await fetchTokenData(token)

  const booking = await fetchBookingDetails(tokenData.bookingId, token)

  if (!booking) {
    notFound()
  }

  return <InviteClientPage booking={booking} tokenPayload={tokenData} token={token} />
}

const fetchTokenData = async (token: string) => {
  const tokenData = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/bookings/token/${token}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: new Headers(await headers()),
    },
  )

  const tokenDataJson = await tokenData.json()
  return tokenDataJson
}

const fetchBookingDetails = async (bookingId: string, token: string) => {
  const payload = await getPayload({ config: configPromise })

  const booking = await payload.find({
    collection: 'bookings',
    where: {
      and: [
        {
          id: {
            equals: bookingId,
          },
        },
        {
          token: {
            equals: token,
          },
        },
      ],
    },
    select: {
      post: true,
      customer: true,
      fromDate: true,
      toDate: true,
      createdAt: true,
    },
    limit: 1,
    depth: 1,
  })

  if (booking.docs.length === 0) {
    return null
  }

  return booking.docs[0]
}
