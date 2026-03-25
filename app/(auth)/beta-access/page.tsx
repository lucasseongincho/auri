'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

export default function BetaAccessPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || status === 'loading') return

    setStatus('loading')
    setErrorMsg('')

    try {
      // Validate first
      const validateRes = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
      const validateData = await validateRes.json()

      if (validateData.alreadyApproved) {
        setStatus('success')
        setTimeout(() => router.replace('/dashboard'), 1200)
        return
      }

      if (!validateData.valid) {
        setStatus('error')
        setErrorMsg(validateData.reason ?? 'Invalid code.')
        return
      }

      // Redeem
      let idToken: string | undefined
      if (auth.currentUser) {
        idToken = await getIdToken(auth.currentUser).catch(() => undefined)
      }

      const redeemRes = await fetch('/api/invite/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
      const redeemData = await redeemRes.json()

      if (redeemData.success) {
        setStatus('success')
        setTimeout(() => router.replace('/dashboard'), 1400)
      } else {
        setStatus('error')
        setErrorMsg(redeemData.error ?? 'Could not redeem code. Please try again.')
      }
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error ? err.message : String(err)
      setErrorMsg(`Unknown error — check console: ${message}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[600px] h-[600px] rounded-full bg-[#6366F1]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="w-full max-w-md relative"
      >
        <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8">
            {/* Logo */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
                flex items-center justify-center shadow-lg shadow-[#6366F1]/30 mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-white mb-1">
                Welcome to AURI Beta
              </h1>
              <p className="text-sm text-[#A0A0B8]">
                Enter your invite code to unlock access
              </p>
              {user && (
                <p className="text-xs text-[#60607A] mt-1">
                  Signed in as {user.email}
                </p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    if (status === 'error') setStatus('idle')
                  }}
                  placeholder="AURI-BETA-XXXX"
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3
                    text-white text-sm font-mono tracking-widest placeholder-[#60607A]
                    focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30
                    transition-all disabled:opacity-50 text-center"
                  aria-label="Invite code"
                  autoFocus
                />
              </div>

              {/* Error */}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20"
                >
                  <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  <p className="text-xs text-[#EF4444]">{errorMsg}</p>
                </motion.div>
              )}

              {/* Success */}
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20"
                >
                  <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                  <p className="text-xs text-[#22C55E]">Access granted! Taking you to the dashboard…</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={!code.trim() || status === 'loading' || status === 'success'}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm
                  shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50 hover:scale-[1.01]
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:hover:scale-100"
              >
                {status === 'loading'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                  : status === 'success'
                  ? <><CheckCircle className="w-4 h-4" /> Access Granted!</>
                  : 'Unlock Beta Access'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-[#60607A] mt-6">
              Don&apos;t have a code?{' '}
              <a
                href="mailto:hello@auri-beta.vercel.app?subject=AURI Beta Waitlist"
                className="text-[#6366F1] hover:text-[#818CF8] transition-colors"
              >
                Join the waitlist
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
