import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { APP_CONFIG } from '@/lib/config'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json() as { code: string }

    if (!code?.trim()) {
      return Response.json({ valid: false, reason: 'No code provided.' }, { status: 400 })
    }

    if (!adminDb) {
      return Response.json({ valid: false, reason: 'Service unavailable.' }, { status: 503 })
    }

    const normalizedCode = code.trim().toUpperCase()

    // Check if code exists and is active
    const codeSnap = await adminDb.doc(`invite_codes/${normalizedCode}`).get()
    if (!codeSnap.exists) {
      return Response.json({ valid: false, reason: 'Invalid or expired invite code.' })
    }

    const codeData = codeSnap.data()!
    if (!codeData.isActive) {
      return Response.json({ valid: false, reason: 'Invalid or expired invite code.' })
    }

    const usedBy: string[] = codeData.usedBy ?? []
    if (usedBy.length >= codeData.maxUses) {
      return Response.json({ valid: false, reason: 'This code has reached its maximum uses.' })
    }

    // Check if requesting user already used a code
    const verifiedUser = await getAuthenticatedUser(req)
    if (verifiedUser?.uid) {
      const profileSnap = await adminDb.doc(`users/${verifiedUser.uid}/profile/data`).get()
      if (profileSnap.exists && profileSnap.data()?.betaApproved === true) {
        return Response.json({ valid: true, alreadyApproved: true })
      }
    }

    // Check total beta user cap
    const usersSnap = await adminDb
      .collectionGroup('profile')
      .where('betaApproved', '==', true)
      .count()
      .get()
    const totalApproved = usersSnap.data().count

    if (totalApproved >= APP_CONFIG.BETA_MAX_USERS) {
      return Response.json({
        valid: false,
        reason: 'Beta is currently full. You have been added to the waitlist.',
      })
    }

    return Response.json({ valid: true })
  } catch (err) {
    console.error('Invite validate error:', err)
    return Response.json({ valid: false, reason: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
