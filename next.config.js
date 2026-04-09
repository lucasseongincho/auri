/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent accidental client-side exposure of server secrets
  serverRuntimeConfig: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },

  async headers() {
    return [
      {
        // Firebase signInWithPopup polls window.closed on the OAuth popup.
        // The default COOP 'same-origin' blocks that cross-origin window access.
        // 'same-origin-allow-popups' permits it while still isolating the page.
        source: '/(.*)',
        headers: [
          {
            // Firebase signInWithPopup polls window.closed on the OAuth popup.
            // 'same-origin-allow-popups' permits it while still isolating the page.
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

module.exports = nextConfig
