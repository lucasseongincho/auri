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
import JobTitleAutocomplete from '@/components/ui/JobTitleAutocomplete'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import CompanyAutocomplete from '@/components/ui/CompanyAutocomplete'
import type { CoverLetter } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

const MIN_WORDS = 280
const MAX_WORDS = 380
const WARN_WORDS = 355

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function WordCountBar({ wordCount }: { wordCount: number }) {
  const pct = Math.min((wordCount / MAX_WORDS) * 100, 100)
  const color =
    wordCount > MAX_WORDS
      ? '#EF4444'
      : wordCount >= WARN_WORDS
      ? '#F59E0B'
      : wordCount >= MIN_WORDS
      ? '#22C55E'
      : '#60607A'

  const label =
    wordCount > MAX_WORDS
      ? `${wordCount - MAX_WORDS} words over limit`
      : wordCount >= MIN_WORDS
      ? `${MAX_WORDS - wordCount} words remaining`
      : `${MIN_WORDS - wordCount} more words to reach minimum`

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#60607A]">Word count (body only)</span>
        <span style={{ color }} className="font-semibold tabular-nums">
          {wordCount} / {MAX_WORDS}
        </span>
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
      <p className="text-xs" style={{ color: wordCount > MAX_WORDS ? '#EF4444' : '#60607A' }}>
        {label}
      </p>
    </div>
  )
}

// ── Formal letter renderer ──────────────────────────────────────────────────

interface LetterDocProps {
  result: CoverLetter
  personal: { name: string; email: string; phone: string; location: string }
  company: string
  position: string
  hiringManagerName: string
  isEditing: boolean
  editedParagraphs: string[]
  onParagraphChange: (index: number, value: string) => void
  onStopEditing: () => void
}

function LetterDocument({
  result,
  personal,
  company,
  hiringManagerName,
  isEditing,
  editedParagraphs,
  onParagraphChange,
  onStopEditing,
}: LetterDocProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const salutation = hiringManagerName
    ? `Dear ${hiringManagerName},`
    : 'Dear Hiring Manager,'

  const paragraphs = isEditing ? editedParagraphs : (result.paragraphs?.length ? result.paragraphs : [result.cover_letter])

  return (
    <div
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '11pt',
        lineHeight: '1.6',
        color: '#1a1a1a',
        background: 'white',
        padding: '25mm 20mm',
        minHeight: '297mm',
        width: '210mm',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* ── Sender block ────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '13pt', margin: '0 0 4px 0' }}>
          {personal.name || 'Your Name'}
        </p>
        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '9.5pt', color: '#555', margin: 0 }}>
          {[personal.location, personal.email, personal.phone].filter(Boolean).join('  ·  ')}
        </p>
      </div>

      {/* ── Date ────────────────────────────────────── */}
      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#444', marginBottom: '20px' }}>
        {today}
      </p>

      {/* ── Recipient block ─────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        {hiringManagerName && (
          <p style={{ margin: '0 0 2px 0', fontWeight: 600 }}>{hiringManagerName}</p>
        )}
        <p style={{ margin: 0 }}>{company}</p>
      </div>

      {/* ── Salutation ──────────────────────────────── */}
      <p style={{ marginBottom: '16px', fontWeight: 500 }}>{salutation}</p>

      {/* ── Body paragraphs ─────────────────────────── */}
      {isEditing ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={onStopEditing}
            style={{
              position: 'absolute',
              top: -28,
              right: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
            }}
            aria-label="Done editing"
          >
            <X size={14} /> Done
          </button>
          {editedParagraphs.map((text, i) => (
            <textarea
              key={i}
              value={text}
              onChange={(e) => onParagraphChange(i, e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '11pt',
                lineHeight: '1.6',
                color: '#1a1a1a',
                background: 'rgba(99,102,241,0.04)',
                border: '1px dashed rgba(99,102,241,0.3)',
                borderRadius: '4px',
                padding: '8px',
                resize: 'vertical',
                marginBottom: '14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              rows={4}
              aria-label={`Edit paragraph ${i + 1}`}
            />
          ))}
        </div>
      ) : (
        <>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ marginBottom: '14px', whiteSpace: 'pre-wrap' }}>{p}</p>
          ))}
        </>
      )}

      {/* ── Closing ─────────────────────────────────── */}
      <p style={{ marginBottom: '40px' }}>Sincerely,</p>
      <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
        {personal.name || 'Your Name'}
      </p>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function CoverLetterPage() {
  const { user } = useAuth()
  const { profile } = useCareerStore()

  const [position, setPosition] = useState(profile?.target?.position ?? '')
  const [company, setCompany] = useState(profile?.target?.company ?? '')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')
  const [experienceSummary, setExperienceSummary] = useState(
    profile && profile.experience.length > 0 ? buildExperienceSummary(profile) : ''
  )
  const [hiringManagerName, setHiringManagerName] = useState('')
  const [cityState, setCityState] = useState(profile?.personal?.location ?? '')

  const [result, setResult] = useState<CoverLetter | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedParagraphs, setEditedParagraphs] = useState<string[]>([])
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
      hiringManagerName,
      cityState,
      uid: user?.uid,
      isPro: false,
    }, {
      onError: (err) => setGenerateError(err),
    })

    if (fullText) {
      try {
        let cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}')
        if (fb !== -1 && lb > fb) cleaned = cleaned.slice(fb, lb + 1)
        const parsed = JSON.parse(cleaned) as CoverLetter
        setResult(parsed)
        setEditedParagraphs(parsed.paragraphs?.length ? parsed.paragraphs : [parsed.cover_letter])
      } catch {
        setGenerateError('Could not parse the cover letter. Please try again.')
      }
    }
  }, [position, company, jobDescription, experienceSummary, hiringManagerName, cityState, user?.uid, stream])

  const handleCopy = useCallback(async () => {
    if (!result) return
    const body = isEditing
      ? editedParagraphs.filter(Boolean).join('\n\n')
      : result.cover_letter
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [isEditing, editedParagraphs, result])

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

  const handleParagraphChange = useCallback((index: number, value: string) => {
    setEditedParagraphs((prev) => prev.map((p, i) => (i === index ? value : p)))
  }, [])

  // Count words across all body paragraphs
  const allBodyText = isEditing
    ? editedParagraphs.join(' ')
    : result
    ? (result.paragraphs?.join(' ') || result.cover_letter)
    : ''
  const currentWordCount = countWords(allBodyText)

  const personal = {
    name: profile?.personal?.name ?? '',
    email: profile?.personal?.email ?? '',
    phone: profile?.personal?.phone ?? '',
    location: cityState || (profile?.personal?.location ?? ''),
  }

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
          Professional letter structure, 300–380 words, 3–6 paragraphs, opens with a powerful hook — never &quot;I am applying for...&quot;
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Form ─────────────────────────────── */}
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
                <JobTitleAutocomplete value={position} onChange={setPosition} placeholder="Senior Software Engineer" className={INPUT_CLASS} aria-label="Target position" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Company Name <span className="text-[#EF4444]">*</span></label>
                <CompanyAutocomplete value={company} onChange={setCompany} placeholder="Acme Corp" className={INPUT_CLASS} aria-label="Company name" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Hiring Manager Name <span className="text-[#60607A] font-normal">(optional)</span></label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="Jane Smith"
                  value={hiringManagerName}
                  onChange={(e) => setHiringManagerName(e.target.value)}
                  aria-label="Hiring manager name"
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Your City, State</label>
                <LocationAutocomplete value={cityState} onChange={setCityState} placeholder="New York, NY" className={INPUT_CLASS} aria-label="City and state" />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Job Description <span className="text-[#60607A] font-normal">(paste for keyword match)</span></label>
              <textarea
                className={TEXTAREA_CLASS}
                rows={4}
                placeholder="Paste the job description here…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                aria-label="Job description"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Your Experience Summary</label>
              <textarea
                className={TEXTAREA_CLASS}
                rows={5}
                placeholder="Your experience is auto-filled from your profile, or paste a summary here…"
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                aria-label="Experience summary"
              />
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
              {isStreaming
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Sparkles className="w-4 h-4" /> Generate Cover Letter</>
              }
            </button>
          </div>
        </motion.div>

        {/* ── Right: Output ───────────────────────────── */}
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
                    <span className="text-sm text-[#F59E0B] font-medium">AURI is crafting your cover letter…</span>
                  </div>
                  {[95, 80, 88, 72, 90, 78, 85, 60, 70, 82].map((w, i) => (
                    <div key={i} className="h-3 rounded-full bg-white/[0.04] animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
                className="space-y-4">

                {result.opening_hook && (
                  <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                    <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wide mb-1">Opening Hook</p>
                    <p className="text-sm text-[#FDE68A] italic">{result.opening_hook}</p>
                  </div>
                )}

                {/* Letter document — scrollable preview */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 overflow-auto">
                  <div ref={letterCardRef}>
                    <LetterDocument
                      result={result}
                      personal={personal}
                      company={company}
                      position={position}
                      hiringManagerName={hiringManagerName}
                      isEditing={isEditing}
                      editedParagraphs={editedParagraphs}
                      onParagraphChange={handleParagraphChange}
                      onStopEditing={() => setIsEditing(false)}
                    />
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
