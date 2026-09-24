'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StartLink from './StartLink'

const LINKS: { label: string; href: string }[] = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '/blog' },
]

export default function LandingNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="border-b border-lp-rule">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-8 lg:py-[14px] xl:px-0">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center font-lp-serif text-2xl font-semibold tracking-[0.06em] text-lp-ink no-underline lg:text-[28px]"
        >
          AURI
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-2 text-[15px] lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="inline-flex min-h-[44px] items-center px-4 text-lp-ink no-underline hover:text-lp-pine"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center px-4 text-lp-ink no-underline hover:text-lp-pine"
          >
            Log in
          </Link>
          <StartLink
            intent="free"
            className="ml-2 inline-flex min-h-[44px] items-center rounded-lp-control bg-lp-pine px-5 font-medium text-white no-underline hover:bg-lp-pine-dark hover:text-white"
          >
            Start free
          </StartLink>
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center px-3 text-[15px] text-lp-ink no-underline"
          >
            Log in
          </Link>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="lp-mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center text-lp-ink"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              {open ? <path d="M5 5l12 12M17 5L5 17" /> : <path d="M3 6h16M3 11h16M3 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="lp-mobile-menu" aria-label="Main" className="border-t border-lp-rule px-4 pb-4 lg:hidden">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center border-b border-lp-hairline text-base text-lp-ink no-underline"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <StartLink
            intent="free"
            className="mt-4 flex min-h-[48px] items-center justify-center rounded-lp-control bg-lp-pine font-medium text-white no-underline"
          >
            Start free
          </StartLink>
        </nav>
      )}
    </header>
  )
}
