'use client'
import { useState, useEffect } from 'react'
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
  const [upgradeLoading, setUpgradeLoading] = useState(false)
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

  const handleUpgrade = async () => {
    setUpgradeLoading(true)
    try {
      const token = await getToken()
      if (!token) { window.location.href = '/login'; return }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: 'annual' }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch {
      // silent
    } finally {
      setUpgradeLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#60607A] to-[#A0A0B8] flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Settings</h1>
        </div>
      </motion.div>

      {/* Account card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 space-y-4">
          <h2 className="font-heading font-semibold text-white">Account</h2>
          <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
            <div>
              <p className="text-sm text-white">{user?.displayName ?? ''}</p>
              <p className="text-xs text-[#60607A]">{user?.email ?? ''}</p>
            </div>
          </div>
          <button type="button" onClick={handleSignOut}
            className="px-4 py-2 rounded-xl border border-[#EF4444]/30 text-[#EF4444]
              hover:bg-[#EF4444]/10 transition-all duration-200 text-sm font-medium">
            Sign Out
          </button>
        </div>
      </motion.div>

      {/* Billing card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}
        className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 space-y-4">
          <h2 className="font-heading font-semibold text-white">Billing</h2>

          <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isPro
                  ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]'
                  : 'bg-white/[0.06]'
              }`}>
                {isPro ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <Zap className="w-5 h-5 text-[#60607A]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {isPro === null ? 'Loading…' : isPro ? 'AURI Pro' : 'Free Plan'}
                </p>
                <p className="text-xs text-[#60607A]">
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
              className="px-4 py-2 rounded-xl border border-white/15 text-[#A0A0B8]
                hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {billingLoading ? 'Loading…' : 'Manage Billing'}
            </button>
          )}
          {isPro === false && (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="px-4 py-2 rounded-xl font-semibold text-white text-sm
                bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/40
                hover:scale-[1.02] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {upgradeLoading ? 'Loading…' : 'Upgrade to Pro'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
