'use client'

import { useT } from '@/lib/i18n/client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Target, Linkedin, Map, Mail, MessageSquare,
  ChevronRight, TrendingUp, CheckCircle, AlertCircle, Sparkles, X, Zap,
} from 'lucide-react'
import { useCareerProfile } from '@/hooks/useCareerProfile'
import { useAuth } from '@/hooks/useAuth'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

// ── Upgrade success toast — shown after Stripe checkout redirect ──────────────
function UpgradedToast({ onDismiss }: { onDismiss: () => void }) {
  const t = useT()
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.95 }}
      transition={SPRING}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
    >
      <div className="rounded-[10px] border border-[#1F5C4A]/40 bg-[#FFFFFF] p-1 ">
        <div className="rounded-[4px] border border-[#1F5C4A]/20 bg-[#FFFFFF] px-5 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1F5C4A]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-lp-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-lp-ink text-sm">{t("Welcome to AURI Pro! 🎉")}</p>
            <p className="text-xs text-[#3C403E] mt-0.5">{t("Unlimited generations unlocked. You're ready to land the job.")}</p>
          </div>
          <button onClick={onDismiss} aria-label={t("Dismiss")} className="text-[#5A5F5C] hover:text-lp-ink transition-colors flex-shrink-0">
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
  { label: 'Build Resume', desc: 'Generate ATS-optimized resume', icon: FileText, href: '/dashboard/resume', color: ' ' },
  { label: 'ATS Score', desc: 'Check your resume match score', icon: Target, href: '/dashboard/ats', color: ' ' },
  { label: 'Cover Letter', desc: 'Generate in under a minute', icon: Mail, href: '/dashboard/cover-letter', color: ' ' },
  { label: 'Interview Prep', desc: 'Practice likely questions', icon: MessageSquare, href: '/dashboard/interview', color: ' ' },
  { label: 'LinkedIn', desc: 'Optimize your profile', icon: Linkedin, href: '/dashboard/linkedin', color: ' ' },
  { label: 'Job Strategy', desc: '7-day action plan', icon: Map, href: '/dashboard/strategy', color: ' ' },
]

function UpgradeBanner() {
  const t = useT()
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.uid) return
    ;(async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        if (!db) return
        const snap = await getDoc(doc(db, `users/${user.uid}/profile/data`))
        setIsPro(snap.exists() ? (snap.data()?.isPro === true) : false)
      } catch {
        setIsPro(null)
      }
    })()
  }, [user?.uid])

  if (isPro !== false) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="rounded-[10px] border border-[#1F5C4A]/30 bg-[#FFFFFF] p-1"
    >
      <div className="rounded-[10px] border border-[#1F5C4A]/15 bg-[#1F5C4A]/10 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1F5C4A]/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-lp-ink" />
          </div>
          <div>
            <p className="text-sm font-semibold text-lp-ink">{t("3 free generations/month")}</p>
            <p className="text-xs text-[#3C403E]">{t("Upgrade to Pro for unlimited access to all AI tools.")}</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="flex-shrink-0 px-4 py-2 rounded-[4px] font-semibold text-white text-sm
            bg-[#1F5C4A]
             transition-all duration-200 whitespace-nowrap"
        >
          {t("Upgrade to Pro")}
        </Link>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const t = useT()
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
    if (hour < 12) return t("Good morning")
    if (hour < 18) return t("Good afternoon")
    return t("Good evening")
  }

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Upgrade success toast */}
      <Suspense fallback={null}>
        <UpgradeSuccessHandler />
      </Suspense>

      {/* Free tier upgrade prompt */}
      <UpgradeBanner />

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
      >
        <h1 className="font-heading text-3xl font-bold text-lp-ink mb-1">
          {user?.displayName
            ? t('{greeting}, {name}', { greeting: greeting(), name: user.displayName.split(' ')[0] })
            : greeting()}
        </h1>
        <p className="text-[#3C403E]">
          {completeness < 50
            ? t("Complete your career profile to unlock full AI personalization.")
            : t("Your career toolkit is ready. What would you like to work on?")}
        </p>
      </motion.div>

      {/* Profile completeness */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
      >
        <div className="rounded-[10px]  bg-[#FFFFFF] p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1F5C4A]" />
              <span className="text-sm font-medium text-[#3C403E]">{t("Profile Completeness")}</span>
            </div>
            <span className="font-heading font-bold text-lp-ink">{completeness}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-lp-ink/6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completeness}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full bg-[#1F5C4A] "
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-[#5A5F5C]">
              {profile?.personal.name ? (
                <span className="flex items-center gap-1 text-[#1F7A4D]"><CheckCircle className="w-3 h-3" />{' '}{t("Personal info")}</span>
              ) : (
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-[#8A5A00]" />{' '}{t("Personal info")}</span>
              )}
              {profile?.experience && profile.experience.length > 0 ? (
                <span className="flex items-center gap-1 text-[#1F7A4D]"><CheckCircle className="w-3 h-3" />{' '}{t("Experience")}</span>
              ) : (
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-[#8A5A00]" />{' '}{t("Experience")}</span>
              )}
              {profile?.target.position ? (
                <span className="flex items-center gap-1 text-[#1F7A4D]"><CheckCircle className="w-3 h-3" />{' '}{t("Target role")}</span>
              ) : (
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-[#8A5A00]" />{' '}{t("Target role")}</span>
              )}
            </div>
            <Link href="/dashboard/resume" className="text-xs text-[#1F5C4A] hover:text-[#1F5C4A] transition-colors flex items-center gap-1">
              {t("Complete profile")}{' '}<ChevronRight className="w-3 h-3" />
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
          className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
        >
          <div className="rounded-[10px]  bg-[#FFFFFF] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#3C403E] mb-1">{t("Last ATS Score")}</p>
                <p className="font-heading text-4xl font-bold text-lp-ink">{atsScore.score}<span className="text-xl text-[#5A5F5C]">/100</span></p>
              </div>
              <div className="text-right">
                <Link href="/dashboard/ats" className="text-sm text-[#1F5C4A] hover:text-[#1F5C4A] transition-colors flex items-center gap-1 justify-end">
                  {t("View report")}{' '}<ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <p className="text-xs text-[#5A5F5C] mt-1">{t("{v0} keywords missing", { v0: atsScore.missing_keywords.length })}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick actions grid */}
      <div>
        <h2 className="font-heading font-semibold text-[#3C403E] text-sm mb-4 uppercase tracking-widest">
          {t("Quick Actions")}
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
                  className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 cursor-pointer group"
                >
                  <div className="rounded-[10px]  bg-[#FFFFFF] p-5">
                    <div className={`w-10 h-10 rounded-[10px] ${action.color}
                      flex items-center justify-center mb-3
                        transition-shadow duration-300`}>
                      <action.icon className="w-5 h-5 text-lp-ink" />
                    </div>
                    <p className="font-heading font-semibold text-lp-ink text-sm mb-1">{t(action.label)}</p>
                    <p className="text-xs text-[#5A5F5C]">{t(action.desc)}</p>
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
