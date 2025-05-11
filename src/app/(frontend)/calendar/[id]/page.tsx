import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import config from '@/payload.config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { fetchCalendarEvents } from '@/utilities/calendar'

type Args = {
  params: {
    id: string
  }
}

export default async function CalendarPage({ params }: Args) {
  const { isEnabled: draft } = await draftMode()
  const calendarForm = await queryCalendarForm({
    id: params.id,
  })

  if (!calendarForm) {
    return notFound()
  }

  if (!calendarForm.calendarUrl) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">{calendarForm.title}</h1>
        <p className="text-red-500">No calendar URL has been set for this form.</p>
      </div>
    )
  }

  const events = await fetchCalendarEvents(calendarForm.calendarUrl)

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{calendarForm.title}</h1>
      <div className="max-w-md mx-auto">
        <Calendar events={events} />
      </div>
    </div>
  )
}

const queryCalendarForm = cache(async ({ id }: { id: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config })

  const result = await payload.findByID({
    collection: 'calendar-forms',
    id,
    draft,
  })

  return result
}) 