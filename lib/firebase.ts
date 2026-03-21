import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

// Firebase config is public-safe — actual security enforced by Firestore rules
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Guard against Next.js SSG build crash: Firebase throws auth/invalid-api-key
// at module-load time when NEXT_PUBLIC_FIREBASE_API_KEY is missing in the build env.
// All Firebase operations are inside useEffect → never called during SSG, so the
// empty-object fallback is safe. Real env vars are required at runtime.
const hasConfig = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)

const app: FirebaseApp = hasConfig
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : ({} as FirebaseApp)

const auth: Auth = hasConfig ? getAuth(app) : ({} as Auth)
const db: Firestore = hasConfig ? getFirestore(app) : ({} as Firestore)

// No Firebase Storage — PDFs generated client-side via html2pdf.js

export { app, auth, db }
