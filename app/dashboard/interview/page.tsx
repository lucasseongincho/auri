'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Mic,
  Send,
  Star,
  BookMarked,
  Copy,
} from 'lucide-react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { buildExperienceSummary } from '@/lib/prompts'
import { saveInterviewPrep } from '@/lib/firestore'
import type { InterviewPrep, InterviewQuestion } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const CARD_SPRING = { type: 'spring' as const, stiffness: 200, damping: 25 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#EF4444]/50 focus:ring-1 focus:ring-[#EF4444]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

interface PracticeFeedback {
  scores: { structure: number; specificity: number; impact: number }
  overall: number
  strengths: string[]
  improvements: string[]
  improved_answer: string
}

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
        try { idToken = await getIdToken(auth.currentUser) } catch { /* guest — IP rate limit applies */ }
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
        setScoreError(`Rate limit reached. Try again in ${j.retryAfter}s.`)
        return
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Scoring failed')
      setFeedback(json.data as PracticeFeedback)
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : 'Scoring failed')
    } finally {
      setIsScoring(false)
    }
  }

  const scoreColor = (n: number) => n >= 8 ? '#22C55E' : n >= 6 ? '#F59E0B' : '#EF4444'

  return (
    <div className="w-full" style={{ perspective: '1200px' }}>
      <motion.div
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={CARD_SPRING}
      >
        {/* Front — Question */}
        <div
          className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 cursor-pointer"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={() => !isPracticeMode && setFlipped(true)}
        >
          <div className="rounded-xl border border-white/[0.05] bg-gradient-to-br from-[#1C1C26] to-[#0F0F1A] p-6 min-h-[200px] flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <span className="px-2.5 py-1 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs font-semibold text-[#F87171] uppercase tracking-wide">
                Q{index + 1}
              </span>
              {!isPracticeMode && (
                <span className="text-xs text-[#60607A] flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Tap to reveal
                </span>
              )}
            </div>
            <p className="text-white font-medium text-base leading-relaxed flex-1">{question.question}</p>
            {isPracticeMode && (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                <textarea className={`${TEXTAREA_CLASS} text-sm`} rows={4} placeholder="Type your answer here…" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} aria-label="Your answer" />
                {scoreError && <p className="text-xs text-[#EF4444] flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {scoreError}</p>}
                {feedback ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(feedback.scores).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/[0.08]">
                          <span className="text-xs text-[#A0A0B8] capitalize">{key}</span>
                          <span className="text-xs font-bold" style={{ color: scoreColor(val) }}>{val}/10</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20">
                        <Star className="w-3 h-3 text-[#6366F1]" />
                        <span className="text-xs font-bold text-[#6366F1]">Overall: {feedback.overall}/10</span>
                      </div>
                    </div>
                    {feedback.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#22C55E] mb-1">Strengths</p>
                        {feedback.strengths.map((s, i) => <p key={i} className="text-xs text-[#A0A0B8]">✓ {s}</p>)}
                      </div>
                    )}
                    {feedback.improvements.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#F59E0B] mb-1">Improvements</p>
                        {feedback.improvements.map((s, i) => <p key={i} className="text-xs text-[#A0A0B8]">→ {s}</p>)}
                      </div>
                    )}
                    <button onClick={() => { setFeedback(null); setUserAnswer('') }} className="text-xs text-[#6366F1] underline">Try again</button>
                  </div>
                ) : (
                  <button
                    onClick={handleScore}
                    disabled={!userAnswer.trim() || isScoring}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-lg shadow-[#EF4444]/25 hover:shadow-[#EF4444]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScoring ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scoring…</> : <><Send className="w-3.5 h-3.5" /> Get AI Feedback</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back — STAR Framework */}
        <div
          className="absolute inset-0 rounded-2xl border border-[#6366F1]/20 bg-[#13131A] p-1 cursor-pointer"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={() => setFlipped(false)}
        >
          <div className="rounded-xl border border-[#6366F1]/10 bg-gradient-to-br from-[#1C1C26] to-[#0F0F1A] p-6 min-h-[200px] flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <span className="px-2.5 py-1 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 text-xs font-semibold text-[#818CF8] uppercase tracking-wide">STAR Framework</span>
              <span className="text-xs text-[#60607A] flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Tap to flip back</span>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-[#A0A0B8] leading-relaxed">{question.answer_framework}</p>
              {question.star_example && (
                <div className="p-3 rounded-xl bg-[#6366F1]/5 border border-[#6366F1]/15">
                  <p className="text-xs font-semibold text-[#6366F1] uppercase tracking-wide mb-1.5">Example</p>
                  <p className="text-xs text-[#A0A0B8] leading-relaxed">{question.star_example}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function QuestionsToAsk({ questions }: { questions: string[] }) {
  const [copied, setCopied] = useState<number | null>(null)
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
      <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-[#6366F1]" />
          <h3 className="text-sm font-semibold text-white">Questions to Ask the Interviewer</h3>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING, delay: i * 0.06 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-[#0A0A0F]/60 border border-white/[0.06]"
            >
              <div className="w-6 h-6 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[#818CF8]">{i + 1}</span>
              </div>
              <p className="flex-1 text-sm text-[#E8E8F0] leading-relaxed italic">&ldquo;{q}&rdquo;</p>
              <button
                onClick={async () => { await navigator.clipboard.writeText(q); setCopied(i); setTimeout(() => setCopied(null), 1500) }}
                aria-label={`Copy question ${i + 1}`}
                className="flex-shrink-0 p-1.5 rounded-lg text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/5 transition-all"
              >
                {copied === i ? <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function InterviewPage() {
  const { user } = useAuth()
  const { profile, updateProfile } = useCareerStore()

  const [position, setPosition] = useState(profile?.target?.position ?? '')
  const [company, setCompany] = useState(profile?.target?.company ?? '')
  const experienceSummary = profile && profile.experience.length > 0 ? buildExperienceSummary(profile) : ''

  const [prep, setPrep] = useState<InterviewPrep | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [savedToStudyList, setSavedToStudyList] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { isStreaming, stream } = useAIStream()

  const handleGenerate = useCallback(async () => {
    if (!position.trim() || !company.trim()) return
    setPrep(null)
    setGenerateError('')
    setCurrentCard(0)
    setSavedToStudyList(false)

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
      try {
        const cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned) as InterviewPrep
        setPrep(parsed)
        // Save to careerStore
        if (profile) {
          updateProfile({ generated: { ...profile.generated, interview_prep: parsed } })
        }
      } catch {
        setGenerateError('Could not parse the interview prep. Please try again.')
      }
    }
  }, [position, company, experienceSummary, user?.uid, stream, profile, updateProfile])

  const handleSaveToStudyList = useCallback(async () => {
    if (!prep || !user?.uid) return
    setIsSaving(true)
    try {
      await saveInterviewPrep(user.uid, position, company, prep)
      setSavedToStudyList(true)
    } catch { /* silent fail */ } finally {
      setIsSaving(false)
    }
  }, [prep, user?.uid, position, company])

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Interview Prep</h1>
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">
          8 likely questions with STAR frameworks, plus 3 strategic questions to ask the interviewer.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* ── Left: Form + Controls ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">
              {profile && profile.experience.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
                  <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                  <p className="text-xs text-[#22C55E]">Experience auto-loaded from Career Profile.</p>
                </div>
              )}
              <div>
                <label className={LABEL_CLASS}>Position <span className="text-[#EF4444]">*</span></label>
                <input type="text" className={INPUT_CLASS} placeholder="Senior Backend Engineer" value={position} onChange={(e) => setPosition(e.target.value)} aria-label="Position" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Company Name <span className="text-[#EF4444]">*</span></label>
                <input type="text" className={INPUT_CLASS} placeholder="Stripe" value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Company" />
              </div>

              {generateError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  <p className="text-xs text-[#EF4444]">{generateError}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!position.trim() || !company.trim() || isStreaming}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white font-semibold text-sm
                  shadow-lg shadow-[#EF4444]/25 hover:shadow-[#EF4444]/50 hover:scale-[1.01]
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</> : <><Sparkles className="w-4 h-4" /> Generate Interview Prep</>}
              </button>
            </div>
          </div>

          {prep && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
              className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wide">Practice Mode</span>
                  <button
                    onClick={() => setIsPracticeMode(!isPracticeMode)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isPracticeMode ? 'bg-[#EF4444]' : 'bg-white/10'}`}
                    role="switch"
                    aria-checked={isPracticeMode}
                    aria-label="Toggle practice mode"
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isPracticeMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-xs text-[#60607A] mb-2">Card {currentCard + 1} of {prep.questions.length}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
                      disabled={currentCard === 0}
                      aria-label="Previous question"
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-white/[0.08] text-[#A0A0B8] text-sm hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                      onClick={() => setCurrentCard(Math.min(prep.questions.length - 1, currentCard + 1))}
                      disabled={currentCard === prep.questions.length - 1}
                      aria-label="Next question"
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-white/[0.08] text-[#A0A0B8] text-sm hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {user?.uid && (
                  <button
                    onClick={handleSaveToStudyList}
                    disabled={savedToStudyList || isSaving}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
                      savedToStudyList ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 cursor-default' : 'border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedToStudyList ? <CheckCircle className="w-3.5 h-3.5" /> : <BookMarked className="w-3.5 h-3.5" />}
                    {savedToStudyList ? 'Saved to Study List' : 'Save to Study List'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── Right: Cards ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            {isStreaming ? (
              <motion.div key="streaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-4 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-[#EF4444] animate-spin" />
                  <span className="text-sm text-[#EF4444] font-medium">Claude is preparing your interview questions…</span>
                </div>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                    <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 min-h-[140px] space-y-3">
                      <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
                      <div className="h-4 w-3/4 rounded bg-white/[0.04] animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-white/[0.03] animate-pulse" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : prep ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="space-y-6">
                <div className="flex items-center gap-2">
                  {isPracticeMode ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20">
                      <Mic className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span className="text-xs font-medium text-[#EF4444]">Practice Mode Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.08]">
                      <BookOpen className="w-3.5 h-3.5 text-[#A0A0B8]" />
                      <span className="text-xs text-[#A0A0B8]">Tap any card to reveal the STAR framework</span>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={currentCard} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={SPRING}>
                    <FlipCard question={prep.questions[currentCard]} index={currentCard} isPracticeMode={isPracticeMode} targetPosition={position} uid={user?.uid} />
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {prep.questions.map((_, i) => (
                    <button key={i} onClick={() => setCurrentCard(i)} aria-label={`Go to question ${i + 1}`}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${i === currentCard ? 'bg-[#EF4444] scale-125' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>

                {prep.questions_to_ask.length > 0 && <QuestionsToAsk questions={prep.questions_to_ask} />}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-16 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-[#EF4444]" />
                  </div>
                  <p className="text-sm font-medium text-[#A0A0B8]">Your interview prep will appear here</p>
                  <p className="text-xs text-[#60607A] mt-1">Enter the position and company, then click Generate</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
