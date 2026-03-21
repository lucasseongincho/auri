'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Target, Linkedin, Map, Mail, MessageSquare,
  ChevronRight, TrendingUp, CheckCircle, AlertCircle, Sparkles, X,
} from 'lucide-react'
import { useCareerProfile } from '@/hooks/useCareerProfile'
import { useAuth } from '@/hooks/useAuth'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

// ── Upgrade success toast — shown after Stripe checkout redirect ──────────────
function UpgradedToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.95 }}
      transition={SPRING}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
    >
      <div className="rounded-2xl border border-[#6366F1]/40 bg-[#13131A] p-1 shadow-2xl shadow-[#6366F1]/20">
        <div className="rounded-xl border border-[#6366F1]/20 bg-[#1C1C26] px-5 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-white text-sm">Welcome to AURI Pro! 🎉</p>
            <p className="text-xs text-[#A0A0B8] mt-0.5">Unlimited generations unlocked. You&apos;re ready to land the job.</p>
          </div>
          <button onClick={onDismiss} aria-label="Dismiss" className="text-[#60607A] hover:text-white transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Inner component that reads search params (must be inside Suspense)
function UpgradeSuccessHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShowToast(true)
      // Remove query param from URL without navigation
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, router])

  const dismiss = () => setShowToast(false)

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!showToast) return
    const t = setTimeout(() => setShowToast(false), 6000)
    return () => clearTimeout(t)
  }, [showToast])

  return (
    <AnimatePresence>
      {showToast && <UpgradedToast onDismiss={dismiss} />}
    </AnimatePresence>
  )
}

const QUICK_ACTIONS = [
  { label: 'Build Resume', desc: 'Generate ATS-optimized resume', icon: FileText, href: '/dashboard/resume', color: 'from-[#6366F1] to-[#4F46E5]' },
  { label: 'ATS Score', desc: 'Check your resume match score', icon: Target, href: '/dashboard/ats', color: 'from-[#8B5CF6] to-[#6366F1]' },
  { label: 'Cover Letter', desc: 'Generate in under a minute', icon: Mail, href: '/dashboard/cover-letter', color: 'from-[#F59E0B] to-[#D97706]' },
  { label: 'Interview Prep', desc: 'Practice likely questions', icon: MessageSquare, href: '/dashboard/interview', color: 'from-[#EF4444] to-[#DC2626]' },
  { label: 'LinkedIn', desc: 'Optimize your profile', icon: Linkedin, href: '/dashboard/linkedin', color: 'from-[#0EA5E9] to-[#6366F1]' },
  { label: 'Job Strategy', desc: '7-day action plan', icon: Map, href: '/dashboard/strategy', color: 'from-[#22C55E] to-[#16A34A]' },
]

export default function DashboardPage() {
  const { profile, atsScore } = useCareerProfile()
  const { user } = useAuth()

  // Calculate profile completeness
  const completeness = (() => {
    if (!profile) return 0
    let score = 0
    if (profile.personal.name) score += 15
    if (profile.personal.email) score += 10
    if (profile.experience.length > 0) score += 30
    if (profile.education.length > 0) score += 15
    if (profile.skills.length > 0) score += 15
    if (profile.target.position) score += 15
    return score
  })()

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Upgrade success toast */}
      <Suspense fallback={null}>
        <UpgradeSuccessHandler />
      </Suspense>

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
      >
        <h1 className="font-heading text-3xl font-bold text-white mb-1">
          {greeting()}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-[#A0A0B8]">
          {completeness < 50
            ? 'Complete your career profile to unlock full AI personalization.'
            : 'Your career toolkit is ready. What would you like to work on?'}
        </p>
      </motion.div>

      {/* Profile completeness */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
      >
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#6366F1]" />
              <span className="text-sm font-medium text-[#A0A0B8]">Profile Completeness</span>
            </div>
            <span className="font-heading font-bold text-white">{completeness}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completeness}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-[#60607A]">
              {profile?.personal.name ? (
                <span className="flex items-center gap-1 text-[#22C55E]"><CheckCircle className="w-3 h-3" /> Personal info</span>
              ) : (
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-[#F59E0B]" /> Personal info</span>
              )}
              {profile?.experience && profile.experience.length > 0 ? (
                <span className="flex items-center gap-1 text-[#22C55E]"><CheckCircle className="w-3 h-3" /> Experience</span>
              ) : (
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-[#F59E0B]" /> Experience</span>
              )}
              {profile?.target.position ? (
                <span className="flex items-center gap-1 text-[#22C55E]"><CheckCircle className="w-3 h-3" /> Target role</span>
              ) : (
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-[#F59E0B]" /> Target role</span>
              )}
            </div>
            <Link href="/dashboard/resume" className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors flex items-center gap-1">
              Complete profile <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ATS score snapshot (if available) */}
      {atsScore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.15 }}
          className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
        >
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A0A0B8] mb-1">Last ATS Score</p>
                <p className="font-heading text-4xl font-bold text-white">{atsScore.score}<span className="text-xl text-[#60607A]">/100</span></p>
              </div>
              <div className="text-right">
                <Link href="/dashboard/ats" className="text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors flex items-center gap-1 justify-end">
                  View report <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <p className="text-xs text-[#60607A] mt-1">{atsScore.missing_keywords.length} keywords missing</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick actions grid */}
      <div>
        <h2 className="font-heading font-semibold text-[#A0A0B8] text-sm mb-4 uppercase tracking-widest">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.1 + i * 0.05 }}
            >
              <Link href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={SPRING}
                  className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 cursor-pointer group"
                >
                  <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color}
                      flex items-center justify-center mb-3
                      group-hover:shadow-lg group-hover:shadow-[#6366F1]/20 transition-shadow duration-300`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-heading font-semibold text-white text-sm mb-1">{action.label}</p>
                    <p className="text-xs text-[#60607A]">{action.desc}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
