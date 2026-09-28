'use client'

import { useLocale, useT } from '@/lib/i18n/client'
import { IconError } from '@/components/icons'
import { ArrowRightLeft, Check, ChevronLeft, ChevronRight, Copy, Download, Trash2 } from 'lucide-react'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { getSavedInterviewPrep, deleteInterviewPrep, getGuestInterviewPreps, deleteGuestInterviewPrep } from '@/lib/firestore'
import type { SavedInterviewPrep, InterviewQuestion } from '@/types'

const CARD_SPRING = { type: 'spring', stiffness: 280, damping: 28 } as const

// ── STARAnswer ────────────────────────────────────────────────────────────────

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

// ── Practice score helper ────────────────────────────────────────────────────

function scoreAnswer(question: string, framework: string, userAnswer: string): {
  score: number
  feedback: string
} {
  const words = userAnswer.trim().split(/\s+/).filter(Boolean)
  if (words.length < 10) return { score: 0, feedback: 'Too short — try to give a detailed answer using the STAR framework.' }

  const lower = userAnswer.toLowerCase()
  const hasResult = /result|outcome|achiev|increas|decreas|improv|reduc|saved|grew|launched/i.test(lower)
  const hasAction = /i (did|built|led|created|managed|developed|implemented|designed|improved|solved)/i.test(lower)
  const hasContext = /when|while|during|at (my|the)|working at/i.test(lower)
  const hasNumbers = /\d+/.test(lower)

  let score = 40
  if (hasContext) score += 15
  if (hasAction) score += 15
  if (hasResult) score += 20
  if (hasNumbers) score += 10

  const frameworkWords = framework.toLowerCase().split(/\s+/)
  const overlap = frameworkWords.filter((w) => w.length > 4 && lower.includes(w)).length
  score = Math.min(100, score + Math.min(overlap * 2, 10))

  let feedback = ''
  if (score >= 85) {
    feedback = 'Excellent! Strong use of the STAR framework with measurable results.'
  } else if (score >= 65) {
    feedback = 'Good answer. Try adding specific metrics or outcomes to make it more memorable.'
  } else if (score >= 45) {
    feedback = !hasResult
      ? 'Add a concrete result or quantified outcome — this is what interviewers remember.'
      : !hasNumbers
      ? 'Including specific numbers (%, $, time saved) will strengthen your answer significantly.'
      : 'Structure your answer using the STAR framework: Situation → Task → Action → Result.'
  } else {
    feedback = 'Expand your answer. Cover the Situation, what you did (Action), and the Result you achieved.'
  }

  // Suppress unused var warning
  void question

  return { score, feedback }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value, total }: { value: number; total: number }) {
  const { t, locale } = useLocale()
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-lp-ink/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#1F5C4A] "
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-[#3C403E] tabular-nums w-16 text-right">
        {t("{v0}/{v1} reviewed", { v0: value, v1: total })}
      </span>
    </div>
  )
}

function ScoreMeter({ score }: { score: number }) {
  const { t, locale } = useLocale()
  const color =
    score >= 80 ? '#1F7A4D' : score >= 60 ? '#8A5A00' : score >= 40 ? '#1F5C4A' : '#B42318'
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(27,29,28,0.05)" strokeWidth="4" />
          <motion.circle
            cx="20" cy="20" r="16"
            fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 16}`}
            initial={{ strokeDashoffset: `${2 * Math.PI * 16}` }}
            animate={{ strokeDashoffset: `${2 * Math.PI * 16 * (1 - score / 100)}` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color }}>
          {score >= 80 ? t("Excellent") : score >= 60 ? t("Good") : score >= 40 ? t("Developing") : t("Needs Work")}
        </p>
        <p className="text-[10px] text-[#5A5F5C]">{t("STAR score")}</p>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StudyViewPage() {
  const { t, locale } = useLocale()
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [prep, setPrep] = useState<SavedInterviewPrep | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Study state
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Practice state
  const [practiceMode, setPracticeMode] = useState(false)
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { text: string; score: number; feedback: string }>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [scored, setScored] = useState(false)

  // Copy state
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // PDF export ref
  const printRef = useRef<HTMLDivElement>(null)

  // Load prep
  useEffect(() => {
    if (authLoading || !id) return
    async function load() {
      try {
        let data: SavedInterviewPrep | null = null
        if (user?.uid) {
          data = await getSavedInterviewPrep(user.uid, id)
        } else {
          const all = getGuestInterviewPreps()
          data = all.find((p) => p.id === id) ?? null
        }
        if (!data) {
          setNotFound(true)
        } else {
          setPrep(data)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading, id])

  const toggleReviewed = useCallback((idx: number) => {
    setReviewed((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) { next.delete(idx) } else { next.add(idx) }
      return next
    })
  }, [])

  async function handleDelete() {
    if (!prep) return
    setDeleting(true)
    try {
      if (user?.uid) {
        await deleteInterviewPrep(user.uid, prep.id)
      } else {
        deleteGuestInterviewPrep(prep.id)
      }
      router.push('/dashboard/interview/saved')
    } catch {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  function handleCopy(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1800)
  }

  function handlePracticeSubmit(q: InterviewQuestion) {
    if (!currentAnswer.trim()) return
    const { score, feedback } = scoreAnswer(q.question, q.answer_framework, currentAnswer)
    setAnswers((prev) => ({ ...prev, [practiceIndex]: { text: currentAnswer, score, feedback } }))
    setScored(true)
  }

  function handlePracticeNext() {
    if (!prep) return
    const nextIdx = practiceIndex + 1
    if (nextIdx < prep.prep.questions.length) {
      setPracticeIndex(nextIdx)
      setCurrentAnswer(answers[nextIdx]?.text ?? '')
      setScored(!!answers[nextIdx])
    }
  }

  function handlePracticePrev() {
    const prevIdx = practiceIndex - 1
    if (prevIdx >= 0) {
      setPracticeIndex(prevIdx)
      setCurrentAnswer(answers[prevIdx]?.text ?? '')
      setScored(!!answers[prevIdx])
    }
  }

  async function handleExportPDF() {
    if (!printRef.current) return
    try {
      const html2pdf = (await import('html2pdf.js')).default
      html2pdf()
        .set({
          margin: [10, 12],
          filename: `interview-prep-${prep?.company ?? 'session'}.pdf`,
          image: { type: 'jpeg', quality: 0.97 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(printRef.current)
        .save()
    } catch {
      window.print()
    }
  }

  function formatDate(locale: 'en' | 'ko', iso: string) {
    try {
      return new Date(iso).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } catch { return iso }
  }

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#1F5C4A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#3C403E] text-sm">{t("Loading session…")}</p>
        </div>
      </div>
    )
  }

  if (notFound || !prep) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20 flex items-center justify-center mb-2">
          <IconError className="w-7 h-7 text-[#B42318]" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-[#1B1D1C]">{t("Session not found")}</h2>
        <p className="text-[#5A5F5C] text-sm">{t("This prep session may have been deleted.")}</p>
        <button
          onClick={() => router.push('/dashboard/interview/saved')}
          className="mt-2 px-5 py-2.5 rounded-[4px] bg-[#1F5C4A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t("Back to sessions")}
        </button>
      </div>
    )
  }

  const questions = prep.prep.questions
  const questionsToAsk = prep.prep.questions_to_ask
  const reviewedCount = reviewed.size
  const practiceQuestion = questions[practiceIndex]
  const practiceEntry = answers[practiceIndex]
  const practicedCount = Object.keys(answers).length
  const avgScore = practicedCount > 0
    ? Math.round(Object.values(answers).reduce((s, a) => s + a.score, 0) / practicedCount)
    : null

  // ── Study Mode view ──────────────────────────────────────────────────────

  const StudyView = (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <ProgressBar value={reviewedCount} total={questions.length} />
      </div>

      {/* Card navigator */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setCurrentCard((c) => Math.max(0, c - 1)); setFlipped(false) }}
          disabled={currentCard === 0}
          className="p-2 rounded-[4px] bg-lp-ink/5 hover:bg-lp-ink/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#3C403E]" aria-hidden="true" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5 py-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentCard(i); setFlipped(false) }}
              className={`rounded-full transition-all duration-200 ${
                i === currentCard
                  ? 'w-5 h-2 bg-[#1F5C4A]'
                  : reviewed.has(i)
                  ? 'w-2 h-2 bg-[#1F7A4D]'
                  : 'w-2 h-2 bg-lp-ink/15 hover:bg-lp-ink/25'
              }`}
              aria-label={`Go to question ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => { setCurrentCard((c) => Math.min(questions.length - 1, c + 1)); setFlipped(false) }}
          disabled={currentCard === questions.length - 1}
          className="p-2 rounded-[4px] bg-lp-ink/5 hover:bg-lp-ink/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#3C403E]" aria-hidden="true" />
        </button>
      </div>

      {/* Flip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="mb-4"
          style={{ perspective: 1200 }}
        >
          <motion.div
            style={{ display: 'grid', transformStyle: 'preserve-3d', cursor: 'pointer' }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={CARD_SPRING}
            onClick={() => setFlipped((f) => !f)}
          >
            {/* Front — Question */}
            <div
              style={{ gridArea: '1/1', backfaceVisibility: 'hidden' }}
              className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-6 sm:p-8 min-h-[200px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-[#1F5C4A] bg-[#1F5C4A]/10 px-2.5 py-1 rounded-full">
                    {t("Q{v0} of {v1}", { v0: currentCard + 1, v1: questions.length })}
                  </span>
                  <span className="text-xs text-[#5A5F5C]">{t("Tap to reveal answer")}</span>
                </div>
                <p className="text-lg font-semibold text-[#1B1D1C] leading-snug">
                  {questions[currentCard].question}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleReviewed(currentCard) }}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-[4px] transition-colors ${
                    reviewed.has(currentCard)
                      ? 'bg-[#1F7A4D]/10 text-[#1F7A4D] border border-[#1F7A4D]/20'
                      : 'bg-lp-ink/5 text-[#3C403E] hover:bg-lp-ink/8'
                  }`}
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  {reviewed.has(currentCard) ? t("Reviewed") : t("Mark reviewed")}
                </button>
                <ArrowRightLeft className="w-5 h-5 text-[#5A5F5C]" aria-hidden="true" />
              </div>
            </div>

            {/* Back — Answer Framework */}
            <div
              style={{
                gridArea: '1/1',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              className="rounded-[10px] border border-[#1F5C4A]/30 bg-[#FFFFFF] p-6 sm:p-8 min-h-[200px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-[#1F5C4A] bg-[#1F5C4A]/10 px-2.5 py-1 rounded-full">
                    {t("Answer Framework")}
                  </span>
                </div>
                <p className="text-[1.05rem] font-semibold text-[#1B1D1C] mb-3 leading-snug">{questions[currentCard].question}</p>
                <p className="text-[0.95rem] text-[#3C403E] leading-[1.7] mb-3">{questions[currentCard].answer_framework}</p>
                {questions[currentCard].star_example && (
                  <div className="mt-4 p-3 rounded-[10px] bg-[#1F5C4A]/8 border border-[#1F5C4A]/15">
                    <p className="text-xs font-semibold text-[#1F5C4A] mb-3">{t("STAR Example")}</p>
                    <STARAnswer text={questions[currentCard].star_example} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleReviewed(currentCard) }}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-[4px] transition-colors ${
                    reviewed.has(currentCard)
                      ? 'bg-[#1F7A4D]/10 text-[#1F7A4D] border border-[#1F7A4D]/20'
                      : 'bg-lp-ink/5 text-[#3C403E] hover:bg-lp-ink/8'
                  }`}
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  {reviewed.has(currentCard) ? t("Reviewed") : t("Mark reviewed")}
                </button>
                <ArrowRightLeft className="w-5 h-5 text-[#5A5F5C]" aria-hidden="true" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )

  // ── Practice Mode view ───────────────────────────────────────────────────

  const PracticeView = (
    <div>
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-[#3C403E]">
          {t("Question")}{' '}<span className="font-semibold text-[#1B1D1C]">{practiceIndex + 1}</span>{' '}{t("of {v0}", { v0: questions.length })}
        </div>
        {avgScore !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#5A5F5C]">{t("Avg score:")}</span>
            <span className="font-bold" style={{ color: avgScore >= 70 ? '#1F7A4D' : avgScore >= 50 ? '#8A5A00' : '#B42318' }}>
              {avgScore}
            </span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-[#1F5C4A] bg-[#1F5C4A]/10 px-2.5 py-1 rounded-full">
            {t("Practice")}
          </span>
          {practiceEntry && <ScoreMeter score={practiceEntry.score} />}
        </div>
        <p className="text-[1.1rem] font-semibold text-[#1B1D1C] leading-snug mb-4">
          {practiceQuestion.question}
        </p>
        <div className="p-3 rounded-[10px] bg-[#1F5C4A]/8 border border-[#1F5C4A]/15 mb-4">
          <p className="text-xs font-semibold text-[#1F5C4A] mb-1">{t("Framework hint")}</p>
          <p className="text-[0.95rem] text-[#3C403E] leading-relaxed">{practiceQuestion.answer_framework}</p>
        </div>

        <textarea
          value={currentAnswer}
          onChange={(e) => { setCurrentAnswer(e.target.value); setScored(false) }}
          placeholder={t("Type your answer here… Use the STAR method: Situation → Task → Action → Result")}
          rows={5}
          className="w-full px-4 py-3 rounded-[4px] bg-[#F4F2EC] border border-lp-rule text-[#1B1D1C] placeholder-[#5A5F5C] text-sm resize-none focus:outline-none focus:border-[#1F5C4A]/50 transition-colors"
        />

        {/* Feedback */}
        <AnimatePresence>
          {scored && practiceEntry && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 p-3 rounded-[10px] border text-[0.95rem] ${
                practiceEntry.score >= 80
                  ? 'bg-[#1F7A4D]/8 border-[#1F7A4D]/20 text-[#1F7A4D]'
                  : practiceEntry.score >= 60
                  ? 'bg-[#8A5A00]/8 border-[#8A5A00]/20 text-[#8A5A00]'
                  : 'bg-[#B42318]/8 border-[#B42318]/20 text-[#B42318]'
              }`}
            >
              {t(practiceEntry.feedback)}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 mt-4">
          {!scored ? (
            <button
              onClick={() => handlePracticeSubmit(practiceQuestion)}
              disabled={!currentAnswer.trim()}
              className="px-5 py-2.5 rounded-[4px] bg-[#1F5C4A] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {t("Get Feedback")}
            </button>
          ) : (
            <button
              onClick={() => { setCurrentAnswer(''); setScored(false) }}
              className="px-5 py-2.5 rounded-[4px] bg-lp-ink/8 hover:bg-lp-ink/12 text-[#3C403E] text-sm font-medium transition-colors"
            >
              {t("Try again")}
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handlePracticePrev}
              disabled={practiceIndex === 0}
              className="p-2 rounded-[4px] bg-lp-ink/5 hover:bg-lp-ink/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#3C403E]" aria-hidden="true" />
            </button>
            <button
              onClick={handlePracticeNext}
              disabled={practiceIndex === questions.length - 1}
              className="p-2 rounded-[4px] bg-lp-ink/5 hover:bg-lp-ink/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#3C403E]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini progress dots */}
      <div className="flex items-center gap-1.5 justify-center flex-wrap">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setPracticeIndex(i)
              setCurrentAnswer(answers[i]?.text ?? '')
              setScored(!!answers[i])
            }}
            className={`rounded-full transition-all duration-200 ${
              i === practiceIndex
                ? 'w-5 h-2 bg-[#1F5C4A]'
                : answers[i]
                ? 'w-2 h-2 bg-[#1F7A4D]'
                : 'w-2 h-2 bg-lp-ink/15 hover:bg-lp-ink/25'
            }`}
            aria-label={t("Practice question {v0}", { v0: i + 1 })}
          />
        ))}
      </div>
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-[#1B1D1C]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/interview/saved')}
              className="flex items-center gap-1.5 text-[#3C403E] hover:text-[#1B1D1C] transition-colors text-sm flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              {t("Back")}
            </button>
            <div className="w-px h-5 bg-lp-ink/10" />
            <div>
              <h1 className="text-xl font-bold text-[#1B1D1C] leading-tight">{prep.company}</h1>
              <p className="text-[#1F5C4A] text-sm font-medium">{prep.position}</p>
              <p className="text-[#5A5F5C] text-xs mt-0.5">{formatDate(locale, prep.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-lp-ink/5 hover:bg-lp-ink/8 text-[#3C403E] text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {t("PDF")}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 rounded-[4px] bg-lp-ink/5 hover:bg-[#B42318]/10 hover:text-[#B42318] text-[#5A5F5C] transition-colors"
              aria-label={t("Delete session")}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-0 rounded-[10px] bg-[#FFFFFF] border border-lp-rule mb-6 w-fit">
          <button
            onClick={() => setPracticeMode(false)}
            className={`px-4 py-2 rounded-[4px] text-sm font-medium transition-all duration-200 ${
              !practiceMode
                ? 'bg-[#1F5C4A] text-white '
                : 'text-[#5A5F5C] hover:text-[#3C403E]'
            }`}
          >
            {t("Study Cards")}
          </button>
          <button
            onClick={() => setPracticeMode(true)}
            className={`px-4 py-2 rounded-[4px] text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              practiceMode
                ? 'bg-[#1F5C4A] text-white '
                : 'text-[#5A5F5C] hover:text-[#3C403E]'
            }`}
          >
            {t("Practice Mode")}
            {practicedCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${practiceMode ? 'bg-lp-ink/20' : 'bg-[#1F7A4D]/20 text-[#1F7A4D]'}`}>
                {practicedCount}/{questions.length}
              </span>
            )}
          </button>
        </div>

        {/* Active mode content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={practiceMode ? 'practice' : 'study'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {practiceMode ? PracticeView : StudyView}
          </motion.div>
        </AnimatePresence>

        {/* Questions to Ask section */}
        {questionsToAsk.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 rounded-full bg-[#1F7A4D] " />
              <h2 className="text-base font-semibold text-[#1B1D1C]">{t("Questions to Ask the Interviewer")}</h2>
            </div>
            <div className="space-y-3">
              {questionsToAsk.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-[4px] border border-lp-rule bg-[#FFFFFF] px-4 py-3.5"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1F7A4D]/15 border border-[#1F7A4D]/25 flex items-center justify-center text-[10px] font-bold text-[#1F7A4D] mt-0.5">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm text-[#3C403E] leading-relaxed">{q}</p>
                  <button
                    onClick={() => handleCopy(q, i)}
                    className="flex-shrink-0 p-1.5 rounded-[4px] hover:bg-lp-ink/8 text-[#5A5F5C] hover:text-[#3C403E] transition-colors"
                    aria-label={t("Copy question")}
                  >
                    {copiedIdx === i ? (
                      <Check className="w-3.5 h-3.5 text-[#1F7A4D]" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Hidden print/PDF content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', padding: '24px', maxWidth: '700px', color: '#111' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
            {t("Interview Prep — {v0} @ {v1}", { v0: prep.position, v1: prep.company })}
          </h1>
          <p style={{ fontSize: '11px', color: '#666', marginBottom: '20px' }}>
            {t("{v0} · {v1} questions", { v0: formatDate(locale, prep.createdAt), v1: questions.length })}
          </p>
          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                Q{i + 1}. {q.question}
              </p>
              <p style={{ fontSize: '11px', color: '#444', marginBottom: '4px' }}>
                <strong>{t("Framework:")}</strong> {q.answer_framework}
              </p>
              {q.star_example && (
                <p style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>
                  <strong>{t("STAR Example:")}</strong> {q.star_example}
                </p>
              )}
              {answers[i] && (
                <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '6px', marginTop: '6px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: '#333' }}>{t("Your Practice Answer (Score: {v0})", { v0: answers[i].score })}</p>
                  <p style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{answers[i].text}</p>
                </div>
              )}
            </div>
          ))}
          {questionsToAsk.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px', marginTop: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>{t("Questions to Ask the Interviewer")}</p>
                {questionsToAsk.map((q, i) => (
                  <p key={i} style={{ fontSize: '11px', color: '#444', marginBottom: '6px' }}>
                    {i + 1}. {q}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => !deleting && setShowDelete(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-6 max-w-sm w-full ">
                <div className="w-12 h-12 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-[#B42318]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-[#1B1D1C] text-center mb-2">{t("Delete Session?")}</h3>
                <p className="text-[#3C403E] text-sm text-center mb-6">
                  {t("This prep session will be permanently deleted.")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDelete(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-[4px] bg-lp-ink/5 hover:bg-lp-ink/8 text-[#3C403E] text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-[4px] bg-[#B42318] hover:bg-[#912018] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <><div className="w-4 h-4 border-2 border-lp-rule border-t-lp-rule rounded-full animate-spin" />{t("Deleting…")}</>
                    ) : t("Delete")}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
