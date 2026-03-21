'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Sparkles, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const FREE_FEATURES = [
  '3 resume generations/month',
  'All 5 resume templates',
  'ATS scoring & optimizer',
  'Cover letter generator',
  'Guest mode — no sign-up required',
]

const PRO_FEATURES = [
  'Unlimited AI generations',
  'All Free features included',
  'LinkedIn profile rewriter',
  '7-day job search strategy',
  'Interview prep with AI scoring',
  'PDF export (all templates)',
  'Priority support',
]

export default function PricingPage() {
  const { user } = useAuth()

  const handleUpgrade = async () => {
    if (!user || user.isGuest) {
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
          className="text-center mb-16"
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

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.05 }}
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

                <ul className="space-y-3 mb-8 flex-1">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                      <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

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
            transition={{ ...SPRING, delay: 0.1 }}
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
                    <span className="font-heading font-bold text-4xl text-white">$19</span>
                    <span className="text-[#60607A] mb-1">/month</span>
                  </div>
                  <p className="text-xs text-[#60607A] mt-2">Cancel anytime</p>
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
                  {user && !user.isGuest ? 'Upgrade to Pro' : 'Sign in to Upgrade'}
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
