import * as admin from 'firebase-admin'

if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  console.error('MISSING ENV VAR: FIREBASE_ADMIN_PROJECT_ID')
}
if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
  console.error('MISSING ENV VAR: FIREBASE_ADMIN_CLIENT_EMAIL')
}
if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('MISSING ENV VAR: FIREBASE_ADMIN_PRIVATE_KEY')
}

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

export const adminDb = admin.firestore()
export const adminAuth = admin.auth()
export default admin
