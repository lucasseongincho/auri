'use client'

import { motion, AnimatePresence } from 'framer-motion'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

interface EstimateDisclaimerModalProps {
  open: boolean
  onClose: () => void
}

/**
 * One-time modal shown after the first resume generation.
 * Explains the amber AI-estimate highlighting system.
 * Shown state is persisted to Firestore (profile.hasSeenEstimateDisclaimer).
 */
export default function EstimateDisclaimerModal({ open, onClose }: EstimateDisclaimerModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 "
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRING}
            className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 w-full max-w-md"
          >
            <div className="rounded-[10px]  bg-[#FFFFFF] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📋</span>
                <h3 className="text-lp-ink font-semibold text-base">About your AI-generated resume</h3>
              </div>

              <p className="text-[#3C403E] text-sm mb-4">
                AURI rewrites your experience to be ATS-optimized and achievement-focused.
                Where you didn&apos;t provide specific numbers, AURI adds realistic estimates
                highlighted in amber so you can easily find and verify them.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-[#1F7A4D] text-sm flex-shrink-0">✅</span>
                  <p className="text-[#3C403E] text-sm">
                    Always replace <span className="text-amber-400 font-medium">amber numbers</span> with your
                    real data before submitting
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#1F7A4D] text-sm flex-shrink-0">✅</span>
                  <p className="text-[#3C403E] text-sm">
                    Click any amber highlight to edit it inline — it turns green when verified
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#1F7A4D] text-sm flex-shrink-0">✅</span>
                  <p className="text-[#3C403E] text-sm">
                    The download button will warn you if unverified numbers remain
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-[4px] text-sm font-semibold
                  bg-[#1F5C4A] text-white
                   transition-all duration-200"
              >
                Got it — show my resume
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
