'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map,
  Sparkles,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertCircle,
  Globe,
  Clock,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import type { JobStrategy, JobStrategyAction, JobStrategyDay } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#22C55E]/50 focus:ring-1 focus:ring-[#22C55E]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'

const DAY_COLORS = [
  { bg: 'bg-[#6366F1]/10', border: 'border-[#6366F1]/20', text: 'text-[#818CF8]' },
  { bg: 'bg-[#8B5CF6]/10', border: 'border-[#8B5CF6]/20', text: 'text-[#A78BFA]' },
  { bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20', text: 'text-[#38BDF8]' },
  { bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/20', text: 'text-[#4ADE80]' },
  { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', text: 'text-[#FCD34D]' },
  { bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', text: 'text-[#F87171]' },
  { bg: 'bg-[#EC4899]/10', border: 'border-[#EC4899]/20', text: 'text-[#F472B6]' },
]

type CompletedMap = Record<string, boolean>

function buildPlanText(strategy: JobStrategy): string {
  return strategy.days
    .map((day) => {
      const header = `Day ${day.day} — ${day.theme}`
      const actions = day.actions.map((a) => `  [${a.time}] ${a.action}${a.resource ? `\n  → ${a.resource}` : ''}`).join('\n')
      return `${header}\n${'─'.repeat(header.length)}\n${actions}`
    })
    .join('\n\n')
}

function ActionItem({ action, actionKey, completed, onToggle }: {
  action: JobStrategyAction
  actionKey: string
  completed: boolean
  onToggle: (key: string) => void
}) {
  return (
    <motion.div layout className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
      completed ? 'border-[#22C55E]/20 bg-[#22C55E]/5' : 'border-white/[0.06] bg-[#0A0A0F]/40 hover:border-white/[0.10]'
    }`}>
      <button
        onClick={() => onToggle(actionKey)}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
          completed ? 'border-[#22C55E] bg-[#22C55E]' : 'border-white/20 hover:border-[#22C55E]/60'
        }`}
      >
        {completed && <CheckCircle className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Clock className="w-3 h-3 text-[#60607A] flex-shrink-0" />
          <span className="text-xs text-[#60607A]">{action.time}</span>
        </div>
        <p className={`text-sm leading-relaxed ${completed ? 'line-through text-[#60607A]' : 'text-[#E8E8F0]'}`}>{action.action}</p>
        {action.resource && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Globe className="w-3 h-3 text-[#6366F1] flex-shrink-0" />
            <span className="text-xs text-[#6366F1] break-all">{action.resource}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DayCard({ day, dayIndex, completed, onToggle }: {
  day: JobStrategyDay
  dayIndex: number
  completed: CompletedMap
  onToggle: (key: string) => void
}) {
  const [expanded, setExpanded] = useState(dayIndex === 0)
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length]
  const completedCount = day.actions.filter((_, ai) => completed[`${day.day}-${ai}`]).length

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
      <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-sm font-bold ${color.text}`}>{day.day}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{day.theme}</p>
              <p className="text-xs text-[#60607A] mt-0.5">{completedCount}/{day.actions.length} actions complete</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {completedCount === day.actions.length && day.actions.length > 0 && <CheckCircle className="w-4 h-4 text-[#22C55E]" />}
            {expanded ? <ChevronUp className="w-4 h-4 text-[#60607A]" /> : <ChevronDown className="w-4 h-4 text-[#60607A]" />}
          </div>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-3">
                {day.actions.map((action, ai) => (
                  <ActionItem key={ai} action={action} actionKey={`${day.day}-${ai}`} completed={completed[`${day.day}-${ai}`] ?? false} onToggle={onToggle} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const STORAGE_KEY = 'auri_strategy_completed'

export default function StrategyPage() {
  const { user } = useAuth()
  const { profile, updateProfile } = useCareerStore()

  const [targetPosition, setTargetPosition] = useState(profile?.target?.position ?? '')
  const [sectorOrIndustry, setSectorOrIndustry] = useState(profile?.target?.industry ?? '')
  const [city, setCity] = useState(profile?.target?.city ?? '')
  const [isRemote, setIsRemote] = useState(!profile?.target?.city)
  const [companySizeOrType, setCompanySizeOrType] = useState(profile?.target?.company_type ?? '')
  const [strategy, setStrategy] = useState<JobStrategy | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [copied, setCopied] = useState(false)

  const [completed, setCompleted] = useState<CompletedMap>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
  })

  // Persist completed to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
    }
  }, [completed])

  const { isStreaming, stream } = useAIStream()

  const handleGenerate = useCallback(async () => {
    if (!targetPosition.trim()) return
    setStrategy(null)
    setGenerateError('')
    const cityOrRemote = isRemote ? 'Remote' : (city.trim() || 'Remote')

    const fullText = await stream('/api/claude/strategy', {
      targetPosition,
      sectorOrIndustry,
      cityOrRemote,
      companySizeOrType,
      uid: user?.uid,
      isPro: false,
    }, {
      onError: (err) => setGenerateError(err),
    })

    if (fullText) {
      try {
        const cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned) as JobStrategy
        setStrategy(parsed)
        setCompleted({})
        // Save to careerStore
        if (profile) {
          updateProfile({ generated: { ...profile.generated, job_strategy: parsed } })
        }
      } catch {
        setGenerateError('Could not parse the strategy plan. Please try again.')
      }
    }
  }, [targetPosition, sectorOrIndustry, city, isRemote, companySizeOrType, user?.uid, stream, profile, updateProfile])

  const toggleAction = (key: string) => {
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const totalActions = strategy?.days.reduce((sum, d) => sum + d.actions.length, 0) ?? 0
  const completedCount = Object.values(completed).filter(Boolean).length

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center">
            <Map className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">7-Day Job Strategy</h1>
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">
          A personalized, immediately executable day-by-day job search plan with specific sites, search terms, and daily actions.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        {/* ── Left: Form ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 h-fit"
        >
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">
            <div>
              <label className={LABEL_CLASS}>Target Position <span className="text-[#EF4444]">*</span></label>
              <input type="text" className={INPUT_CLASS} placeholder="Growth Marketing Manager" value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} aria-label="Target position" />
            </div>
            <div>
              <label className={LABEL_CLASS}>Sector / Industry</label>
              <input type="text" className={INPUT_CLASS} placeholder="FinTech, Healthcare, B2B SaaS…" value={sectorOrIndustry} onChange={(e) => setSectorOrIndustry(e.target.value)} aria-label="Sector" />
            </div>
            <div>
              <label className={LABEL_CLASS}>Location</label>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setIsRemote(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${!isRemote ? 'border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]' : 'border-white/[0.08] text-[#60607A] hover:text-[#A0A0B8]'}`}>City</button>
                <button onClick={() => setIsRemote(true)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${isRemote ? 'border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]' : 'border-white/[0.08] text-[#60607A] hover:text-[#A0A0B8]'}`}>Remote</button>
              </div>
              {!isRemote && <input type="text" className={INPUT_CLASS} placeholder="New York, NY" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" />}
            </div>
            <div>
              <label className={LABEL_CLASS}>Company Size / Type</label>
              <input type="text" className={INPUT_CLASS} placeholder="Series B startups, Fortune 500…" value={companySizeOrType} onChange={(e) => setCompanySizeOrType(e.target.value)} aria-label="Company size" />
            </div>

            {generateError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                <p className="text-xs text-[#EF4444]">{generateError}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!targetPosition.trim() || isStreaming}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white font-semibold text-sm
                shadow-lg shadow-[#22C55E]/25 hover:shadow-[#22C55E]/50 hover:scale-[1.01]
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" /> Building Plan…</> : <><Sparkles className="w-4 h-4" /> Build 7-Day Plan</>}
            </button>
          </div>
        </motion.div>

        {/* ── Right: Output ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {isStreaming ? (
              <motion.div key="streaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="rounded-2xl border border-[#22C55E]/20 bg-[#22C55E]/5 p-4 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-[#22C55E] animate-spin" />
                  <span className="text-sm text-[#22C55E] font-medium">Claude is building your 7-day plan…</span>
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                    <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-2">
                      <div className="h-4 w-24 rounded bg-white/[0.06] animate-pulse" />
                      <div className="h-3 w-48 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : strategy ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="space-y-4">
                {/* Progress header */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                  <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{completedCount} / {totalActions} actions completed</p>
                        <p className="text-xs text-[#60607A] mt-0.5">7-day plan for {targetPosition}</p>
                      </div>
                      <button
                        onClick={async () => { if (!strategy) return; await navigator.clipboard.writeText(buildPlanText(strategy)); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
                      >
                        {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy Plan'}
                      </button>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A]"
                        initial={{ width: 0 }}
                        animate={{ width: totalActions > 0 ? `${(completedCount / totalActions) * 100}%` : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>

                {strategy.days.map((day, dayIndex) => (
                  <motion.div key={day.day} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: dayIndex * 0.05 }}>
                    <DayCard day={day} dayIndex={dayIndex} completed={completed} onToggle={toggleAction} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-16 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center mb-4">
                    <Map className="w-6 h-6 text-[#22C55E]" />
                  </div>
                  <p className="text-sm font-medium text-[#A0A0B8]">Your 7-day plan will appear here</p>
                  <p className="text-xs text-[#60607A] mt-1">Fill in your target role and click Build Plan</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
