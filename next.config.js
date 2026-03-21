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
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
