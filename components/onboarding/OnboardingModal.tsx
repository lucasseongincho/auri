'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Lock, Check, Sparkles, Crown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCareerStore } from '@/store/careerStore'
import { updateCareerProfile } from '@/lib/firestore'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const TOTAL_STEPS = 4

const PRO_FEATURES = [
  'LinkedIn Rewriter',
  'Resume Rewriter',
  'Job Strategy',
  'Interview Prep',
] as const

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
}

export default function OnboardingModal() {
  const { user } = useAuth()
  const { profile, updateProfile } = useCareerStore()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  const isPro = profile?.isPro === true

  const complete = () => {
    updateProfile({ hasCompletedOnboarding: true })
    if (user?.uid) {
      updateCareerProfile(user.uid, { hasCompletedOnboarding: true }).catch(() => {})
    }
  }

  const handleNext = () => {
    setDirection(1)
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    setDirection(-1)
    setStep((s) => s - 1)
  }

  const handleGoToATS = () => {
    complete()
    router.push('/dashboard/ats')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0A0A0F]/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING}
        className="w-full max-w-md overflow-hidden"
      >
        {/* Outer bezel */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />

          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 pt-5">
            {/* Header row: step dots + counter + skip */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i + 1 === step
                        ? 'w-4 bg-[#6366F1]'
                        : i + 1 < step
                        ? 'w-1.5 bg-[#6366F1]/50'
                        : 'w-1.5 bg-white/10'
                    }`}
                  />
                ))}
                <span className="text-[11px] text-[#60607A] ml-1">{step} of {TOTAL_STEPS}</span>
              </div>
              <button
                onClick={complete}
                className="text-xs text-[#60607A] hover:text-[#A0A0B8] transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Step content */}
            <div className="relative min-h-[210px] overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                >
                  {step === 1 && <Step1 />}
                  {step === 2 && <Step2 />}
                  {step === 3 && <Step3 isPro={isPro} />}
                  {step === 4 && <Step4 />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="text-sm text-[#60607A] hover:text-[#A0A0B8] transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {step < TOTAL_STEPS ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white
                    bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                    shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                    hover:scale-[1.02] transition-all duration-200"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleGoToATS}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white
                    bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                    shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                    hover:scale-[1.02] transition-all duration-200"
                >
                  Go to Resume Analyzer →
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Step1() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
          flex items-center justify-center shadow-lg shadow-[#6366F1]/25 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white font-heading">Welcome to AURI</h2>
      </div>
      <p className="text-[#A0A0B8] text-sm leading-relaxed">
        You've got a career toolkit that actually works. Here's a quick look at what you can do — it takes 30 seconds.
      </p>
    </div>
  )
}

function Step2() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="text-xl font-semibold text-white font-heading">Start with the Resume Analyzer</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold
          bg-[#22C55E]/15 border border-[#22C55E]/25 text-[#22C55E]">
          Free
        </span>
      </div>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08]
          flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#818CF8]" />
        </div>
        <p className="text-[#A0A0B8] text-sm leading-relaxed">
          Paste any job description and AURI will score your resume against it, show you what's missing, and tell you exactly what to fix.
        </p>
      </div>
    </div>
  )
}

function Step3({ isPro }: { isPro: boolean }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white font-heading mb-2">Unlock the full toolkit</h2>
      <p className="text-[#A0A0B8] text-sm leading-relaxed mb-4">
        Pro members also get LinkedIn Rewriter, Resume Rewriter, Job Strategy, and Interview Prep.
      </p>
      <ul className="space-y-2 mb-5">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2.5">
            {isPro ? (
              <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-[#60607A] flex-shrink-0" />
            )}
            <span className={`text-sm ${isPro ? 'text-[#A0A0B8]' : 'text-[#60607A]'}`}>{f}</span>
            {!isPro && (
              <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded
                text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                PRO
              </span>
            )}
          </li>
        ))}
      </ul>
      {isPro ? (
        <p className="text-sm font-medium text-[#22C55E]">✓ You have full access</p>
      ) : (
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
            shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
            hover:scale-[1.02] transition-all duration-200"
        >
          <Crown className="w-3.5 h-3.5" />
          Upgrade to Pro — $19/mo
        </a>
      )}
    </div>
  )
}

function Step4() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white font-heading mb-3">You're ready.</h2>
      <p className="text-[#A0A0B8] text-sm leading-relaxed">
        Start by analyzing your resume against a real job description. Most users see results in under 2 minutes.
      </p>
    </div>
  )
}
