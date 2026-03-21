import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Start free — no sign-up required. Upgrade to AURI Pro for unlimited AI resume generations, LinkedIn rewrites, interview prep, and more.',
  openGraph: {
    title: 'AURI Pricing — Free & Pro Plans',
    description:
      'Start free with 3 resume generations per month. Upgrade to Pro for unlimited generations, LinkedIn rewriter, interview prep, and PDF export.',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
