'use client'

import { useEffect, useState } from 'react'
import { getBetaUsage, type BetaUsage } from '@/lib/firestore'

export function useBetaUsage(uid: string | undefined, refreshKey?: number) {
  const [usage, setUsage] = useState<BetaUsage | null>(null)

  useEffect(() => {
    if (!uid) return
    getBetaUsage(uid).then(setUsage).catch(() => setUsage(null))
  }, [uid, refreshKey])

  return usage
}
