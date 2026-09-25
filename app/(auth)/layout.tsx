import '@/lib/i18n/fonts'
import { LocaleProvider } from '@/lib/i18n/client'
import { getRequestLocale } from '@/lib/i18n/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Sign In — AURI' },
  robots: { index: false, follow: false, googleBot: { index: false } },
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale()
  return <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
}
