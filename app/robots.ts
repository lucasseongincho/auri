import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/login',
      ],
    },
    sitemap: 'https://auri-beta.vercel.app/sitemap.xml',
    host: 'https://auri-beta.vercel.app',
  }
}
