import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://auri-beta.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/login', '/signup'],
        // Disallow authenticated dashboard routes — not indexable
        disallow: ['/dashboard/', '/api/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
