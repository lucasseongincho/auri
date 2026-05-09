'use client'

import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import type { CareerProfile } from '@/types'

/**
 * Global career data hook — wraps the Zustand store and handles
 * the logged-in vs guest persistence split transparently.
 *
 * Callers don't need to know whether data is in Firestore or
 * localStorage — this hook handles the routing.
 */
export function useCareerProfile() {
  const { user } = useAuth()
  const {
    profile,
    currentResume,
    atsScore,
    isGenerating,
    isSyncing,
    syncError,
    updateProfile: storeUpdateProfile,
    setProfile,
    setResume,
    setATSScore,
    setIsGenerating,
    syncToFirestore,
    resetProfile,
  } = useCareerStore()

  const updateProfile = (partial: Partial<CareerProfile>) => {
    storeUpdateProfile(partial)
    // Auto-sync to Firestore for authenticated users (debounced inside store)
    if (user) {
      syncToFirestore(user.uid)
    }
  }

  return {
    profile,
    currentResume,
    atsScore,
    isGenerating,
    isSyncing,
    syncError,
    updateProfile,
    setProfile,
    setResume,
    setATSScore,
    setIsGenerating,
    resetProfile,
  }
}
