import Stripe from 'stripe'

// Stripe server-side singleton — never expose STRIPE_SECRET_KEY to client
// null when env var not set (build time / local dev without Stripe configured)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
    })
  : null
