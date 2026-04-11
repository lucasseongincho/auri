import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interview Preparation',
  description:
    'Get the 8 most likely interview questions for your specific role and company, with STAR-method answer frameworks built from your own experience.',
}

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
