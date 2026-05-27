import { adminDb } from '@/lib/firebaseAdmin'
import admin from '@/lib/firebaseAdmin'
import { APP_CONFIG } from '@/lib/config'

function monthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

interface FreeTierResult {
  allowed: boolean
  used: number
  limit: number
}

export async function checkAndIncrementFreeUsage(uid: string): Promise<FreeTierResult> {
  if (!adminDb) throw new Error('Firebase Admin not initialized')

  const key = monthKey()
  const ref = adminDb.doc(`users/${uid}/usage/${key}`)
  const limit = APP_CONFIG.FREE_MONTHLY_LIMIT

  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const used: number = snap.exists ? (snap.data()?.count ?? 0) : 0

    if (used >= limit) {
      return { allowed: false, used, limit }
    }

    tx.set(ref, { count: admin.firestore.FieldValue.increment(1) }, { merge: true })
    return { allowed: true, used: used + 1, limit }
  })

  return result
}

export async function getFreeUsage(uid: string): Promise<{ used: number; limit: number }> {
  if (!adminDb) throw new Error('Firebase Admin not initialized')

  const key = monthKey()
  const snap = await adminDb.doc(`users/${uid}/usage/${key}`).get()
  const used: number = snap.exists ? (snap.data()?.count ?? 0) : 0

  return { used, limit: APP_CONFIG.FREE_MONTHLY_LIMIT }
}
