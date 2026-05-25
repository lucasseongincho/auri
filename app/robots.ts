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
    sitemap: 'https://www.auri-resume.com/sitemap.xml',
    host: 'https://www.auri-resume.com',
  }
}
