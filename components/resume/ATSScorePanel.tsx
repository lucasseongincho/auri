'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, CheckCircle, XCircle, AlertTriangle, Lightbulb, Zap, Loader2, TrendingUp } from 'lucide-react'
import type { ATSScore } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

interface ATSScorePanelProps {
  score: ATSScore | null
  isLoading: boolean
  onFixAll: () => void
  isFixing: boolean
  fixingLabel?: string
}

function ScoreMeter({ score, prevScore }: { score: number; prevScore?: number }) {
  const [displayed, setDisplayed] = useState(prevScore ?? 0)
  const displayedRef = useRef(displayed)
  const circumference = 2 * Math.PI * 45

  useEffect(() => { displayedRef.current = displayed })

  useEffect(() => {
    const start = displayedRef.current
    const end = score
    const duration = 1200
    const startTime = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [score])

  const color = score >= 85 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#EF4444'
  const strokeDash = circumference * (1 - displayed / 100)

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r="45" fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDash}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeDash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading font-bold text-2xl text-white leading-none">{displayed}</span>
        <span className="text-[10px] text-[#60607A] mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

export default function ATSScorePanel({ score, isLoading, onFixAll, isFixing, fixingLabel = 'Fixing...' }: ATSScorePanelProps) {
  const [prevScore, setPrevScore] = useState<number | undefined>()

  useEffect(() => {
    if (score) setPrevScore(score.score)
  }, [score])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-[#6366F1]" />
            <span className="text-sm font-semibold text-white">Analyzing ATS compatibility...</span>
            <Loader2 className="w-3.5 h-3.5 text-[#6366F1] animate-spin ml-auto" />
          </div>
          <div className="space-y-2">
            {[70, 50, 80, 60].map((w, i) => (
              <div key={i} className="h-2.5 rounded-full bg-white/[0.06] animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!score) return null

  const scoreColor = score.score >= 85 ? 'text-[#22C55E]' : score.score >= 70 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
  const scoreLabel = score.score >= 85 ? 'Excellent' : score.score >= 70 ? 'Good' : 'Needs Work'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
    >
      <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-5">
        {/* Score header */}
        <div className="flex items-center gap-4">
          <ScoreMeter score={score.score} prevScore={prevScore} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[#6366F1]" />
              <span className="text-sm font-semibold text-white">ATS Score</span>
            </div>
            <p className={`text-2xl font-heading font-bold ${scoreColor}`}>{scoreLabel}</p>
            <p className="text-xs text-[#60607A] mt-1">
              {score.matched_keywords.length} keywords matched · {score.missing_keywords.length} missing
            </p>
            <button
              onClick={onFixAll}
              disabled={isFixing}
              aria-label="Fix all ATS issues automatically"
              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                hover:scale-[1.02] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {isFixing ? fixingLabel : 'Fix All Issues'}
            </button>
          </div>
        </div>

        {/* Strength areas */}
        {score.strength_areas.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wide">Strengths</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {score.strength_areas.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Matched keywords */}
        {score.matched_keywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wide">Matched Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {score.matched_keywords.slice(0, 15).map((kw, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                  {kw}
                </span>
              ))}
              {score.matched_keywords.length > 15 && (
                <span className="px-2 py-0.5 rounded-full text-xs text-[#60607A]">
                  +{score.matched_keywords.length - 15}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Missing keywords */}
        {score.missing_keywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wide">Missing Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {score.missing_keywords.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Formatting issues */}
        {score.formatting_issues.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wide">Formatting Issues</span>
            </div>
            <ul className="space-y-1">
              {score.formatting_issues.map((issue, i) => (
                <li key={i} className="text-xs text-[#A0A0B8] flex items-start gap-1.5">
                  <span className="text-[#F59E0B] mt-0.5 flex-shrink-0">·</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {score.suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#818CF8]" />
              <span className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wide">Suggestions</span>
            </div>
            <ul className="space-y-1.5">
              {score.suggestions.map((s, i) => (
                <li key={i} className="text-xs text-[#A0A0B8] flex items-start gap-1.5">
                  <span className="text-[#6366F1] mt-0.5 flex-shrink-0">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}
