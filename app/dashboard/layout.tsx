import { LocaleProvider } from '@/lib/i18n/client'
import { getRequestLocale } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false } },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale()
  return (
    <LocaleProvider initialLocale={locale}>
      <DashboardClient>{children}</DashboardClient>
    </LocaleProvider>
  )
}
