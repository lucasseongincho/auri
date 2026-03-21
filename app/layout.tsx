import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AURI — AI-Powered Career Toolkit',
  description:
    'AURI helps you build ATS-optimized resumes, rewrite your LinkedIn, craft cover letters, and prepare for interviews — all powered by AI.',
  keywords: 'resume builder, ATS optimizer, cover letter generator, LinkedIn rewriter, interview prep, AI resume',
  openGraph: {
    title: 'AURI',
    description: 'AURI helps you build ATS-optimized resumes, rewrite your LinkedIn, craft cover letters, and prepare for interviews — all powered by AI.',
    type: 'website',
    siteName: 'AURI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  )
}
