/**
 * Backfills missing email, displayName, and createdAt fields on all
 * users/{uid}/profile/data documents from Firebase Auth records.
 *
 * Safe to run multiple times — uses merge: true and only writes fields
 * that are currently missing. Never overwrites existing data.
 *
 * Run with: npx tsx scripts/backfill-user-profiles.ts
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
const auth = admin.auth()

async function main() {
  console.log('Listing all Firebase Auth users…')

  let pageToken: string | undefined
  let totalUsers = 0
  let backfilled = 0
  let skipped = 0

  do {
    const listResult = await auth.listUsers(1000, pageToken)
    pageToken = listResult.pageToken

    for (const userRecord of listResult.users) {
      totalUsers++
      const uid = userRecord.uid
      const ref = db.doc(`users/${uid}/profile/data`)
      const snap = await ref.get()
      const existing = snap.exists ? snap.data()! : {}

      const updates: Record<string, unknown> = {}

      if (!existing['email'] && userRecord.email) {
        updates['email'] = userRecord.email
      }
      if (!existing['displayName'] && userRecord.displayName) {
        updates['displayName'] = userRecord.displayName
      }
      // Set createdAt from Firebase Auth metadata if missing
      if (!existing['createdAt'] && userRecord.metadata?.creationTime) {
        updates['createdAt'] = admin.firestore.Timestamp.fromDate(
          new Date(userRecord.metadata.creationTime)
        )
      }

      if (Object.keys(updates).length > 0) {
        await ref.set(updates, { merge: true })
        console.log(`  ✓ Backfilled uid=${uid}: ${Object.keys(updates).join(', ')}`)
        backfilled++
      } else {
        skipped++
      }
    }
  } while (pageToken)

  console.log(`\nDone. Total users: ${totalUsers} | Backfilled: ${backfilled} | Already complete: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
