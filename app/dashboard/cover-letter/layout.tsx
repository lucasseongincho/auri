import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cover Letter Generator',
  description:
    "Generate a 280-300 word cover letter that opens with a powerful hook. AI connects your specific experience to the company's exact needs.",
}

export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
