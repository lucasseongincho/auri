'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Sparkles, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const FREE_FEATURES = [
  '3 AI generations/month',
  'Resume builder & ATS optimizer',
  'Cover letter generator',
]

const PRO_FEATURES = [
  'Unlimited AI generations',
  'All Free features included',
  'LinkedIn profile rewriter',
  '7-day job search strategy',
  'Interview prep system',
  'Priority support',
]

const ANNUAL_FEATURES = [
  'Unlimited AI generations',
  'All Free features included',
  'LinkedIn profile rewriter',
  '7-day job search strategy',
  'Interview prep system',
  'Priority support',
  '2 months free vs monthly',
]

export default function PricingPage() {
  const { user } = useAuth()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  const monthlyPrice = 19
  const annualMonthlyPrice = 15.83
  const displayPrice = billing === 'annual' ? annualMonthlyPrice : monthlyPrice

  const handleUpgrade = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    try {
      const { getIdToken } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase')
      if (!auth.currentUser) { window.location.href = '/login'; return }
      const token = await getIdToken(auth.currentUser)
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: billing }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch {
      // fallback
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] px-6 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#60607A] hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#818CF8] text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" /> Simple, transparent pricing
          </div>
          <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4">
            Start free. Upgrade when<br />you&apos;re ready.
          </h1>
          <p className="text-[#A0A0B8] text-lg">
            No credit card required to start. Cancel anytime.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="flex justify-center mb-10"
        >
          <div className="relative flex items-center p-1 rounded-xl
            bg-[#13131A] border border-white/[0.08]">
            {/* Sliding background */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="absolute rounded-lg bg-[#6366F1]"
              style={{
                width: 'calc(50% - 4px)',
                height: 'calc(100% - 8px)',
                top: 4,
                left: billing === 'monthly' ? 4 : 'calc(50%)',
              }}
            />
            <button
              onClick={() => setBilling('monthly')}
              className={`relative z-10 px-5 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200 ${
                billing === 'monthly' ? 'text-white' : 'text-[#60607A] hover:text-[#A0A0B8]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`relative z-10 px-5 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200 flex items-center gap-2 ${
                billing === 'annual' ? 'text-white' : 'text-[#60607A] hover:text-[#A0A0B8]'
              }`}
            >
              Annual
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                transition-colors duration-200 ${
                billing === 'annual'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]'
              }`}>
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.08 }}
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 h-full">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8 h-full flex flex-col">
                <div className="mb-6">
                  <p className="font-heading font-semibold text-[#A0A0B8] mb-2">Free</p>
                  <div className="flex items-end gap-1">
                    <span className="font-heading font-bold text-4xl text-white">$0</span>
                    <span className="text-[#60607A] mb-1">/month</span>
                  </div>
                  <p className="text-xs text-[#60607A] mt-2">No credit card required</p>
                </div>

                <ul className="space-y-3 mb-2 flex-1">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                      <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#60607A] mt-2 mb-8">
                  LinkedIn, Strategy, Interview &amp; Rewriter require Pro
                </p>

                <Link
                  href="/dashboard"
                  className="block text-center py-3 rounded-xl border border-white/15
                    text-[#A0A0B8] hover:text-white hover:bg-white/5
                    transition-all duration-200 font-medium"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.12 }}
          >
            <div className="rounded-2xl border border-[#6366F1]/40 bg-[#13131A] p-1 h-full relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full
                bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-semibold">
                Most Popular
              </div>
              <div className="rounded-xl border border-[#6366F1]/20 bg-[#1C1C26] p-8 h-full flex flex-col">
                <div className="mb-6">
                  <p className="font-heading font-semibold text-[#818CF8] mb-2">Pro</p>
                  <div className="flex items-end gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={billing}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="font-heading font-bold text-4xl text-white"
                      >
                        {billing === 'annual' ? '$15.83' : '$19'}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[#60607A] mb-1">/month</span>
                  </div>
                  <AnimatePresence>
                    {billing === 'annual' && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="text-xs text-[#22C55E] mt-1"
                      >
                        $190 billed annually
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                      <CheckCircle className="w-4 h-4 text-[#6366F1] flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleUpgrade}
                  className="w-full py-3 rounded-xl font-semibold text-white
                    bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                    shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                    hover:scale-[1.02] transition-all duration-200"
                >
                  {user ? 'Upgrade to Pro' : 'Sign in to Upgrade'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-[#60607A] mt-12"
        >
          Questions? Email{' '}
          <a href="mailto:support@auri.app" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
            support@auri.app
          </a>
        </motion.p>
      </div>
    </main>
  )
}
