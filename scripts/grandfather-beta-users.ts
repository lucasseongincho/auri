/**
 * Run this BEFORE setting BETA_MODE = false in lib/config.ts.
 * This gives all beta testers 30 days of free Pro access
 * as a thank you for testing AURI.
 *
 * DO NOT run this now — it is ready for when beta ends.
 *
 * Run with: npx tsx scripts/grandfather-beta-users.ts
 *
 * Requires these env vars in .env.local:
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY
 */

import * as admin from 'firebase-admin'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } =
  process.env

if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('Missing Firebase Admin env vars. Check .env.local')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

const db = admin.firestore()

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

async function main() {
  console.log('Querying all betaApproved users…')

  // Fetch all profile/data docs where betaApproved = true
  const snap = await db.collectionGroup('profile').where('betaApproved', '==', true).get()

  if (snap.empty) {
    console.log('No betaApproved users found.')
    process.exit(0)
  }

  const proExpiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + THIRTY_DAYS_MS))
  let updated = 0

  const batch = db.batch()
  for (const docSnap of snap.docs) {
    batch.set(
      docSnap.ref,
      {
        isPro: true,
        grandfathered: true,
        proExpiresAt,
      },
      { merge: true }
    )
    updated++
  }

  await batch.commit()
  console.log(`\nUpdated ${updated} users with grandfathered Pro access (30 days).`)
  console.log('Next step: set BETA_MODE = false in lib/config.ts')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
