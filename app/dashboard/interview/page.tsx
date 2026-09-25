'use client'

import { useT } from '@/lib/i18n/client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, AlertCircle, BookOpen, Send, Star, BookMarked, Copy, ExternalLink, Zap } from 'lucide-react'
import { IconAiMark, IconInterviewPrep, IconLoading } from '@/components/icons'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { buildExperienceSummary } from '@/lib/prompts'
import CompanyAutocomplete from '@/components/ui/CompanyAutocomplete'
import { saveInterviewPrep, saveGuestInterviewPrep } from '@/lib/firestore'
import ProGate from '@/components/shared/ProGate'
import type { InterviewPrep, InterviewQuestion } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

// ── STARAnswer ───────────────────────────────────────────────────────────────

function STARAnswer({ text }: { text: string }) {
  const t = useT()
  const sections = text.split(/(?=Situation:|Task:|Action:|Result:)/i)
  const parsed = sections
    .map((section) => {
      const match = section.match(/^(Situation|Task|Action|Result):([\s\S]*)/i)
      if (!match) return null
      return { label: match[1], content: match[2].trim() }
    })
    .filter(Boolean) as { label: string; content: string }[]

  if (parsed.length < 2) {
    return <p className="text-[0.95rem] text-[#3C403E] leading-[1.7]">{text}</p>
  }

  return (
    <div>
      {parsed.map((s, i) => (
        <div key={i} className="mb-5">
          <span className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#1F5C4A] mb-1">
            {t(s.label.charAt(0).toUpperCase() + s.label.slice(1).toLowerCase())}
          </span>
          <p className="text-[0.95rem] leading-[1.6] pl-3 border-l-2 border-[#1F5C4A] text-[#1B1D1C] mb-4">
            {s.content}
          </p>
        </div>
      ))}
    </div>
  )
}
const CARD_SPRING = { type: 'spring' as const, stiffness: 200, damping: 25 }
const INPUT_CLASS =
  'w-full bg-[#F4F2EC] border border-lp-rule rounded-[4px] px-4 py-3 text-lp-ink text-sm placeholder-[#5A5F5C] focus:outline-none focus:border-[#B42318]/50 focus:ring-1 focus:ring-[#B42318]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#3C403E] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

interface PracticeFeedback {
  scores: { structure: number; specificity: number; impact: number }
  overall: number
  strengths: string[]
  improvements: string[]
  improved_answer: string
}

// ── FlipCard ────────────────────────────────────────────────────────────────

function FlipCard({
  question,
  index,
  isPracticeMode,
  targetPosition,
  uid,
}: {
  question: InterviewQuestion
  index: number
  isPracticeMode: boolean
  targetPosition: string
  uid?: string
}) {
  const t = useT()
  const [flipped, setFlipped] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [scoreError, setScoreError] = useState('')

  const handleScore = async () => {
    if (!userAnswer.trim()) return
    setIsScoring(true)
    setScoreError('')
    try {
      let idToken: string | undefined
      if (auth.currentUser) {
        try { idToken = await getIdToken(auth.currentUser) } catch { /* guest */ }
      }
      const res = await fetch('/api/claude/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ mode: 'practice', question: question.question, userAnswer, targetPosition, uid, isPro: false }),
      })
      if (res.status === 429) {
        const j = await res.json()
        setScoreError(t("Rate limit reached. Try again in {v0}s.", { v0: j.retryAfter }))
        return
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? t("Scoring failed"))
      setFeedback(json.data as PracticeFeedback)
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : t("Scoring failed"))
    } finally {
      setIsScoring(false)
    }
  }

  const scoreColor = (n: number) => n >= 8 ? '#1F7A4D' : n >= 6 ? '#8A5A00' : '#B42318'

  // ── CSS grid overlay: both front and back share the same grid cell.
  // Grid cell height = max(front height, back height) → no overflow, no absolute positioning.
  return (
    <div style={{ perspective: '1200px' }}>
      <motion.div
        style={{ display: 'grid', transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={CARD_SPRING}
      >
        {/* ── Front: Question ─────────────────────────────── */}
        <div
          className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 cursor-pointer"
          style={{ gridArea: '1/1', backfaceVisibility: 'hidden' }}
          onClick={() => !isPracticeMode && setFlipped(true)}
        >
          <div className="rounded-[10px]  bg-[#FFFFFF] p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <span className="px-2.5 py-1 rounded-[4px] bg-[#B42318]/10 border border-[#B42318]/20 text-xs font-semibold text-[#B42318] uppercase tracking-wide">
                Q{index + 1}
              </span>
              {!isPracticeMode && (
                <span className="text-xs text-[#5A5F5C] flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />{' '}{t("Tap to reveal")}
                </span>
              )}
            </div>
            <p className="text-lp-ink font-semibold text-lg leading-relaxed">{question.question}</p>
            {isPracticeMode && (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <textarea
                  className={`${TEXTAREA_CLASS} text-sm`}
                  rows={4}
                  placeholder={t("Type your answer here using the STAR method…")}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  aria-label={t("Your answer")}
                />
                {scoreError && (
                  <p className="text-xs text-[#B42318] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {scoreError}
                  </p>
                )}
                {feedback ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(feedback.scores).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-lp-ink/5 border border-lp-rule">
                          <span className="text-xs text-[#3C403E] capitalize">{key}</span>
                          <span className="text-xs font-bold" style={{ color: scoreColor(val) }}>{val}/10</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20">
                        <Star className="w-3 h-3 text-[#1F5C4A]" />
                        <span className="text-xs font-bold text-[#1F5C4A]">{t("Overall: {v0}/10", { v0: feedback.overall })}</span>
                      </div>
                    </div>
                    {feedback.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#1F7A4D] mb-1">{t("Strengths")}</p>
                        {feedback.strengths.map((s, i) => <p key={i} className="text-xs text-[#3C403E]">✓ {s}</p>)}
                      </div>
                    )}
                    {feedback.improvements.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#8A5A00] mb-1">{t("Improvements")}</p>
                        {feedback.improvements.map((s, i) => <p key={i} className="text-xs text-[#3C403E]">→ {s}</p>)}
                      </div>
                    )}
                    <button onClick={() => { setFeedback(null); setUserAnswer('') }} className="text-xs text-[#1F5C4A] underline">
                      {t("Try again")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleScore}
                    disabled={!userAnswer.trim() || isScoring}
                    className="flex items-center gap-2 px-4 py-2 rounded-[4px] text-sm font-semibold bg-[#B42318] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScoring
                      ? <><IconLoading className="w-3.5 h-3.5 animate-spin" />{' '}{t("Scoring…")}</>
                      : <><Send className="w-3.5 h-3.5" />{' '}{t("Submit Answer")}</>
                    }
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Back: STAR Framework ─────────────────────────── */}
        <div
          className="rounded-[10px] border border-[#1F5C4A]/20 bg-[#FFFFFF] p-1 cursor-pointer"
          style={{ gridArea: '1/1', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={() => setFlipped(false)}
        >
          <div className="rounded-[10px] border border-[#1F5C4A]/10 bg-[#FFFFFF] p-6 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <span className="px-2.5 py-1 rounded-[4px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-xs font-semibold text-[#1F5C4A] uppercase tracking-wide">
                {t("STAR Framework")}
              </span>
              <span className="text-xs text-[#5A5F5C] flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />{' '}{t("Tap to flip back")}
              </span>
            </div>
            <p className="text-[0.95rem] text-[#3C403E] leading-[1.7] mb-3">{question.answer_framework}</p>
            {question.star_example && (
              <div className="p-3 rounded-[10px] bg-[#1F5C4A]/5 border border-[#1F5C4A]/15">
                <p className="text-xs font-semibold text-[#1F5C4A] uppercase tracking-wide mb-3">{t("Example")}</p>
                <STARAnswer text={question.star_example} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── QuestionsToAsk ───────────────────────────────────────────────────────────

function QuestionsToAsk({ questions }: { questions: string[] }) {
  const t = useT()
  const [copied, setCopied] = useState<number | null>(null)
  return (
    <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
      <div className="rounded-[10px]  bg-[#FFFFFF] p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-[#1F5C4A]" />
          <h3 className="text-sm font-semibold text-lp-ink">{t("Questions to Ask the Interviewer")}</h3>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING, delay: i * 0.06 }}
              className="flex items-start gap-3 p-4 rounded-[10px] bg-[#F4F2EC]/60 "
            >
              <div className="w-6 h-6 rounded-full bg-[#1F5C4A]/20 border border-[#1F5C4A]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[#1F5C4A]">{i + 1}</span>
              </div>
              <p className="flex-1 text-[0.95rem] text-[#1B1D1C] leading-[1.6] italic">{t("“{v0}”", { v0: q })}</p>
              <button
                onClick={async () => { await navigator.clipboard.writeText(q); setCopied(i); setTimeout(() => setCopied(null), 1500) }}
                aria-label={t("Copy question {v0}", { v0: i + 1 })}
                className="flex-shrink-0 p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-[#3C403E] hover:bg-lp-ink/5 transition-all"
              >
                {copied === i ? <CheckCircle className="w-3.5 h-3.5 text-[#1F7A4D]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  type: 'success' | 'error'
  message: string
  link?: { label: string; href: string }
}

// ── Interview JSON parser ─────────────────────────────────────────────────────
// Defined at module level so it is not re-created on every render.
// The sanitizeControlChars pass is the critical fix: Claude emits literal
// newlines inside star_example string values, which is invalid JSON.

function sanitizeControlChars(json: string): string {
  let out = ''
  let inStr = false
  let i = 0
  while (i < json.length) {
    const ch = json[i]
    if (ch === '\\' && inStr) { out += ch + (json[i + 1] ?? ''); i += 2; continue }
    if (ch === '"') { inStr = !inStr; out += ch }
    else if (inStr && ch === '\n') { out += '\\n' }
    else if (inStr && ch === '\r') { /* skip */ }
    else if (inStr && ch === '\t') { out += '\\t' }
    else { out += ch }
    i++
  }
  return out
}

function parseInterviewPrep(raw: string): InterviewPrep | null {
  try {
    let s = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

    const start = s.indexOf('{')
    if (start !== -1) {
      let depth = 0, end = -1, inStr = false
      for (let i = start; i < s.length; i++) {
        const c = s[i]
        if (c === '\\' && inStr) { i++; continue }
        if (c === '"') { inStr = !inStr; continue }
        if (inStr) continue
        if (c === '{') depth++
        else if (c === '}' && --depth === 0) { end = i; break }
      }
      if (end !== -1) s = s.slice(start, end + 1)
    }

    const repaired = sanitizeControlChars(
      s.replace(/['']/g, "'").replace(/[""]/g, '"').replace(/,(\s*[}\]])/g, '$1')
    )

    const parsed = JSON.parse(repaired) as InterviewPrep
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      if (process.env.NODE_ENV !== 'production') console.error('[parseInterviewPrep] shape invalid', JSON.stringify(parsed).slice(0, 300))
      return null
    }
    if (!Array.isArray(parsed.questions_to_ask)) parsed.questions_to_ask = []
    return parsed
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[parseInterviewPrep] parse error:', err instanceof Error ? err.message : String(err))
      console.error('[parseInterviewPrep] raw (first 600):', raw.slice(0, 600))
    }
    return null
  }
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function InterviewPage() {
  const t = useT()
  const { user } = useAuth()
  const { profile, updateProfile } = useCareerStore()

  const [position, setPosition] = useState(profile?.target?.position ?? '')
  const [company, setCompany] = useState(profile?.target?.company ?? '')
  const experienceSummary = profile && profile.experience.length > 0 ? buildExperienceSummary(profile, position) : ''

  const [prep, setPrep] = useState<InterviewPrep | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [savedToStudyList, setSavedToStudyList] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { isStreaming, stream } = useAIStream()

  const showToast = useCallback((t: Toast) => {
    setToast(t)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const handleGenerate = useCallback(async () => {
    if (!position.trim() || !company.trim()) return
    setPrep(null)
    setGenerateError('')
    setCurrentCard(0)
    setSavedToStudyList(false)
    setIsPracticeMode(false)

    const fullText = await stream('/api/claude/interview', {
      mode: 'generate',
      position,
      company,
      experienceSummary,
      uid: user?.uid,
      isPro: false,
    }, {
      onError: (err) => setGenerateError(err),
    })

    if (fullText) {
      const parsed = parseInterviewPrep(fullText)
      if (parsed) {
        setPrep(parsed)
        if (profile) {
          updateProfile({ generated: { ...profile.generated, interview_prep: parsed } })
        }
      } else {
        setGenerateError(t("Could not parse the interview prep. Check browser console (F12) for details."))
      }
    }
  }, [position, company, experienceSummary, user?.uid, stream, profile, updateProfile])

  const handleSaveToStudyList = useCallback(async () => {
    if (!prep) return
    setIsSaving(true)
    try {
      if (user?.uid) {
        // Authenticated: save to Firestore
        await saveInterviewPrep(user.uid, position, company, prep)
      } else {
        // Guest: save to localStorage
        saveGuestInterviewPrep(position, company, prep)
      }
      setSavedToStudyList(true)
      showToast({
        type: 'success',
        message: t("Saved to study list!"),
        link: { label: t('View all sessions →'), href: '/dashboard/interview/saved' },
      })
    } catch {
      showToast({ type: 'error', message: t("Failed to save. Please try again.") })
    } finally {
      setIsSaving(false)
    }
  }, [prep, user?.uid, position, company, showToast])

  return (
    <ProGate
      featureName={t("Interview Prep System")}
      featureDescription={t("Generate the 8 most likely interview questions with STAR frameworks, plus 3 strategic questions to ask. Practice mode with AI feedback included.")}
      icon={<IconInterviewPrep className="w-6 h-6 text-[#1F5C4A]" />}
    >
    <div className="space-y-6 pb-20 md:pb-0">
      {/* ── Toast ─────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-[4px] border
              ${toast.type === 'success'
                ? 'bg-[#1F7A4D]/20 border-[#1F7A4D]/30 text-[#1F7A4D]'
                : 'bg-[#B42318]/20 border-[#B42318]/30 text-[#B42318]'
              }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
            {toast.link && (
              <Link href={toast.link.href} className="text-sm font-semibold underline flex items-center gap-1">
                {toast.link.label} <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page header ─────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#B42318]/10 flex items-center justify-center">
              <IconInterviewPrep className="w-5 h-5 text-lp-ink" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-lp-ink">{t("Interview Prep")}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Save — only show when prep results exist */}
            {prep && (
              <button
                onClick={handleSaveToStudyList}
                disabled={savedToStudyList || isSaving}
                aria-label={t("Save to study list")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                  bg-[#1F5C4A] text-white
                   transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSaving
                  ? <IconLoading className="w-3.5 h-3.5 animate-spin" />
                  : savedToStudyList
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <BookMarked className="w-3.5 h-3.5" />
                }
                {isSaving ? t("Saving…") : savedToStudyList ? t("Saved!") : t("Save")}
              </button>
            )}
            <Link
              href="/dashboard/interview/saved"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium
                border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5
                transition-all duration-200"
            >
              <BookMarked className="w-3.5 h-3.5" />
              {t("My Sessions")}
            </Link>
          </div>
        </div>
        <p className="text-[#3C403E] text-sm ml-12">
          {t("8 likely questions with STAR frameworks, plus 3 strategic questions to ask.")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* ── Left: Form + Controls ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
            <div className="rounded-[10px]  bg-[#FFFFFF] p-5 space-y-4">
              {profile && profile.experience.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#1F7A4D]/10 border border-[#1F7A4D]/20">
                  <CheckCircle className="w-4 h-4 text-[#1F7A4D] flex-shrink-0" />
                  <p className="text-xs text-[#1F7A4D]">{t("Experience auto-loaded from Career Profile.")}</p>
                </div>
              )}
              <div>
                <label className={LABEL_CLASS}>{t("Position")}{' '}<span className="text-[#B42318]">*</span></label>
                <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder={t("Senior Backend Engineer")} className={INPUT_CLASS} aria-label={t("Position")} style={{ fontSize: '16px' }} />
              </div>
              <div>
                <label className={LABEL_CLASS}>{t("Company Name")}{' '}<span className="text-[#B42318]">*</span></label>
                <CompanyAutocomplete value={company} onChange={setCompany} placeholder={t("Stripe")} className={INPUT_CLASS} aria-label={t("Company")} />
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
                disabled={!position.trim() || !company.trim() || isStreaming}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px]
                  bg-[#B42318] text-white font-semibold text-sm
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isStreaming
                  ? <><IconLoading className="w-4 h-4 animate-spin" />{' '}{t("Preparing…")}</>
                  : <><IconAiMark className="w-4 h-4" />{' '}{t("Generate Interview Prep")}</>
                }
              </button>
            </div>
          </div>

          {prep && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
              className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
              <div className="rounded-[10px]  bg-[#FFFFFF] p-4 space-y-3">

                {/* Practice Mode toggle — fixed overflow */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#3C403E] uppercase tracking-wide">{t("Practice Mode")}</span>
                  <button
                    onClick={() => setIsPracticeMode(!isPracticeMode)}
                    className={`relative inline-flex items-center w-12 h-6 rounded-full
                      transition-colors duration-200 focus:outline-none
                      ${isPracticeMode ? 'bg-[#B42318]' : 'bg-lp-ink/10'}`}
                    role="switch"
                    aria-checked={isPracticeMode}
                    aria-label={t("Toggle practice mode")}
                  >
                    <span
                      className={`inline-block w-5 h-5 bg-white rounded-full
                        transform transition-transform duration-200
                        ${isPracticeMode ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                <div className="border-t border-lp-hairline pt-3">
                  <p className="text-xs text-[#5A5F5C] mb-2">{t("Card {v0} of {v1}", { v0: currentCard + 1, v1: prep.questions.length })}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
                      disabled={currentCard === 0}
                      aria-label={t("Previous question")}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-[4px] border border-lp-rule text-[#3C403E] text-sm hover:text-lp-ink hover:bg-lp-ink/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />{' '}{t("Prev")}
                    </button>
                    <button
                      onClick={() => setCurrentCard(Math.min(prep.questions.length - 1, currentCard + 1))}
                      disabled={currentCard === prep.questions.length - 1}
                      aria-label={t("Next question")}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-[4px] border border-lp-rule text-[#3C403E] text-sm hover:text-lp-ink hover:bg-lp-ink/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {t("Next")}{' '}<ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── Right: Cards ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            {isStreaming ? (
              <motion.div key="streaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-[10px] border border-[#B42318]/20 bg-[#B42318]/5 p-4 flex items-center gap-3">
                  <IconLoading className="w-4 h-4 text-[#B42318] animate-spin" />
                  <span className="text-sm text-[#B42318] font-medium">{t("AURI is preparing your interview questions…")}</span>
                </div>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                    <div className="rounded-[10px]  bg-[#FFFFFF] p-6 min-h-[140px] space-y-3">
                      <div className="h-4 w-20 rounded bg-lp-ink/6 animate-pulse" />
                      <div className="h-4 w-3/4 rounded bg-lp-ink/[0.04] animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-lp-ink/[0.03] animate-pulse" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : prep ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="space-y-6">
                {/* Mode indicator */}
                <div className="flex items-center gap-2">
                  {isPracticeMode ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B42318]/10 border border-[#B42318]/20">
                      <span className="w-2 h-2 rounded-full bg-[#B42318]" />
                      <span className="text-xs font-medium text-[#B42318]">{t("Practice Mode Active — Type your answers below")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-lp-ink/5 border border-lp-rule">
                      <BookOpen className="w-3.5 h-3.5 text-[#3C403E]" />
                      <span className="text-xs text-[#3C403E]">{t("Tap any card to reveal the STAR framework")}</span>
                    </div>
                  )}
                </div>

                {/* Flip card — key includes isPracticeMode so toggling remounts card (resets flipped state) */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentCard}-${isPracticeMode ? 1 : 0}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={SPRING}
                  >
                    <FlipCard
                      question={prep.questions[currentCard]}
                      index={currentCard}
                      isPracticeMode={isPracticeMode}
                      targetPosition={position}
                      uid={user?.uid}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Navigation dots — in own container with clearance from card and QuestionsToAsk */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap py-1">
                  {prep.questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentCard(i)}
                      aria-label={`Go to question ${i + 1}`}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        i === currentCard ? 'bg-[#B42318]' : 'bg-lp-ink/20 hover:bg-lp-ink/40'
                      }`}
                    />
                  ))}
                </div>

                {/* Questions to Ask — clear separation from dots */}
                {prep.questions_to_ask.length > 0 && (
                  <div className="mt-2">
                    <QuestionsToAsk questions={prep.questions_to_ask} />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                <div className="rounded-[10px]  bg-[#FFFFFF] p-16 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20 flex items-center justify-center mb-4">
                    <IconInterviewPrep className="w-6 h-6 text-[#B42318]" />
                  </div>
                  <p className="text-sm font-medium text-[#3C403E]">{t("Your interview prep will appear here")}</p>
                  <p className="text-xs text-[#5A5F5C] mt-1">{t("Enter the position and company, then click Generate")}</p>
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
