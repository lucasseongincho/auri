import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
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
    const { code } = await req.json() as { code: string }

    if (!code?.trim()) {
      return Response.json({ success: false, error: 'No code provided.' }, { status: 400 })
    }

    const verifiedUser = await getAuthenticatedUser(req)
    if (!verifiedUser?.uid) {
      return Response.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    }

    if (!adminDb) {
      return Response.json({ success: false, error: 'Service unavailable.' }, { status: 503 })
    }

    const normalizedCode = code.trim().toUpperCase()
    const uid = verifiedUser.uid

    // Double-check code validity
    const codeRef = adminDb.doc(`invite_codes/${normalizedCode}`)
    const codeSnap = await codeRef.get()

    if (!codeSnap.exists || !codeSnap.data()?.isActive) {
      return Response.json({ success: false, error: 'Invalid or expired invite code.' }, { status: 400 })
    }

    const usedBy: string[] = codeSnap.data()?.usedBy ?? []
    if (usedBy.length >= codeSnap.data()!.maxUses) {
      return Response.json({ success: false, error: 'This code has reached its maximum uses.' }, { status: 400 })
    }

    // Check if already approved
    const profileRef = adminDb.doc(`users/${uid}/profile/data`)
    const profileSnap = await profileRef.get()
    if (profileSnap.exists && profileSnap.data()?.betaApproved === true) {
      return Response.json({ success: true, alreadyApproved: true })
    }

    // Approve the user
    await profileRef.set({ betaApproved: true }, { merge: true })

    // Initialize beta usage tracking
    const usageRef = adminDb.doc(`users/${uid}/betaUsage/data`)
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
    console.error('Invite redeem error:', err)
    return Response.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
