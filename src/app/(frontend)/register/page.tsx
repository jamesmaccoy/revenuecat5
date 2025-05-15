import React from 'react'
import RegisterPage from './page.client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register | SimplePlek',
  description: 'Create an account to access bookings and more.',
}

export default function Page() {
  return <RegisterPage />
}
