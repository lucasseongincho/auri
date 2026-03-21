import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Firebase Admin SDK — server-side only, never exposed to client
// Requires FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
// The private key in Vercel env vars uses literal \n — replace before passing to cert()
const hasAdminConfig = Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID)

if (!getApps().length && hasAdminConfig) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminAuth = hasAdminConfig && getApps().length ? getAuth() : null
export const adminDb = hasAdminConfig && getApps().length ? getFirestore() : null
