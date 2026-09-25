import type { Metadata } from 'next'
import Landing from '@/components/landing/Landing'
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
  return <Landing c={en} />
}
