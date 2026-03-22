/**
 * Run this once before sharing invite codes.
 * Check Firebase Console → Firestore → invite_codes to verify.
 *
 * Run with: npx ts-node --esm scripts/create-invite-codes.ts
 * Or:       npx tsx scripts/create-invite-codes.ts
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
const now = admin.firestore.FieldValue.serverTimestamp()

const CODES = [
  {
    code: 'AURI-BETA-2026',
    maxUses: 50,
    isActive: true,
    usedBy: [],
    note: 'Main public beta code — share openly',
  },
  {
    code: 'AURI-FRIEND-01',
    maxUses: 10,
    isActive: true,
    usedBy: [],
    note: 'Personal code 01',
  },
  {
    code: 'AURI-FRIEND-02',
    maxUses: 10,
    isActive: true,
    usedBy: [],
    note: 'Personal code 02',
  },
  {
    code: 'AURI-FRIEND-03',
    maxUses: 10,
    isActive: true,
    usedBy: [],
    note: 'Personal code 03',
  },
  {
    code: 'AURI-FRIEND-04',
    maxUses: 10,
    isActive: true,
    usedBy: [],
    note: 'Personal code 04',
  },
  {
    code: 'AURI-FRIEND-05',
    maxUses: 10,
    isActive: true,
    usedBy: [],
    note: 'Personal code 05',
  },
]

async function main() {
  console.log(`Creating ${CODES.length} invite codes…`)

  for (const entry of CODES) {
    const { code, ...data } = entry
    await db.doc(`invite_codes/${code}`).set({ ...data, code, createdAt: now }, { merge: true })
    console.log(`  ✅ ${code} (max ${data.maxUses} uses) — ${data.note}`)
  }

  const total = CODES.reduce((sum, c) => sum + c.maxUses, 0)
  console.log(`\nDone. Total capacity: ${total} beta users.`)
  console.log('Verify at: Firebase Console → Firestore → invite_codes')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
