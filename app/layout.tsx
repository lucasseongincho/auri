import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://auri-beta.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AURI — AI Resume Builder That Gets Past ATS Filters',
    template: '%s | AURI',
  },
  description:
    'Build ATS-optimized resumes tailored to every job. AURI rewrites your resume, LinkedIn profile, cover letter, and preps you for interviews — all powered by AI.',
  keywords: [
    'ATS resume builder',
    'AI resume optimizer',
    'ATS score checker',
    'resume keyword optimizer',
    'ATS-friendly resume',
    'AI cover letter generator',
    'LinkedIn profile optimizer',
    'interview preparation AI',
    'job search strategy',
    'resume rewriter AI',
    'career toolkit',
    'applicant tracking system resume',
  ],
  authors: [{ name: 'AURI' }],
  creator: 'AURI',
  publisher: 'AURI',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: 'AURI — AI Resume Builder & Career Toolkit',
    description:
      'Build ATS-optimized resumes tailored to every job. Rewrite your LinkedIn, generate cover letters, and prep for interviews — all in one AI-powered system.',
    type: 'website',
    siteName: 'AURI',
    url: APP_URL,
    // og:image is auto-injected by app/opengraph-image.tsx (Next.js file-based OG)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AURI — AI Resume Builder & Career Toolkit',
    description:
      'Build ATS-optimized resumes tailored to every job. AI-powered career toolkit.',
    // twitter:image is auto-injected by app/twitter-image.tsx (falls back to opengraph-image)
  },
  alternates: {
    canonical: APP_URL,
  },
  verification: {
    google: 'P2tadCAsvByF8yjAeb7ZVg2TH5OlXFajDfEAAoXjDlE',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

// JSON-LD structured data — WebApplication schema for rich search results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AURI',
  url: APP_URL,
  description:
    'AI-powered career toolkit for building ATS-optimized resumes, rewriting LinkedIn profiles, generating cover letters, and preparing for interviews.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free to start — no sign-up required',
  },
  featureList: [
    'ATS-optimized resume builder',
    'AI cover letter generator',
    'LinkedIn profile rewriter',
    '7-day job search strategy',
    'Interview preparation system',
    'ATS score optimizer',
    '5 premium resume templates',
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-text-primary font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
