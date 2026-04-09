import * as admin from 'firebase-admin'

let adminDb: admin.firestore.Firestore | null = null
let adminAuth: admin.auth.Auth | null = null

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
          ?.replace(/\\n/g, '\n'),
      }),
    })
  }
  adminDb = admin.firestore()
  adminAuth = admin.auth()
} catch (e) {
  console.error('Firebase Admin init failed — check FIREBASE_ADMIN_* env vars:', e)
  // adminDb and adminAuth remain null.
  // Routes checking for null will return clear errors rather than
  // silently treating all requests as unauthenticated guests.
}

export { adminDb, adminAuth }
export default admin
