'use client'

import React, { useEffect, useState } from 'react'
import { User } from '@/payload-types'

export default function PremiumContentClient() {
  const [guests, setGuests] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="container py-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-8">Premium Content</h1>
        <p>Loading guests...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-8">Premium Content</h1>
        <p className="text-error">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold tracking-tighter mb-8">Start your curated stay</h1>
      
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