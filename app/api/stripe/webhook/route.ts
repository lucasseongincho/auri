import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

// Stripe sends the raw body — Next.js must not parse it before we verify the signature
export const dynamic = 'force-dynamic'

async function setUserProStatus(uid: string, isPro: boolean, stripeCustomerId?: string) {
  const update: Record<string, unknown> = { isPro }
  if (stripeCustomerId) update.stripeCustomerId = stripeCustomerId
  await adminDb!.doc(`users/${uid}/profile/data`).set(update, { merge: true })
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return Response.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  if (!adminDb) {
    return Response.json({ error: 'Firebase Admin not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Missing webhook signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return Response.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : err}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const uid = session.metadata?.uid
        if (uid && session.payment_status === 'paid') {
          const customerId = typeof session.customer === 'string' ? session.customer : undefined
          await setUserProStatus(uid, true, customerId)
        }
        break
      }

      case 'checkout.session.expired': {
        // Payment did not complete — no Pro state was written, nothing to clean up
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const uid = sub.metadata?.uid
        if (uid) {
          const isActive = ['active', 'trialing'].includes(sub.status)
          await setUserProStatus(uid, isActive)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const uid = sub.metadata?.uid
        if (uid) {
          await setUserProStatus(uid, false)
        }
        break
      }

      default:
        // Unhandled event types are silently ignored
        break
    }

    return Response.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler error'
    return Response.json({ error: message }, { status: 500 })
  }
}
