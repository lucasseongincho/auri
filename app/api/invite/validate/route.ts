import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkInviteRateLimit } from '@/lib/inviteRateLimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — 10 attempts per 15 minutes (brute-force protection)
    const { allowed, retryAfter } = await checkInviteRateLimit(req)
    if (!allowed) {
      return Response.json(
        { valid: false, reason: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const body = await req.json() as { code: string }
    const code = body.code

    if (!code?.trim()) {
      return Response.json({ valid: false, reason: 'No code provided.' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase()

    if (!adminDb) {
      return Response.json({ valid: false, reason: 'Server config error.' }, { status: 503 })
    }

    const codeRef = adminDb.collection('invite_codes').doc(cleanCode)
    const codeSnap = await codeRef.get()

    if (!codeSnap.exists) {
      return Response.json({ valid: false, reason: `Code "${cleanCode}" not found in Firestore.` })
    }

    const codeData = codeSnap.data()!

    if (!codeData.isActive) {
      return Response.json({ valid: false, reason: 'This invite code has been deactivated.' })
    }

    const usedBy: string[] = codeData.usedBy ?? []
    if (usedBy.length >= codeData.maxUses) {
      return Response.json({ valid: false, reason: `This code has reached its maximum uses (${codeData.maxUses}).` })
    }

    // Check if requesting user is already approved
    const verifiedUser = await getAuthenticatedUser(req).catch(() => null)
    if (verifiedUser?.uid) {
      const profileSnap = await adminDb.collection('users').doc(verifiedUser.uid).collection('profile').doc('data').get()
      if (profileSnap.exists && profileSnap.data()?.betaApproved === true) {
        return Response.json({ valid: true, alreadyApproved: true })
      }
    }

    // NOTE: Beta user cap check (collectionGroup count) requires a Firestore composite index.
    // To enable: Firebase Console → Firestore → Indexes → create index on collectionGroup "profile"
    // field: betaApproved (ASC). Until then, the cap is not enforced at validate time.

    return Response.json({ valid: true })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[invite/validate] Unexpected error:', err)
    }
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ valid: false, reason: `Server error: ${message}` }, { status: 500 })
  }
}
