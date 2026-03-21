'use client'

import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle,
  Download,
  AlertCircle,
  Edit3,
  X,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { buildExperienceSummary } from '@/lib/prompts'
import type { CoverLetter } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

const MAX_WORDS = 200
const WARN_WORDS = 180

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function WordCountBar({ wordCount }: { wordCount: number }) {
  const pct = Math.min((wordCount / MAX_WORDS) * 100, 100)
  const color = wordCount > MAX_WORDS ? '#EF4444' : wordCount >= WARN_WORDS ? '#F59E0B' : '#22C55E'
  const label = wordCount > MAX_WORDS
    ? `${wordCount - MAX_WORDS} words over limit`
    : `${MAX_WORDS - wordCount} words remaining`

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#60607A]">Word count</span>
        <span style={{ color }} className="font-semibold tabular-nums">{wordCount} / {MAX_WORDS}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs" style={{ color: wordCount > MAX_WORDS ? '#EF4444' : '#60607A' }}>{label}</p>
    </div>
  )
}

export default function CoverLetterPage() {
  const { user } = useAuth()
  const { profile } = useCareerStore()

  const [position, setPosition] = useState(profile?.target?.position ?? '')
  const [company, setCompany] = useState(profile?.target?.company ?? '')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')
  const [experienceSummary, setExperienceSummary] = useState(
    profile && profile.experience.length > 0 ? buildExperienceSummary(profile) : ''
  )

  const [result, setResult] = useState<CoverLetter | null>(null)
  const [editedLetter, setEditedLetter] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const letterCardRef = useRef<HTMLDivElement>(null)
  const { isStreaming, stream } = useAIStream()

  const handleGenerate = useCallback(async () => {
    if (!position.trim() || !company.trim()) return
    setResult(null)
    setGenerateError('')
    setIsEditing(false)

    const fullText = await stream('/api/claude/cover-letter', {
      position,
      company,
      jobDescription,
      experienceSummary,
      uid: user?.uid,
      isPro: false,
    }, {
      onError: (err) => setGenerateError(err),
    })

    if (fullText) {
      try {
        const cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned) as CoverLetter
        setResult(parsed)
        setEditedLetter(parsed.cover_letter)
      } catch {
        setGenerateError('Could not parse the cover letter. Please try again.')
      }
    }
  }, [position, company, jobDescription, experienceSummary, user?.uid, stream])

  const handleCopy = useCallback(async () => {
    const text = isEditing ? editedLetter : (result?.cover_letter ?? '')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [isEditing, editedLetter, result])

  const handleDownloadPDF = useCallback(async () => {
    if (!letterCardRef.current) return
    setDownloading(true)
    try {
      const { generatePDFFromElement } = await import('@/lib/pdf')
      const name = `cover-letter-${company.replace(/\s+/g, '-').toLowerCase() || 'download'}`
      await generatePDFFromElement(letterCardRef.current, { filename: `${name}.pdf` })
    } finally {
      setDownloading(false)
    }
  }, [company])

  const currentWordCount = countWords(isEditing ? editedLetter : (result?.cover_letter ?? ''))

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Cover Letter Generator</h1>
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">
          Compelling, under-200-word cover letter that opens with a powerful hook — never &quot;I am applying for...&quot;
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Form ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
        >
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">
            {profile && profile.experience.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
                <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                <p className="text-xs text-[#22C55E]">Your experience has been auto-filled from your Career Profile.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Position <span className="text-[#EF4444]">*</span></label>
                <input type="text" className={INPUT_CLASS} placeholder="Senior Software Engineer" value={position} onChange={(e) => setPosition(e.target.value)} aria-label="Target position" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Company Name <span className="text-[#EF4444]">*</span></label>
                <input type="text" className={INPUT_CLASS} placeholder="Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Company name" />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Job Description (paste only)</label>
              <textarea className={TEXTAREA_CLASS} rows={4} placeholder="Paste the job description for Claude to match your keywords…" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} aria-label="Job description" />
            </div>

            <div>
              <label className={LABEL_CLASS}>Your Experience Summary</label>
              <textarea className={TEXTAREA_CLASS} rows={6} placeholder="Your experience is auto-filled from your profile, or paste a summary here…" value={experienceSummary} onChange={(e) => setExperienceSummary(e.target.value)} aria-label="Experience summary" />
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
                bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-semibold text-sm
                shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/50 hover:scale-[1.01]
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Cover Letter</>}
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
              <motion.div key="streaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 space-y-3 min-h-[300px]">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                    <Loader2 className="w-4 h-4 text-[#F59E0B] animate-spin" />
                    <span className="text-sm text-[#F59E0B] font-medium">Claude is crafting your cover letter…</span>
                  </div>
                  {[95, 80, 88, 72, 90, 78, 85].map((w, i) => (
                    <div key={i} className="h-3 rounded-full bg-white/[0.04] animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
                className="space-y-4">
                <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1" ref={letterCardRef}>
                  <div className="rounded-xl border border-white/[0.05] bg-white p-8">
                    {result.opening_hook && (
                      <div className="mb-4 p-3 rounded-lg bg-amber-50 border-l-4 border-[#F59E0B]">
                        <p className="text-xs font-semibold text-[#92400E] uppercase tracking-wide mb-1">Opening Hook</p>
                        <p className="text-sm text-[#78350F] italic">{result.opening_hook}</p>
                      </div>
                    )}
                    {isEditing ? (
                      <div className="relative">
                        <textarea
                          className="w-full text-sm text-gray-800 leading-relaxed p-0 border-none outline-none resize-none bg-transparent"
                          rows={12}
                          value={editedLetter}
                          onChange={(e) => setEditedLetter(e.target.value)}
                          aria-label="Edit cover letter"
                          autoFocus
                        />
                        <button onClick={() => setIsEditing(false)} aria-label="Finish editing" className="absolute top-0 right-0 p-1 rounded text-gray-400 hover:text-gray-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{editedLetter || result.cover_letter}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                  <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4">
                    <WordCountBar wordCount={currentWordCount} />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditing ? 'Done Editing' : 'Edit Inline'}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {downloading ? 'Generating…' : 'Download PDF'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-12 flex flex-col items-center text-center min-h-[300px] justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <p className="text-sm font-medium text-[#A0A0B8]">Your cover letter will appear here</p>
                  <p className="text-xs text-[#60607A] mt-1">Fill in the form and click Generate</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
