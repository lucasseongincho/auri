import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '7-Day Job Search Strategy',
  description:
    'Get a personalized 7-day job search action plan with specific job sites, search terms, and daily tasks for your target role.',
}

export default function StrategyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
