'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import StartLink from './StartLink'
import type { NavCopy } from './copy'

export default function LandingNav({ c, homeHref }: { c: NavCopy; homeHref: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const langSwitch = (extra: string) => (
    <Link
      href={c.switchTo.href}
      hrefLang={c.switchTo.hrefLang}
      lang={c.switchTo.hrefLang}
      aria-label={c.switchTo.ariaLabel}
      className={`inline-flex min-h-[44px] items-center text-lp-ink no-underline hover:text-lp-pine ${extra}`}
    >
      {c.switchTo.label}
    </Link>
  )

  return (
    <header className="border-b border-lp-rule">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-8 lg:py-[14px] xl:px-0">
        <Link
          href={homeHref}
          aria-label={c.home}
          className="inline-flex min-h-[44px] items-center font-lp-serif text-2xl font-semibold tracking-[0.06em] text-lp-ink no-underline lg:text-[28px]"
        >
          AURI
        </Link>

        <nav aria-label={c.mainLabel} className="hidden items-center gap-2 text-[15px] lg:flex">
          {c.links.map((l) => (
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
            {c.login}
          </Link>
          {langSwitch('border-l border-lp-rule pl-4 pr-2')}
          <StartLink
            intent="free"
            className="ml-2 inline-flex min-h-[44px] items-center rounded-lp-control bg-lp-pine px-5 font-medium text-white no-underline hover:bg-lp-pine-dark hover:text-white"
          >
            {c.start}
          </StartLink>
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          {langSwitch('px-2 text-[15px]')}
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center px-2 text-[15px] text-lp-ink no-underline"
          >
            {c.login}
          </Link>
          <button
            type="button"
            aria-label={open ? c.menuClose : c.menuOpen}
            aria-expanded={open}
            aria-controls="lp-mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center text-lp-ink"
          >
            {open ? <X className="h-[22px] w-[22px]" strokeWidth={1.5} aria-hidden="true" /> : <Menu className="h-[22px] w-[22px]" strokeWidth={1.5} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="lp-mobile-menu" aria-label={c.mainLabel} className="border-t border-lp-rule px-4 pb-4 lg:hidden">
          <ul className="flex flex-col">
            {c.links.map((l) => (
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
            {c.start}
          </StartLink>
        </nav>
      )}
    </header>
  )
}
