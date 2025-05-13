import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle, Card } from '@/components/ui/card'
import { getMeUser } from '@/utilities/getMeUser'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

type SearchParams = Promise<{
  token: string
}>

export default async function GuestInvite({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const user = await getMeUser()

  if (!user) {
    ;<div className="max-w-screen-md mx-auto mt-20">
      <Card>
        <CardContent>
          <CardHeader>
            <CardTitle>You are not logged in</CardTitle>
            <CardDescription>
              Please log in or create an account to accept the invite as a guest.
            </CardDescription>
          </CardHeader>

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
  }

  return <div>GuestInvite</div>
}
