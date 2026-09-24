'use client'

import { useRouter } from 'next/navigation'
import { getStartedRedirect } from '@/lib/getStartedRedirect'

// Real link to /signup so it works without JS and is announced as a link.
// With JS, defer to getStartedRedirect so signed-in users go to /dashboard
// and the 'pro' intent is stored before auth, exactly as before.
export default function StartLink({
  intent,
  className,
  children,
}: {
  intent: 'free' | 'pro'
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <a
      href="/signup"
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        router.push(getStartedRedirect(intent))
      }}
    >
      {children}
    </a>
  )
}
