import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { adminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!stripe) {
    return Response.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const snap = await adminDb?.doc(`users/${user.uid}/profile/data`).get()
    const customerId = snap?.data()?.stripeCustomerId as string | undefined

    if (!customerId) {
      return Response.json({ error: 'No billing account found for this user' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://auri-beta.vercel.app'}/dashboard/settings`,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Billing portal session failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
