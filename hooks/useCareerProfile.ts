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
    selectedTemplate,
    atsScore,
    isGenerating,
    isSyncing,
    syncError,
    updateProfile: storeUpdateProfile,
    setProfile,
    setResume,
    setATSScore,
    setSelectedTemplate,
    setIsGenerating,
    syncToFirestore,
    resetProfile,
  } = useCareerStore()

  const updateProfile = (partial: Partial<CareerProfile>) => {
    storeUpdateProfile(partial)
    // Auto-sync to Firestore for authenticated users (debounced inside store)
    if (user && !user.isGuest) {
      syncToFirestore(user.uid)
    }
    // Guest users: Zustand persist middleware handles localStorage automatically
  }

  return {
    profile,
    currentResume,
    selectedTemplate,
    atsScore,
    isGenerating,
    isSyncing,
    syncError,
    updateProfile,
    setProfile,
    setResume,
    setATSScore,
    setSelectedTemplate,
    setIsGenerating,
    resetProfile,
  }
}
