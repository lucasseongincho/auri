'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ArrowRight, LayoutList, Loader2 } from 'lucide-react'
import type { SectionAnalysis } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

interface SectionAnalysisPanelProps {
  sections: SectionAnalysis[] | null
  isLoading: boolean
}

function scoreBadgeClass(score: number): string {
  if (score >= 75) return 'bg-[#1F7A4D]/10 border-[#1F7A4D]/20 text-[#1F7A4D]'
  if (score >= 50) return 'bg-[#8A5A00]/10 border-[#8A5A00]/20 text-[#8A5A00]'
  return 'bg-[#B42318]/10 border-[#B42318]/20 text-[#B42318]'
}

export default function SectionAnalysisPanel({ sections, isLoading }: SectionAnalysisPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-5">
          <div className="flex items-center gap-2 mb-4">
            <LayoutList className="w-4 h-4 text-[#1F5C4A]" />
            <span className="text-sm font-semibold text-lp-ink">Analyzing sections…</span>
            <Loader2 className="w-3.5 h-3.5 text-[#1F5C4A] animate-spin ml-auto" />
          </div>
          <div className="space-y-2">
            {[90, 70, 80, 60, 75].map((w, i) => (
              <div
                key={i}
                className="h-16 rounded-[10px] bg-lp-ink/[0.04] animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!sections || sections.length === 0) return null

  // Lowest score first — the most problematic sections surface at the top
  const sorted = [...sections].sort((a, b) => a.score - b.score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
    >
      <div className="rounded-[10px]  bg-[#FFFFFF] p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <LayoutList className="w-4 h-4 text-[#1F5C4A]" />
          <span className="text-sm font-semibold text-lp-ink">Section-by-Section Analysis</span>
          <span className="text-[10px] text-[#5A5F5C] ml-auto uppercase tracking-wide">pro</span>
        </div>

        {/* Section cards */}
        <div className="space-y-3">
          {sorted.map((item, i) => (
            <motion.div
              key={item.section}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING, delay: i * 0.04 }}
              className="rounded-[10px]  bg-[#F4F2EC]/60 p-4 space-y-3"
            >
              {/* Section label + score badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-lp-ink">{item.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${scoreBadgeClass(item.score)}`}>
                  {item.score}/100
                </span>
              </div>

              {/* Strengths */}
              {item.strengths.length > 0 && (
                <div className="space-y-1">
                  {item.strengths.map((s, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#1F7A4D] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#3C403E] leading-snug">{s}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Gaps */}
              {item.gaps.length > 0 && (
                <div className="space-y-1">
                  {item.gaps.map((g, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-[#B42318] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#3C403E] leading-snug">{g}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {item.suggestions.length > 0 && (
                <div className="space-y-1 border-t border-lp-hairline pt-2">
                  {item.suggestions.map((s, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-[#1F5C4A] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#3C403E] leading-snug">{s}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
