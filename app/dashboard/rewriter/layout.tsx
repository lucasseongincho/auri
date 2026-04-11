import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resume Rewriter',
  description:
    'Transform your existing resume for any new role. AI rewrites every bullet to match the job description and pass ATS filters.',
}

export default function RewriterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
