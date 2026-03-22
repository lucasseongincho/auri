'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCareerStore } from '@/store/careerStore'

export function useSignOut() {
  const router = useRouter()
  const { logout } = useAuth()
  const clearStore = useCareerStore((state) => state.clearStore)

  const handleSignOut = async () => {
    try {
      await logout()
      clearStore()
      localStorage.clear()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return { handleSignOut }
}
