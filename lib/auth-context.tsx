'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { auth, hasConfig } from '@/lib/firebase'
import { migrateGuestToFirestore } from '@/lib/firestore'
import { useCareerStore } from '@/store/careerStore'
import type { AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isGuest: boolean
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<User>
  signInWithEmail: (email: string, password: string) => Promise<User>
  signUpWithEmail: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  continueAsGuest: () => void
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
          isGuest: false,
        })
        // Single source of truth: loadFromFirestore only here, not in sign-in methods.
        // This prevents double-reads on sign-in (listener fires after signInWithPopup resolves).
        await useCareerStore.getState().loadFromFirestore(firebaseUser.uid)
      } else {
        // Don't clobber guest state — only clear if user was a real Firebase user
        setUser((prev) => (prev?.isGuest ? prev : null))
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    const result = await signInWithPopup(auth, googleProvider)
    await migrateGuestToFirestore(result.user.uid)
    return result.user
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    const result = await signInWithEmailAndPassword(auth, email, password)
    await migrateGuestToFirestore(result.user.uid)
    return result.user
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await migrateGuestToFirestore(result.user.uid)
    return result.user
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
  }, [])

  const continueAsGuest = useCallback(() => {
    setUser({
      uid: 'guest',
      email: null,
      displayName: 'Guest',
      photoURL: null,
      isGuest: true,
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest: user?.isGuest ?? false,
        isAuthenticated: !!user && !user.isGuest,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        continueAsGuest,
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
