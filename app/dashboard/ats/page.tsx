'use client'
import { motion } from 'framer-motion'
import { Target, Sparkles } from 'lucide-react'
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
export default function ATSPage() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">ATS Optimizer</h1>
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">Real-time ATS match score with keyword analysis and one-click fixes.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#6366F1]/20 border border-[#8B5CF6]/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[#8B5CF6]" />
          </div>
          <h2 className="font-heading text-xl font-bold text-white mb-2">Coming in Phase 2</h2>
          <p className="text-[#60607A] text-sm max-w-md mx-auto">Live ATS scoring with animated score meter, missing keywords, and Fix All button.</p>
        </div>
      </motion.div>
    </div>
  )
}
