'use client'

import { useT } from '@/lib/i18n/client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
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
  Zap,
  Save,
  FolderOpen,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import ProGate from '@/components/shared/ProGate'
import { saveStrategy, saveGuestStrategy } from '@/lib/firestore'
import type { JobStrategy, JobStrategyAction, JobStrategyDay } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#F4F2EC] border border-lp-rule rounded-[4px] px-4 py-3 text-lp-ink text-sm placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F7A4D]/50 focus:ring-1 focus:ring-[#1F7A4D]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#3C403E] mb-1.5'

const DAY_COLORS = [
  { bg: 'bg-[#1F5C4A]/10', border: 'border-[#1F5C4A]/20', text: 'text-[#1F5C4A]' },
  { bg: 'bg-[#1F5C4A]/10', border: 'border-[#1F5C4A]/20', text: 'text-[#1F5C4A]' },
  { bg: 'bg-[#1F5C4A]/10', border: 'border-[#1F5C4A]/20', text: 'text-[#1F5C4A]' },
  { bg: 'bg-[#1F7A4D]/10', border: 'border-[#1F7A4D]/20', text: 'text-[#1F7A4D]' },
  { bg: 'bg-[#8A5A00]/10', border: 'border-[#8A5A00]/20', text: 'text-[#F2D45C]' },
  { bg: 'bg-[#B42318]/10', border: 'border-[#B42318]/20', text: 'text-[#B42318]' },
  { bg: 'bg-[#1F5C4A]/10', border: 'border-[#1F5C4A]/20', text: 'text-[#1F5C4A]' },
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
  const t = useT()
  return (
    <motion.div layout className={`flex items-start gap-3 p-3 rounded-[10px] border transition-all duration-200 ${
      completed ? 'border-[#1F7A4D]/20 bg-[#1F7A4D]/5' : 'border-lp-hairline bg-[#F4F2EC]/40 hover:border-lp-rule'
    }`}>
      <button
        onClick={() => onToggle(actionKey)}
        aria-label={completed ? t("Mark incomplete") : t("Mark complete")}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
          completed ? 'border-[#1F7A4D] bg-[#1F7A4D]' : 'border-lp-rule hover:border-[#1F7A4D]/60'
        }`}
      >
        {completed && <CheckCircle className="w-3 h-3 text-lp-ink" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Clock className="w-3 h-3 text-[#5A5F5C] flex-shrink-0" />
          <span className="text-xs text-[#5A5F5C]">{action.time}</span>
        </div>
        <p className={`text-sm leading-relaxed ${completed ? 'line-through text-[#5A5F5C]' : 'text-[#1B1D1C]'}`}>{action.action}</p>
        {action.resource && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Globe className="w-3 h-3 text-[#1F5C4A] flex-shrink-0" />
            <span className="text-xs text-[#1F5C4A] break-all">{action.resource}</span>
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
  const t = useT()
  const [expanded, setExpanded] = useState(dayIndex === 0)
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length]
  const completedCount = day.actions.filter((_, ai) => completed[`${day.day}-${ai}`]).length

  return (
    <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
      <div className="rounded-[10px]  bg-[#FFFFFF] overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-lp-ink/[0.02] transition-colors"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-[10px] ${color.bg} border ${color.border} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-sm font-bold ${color.text}`}>{day.day}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-lp-ink leading-tight">{day.theme}</p>
              <p className="text-xs text-[#5A5F5C] mt-0.5">{t("{v0}/{v1} actions complete", { v0: completedCount, v1: day.actions.length })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {completedCount === day.actions.length && day.actions.length > 0 && <CheckCircle className="w-4 h-4 text-[#1F7A4D]" />}
            {expanded ? <ChevronUp className="w-4 h-4 text-[#5A5F5C]" /> : <ChevronDown className="w-4 h-4 text-[#5A5F5C]" />}
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
              <div className="px-4 pb-4 space-y-2 border-t border-lp-hairline pt-3">
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
  const t = useT()
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
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [completed, setCompleted] = useState<CompletedMap>(() => {
    // Prefer Firestore-synced data from the career profile (loaded on mount via store)
    // Fall back to localStorage for guests or first load before Firestore arrives
    const fromProfile = (profile?.generated?.job_strategy as { completed?: CompletedMap } | undefined)?.completed
    if (fromProfile && typeof fromProfile === 'object') return fromProfile
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
  })

  // Persist completed to localStorage and Firestore
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
    }
    if (profile) {
      updateProfile({
        generated: {
          ...profile.generated,
          job_strategy: { ...(profile.generated.job_strategy ?? {}), completed },
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed])

  const { isStreaming, stream } = useAIStream()

  const handleGenerate = useCallback(async () => {
    if (!targetPosition.trim()) return
    setStrategy(null)
    setGenerateError('')
    setSavedId(null)
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
        // Strip markdown fences, then extract the outermost JSON object
        const stripped = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const start = stripped.indexOf('{')
        const end = stripped.lastIndexOf('}')
        if (start === -1 || end === -1) throw new Error(t("No JSON object found"))
        const parsed = JSON.parse(stripped.slice(start, end + 1)) as JobStrategy
        if (!parsed.days || !Array.isArray(parsed.days)) throw new Error(t("Invalid structure"))
        setStrategy(parsed)
        setCompleted({})
        // Save to careerStore
        if (profile) {
          updateProfile({ generated: { ...profile.generated, job_strategy: parsed } })
        }
      } catch {
        setGenerateError(t("Could not parse the strategy plan. Please try again."))
      }
    }
  }, [targetPosition, sectorOrIndustry, city, isRemote, companySizeOrType, user?.uid, stream, profile, updateProfile])

  const handleSave = useCallback(async () => {
    if (!strategy) return
    setSaving(true)
    try {
      if (user) {
        const id = await saveStrategy(
          user.uid,
          targetPosition,
          sectorOrIndustry,
          isRemote ? 'Remote' : city,
          strategy
        )
        setSavedId(id)
      } else {
        const id = saveGuestStrategy(
          targetPosition,
          sectorOrIndustry,
          isRemote ? 'Remote' : city,
          strategy
        )
        setSavedId(id)
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }, [strategy, user, targetPosition, sectorOrIndustry, city, isRemote])

  const toggleAction = (key: string) => {
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const totalActions = strategy?.days.reduce((sum, d) => sum + d.actions.length, 0) ?? 0
  const completedCount = Object.values(completed).filter(Boolean).length

  return (
    <ProGate
      featureName={t("7-Day Job Search Strategy")}
      featureDescription={t("Get a personalized, immediately executable 7-day action plan for your target role — with specific job sites, search terms, and daily actions.")}
      icon={<Map className="w-6 h-6 text-[#1F5C4A]" />}
    >
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#1F7A4D]/10 flex items-center justify-center">
              <Map className="w-5 h-5 text-lp-ink" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-lp-ink">{t("7-Day Job Strategy")}</h1>
          </div>
          <div className="flex items-center gap-2">
            {strategy && (
              <button
                onClick={handleSave}
                disabled={saving || !!savedId}
                aria-label={t("Save strategy")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                  bg-[#1F5C4A] text-white
                   transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : savedId
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <Save className="w-3.5 h-3.5" />
                }
                {saving ? t("Saving…") : savedId ? t("Saved!") : t("Save")}
              </button>
            )}
            <Link
              href="/dashboard/strategy/saved"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium
                border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5
                transition-all duration-200"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {t("My Strategies")}
            </Link>
          </div>
        </div>
        <p className="text-[#3C403E] text-sm ml-12">
          {t("A personalized, immediately executable day-by-day job search plan with specific sites, search terms, and daily actions.")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* ── Left: Form ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 h-fit"
        >
          <div className="rounded-[10px]  bg-[#FFFFFF] p-5 space-y-4">
            <div>
              <label className={LABEL_CLASS}>{t("Target Position")}{' '}<span className="text-[#B42318]">*</span></label>
              <input type="text" value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} placeholder={t("Growth Marketing Manager")} className={INPUT_CLASS} aria-label={t("Target position")} style={{ fontSize: '16px' }} />
            </div>
            <div>
              <label className={LABEL_CLASS}>{t("Sector / Industry")}</label>
              <input type="text" className={INPUT_CLASS} placeholder={t("FinTech, Healthcare, B2B SaaS…")} value={sectorOrIndustry} onChange={(e) => setSectorOrIndustry(e.target.value)} aria-label={t("Sector")} />
            </div>
            <div>
              <label className={LABEL_CLASS}>{t("Location")}</label>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setIsRemote(false)} className={`flex-1 py-2 rounded-[4px] text-xs font-medium border transition-all ${!isRemote ? 'border-[#1F7A4D]/40 bg-[#1F7A4D]/10 text-[#1F7A4D]' : 'border-lp-rule text-[#5A5F5C] hover:text-[#3C403E]'}`}>{t("City")}</button>
                <button onClick={() => setIsRemote(true)} className={`flex-1 py-2 rounded-[4px] text-xs font-medium border transition-all ${isRemote ? 'border-[#1F7A4D]/40 bg-[#1F7A4D]/10 text-[#1F7A4D]' : 'border-lp-rule text-[#5A5F5C] hover:text-[#3C403E]'}`}>{t("Remote")}</button>
              </div>
              {!isRemote && <LocationAutocomplete value={city} onChange={setCity} placeholder={t("New York, NY")} className={INPUT_CLASS} aria-label={t("City")} />}
            </div>
            <div>
              <label className={LABEL_CLASS}>{t("Company Size / Type")}</label>
              <input type="text" className={INPUT_CLASS} placeholder={t("Series B startups, Fortune 500…")} value={companySizeOrType} onChange={(e) => setCompanySizeOrType(e.target.value)} aria-label={t("Company size")} />
            </div>

            {generateError && (
              generateError === 'FREE_TIER_LIMIT_REACHED' ? (
                <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20">
                  <Zap className="w-4 h-4 text-[#1F5C4A] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-lp-ink">{t("Monthly limit reached")}</p>
                    <p className="text-xs text-[#3C403E]">{t("You've used all 3 free generations this month.")}</p>
                  </div>
                  <Link href="/pricing" className="flex-shrink-0 text-xs font-semibold text-[#1F5C4A] hover:text-lp-ink transition-colors">
                    {t("Upgrade →")}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20">
                  <AlertCircle className="w-4 h-4 text-[#B42318] flex-shrink-0" />
                  <p className="text-xs text-[#B42318]">{generateError}</p>
                </div>
              )
            )}

            <button
              onClick={handleGenerate}
              disabled={!targetPosition.trim() || isStreaming}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px]
                bg-[#1F7A4D] text-white font-semibold text-sm
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" />{' '}{t("Building Plan…")}</> : <><Sparkles className="w-4 h-4" />{' '}{t("Build 7-Day Plan")}</>}
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
                <div className="rounded-[10px] border border-[#1F7A4D]/20 bg-[#1F7A4D]/5 p-4 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-[#1F7A4D] animate-spin" />
                  <span className="text-sm text-[#1F7A4D] font-medium">{t("AURI is building your 7-day plan…")}</span>
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                    <div className="rounded-[10px]  bg-[#FFFFFF] p-4 space-y-2">
                      <div className="h-4 w-24 rounded bg-lp-ink/6 animate-pulse" />
                      <div className="h-3 w-48 rounded bg-lp-ink/[0.04] animate-pulse" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : strategy ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="space-y-4">
                {/* Progress header */}
                <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                  <div className="rounded-[10px]  bg-[#FFFFFF] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-lp-ink">{t("{v0} / {v1} actions completed", { v0: completedCount, v1: totalActions })}</p>
                        <p className="text-xs text-[#5A5F5C] mt-0.5">{t("7-day plan for {v0}", { v0: targetPosition })}</p>
                      </div>
                      <button
                        onClick={async () => { if (!strategy) return; await navigator.clipboard.writeText(buildPlanText(strategy)); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5 transition-all"
                      >
                        {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#1F7A4D]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? t("Copied!") : t("Copy Plan")}
                      </button>
                    </div>
                    <div className="h-2 rounded-full bg-lp-ink/6 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[#1F7A4D] "
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
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                <div className="rounded-[10px]  bg-[#FFFFFF] p-16 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-[10px] bg-[#1F7A4D]/10 border border-[#1F7A4D]/20 flex items-center justify-center mb-4">
                    <Map className="w-6 h-6 text-[#1F7A4D]" />
                  </div>
                  <p className="text-sm font-medium text-[#3C403E]">{t("Your 7-day plan will appear here")}</p>
                  <p className="text-xs text-[#5A5F5C] mt-1">{t("Fill in your target role and click Build Plan")}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
    </ProGate>
  )
}
