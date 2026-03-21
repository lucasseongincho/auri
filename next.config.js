/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent accidental client-side exposure of server secrets
  serverRuntimeConfig: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
}

module.exports = nextConfig
