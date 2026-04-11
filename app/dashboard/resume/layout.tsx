import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resume Builder',
  description:
    'Build an ATS-optimized resume tailored to any job description. AI rewrites every bullet as a measurable achievement and scores your resume against the job posting.',
}

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
