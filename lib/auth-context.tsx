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
import { useCareerStore } from '@/store/careerStore'
import type { AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<User>
  signInWithEmail: (email: string, password: string) => Promise<User>
  signUpWithEmail: (email: string, password: string) => Promise<User>
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
        // This prevents double-reads on sign-in (listener fires after signInWithPopup resolves).
        await useCareerStore.getState().loadFromFirestore(firebaseUser.uid)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!hasConfig) throw new Error('Firebase is not configured.')
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return result.user
  }, [])

  const logout = useCallback(async () => {
    // Always clear local state — even if Firebase signOut fails (e.g. guest mode, unconfigured)
    try {
      if (hasConfig) await signOut(auth)
    } finally {
      setUser(null)
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
