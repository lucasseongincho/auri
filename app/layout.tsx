import type { Metadata } from 'next'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://auri-beta.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AURI — AI-Powered Career Toolkit',
    template: '%s | AURI',
  },
  description:
    'Build ATS-optimized resumes, rewrite your LinkedIn profile, generate cover letters, and ace interviews — all powered by Claude AI. Free to start.',
  keywords: [
    'AI resume builder',
    'ATS optimizer',
    'cover letter generator',
    'LinkedIn profile rewriter',
    'interview prep',
    'job search strategy',
    'resume templates',
    'career toolkit',
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
    title: 'AURI — AI-Powered Career Toolkit',
    description:
      'Build ATS-optimized resumes, rewrite your LinkedIn, craft cover letters, and prepare for interviews — all powered by Claude AI.',
    type: 'website',
    siteName: 'AURI',
    url: APP_URL,
    // og:image is auto-injected by app/opengraph-image.tsx (Next.js file-based OG)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AURI — AI-Powered Career Toolkit',
    description:
      'Build ATS-optimized resumes, rewrite your LinkedIn, craft cover letters, and prepare for interviews — powered by AI.',
    // twitter:image is auto-injected by app/twitter-image.tsx (falls back to opengraph-image)
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
        {children}
      </body>
    </html>
  )
}
