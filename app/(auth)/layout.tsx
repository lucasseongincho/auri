import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Sign In — AURI' },
  robots: { index: false, follow: false, googleBot: { index: false } },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
