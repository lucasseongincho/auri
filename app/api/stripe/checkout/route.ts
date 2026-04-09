import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getAuthenticatedUser } from '@/lib/verifyAuth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!stripe) {
    return Response.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (!process.env.STRIPE_PRICE_ID_PRO) {
    return Response.json({ error: 'Stripe price not configured' }, { status: 503 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      // Exact URLs per deployment spec
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { uid: user.uid },
      // Propagate uid to subscription metadata so subscription.updated/deleted
      // webhooks can look up the user without a separate Firestore query.
      subscription_data: { metadata: { uid: user.uid } },
      allow_promotion_codes: true,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout creation failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
