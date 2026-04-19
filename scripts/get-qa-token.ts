import * as admin from 'firebase-admin'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_API_KEY } = process.env

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\n/g, '\n'),
    }),
  })
}

const db = admin.firestore()
const auth = admin.auth()

async function main() {
  const QA_EMAIL = 'qa-test@auri-test.dev'
  
  let uid: string
  try {
    const existing = await auth.getUserByEmail(QA_EMAIL)
    uid = existing.uid
  } catch {
    const created = await auth.createUser({
      email: QA_EMAIL,
      password: 'QA_Pass_2026!',
      displayName: 'QA Tester',
    })
    uid = created.uid
  }
  
  await db.doc(`users/${uid}/profile/data`).set({ betaApproved: true, email: QA_EMAIL, displayName: 'QA Tester', isPro: true }, { merge: true })
  
  const customToken = await auth.createCustomToken(uid)
  
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${NEXT_PUBLIC_FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  })
  const data = await res.json() as { idToken?: string; refreshToken?: string; error?: unknown }
  if (!data.idToken) { console.error('Token exchange failed:', JSON.stringify(data.error)); process.exit(1) }
  
  console.log('UID=' + uid)
  console.log('ID_TOKEN=' + data.idToken)
  console.log('REFRESH_TOKEN=' + data.refreshToken)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
