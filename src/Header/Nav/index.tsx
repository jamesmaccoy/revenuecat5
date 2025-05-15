'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useUserContext } from '@/context/UserContext'
import { AdminLink } from '@/components/AdminLink'
import { useSubscription } from '@/hooks/useSubscription'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  const { currentUser } = useUserContext()
  const { isSubscribed } = useSubscription()
  const router = useRouter()

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!currentUser) {
      router.push('/subscribe')
      return
    }

    if (!isSubscribed) {
      router.push('/subscribe')
      return
    }

    router.push('/admin')
  }

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ link }, i) => {
        if (link.url === '/admin') {
          return (
            <AdminLink key={i} className={buttonVariants({ variant: "link" })}>
              {link.label}
            </AdminLink>
          )
        }
        return <CMSLink key={i} {...link} appearance="link" />
      })}
      <Link href="/search">
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
      {!currentUser ? (
        <Link className={buttonVariants({})} href="/subscribe" onClick={handleAccountClick}>
          Pay later
        </Link>
      ) : (
        <div className="font-medium text-sm text-primary">Hello, {currentUser.name}</div>
      )}
    </nav>
  )
}
