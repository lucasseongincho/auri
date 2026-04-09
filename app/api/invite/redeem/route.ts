import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkInviteRateLimit } from '@/lib/inviteRateLimit'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

function getThisMondayUTC(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const daysBack = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - daysBack)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — 10 attempts per 15 minutes (brute-force protection)
    const { allowed, retryAfter } = await checkInviteRateLimit(req)
    if (!allowed) {
      return Response.json(
        { success: false, error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const body = await req.json() as { code: string }
    const code = body.code

    if (!code?.trim()) {
      return Response.json({ success: false, error: 'No code provided.' }, { status: 400 })
    }

    const verifiedUser = await getAuthenticatedUser(req)
    if (!verifiedUser?.uid) {
      return Response.json({ success: false, error: 'Unauthorized — no valid Firebase ID token.' }, { status: 401 })
    }

    if (!adminDb) {
      return Response.json({ success: false, error: 'Server config error.' }, { status: 503 })
    }

    const cleanCode = code.trim().toUpperCase()
    const uid = verifiedUser.uid

    const codeRef = adminDb.collection('invite_codes').doc(cleanCode)
    const codeSnap = await codeRef.get()

    if (!codeSnap.exists) {
      return Response.json({ success: false, error: `Code "${cleanCode}" not found in Firestore.` }, { status: 400 })
    }

    const codeData = codeSnap.data()!
    if (!codeData.isActive) {
      return Response.json({ success: false, error: 'This invite code has been deactivated.' }, { status: 400 })
    }

    const usedBy: string[] = codeData.usedBy ?? []
    if (usedBy.length >= codeData.maxUses) {
      return Response.json({ success: false, error: 'This code has reached its maximum uses.' }, { status: 400 })
    }

    // Check if already approved
    const profileRef = adminDb.collection('users').doc(uid).collection('profile').doc('data')
    const profileSnap = await profileRef.get()
    if (profileSnap.exists && profileSnap.data()?.betaApproved === true) {
      return Response.json({ success: true, alreadyApproved: true })
    }

    // Approve the user
    await profileRef.set({ betaApproved: true }, { merge: true })

    // Initialize beta usage tracking
    const usageRef = adminDb.collection('users').doc(uid).collection('betaUsage').doc('data')
    await usageRef.set(
      {
        betaCallsThisWeek: 0,
        betaWeekStart: Timestamp.fromDate(getThisMondayUTC()),
      },
      { merge: true }
    )

    // Record uid in the invite code's usedBy array
    await codeRef.update({ usedBy: FieldValue.arrayUnion(uid) })

    return Response.json({ success: true })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[invite/redeem] Unexpected error:', err)
    }
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ success: false, error: `Server error: ${message}` }, { status: 500 })
  }
}
