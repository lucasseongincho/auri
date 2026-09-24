'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Settings, Crown, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSignOut } from '@/hooks/useSignOut'
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

async function getToken(): Promise<string | null> {
  try {
    const { getIdToken } = await import('firebase/auth')
    const { auth } = await import('@/lib/firebase')
    if (!auth.currentUser) return null
    return getIdToken(auth.currentUser)
  } catch {
    return null
  }
}

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const { handleSignOut } = useSignOut()
  const [billingLoading, setBillingLoading] = useState(false)
  const [isPro, setIsPro] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) return
    ;(async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        if (!db) return
        const snap = await getDoc(doc(db, `users/${user.uid}/profile/data`))
        setIsPro(snap.exists() ? (snap.data()?.isPro === true) : false)
      } catch {
        setIsPro(false)
      }
    })()
  }, [isAuthenticated, user?.uid])

  const handleManageBilling = async () => {
    setBillingLoading(true)
    try {
      const token = await getToken()
      if (!token) return
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch {
      // silent
    } finally {
      setBillingLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-[10px] bg-[#5A5F5C]/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-lp-ink" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-lp-ink">Settings</h1>
        </div>
      </motion.div>

      {/* Account card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
        className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-6 space-y-4">
          <h2 className="font-heading font-semibold text-lp-ink">Account</h2>
          <div className="flex items-center justify-between py-3 border-b border-lp-hairline">
            <div>
              <p className="text-sm text-lp-ink">{user?.displayName ?? ''}</p>
              <p className="text-xs text-[#5A5F5C]">{user?.email ?? ''}</p>
            </div>
          </div>
          <button type="button" onClick={handleSignOut}
            className="px-4 py-2 rounded-[4px] border border-[#B42318]/30 text-[#B42318]
              hover:bg-[#B42318]/10 transition-all duration-200 text-sm font-medium">
            Sign Out
          </button>
        </div>
      </motion.div>

      {/* Billing card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}
        className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-6 space-y-4">
          <h2 className="font-heading font-semibold text-lp-ink">Billing</h2>

          <div className="flex items-center justify-between py-3 border-b border-lp-hairline">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${
                isPro
                  ? 'bg-[#1F5C4A] '
                  : 'bg-lp-ink/6'
              }`}>
                {isPro ? (
                  <Crown className="w-5 h-5 text-lp-ink" />
                ) : (
                  <Zap className="w-5 h-5 text-[#5A5F5C]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-lp-ink">
                  {isPro === null ? 'Loading…' : isPro ? 'AURI Pro' : 'Free Plan'}
                </p>
                <p className="text-xs text-[#5A5F5C]">
                  {isPro ? 'Unlimited AI generations' : '3 AI generations/month'}
                </p>
              </div>
            </div>
          </div>

          {isPro === true && (
            <button
              type="button"
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="px-4 py-2 rounded-[4px] border border-lp-rule text-[#3C403E]
                hover:text-lp-ink hover:bg-lp-ink/5 transition-all duration-200 text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {billingLoading ? 'Loading…' : 'Manage Billing'}
            </button>
          )}
          {isPro === false && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px]
                font-semibold text-white text-sm
                bg-[#1F5C4A]
                 transition-all duration-200"
            >
              <Crown className="w-3.5 h-3.5" />
              View Plans
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
