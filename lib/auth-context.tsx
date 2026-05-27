'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { auth, hasConfig } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { ensureUserProfileFields, migrateGuestToFirestore, migrateGuestInterviewPrepsToFirestore, migrateGuestCoverLettersToFirestore } from '@/lib/firestore'
import type { AuthUser } from '@/types'

interface SignUpOptions {
  name?: string
  marketingConsent?: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<User>
  signUpWithEmail: (email: string, password: string, options?: SignUpOptions) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Guard: Firebase env vars not set (e.g. Vercel preview without env config)
    if (!hasConfig) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        })
        // Single source of truth: loadFromFirestore only here, not in sign-in methods.
        // This prevents double-reads on sign-in (listener fires after redirect/email sign-in resolves).
        await useCareerStore.getState().loadFromFirestore(firebaseUser.uid)
        // Migrate any guest localStorage data to Firestore on sign-in (non-blocking)
        Promise.all([
          migrateGuestToFirestore(firebaseUser.uid),
          migrateGuestInterviewPrepsToFirestore(firebaseUser.uid),
          migrateGuestCoverLettersToFirestore(firebaseUser.uid),
        ]).catch(() => {/* non-blocking */})
        // Persist auth metadata to Firestore for Google sign-ins and any gaps.
        // ensureUserProfileFields only writes fields that are missing — no overwrites.
        ensureUserProfileFields(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }).catch(() => {/* non-blocking */})
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    await signInWithPopup(auth, googleProvider)
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string, options?: SignUpOptions) => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = result.user
    // Set displayName on the Firebase Auth profile
    if (options?.name?.trim()) {
      await updateProfile(firebaseUser, { displayName: options.name.trim() })
    }
    // Write email, displayName, marketingConsent to Firestore (merge: true, no overwrites)
    await ensureUserProfileFields(firebaseUser.uid, {
      email: firebaseUser.email,
      displayName: options?.name?.trim() || firebaseUser.displayName,
      marketingConsent: options?.marketingConsent ?? false,
    })
    return firebaseUser
  }, [])

  const logout = useCallback(async () => {
    // Always clear local state — even if Firebase signOut fails (e.g. guest mode, unconfigured)
    try {
      if (hasConfig) await signOut(auth)
    } finally {
      setUser(null)
      // Clear cached profile so the next user starts fresh with no stale isPro data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auri_guest_profile')
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
