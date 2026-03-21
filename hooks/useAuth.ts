'use client'

import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { migrateGuestToFirestore } from '@/lib/firestore'
import { useCareerStore } from '@/store/careerStore'
import type { AuthUser } from '@/types'

const googleProvider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { loadFromFirestore } = useCareerStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isGuest: false,
        }
        setUser(authUser)
        // Load Firestore profile when user signs in
        await loadFromFirestore(firebaseUser.uid)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [loadFromFirestore])

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    // Migrate any guest localStorage data to Firestore on sign-in
    await migrateGuestToFirestore(result.user.uid)
    await loadFromFirestore(result.user.uid)
    return result.user
  }

  const signInWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    await migrateGuestToFirestore(result.user.uid)
    await loadFromFirestore(result.user.uid)
    return result.user
  }

  const signUpWithEmail = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await migrateGuestToFirestore(result.user.uid)
    return result.user
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  // Guest mode — no auth, full feature access, data in localStorage
  const continueAsGuest = () => {
    setUser({
      uid: 'guest',
      email: null,
      displayName: 'Guest',
      photoURL: null,
      isGuest: true,
    })
  }

  return {
    user,
    loading,
    isGuest: user?.isGuest ?? false,
    isAuthenticated: !!user && !user.isGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    continueAsGuest,
  }
}
