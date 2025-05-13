import { getPayload } from 'payload'
import React from 'react'
import configPromise from '@/payload.config'
import { getMeUser } from '@/utilities/getMeUser'
import { redirect } from 'next/navigation'
import { Media } from '@/components/Media'
import { Post } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { Button } from '@/components/ui/button'
import { PlusCircleIcon } from 'lucide-react'
import InviteUrlDialog from './_components/invite-url-dialog'

type Params = Promise<{
  bookingId: string
}>

export default async function BookingDetails({ params }: { params: Params }) {
  const { bookingId } = await params

  const { user } = await getMeUser()

  if (!user) {
    redirect('/login')
  }

  const data = await fetchBookingDetails(bookingId, user.id)

  return (
    <div className="container my-10">
      {data && 'post' in data && typeof data?.post !== 'string' ? (
        <div className="flex items-start gap-10">
          <div className="max-w-[450px] rounded-md overflow-hidden">
            {!!data?.post.meta?.image && <Media resource={data?.post.meta?.image || undefined} />}
          </div>
          <div className="py-5">
            <h1 className="text-4xl mb-3 font-bold">{data?.post.title}</h1>

            <p className="text-lg font-medium">
              Date Booked: {formatDateTime(data?.post.createdAt)}
            </p>
            <p className="text-lg font-medium">Arrival Date: {formatDateTime(data?.fromDate)}</p>
          </div>
        </div>
      ) : (
        <div>Error loading booking details</div>
      )}

      <div className="mt-10 max-w-screen-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Guests</h2>
          <InviteUrlDialog
            bookingId={bookingId}
            trigger={
              <Button>
                <PlusCircleIcon className="size-4 mr-2" />
                <span>Invite</span>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}

const fetchBookingDetails = async (bookingId: string, currentUserId: string) => {
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
          customer: {
            equals: currentUserId,
          },
        },
      ],
    },
    depth: 2,
    pagination: false,
    limit: 1,
  })

  if (booking.docs.length === 0) {
    return null
  }

  return booking.docs[0]
}
