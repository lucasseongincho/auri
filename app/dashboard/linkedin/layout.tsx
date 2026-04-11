import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LinkedIn Profile Rewriter',
  description:
    'Rewrite your LinkedIn headline, About section, and top 3 experiences to appear in recruiter searches for your target role.',
}

export default function LinkedInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
