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
    console.log('[invite/redeem] Request received')

    const body = await req.json() as { code: string }
    const code = body.code
    console.log('[invite/redeem] Code received:', code)

    if (!code?.trim()) {
      return Response.json({ success: false, error: 'No code provided.' }, { status: 400 })
    }

    const verifiedUser = await getAuthenticatedUser(req)
    console.log('[invite/redeem] Verified user uid:', verifiedUser?.uid ?? 'none')
    if (!verifiedUser?.uid) {
      return Response.json({ success: false, error: 'Unauthorized — no valid Firebase ID token.' }, { status: 401 })
    }

    console.log('[invite/redeem] adminDb available:', !!adminDb)
    if (!adminDb) {
      console.error('[invite/redeem] adminDb is null — Firebase Admin not initialized')
      return Response.json({ success: false, error: 'Server config error: Firebase Admin not initialized. Check FIREBASE_ADMIN_* env vars.' }, { status: 503 })
    }

    const cleanCode = code.trim().toUpperCase()
    const uid = verifiedUser.uid
    console.log('[invite/redeem] Normalized code:', cleanCode, '| uid:', uid)

    // Double-check code validity
    const codeRef = adminDb.collection('invite_codes').doc(cleanCode)
    console.log('[invite/redeem] Looking up invite_codes/', cleanCode)
    const codeSnap = await codeRef.get()
    console.log('[invite/redeem] Document exists:', codeSnap.exists)

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
    console.log('[invite/redeem] Checking profile at users/', uid, '/profile/data')
    const profileSnap = await profileRef.get()
    if (profileSnap.exists && profileSnap.data()?.betaApproved === true) {
      console.log('[invite/redeem] User already approved')
      return Response.json({ success: true, alreadyApproved: true })
    }

    // Approve the user
    console.log('[invite/redeem] Setting betaApproved on profile')
    await profileRef.set({ betaApproved: true }, { merge: true })

    // Initialize beta usage tracking
    const usageRef = adminDb.collection('users').doc(uid).collection('betaUsage').doc('data')
    console.log('[invite/redeem] Initializing betaUsage')
    await usageRef.set(
      {
        betaCallsThisWeek: 0,
        betaWeekStart: Timestamp.fromDate(getThisMondayUTC()),
      },
      { merge: true }
    )

    // Record uid in the invite code's usedBy array
    console.log('[invite/redeem] Updating usedBy on invite code')
    await codeRef.update({ usedBy: FieldValue.arrayUnion(uid) })

    console.log('[invite/redeem] Success')
    return Response.json({ success: true })
  } catch (err) {
    console.error('[invite/redeem] Unexpected error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ success: false, error: `Server error: ${message}` }, { status: 500 })
  }
}
