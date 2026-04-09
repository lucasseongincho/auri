import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

export interface VerifiedUser {
  uid: string
  isPro: boolean
  email?: string
}

/**
 * Verifies the Firebase ID token from the Authorization header and reads
 * isPro status from Firestore server-side.
 *
 * Why server-side verification: Prevents clients from self-reporting isPro=true
 * to bypass Pro-only rate limits. Firebase ID tokens are cryptographically signed
 * and cannot be forged without the private key.
 *
 * Returns null for: missing token, invalid token.
 * Throws if Firebase Admin is not initialized (misconfigured env) — this surfaces
 * as a 500 rather than silently treating the request as a guest.
 */
export async function getAuthenticatedUser(req: Request): Promise<VerifiedUser | null> {
  if (!adminAuth || !adminDb) {
    console.error('Firebase Admin not initialized — check FIREBASE_ADMIN_* env vars')
    throw new Error('Firebase Admin not initialized')
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const snap = await adminDb.doc(`users/${uid}/profile/data`).get()
    const isPro = snap.exists ? (snap.data()?.isPro === true) : false

    return { uid, isPro, email: decoded.email }
  } catch {
    return null
  }
}
