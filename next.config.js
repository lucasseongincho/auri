const createMDX = require('@next/mdx')

const withMDX = createMDX({})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // ANTHROPIC_API_KEY has no NEXT_PUBLIC_ prefix so Next.js never exposes it
  // to the client bundle. No extra config needed — server-only by convention.

  async headers() {
    return [
      {
        // Firebase signInWithPopup polls window.closed on the OAuth popup.
        // The default COOP 'same-origin' blocks that cross-origin window access.
        // 'same-origin-allow-popups' permits it while still isolating the page.
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

module.exports = withMDX(nextConfig)
