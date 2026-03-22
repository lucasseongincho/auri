import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { getAuthenticatedUser } from '@/lib/verifyAuth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    console.log('[invite/validate] Request received')

    const body = await req.json() as { code: string }
    const code = body.code
    console.log('[invite/validate] Code received:', code)

    if (!code?.trim()) {
      return Response.json({ valid: false, reason: 'No code provided.' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase()
    console.log('[invite/validate] Normalized code:', cleanCode)

    console.log('[invite/validate] adminDb available:', !!adminDb)
    if (!adminDb) {
      console.error('[invite/validate] adminDb is null — Firebase Admin not initialized')
      return Response.json({ valid: false, reason: 'Server config error: Firebase Admin not initialized. Check FIREBASE_ADMIN_* env vars.' }, { status: 503 })
    }

    // Look up the invite code document
    console.log('[invite/validate] Looking up invite_codes/', cleanCode)
    const codeRef = adminDb.collection('invite_codes').doc(cleanCode)
    const codeSnap = await codeRef.get()
    console.log('[invite/validate] Document exists:', codeSnap.exists)

    if (!codeSnap.exists) {
      return Response.json({ valid: false, reason: `Code "${cleanCode}" not found in Firestore.` })
    }

    const codeData = codeSnap.data()!
    console.log('[invite/validate] Code data:', JSON.stringify(codeData))

    if (!codeData.isActive) {
      return Response.json({ valid: false, reason: 'This invite code has been deactivated.' })
    }

    const usedBy: string[] = codeData.usedBy ?? []
    if (usedBy.length >= codeData.maxUses) {
      return Response.json({ valid: false, reason: `This code has reached its maximum uses (${codeData.maxUses}).` })
    }

    // Check if requesting user is already approved
    const verifiedUser = await getAuthenticatedUser(req)
    console.log('[invite/validate] Verified user uid:', verifiedUser?.uid ?? 'none')
    if (verifiedUser?.uid) {
      const profileSnap = await adminDb.collection('users').doc(verifiedUser.uid).collection('profile').doc('data').get()
      if (profileSnap.exists && profileSnap.data()?.betaApproved === true) {
        console.log('[invite/validate] User already approved')
        return Response.json({ valid: true, alreadyApproved: true })
      }
    }

    // NOTE: Beta user cap check (collectionGroup count) requires a Firestore composite index.
    // To enable: Firebase Console → Firestore → Indexes → create index on collectionGroup "profile"
    // field: betaApproved (ASC). Until then, the cap is not enforced at validate time.

    console.log('[invite/validate] Code is valid')
    return Response.json({ valid: true })
  } catch (err) {
    console.error('[invite/validate] Unexpected error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ valid: false, reason: `Server error: ${message}` }, { status: 500 })
  }
}
