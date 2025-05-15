import LoginPage from './page.client'
import { Suspense } from 'react'

// You can now add Next.js metadata here for SEO
export const metadata = {
  title: 'Login | SimplePlek',
  description: 'Login to your account to access bookings and more.',
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  )
}
