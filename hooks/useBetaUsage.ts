'use client'

import { useEffect, useState } from 'react'
import { getBetaUsage, type BetaUsage } from '@/lib/firestore'

export function useBetaUsage(uid: string | undefined) {
  const [usage, setUsage] = useState<BetaUsage | null>(null)

  useEffect(() => {
    if (!uid) return
    getBetaUsage(uid).then(setUsage).catch(() => setUsage(null))
  }, [uid])

  return usage
}
