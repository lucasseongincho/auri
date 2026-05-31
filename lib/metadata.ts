import type { Metadata } from 'next'

export const siteConfig = {
  name: 'AURI',
  url: 'https://www.auri-resume.com',
  description:
    'AURI is an AI-powered career toolkit that helps you tailor your resume to any job, beat ATS filters, and land more interviews — faster.',
  ogImage: '/opengraph-image',
}

export function generatePageMetadata({
  title,
  description,
  ogImage,
  path,
  noindex = false,
  type = 'website',
}: {
  title: string
  description?: string
  ogImage?: string
  path?: string
  noindex?: boolean
  type?: 'website' | 'article'
}): Metadata {
  const desc = description ?? siteConfig.description
  const image = ogImage ?? siteConfig.ogImage
  const url = path ? `${siteConfig.url}${path}` : siteConfig.url

  return {
    title: { absolute: title },
    description: desc,
    ...(noindex ? { robots: { index: false, follow: false, googleBot: { index: false } } } : {}),
    openGraph: {
      title,
      description: desc,
      url,
      images: [{ url: image }],
      siteName: siteConfig.name,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  }
}
