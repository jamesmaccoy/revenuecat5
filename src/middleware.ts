import { NextRequest, NextResponse } from 'next/server'
import { getServerSideURL } from './utilities/getURL'

// Paths that require authentication and subscription
const PROTECTED_PATHS = ['/admin', '/join']

// Paths that are always allowed
const PUBLIC_PATHS = ['/login', '/subscribe', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log('Middleware processing path:', pathname)

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    console.log('Public path accessed:', pathname)
    return NextResponse.next()
  }

  // Check if path requires protection
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  if (!isProtectedPath) {
    console.log('Non-protected path:', pathname)
    return NextResponse.next()
  }

  // Get auth cookie
  const authCookie = request.cookies.get('payload-token')
  console.log('Auth cookie present:', !!authCookie?.value)

  if (!authCookie?.value) {
    console.log('No auth cookie found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check subscription status for protected routes
  if (isProtectedPath) {
    try {
      const checkUrl = new URL('/api/check-subscription', request.url)
      const checkResponse = await fetch(checkUrl, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      })

      // Expect activeEntitlements array from the API
      const { hasActiveSubscription, customerId, activeEntitlements } = await checkResponse.json()

      // --- Admin Path Specific Check ---
      if (pathname.startsWith('/admin')) {
        if (!activeEntitlements || !activeEntitlements.includes('subscription_pro')) {
          console.log('User does not have \'subscription_pro\', redirecting to /bookings');
          return NextResponse.redirect(new URL('/bookings', request.url));
        }
        // If user has 'subscription_pro', allow access (handled later)
      } 
      // --- End Admin Path Specific Check ---
      
      // --- General Protected Path Check (excluding admin path already checked) ---
      else if (!hasActiveSubscription) {
        console.log('No active subscription found, redirecting to subscribe');
        return NextResponse.redirect(new URL('/subscribe', request.url));
      }
      // --- End General Protected Path Check ---

      // If we have a customer ID but no cookie, set it
      if (customerId && !request.cookies.get('rc-customer-id')) {
        const response = NextResponse.next()
        response.cookies.set('rc-customer-id', customerId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        })
        return response
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  }

  // If authenticated and path is protected, allow access
  console.log('User authenticated and subscribed, allowing access to protected path:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 