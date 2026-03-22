'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

export default function BetaLimitModal() {
  const { betaLimitData, clearBetaLimitData } = useCareerStore()

  return (
    <AnimatePresence>
      {betaLimitData && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clearBetaLimitData}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-white text-base">Weekly Limit Reached</h2>
                      <p className="text-xs text-[#60607A]">
                        {betaLimitData.callsUsed}/{betaLimitData.callsTotal} beta calls used
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearBetaLimitData}
                    aria-label="Close"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#60607A]
                      hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-3 mb-5">
                  <p className="text-sm text-[#A0A0B8] leading-relaxed">
                    You&apos;ve used all <span className="text-white font-semibold">{betaLimitData.callsTotal} beta calls</span> this week.
                    Your limit resets on <span className="text-white font-semibold">{betaLimitData.resetsOn}</span>.
                  </p>

                  <div className="rounded-xl bg-[#0A0A0F] border border-white/[0.06] p-4 space-y-2">
                    <p className="text-xs font-semibold text-[#60607A] uppercase tracking-wide">In the meantime, you can still:</p>
                    <ul className="space-y-1.5">
                      {[
                        'Edit your saved resumes',
                        'Review your interview prep',
                        'Check your 7-day strategy',
                        'Copy your cover letters',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1]/60 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#EF4444]"
                      style={{ width: `${Math.min((betaLimitData.callsUsed / betaLimitData.callsTotal) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearBetaLimitData}
                  className="w-full py-2.5 rounded-xl bg-[#6366F1] text-white font-semibold text-sm
                    hover:bg-[#4F46E5] transition-colors duration-200"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
