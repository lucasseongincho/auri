import type { Metadata } from 'next'
import Landing from '@/components/landing/Landing'
import { RememberLocale } from '@/lib/i18n/client'
import { en } from '@/components/landing/copy'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.auri-resume.com',
    languages: {
      en: 'https://www.auri-resume.com',
      ko: 'https://www.auri-resume.com/ko',
    },
  },
}

export default function LandingPage() {
  return (
    <>
      <RememberLocale locale='en' />
      <Landing c={en} />
    </>
  )
}
