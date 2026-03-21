'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { getSavedInterviewPrep, deleteInterviewPrep, getGuestInterviewPreps, deleteGuestInterviewPrep } from '@/lib/firestore'
import type { SavedInterviewPrep, InterviewQuestion } from '@/types'

const CARD_SPRING = { type: 'spring', stiffness: 280, damping: 28 } as const

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
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-[#A0A0B8] tabular-nums w-16 text-right">
        {value}/{total} reviewed
      </span>
    </div>
  )
}

function ScoreMeter({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : score >= 40 ? '#6366F1' : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
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
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Developing' : 'Needs Work'}
        </p>
        <p className="text-[10px] text-[#60607A]">STAR score</p>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StudyViewPage() {
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

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } catch { return iso }
  }

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#A0A0B8] text-sm">Loading session…</p>
        </div>
      </div>
    )
  }

  if (notFound || !prep) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mb-2">
          <svg className="w-7 h-7 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#F8F8FF]">Session not found</h2>
        <p className="text-[#60607A] text-sm">This prep session may have been deleted.</p>
        <button
          onClick={() => router.push('/dashboard/interview/saved')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-[#6366F1] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Back to sessions
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
          className="p-2 rounded-lg bg-white/5 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 text-[#A0A0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5 py-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentCard(i); setFlipped(false) }}
              className={`rounded-full transition-all duration-200 ${
                i === currentCard
                  ? 'w-5 h-2 bg-[#6366F1]'
                  : reviewed.has(i)
                  ? 'w-2 h-2 bg-[#22C55E]'
                  : 'w-2 h-2 bg-white/15 hover:bg-white/25'
              }`}
              aria-label={`Go to question ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => { setCurrentCard((c) => Math.min(questions.length - 1, c + 1)); setFlipped(false) }}
          disabled={currentCard === questions.length - 1}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 text-[#A0A0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
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
              className="rounded-2xl border border-white/8 bg-[#13131A] p-6 sm:p-8 min-h-[200px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-[#6366F1] bg-[#6366F1]/10 px-2.5 py-1 rounded-full">
                    Q{currentCard + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-[#60607A]">Tap to reveal answer</span>
                </div>
                <p className="text-lg font-semibold text-[#F8F8FF] leading-snug">
                  {questions[currentCard].question}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleReviewed(currentCard) }}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    reviewed.has(currentCard)
                      ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                      : 'bg-white/5 text-[#A0A0B8] hover:bg-white/8'
                  }`}
                >
                  <svg className="w-4 h-4" fill={reviewed.has(currentCard) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {reviewed.has(currentCard) ? 'Reviewed' : 'Mark reviewed'}
                </button>
                <svg className="w-5 h-5 text-[#60607A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
                </svg>
              </div>
            </div>

            {/* Back — Answer Framework */}
            <div
              style={{
                gridArea: '1/1',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              className="rounded-2xl border border-[#6366F1]/30 bg-[#13131A] p-6 sm:p-8 min-h-[200px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2.5 py-1 rounded-full">
                    Answer Framework
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#F8F8FF] mb-3">{questions[currentCard].question}</p>
                <p className="text-sm text-[#A0A0B8] leading-relaxed">{questions[currentCard].answer_framework}</p>
                {questions[currentCard].star_example && (
                  <div className="mt-4 p-3 rounded-xl bg-[#6366F1]/8 border border-[#6366F1]/15">
                    <p className="text-xs font-semibold text-[#6366F1] mb-1">STAR Example</p>
                    <p className="text-xs text-[#A0A0B8] leading-relaxed">{questions[currentCard].star_example}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleReviewed(currentCard) }}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    reviewed.has(currentCard)
                      ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                      : 'bg-white/5 text-[#A0A0B8] hover:bg-white/8'
                  }`}
                >
                  <svg className="w-4 h-4" fill={reviewed.has(currentCard) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {reviewed.has(currentCard) ? 'Reviewed' : 'Mark reviewed'}
                </button>
                <svg className="w-5 h-5 text-[#60607A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
                </svg>
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
        <div className="text-sm text-[#A0A0B8]">
          Question <span className="font-semibold text-[#F8F8FF]">{practiceIndex + 1}</span> of {questions.length}
        </div>
        {avgScore !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#60607A]">Avg score:</span>
            <span className="font-bold" style={{ color: avgScore >= 70 ? '#22C55E' : avgScore >= 50 ? '#F59E0B' : '#EF4444' }}>
              {avgScore}
            </span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-white/8 bg-[#13131A] p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-[#6366F1] bg-[#6366F1]/10 px-2.5 py-1 rounded-full">
            Practice
          </span>
          {practiceEntry && <ScoreMeter score={practiceEntry.score} />}
        </div>
        <p className="text-base font-semibold text-[#F8F8FF] leading-snug mb-4">
          {practiceQuestion.question}
        </p>
        <div className="p-3 rounded-xl bg-[#6366F1]/8 border border-[#6366F1]/15 mb-4">
          <p className="text-xs font-semibold text-[#6366F1] mb-1">Framework hint</p>
          <p className="text-xs text-[#A0A0B8] leading-relaxed">{practiceQuestion.answer_framework}</p>
        </div>

        <textarea
          value={currentAnswer}
          onChange={(e) => { setCurrentAnswer(e.target.value); setScored(false) }}
          placeholder="Type your answer here… Use the STAR method: Situation → Task → Action → Result"
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/8 text-[#F8F8FF] placeholder-[#60607A] text-sm resize-none focus:outline-none focus:border-[#6366F1]/50 transition-colors"
        />

        {/* Feedback */}
        <AnimatePresence>
          {scored && practiceEntry && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 p-3 rounded-xl border text-sm ${
                practiceEntry.score >= 80
                  ? 'bg-[#22C55E]/8 border-[#22C55E]/20 text-[#22C55E]'
                  : practiceEntry.score >= 60
                  ? 'bg-[#F59E0B]/8 border-[#F59E0B]/20 text-[#F59E0B]'
                  : 'bg-[#EF4444]/8 border-[#EF4444]/20 text-[#EF4444]'
              }`}
            >
              {practiceEntry.feedback}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 mt-4">
          {!scored ? (
            <button
              onClick={() => handlePracticeSubmit(practiceQuestion)}
              disabled={!currentAnswer.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Get Feedback
            </button>
          ) : (
            <button
              onClick={() => { setCurrentAnswer(''); setScored(false) }}
              className="px-5 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-[#A0A0B8] text-sm font-medium transition-colors"
            >
              Try again
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handlePracticePrev}
              disabled={practiceIndex === 0}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-[#A0A0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handlePracticeNext}
              disabled={practiceIndex === questions.length - 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-[#A0A0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
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
                ? 'w-5 h-2 bg-[#6366F1]'
                : answers[i]
                ? 'w-2 h-2 bg-[#22C55E]'
                : 'w-2 h-2 bg-white/15 hover:bg-white/25'
            }`}
            aria-label={`Practice question ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8F8FF]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/interview/saved')}
              className="flex items-center gap-1.5 text-[#A0A0B8] hover:text-[#F8F8FF] transition-colors text-sm flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div>
              <h1 className="text-xl font-bold text-[#F8F8FF] leading-tight">{prep.company}</h1>
              <p className="text-[#8B5CF6] text-sm font-medium">{prep.position}</p>
              <p className="text-[#60607A] text-xs mt-0.5">{formatDate(prep.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-[#A0A0B8] text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-[#EF4444]/10 hover:text-[#EF4444] text-[#60607A] transition-colors"
              aria-label="Delete session"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#13131A] border border-white/8 mb-6 w-fit">
          <button
            onClick={() => setPracticeMode(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              !practiceMode
                ? 'bg-[#6366F1] text-white shadow-md'
                : 'text-[#60607A] hover:text-[#A0A0B8]'
            }`}
          >
            Study Cards
          </button>
          <button
            onClick={() => setPracticeMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              practiceMode
                ? 'bg-[#EF4444] text-white shadow-md'
                : 'text-[#60607A] hover:text-[#A0A0B8]'
            }`}
          >
            Practice Mode
            {practicedCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${practiceMode ? 'bg-white/20' : 'bg-[#22C55E]/20 text-[#22C55E]'}`}>
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
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#22C55E] to-[#16A34A]" />
              <h2 className="text-base font-semibold text-[#F8F8FF]">Questions to Ask the Interviewer</h2>
            </div>
            <div className="space-y-3">
              {questionsToAsk.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-white/8 bg-[#13131A] px-4 py-3.5"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/25 flex items-center justify-center text-[10px] font-bold text-[#22C55E] mt-0.5">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm text-[#A0A0B8] leading-relaxed">{q}</p>
                  <button
                    onClick={() => handleCopy(q, i)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/8 text-[#60607A] hover:text-[#A0A0B8] transition-colors"
                    aria-label="Copy question"
                  >
                    {copiedIdx === i ? (
                      <svg className="w-3.5 h-3.5 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
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
            Interview Prep — {prep.position} @ {prep.company}
          </h1>
          <p style={{ fontSize: '11px', color: '#666', marginBottom: '20px' }}>
            {formatDate(prep.createdAt)} · {questions.length} questions
          </p>
          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                Q{i + 1}. {q.question}
              </p>
              <p style={{ fontSize: '11px', color: '#444', marginBottom: '4px' }}>
                <strong>Framework:</strong> {q.answer_framework}
              </p>
              {q.star_example && (
                <p style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>
                  <strong>STAR Example:</strong> {q.star_example}
                </p>
              )}
              {answers[i] && (
                <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '6px', marginTop: '6px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: '#333' }}>Your Practice Answer (Score: {answers[i].score})</p>
                  <p style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{answers[i].text}</p>
                </div>
              )}
            </div>
          ))}
          {questionsToAsk.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px', marginTop: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Questions to Ask the Interviewer</p>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => !deleting && setShowDelete(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="rounded-2xl border border-white/10 bg-[#1C1C26] p-6 max-w-sm w-full shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#F8F8FF] text-center mb-2">Delete Session?</h3>
                <p className="text-[#A0A0B8] text-sm text-center mb-6">
                  This prep session will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDelete(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-[#A0A0B8] text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
                    ) : 'Delete'}
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
