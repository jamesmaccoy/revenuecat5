'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { CalendarEvent } from '@/utilities/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function CalendarUrlForm() {
  const [icsUrl, setIcsUrl] = React.useState('')
  const [isValid, setIsValid] = React.useState(true)
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchCalendarData = async (url: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/calendar?url=${encodeURIComponent(url)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setEvents(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      new URL(icsUrl)
      setIsValid(true)
      await fetchCalendarData(icsUrl)
    } catch {
      setIsValid(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Calendar Integration</CardTitle>
        <CardDescription>
          Enter your Google Calendar .ics URL to display your availability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="icsUrl">Calendar URL (.ics)</Label>
            <Input
              id="icsUrl"
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/..."
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              className={!isValid ? 'border-red-500' : ''}
            />
            {!isValid && (
              <p className="text-sm text-red-500">Please enter a valid URL</p>
            )}
            <p className="text-sm text-muted-foreground">
              To get your calendar URL:
              <ol className="list-decimal list-inside mt-2">
                <li>Open Google Calendar</li>
                <li>Click the settings icon (⚙️) next to your calendar</li>
                <li>Scroll down to "Integrate calendar"</li>
                <li>Copy the "Secret address in iCal format"</li>
              </ol>
            </p>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Load Calendar'}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-md">
            Error loading calendar: {error}
          </div>
        )}

        {isValid && icsUrl && !loading && !error && (
          <div className="mt-6">
            <Calendar events={events} />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 