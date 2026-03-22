/*
  ═══════════════════════════════════════
  BETA MODE — HOW IT WORKS
  ═══════════════════════════════════════

  RIGHT NOW (Beta):
  - BETA_MODE = true
  - Only users with a valid invite code can access the dashboard
  - Each user gets 20 AI calls per week
  - Max 100 users total
  - Everyone is treated as Pro — no payment required
  - Resets every Monday automatically

  WHEN BETA ENDS — FULL CHECKLIST:

  1. Run scripts/grandfather-beta-users.ts FIRST
     → gives all existing beta users 30 days free Pro access
     → do this BEFORE setting BETA_MODE = false

  2. Set BETA_MODE = false in this file

  3. Switch Stripe from test mode to live mode:
     → Go to dashboard.stripe.com
     → Toggle "Test mode" OFF
     → Replace in Vercel env vars:
       STRIPE_SECRET_KEY        → sk_live_...
       STRIPE_WEBHOOK_SECRET    → new whsec_... from live webhook
       NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → pk_live_...

  4. Update Stripe webhook:
     → Delete the test webhook in Stripe Dashboard
     → Create new live webhook:
       URL: https://auri-beta.vercel.app/api/stripe/webhook
       Events: checkout.session.completed,
               checkout.session.expired,
               customer.subscription.updated,
               customer.subscription.deleted

  5. Confirm STRIPE_PRICE_ID_PRO points to live price ID

  6. Remove invite code gate from sign up flow
     → Set isActive = false on all codes in Firestore
     → OR delete the invite code screen entirely

  7. Update pricing page
     → Remove all beta messaging
     → Show real pricing: Free (3 generations/month) vs Pro $12/month

  8. Email all beta users:
     "Thank you for beta testing AURI!
      You have 30 days of free Pro access as our thank you.
      After that, Pro is $12/month."

  9. Test end-to-end with a real card purchase before announcing
  ═══════════════════════════════════════
*/

export const APP_CONFIG = {
  // BETA MODE
  // When true: all signed-in users with invite code get
  // 20 calls/week regardless of payment
  // When false: enforce free vs Pro paid tiers
  BETA_MODE: true,
  BETA_ENDS: '2026-07-01',

  // BETA LIMITS
  BETA_WEEKLY_CALL_LIMIT: 20,   // AI calls per person per week
  BETA_MAX_USERS: 100,          // max total beta users allowed

  // PAID TIER LIMITS (used when BETA_MODE = false)
  FREE_RATE_LIMIT: 10,          // calls per minute
  PRO_RATE_LIMIT: 60,           // calls per minute
  FREE_MONTHLY_LIMIT: 3,        // generations per month
  PRO_MONTHLY_LIMIT: Infinity,
}
