import { LocaleProvider } from '@/lib/i18n/client'
import { getRequestLocale } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Pricing — AURI',
  description:
    'Get full access to AURI\'s AI career tools for $19/month or $190/year. Less than half the price of Jobscan — with more features.',
  path: '/pricing',
})

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale()
  return <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
}
