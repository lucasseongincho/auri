'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
} from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle,
  Download,
  AlertCircle,
  X,
  Save,
  FolderOpen,
  Wand2,
  RotateCcw,
  RotateCw,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { buildExperienceSummary } from '@/lib/prompts'
import { saveCoverLetter, getSavedCoverLetter } from '@/lib/firestore'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import CompanyAutocomplete from '@/components/ui/CompanyAutocomplete'
import type { CoverLetter } from '@/types'

// ── Constants ────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

const LETTER_W = 816   // 8.5" at 96 dpi
const LETTER_H = 1056  // 11" at 96 dpi
const PAGE_PADDING = 96 // 1 inch margins

const MIN_WORDS = 280
const MAX_WORDS = 300
const WARN_WORDS = 270

const LOADING_MESSAGES = [
  'Analyzing the job description…',
  'Crafting your opening hook…',
  'Connecting your experience to their needs…',
  'Polishing to 280–300 words…',
  'Finalizing the letter…',
]

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

// ── Word Count Bar ────────────────────────────────────────────────────────────

function WordCountBar({ wordCount }: { wordCount: number }) {
  const pct = Math.min((wordCount / MAX_WORDS) * 100, 100)
  const color =
    wordCount > MAX_WORDS ? '#EF4444'
    : wordCount >= MIN_WORDS ? '#22C55E'
    : wordCount >= WARN_WORDS ? '#F59E0B'
    : '#60607A'

  const label =
    wordCount > MAX_WORDS
      ? `${wordCount - MAX_WORDS} words over limit — trim to 280-300`
      : wordCount >= MIN_WORDS
      ? `${MAX_WORDS - wordCount} words remaining`
      : wordCount >= WARN_WORDS
      ? `${MIN_WORDS - wordCount} more words to reach minimum`
      : 'Too short — aim for 280-300 words'

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
      <p className="text-xs" style={{ color: wordCount > MAX_WORDS ? '#EF4444' : wordCount < MIN_WORDS ? (wordCount >= WARN_WORDS ? '#F59E0B' : '#60607A') : '#60607A' }}>
        {label}
      </p>
    </div>
  )
}

// ── Loading Animation ────────────────────────────────────────────────────────

function CoverLetterLoadingState() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2200)
    const progTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 1.2, 92))
    }, 200)
    return () => { clearInterval(msgTimer); clearInterval(progTimer) }
  }, [])

  return (
    <div
      style={{
        background: 'white',
        width: `${LETTER_W}px`,
        minHeight: `${LETTER_H}px`,
        padding: `${PAGE_PADDING}px`,
        boxSizing: 'border-box',
      }}
      className="flex flex-col items-center justify-center gap-8"
    >
      {/* AURI pulsing icon */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706]
            flex items-center justify-center shadow-lg shadow-[#F59E0B]/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Mail className="w-9 h-9 text-white" />
        </motion.div>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-2xl border border-[#F59E0B]/30"
            style={{ width: `${80 + (i + 1) * 28}px`, height: `${80 + (i + 1) * 28}px` }}
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Status message */}
      <div className="text-center space-y-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-base font-medium text-[#444]"
          >
            {LOADING_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-[#999]">AURI is writing your cover letter</p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Skeleton lines */}
      <div className="w-full space-y-3 mt-4">
        {[92, 85, 78, 88, 72, 82, 90, 65, 75, 88].map((w, i) => (
          <motion.div
            key={i}
            className="h-3 rounded-full bg-[#F0F0F0]"
            style={{ width: `${w}%` }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Editable paragraph sub-component ─────────────────────────────────────────
// Owns its own DOM — React never re-writes content after first activation,
// which prevents the browser from resetting the cursor on every keystroke.

interface EditableParagraphProps {
  text: string
  isActive: boolean
  isAssisting: boolean
  idx: number
  onClick: () => void
  onChange: (val: string) => void
}

function EditableParagraph({
  text,
  isActive,
  isAssisting,
  onClick,
  onChange,
}: EditableParagraphProps) {
  const ref = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  // Set DOM content exactly once when paragraph first becomes active.
  // Intentionally omits `text` — after init, the browser owns the DOM.
  useEffect(() => {
    if (isActive && !initializedRef.current && ref.current) {
      ref.current.innerText = text
      initializedRef.current = true
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
      ref.current.focus()
    }
    if (!isActive) {
      initializedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  // Sync new text from AI assist into DOM after rewrite completes.
  useEffect(() => {
    if (isActive && !isAssisting && ref.current && initializedRef.current) {
      ref.current.innerText = text
      try {
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(ref.current)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssisting])

  return (
    <div
      style={{ position: 'relative', marginBottom: '14px' }}
      onClick={onClick}
    >
      <div
        ref={ref}
        contentEditable={isActive}
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerText)}
        onClick={(e) => { if (isActive) e.stopPropagation() }}
        style={{
          outline: 'none',
          borderRadius: '4px',
          padding: isActive ? '6px 8px' : '0',
          border: isActive
            ? '1.5px solid rgba(245,158,11,0.4)'
            : '1.5px solid transparent',
          background: isActive
            ? 'rgba(245,158,11,0.04)'
            : isAssisting
            ? 'rgba(245,158,11,0.06)'
            : 'transparent',
          cursor: isActive ? 'text' : 'pointer',
          transition: 'all 0.15s ease',
          whiteSpace: 'pre-wrap',
        }}
      >
        {isAssisting && (
          <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Rewriting…</span>
        )}
      </div>
    </div>
  )
}

// ── Formal letter document ────────────────────────────────────────────────────

interface LetterDocProps {
  result: CoverLetter
  personal: { name: string; email: string; phone: string; location: string }
  company: string
  hiringManagerName: string
  paragraphs: string[]
  activeParagraphIdx: number | null
  assistingIdx: number | null
  onParagraphClick: (idx: number) => void
  onParagraphChange: (idx: number, val: string) => void
}

function LetterDocument({
  result,
  personal,
  company,
  hiringManagerName,
  paragraphs,
  activeParagraphIdx,
  assistingIdx,
  onParagraphClick,
  onParagraphChange,
}: LetterDocProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const salutation = hiringManagerName ? `Dear ${hiringManagerName},` : 'Dear Hiring Manager,'

  return (
    <div
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '11pt',
        lineHeight: '1.6',
        color: '#1a1a1a',
        background: 'white',
        padding: `${PAGE_PADDING}px`,
        minHeight: `${LETTER_H}px`,
        width: `${LETTER_W}px`,
        boxSizing: 'border-box',
      }}
    >
      {/* Sender block */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '13pt', margin: '0 0 4px 0' }}>
          {personal.name || 'Your Name'}
        </p>
        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '9.5pt', color: '#555', margin: 0 }}>
          {[personal.location, personal.email, personal.phone].filter(Boolean).join('  ·  ')}
        </p>
      </div>

      {/* Date */}
      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#444', marginBottom: '20px' }}>
        {today}
      </p>

      {/* Recipient */}
      <div style={{ marginBottom: '24px' }}>
        {hiringManagerName && (
          <p style={{ margin: '0 0 2px 0', fontWeight: 600 }}>{hiringManagerName}</p>
        )}
        <p style={{ margin: 0 }}>{company}</p>
      </div>

      {/* Salutation */}
      <p style={{ marginBottom: '16px', fontWeight: 500 }}>{salutation}</p>

      {/* Body paragraphs — Easy Tune */}
      {paragraphs.map((text, i) => (
        <EditableParagraph
          key={i}
          idx={i}
          text={text}
          isActive={activeParagraphIdx === i}
          isAssisting={assistingIdx === i}
          onClick={() => onParagraphClick(i)}
          onChange={(val) => onParagraphChange(i, val)}
        />
      ))}

      {/* Closing */}
      <p style={{ marginBottom: '40px' }}>Sincerely,</p>
      <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
        {personal.name || 'Your Name'}
      </p>

      {/* Invisible result reference for word count */}
      <span style={{ display: 'none' }}>{result.word_count}</span>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 32, scale: 0.95 }}
      transition={SPRING}
      className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[9999] flex items-center gap-3
        px-4 py-3 rounded-xl border shadow-xl max-w-sm
        ${type === 'success'
          ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
          : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'}`}
    >
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss" className="p-0.5 ml-1 rounded opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function CoverLetterContent() {
  const { user } = useAuth()
  const { profile } = useCareerStore()
  const searchParams = useSearchParams()

  // Form fields
  const [position, setPosition] = useState(profile?.target?.position ?? '')
  const [company, setCompany] = useState(profile?.target?.company ?? '')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')
  const [experienceSummary, setExperienceSummary] = useState(
    profile && profile.experience.length > 0 ? buildExperienceSummary(profile) : ''
  )
  const [hiringManagerName, setHiringManagerName] = useState('')
  const [cityState, setCityState] = useState(profile?.personal?.location ?? '')

  // Result + editing state
  const [result, setResult] = useState<CoverLetter | null>(null)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [history, setHistory] = useState<string[][]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [activeParagraphIdx, setActiveParagraphIdx] = useState<number | null>(null)
  const [assistingIdx, setAssistingIdx] = useState<number | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Preview scaling
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const letterPrintRef = useRef<HTMLDivElement>(null)
  const { isStreaming, stream } = useAIStream()

  // Load saved letter when ?id= is present in the URL
  useEffect(() => {
    const id = searchParams.get('id')
    if (!id || !user?.uid) return
    getSavedCoverLetter(user.uid, id).then((letter) => {
      if (!letter) return
      setCompany(letter.company)
      setPosition(letter.position)
      const ps = letter.paragraphs?.length ? letter.paragraphs : [letter.content]
      setResult({
        cover_letter: letter.content,
        word_count: letter.wordCount,
        opening_hook: letter.openingHook ?? '',
        paragraphs: ps,
      })
      setParagraphs(ps)
      setHistory([ps])
      setHistoryIdx(0)
      setSavedId(id)
    })
  // Only run when auth resolves and id is present — not on every profile change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, searchParams])

  // Scale the letter to fit the container
  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const observe = new ResizeObserver(() => {
      const w = el.clientWidth - 32 // 16px padding each side
      setScale(Math.min(1, w / LETTER_W))
    })
    observe.observe(el)
    return () => observe.disconnect()
  }, [])

  // Push to undo history
  const pushHistory = useCallback((ps: string[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIdx + 1)
      return [...trimmed, ps]
    })
    setHistoryIdx((i) => i + 1)
  }, [historyIdx])

  const handleUndo = useCallback(() => {
    if (historyIdx <= 0) return
    const idx = historyIdx - 1
    setParagraphs(history[idx])
    setHistoryIdx(idx)
  }, [history, historyIdx])

  const handleRedo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const idx = historyIdx + 1
    setParagraphs(history[idx])
    setHistoryIdx(idx)
  }, [history, historyIdx])

  // Keyboard undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

  // Generate
  const handleGenerate = useCallback(async () => {
    if (!position.trim() || !company.trim()) return
    setResult(null)
    setParagraphs([])
    setHistory([])
    setHistoryIdx(-1)
    setGenerateError('')
    setActiveParagraphIdx(null)
    setSavedId(null)

    const fullText = await stream('/api/claude/cover-letter', {
      position, company, jobDescription, experienceSummary,
      hiringManagerName, cityState, uid: user?.uid, isPro: false,
    }, { onError: (err) => setGenerateError(err) })

    if (fullText) {
      try {
        let cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}')
        if (fb !== -1 && lb > fb) cleaned = cleaned.slice(fb, lb + 1)
        const parsed = JSON.parse(cleaned) as CoverLetter
        const ps = parsed.paragraphs?.length ? parsed.paragraphs : [parsed.cover_letter]
        setResult(parsed)
        setParagraphs(ps)
        setHistory([ps])
        setHistoryIdx(0)
      } catch {
        setGenerateError('Could not parse the cover letter. Please try again.')
      }
    }
  }, [position, company, jobDescription, experienceSummary, hiringManagerName, cityState, user?.uid, stream])

  // Paragraph click — set active (no toggle; deactivation happens via outer container click)
  const handleParagraphClick = useCallback((idx: number) => {
    setActiveParagraphIdx(idx)
  }, [])

  // Paragraph text change
  const handleParagraphChange = useCallback((idx: number, val: string) => {
    setParagraphs((prev) => {
      const next = prev.map((p, i) => (i === idx ? val : p))
      return next
    })
  }, [])

  // Paragraph blur → push history
  const handleParagraphBlur = useCallback(() => {
    pushHistory(paragraphs)
  }, [paragraphs, pushHistory])

  // AI Assist on a paragraph
  const handleAIAssist = useCallback(async (idx: number) => {
    if (!result || assistingIdx !== null) return
    setAssistingIdx(idx)
    try {
      const res = await fetch('/api/claude/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'assist',
          position,
          company,
          selectedParagraph: paragraphs[idx],
          allParagraphs: paragraphs,
          uid: user?.uid,
        }),
      })
      if (!res.ok) throw new Error('Assist failed')
      const text = await res.text()
      const rewritten = text.trim()
      if (rewritten) {
        const next = paragraphs.map((p, i) => (i === idx ? rewritten : p))
        setParagraphs(next)
        pushHistory(next)
      }
    } catch {
      setToast({ message: 'AI Assist failed. Please try again.', type: 'error' })
    } finally {
      setAssistingIdx(null)
    }
  }, [result, assistingIdx, position, company, paragraphs, user?.uid, pushHistory])

  // Copy
  const handleCopy = useCallback(async () => {
    if (!result) return
    const body = paragraphs.filter(Boolean).join('\n\n')
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result, paragraphs])

  // Download PDF — only capture the letter content (no UI chrome)
  const handleDownloadPDF = useCallback(async () => {
    if (!letterPrintRef.current) return
    setDownloading(true)
    try {
      const { generatePDFFromElement } = await import('@/lib/pdf')
      const slug = `${company.replace(/\s+/g, '-').toLowerCase()}-${position.replace(/\s+/g, '-').toLowerCase()}`
      await generatePDFFromElement(letterPrintRef.current, {
        filename: `cover-letter-${slug || 'download'}.pdf`,
      })
    } finally {
      setDownloading(false)
    }
  }, [company, position])

  // Save to Firestore
  const handleSave = useCallback(async () => {
    if (!result || !user?.uid) return
    setSaving(true)
    try {
      const wordCount = countWords(paragraphs.join(' '))
      const payload = {
        company,
        position,
        content: paragraphs.join('\n\n'),
        paragraphs,
        wordCount,
        openingHook: result.opening_hook,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      if (savedId) {
        const { updateCoverLetter } = await import('@/lib/firestore')
        await updateCoverLetter(user.uid, savedId, payload)
      } else {
        const id = await saveCoverLetter(user.uid, payload)
        setSavedId(id)
      }
      setToast({ message: 'Cover letter saved ✓', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save. Please try again.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [result, user?.uid, company, position, paragraphs, savedId])

  // Word count (live, from paragraphs state)
  const currentWordCount = countWords(paragraphs.join(' '))

  const personal = {
    name: profile?.personal?.name ?? '',
    email: profile?.personal?.email ?? '',
    phone: profile?.personal?.phone ?? '',
    location: cityState || (profile?.personal?.location ?? ''),
  }

  const canUndo = historyIdx > 0
  const canRedo = historyIdx < history.length - 1

  return (
    <div className="h-full flex flex-col pb-20 md:pb-0">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="flex-shrink-0 flex items-center justify-between gap-4 mb-4 px-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-white leading-tight">Cover Letter Generator</h1>
            <p className="text-xs text-[#60607A] hidden sm:block">
              280–300 words · Opens with a powerful hook · Never &quot;I am applying for…&quot;
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/cover-letter/saved"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
            border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Saved Letters
        </Link>
      </motion.div>

      {/* Split layout */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

        {/* LEFT: Form */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          style={{ width: '40%', minWidth: '380px', flexShrink: 0 }}
          className="flex flex-col overflow-hidden"
        >
          <div className="flex-1 min-h-0 rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 flex flex-col">
            <div className="flex-1 min-h-0 rounded-xl border border-white/[0.05] bg-[#1C1C26] flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">

                {profile && profile.experience.length > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
                    <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                    <p className="text-xs text-[#22C55E]">Experience auto-filled from your Career Profile.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Position <span className="text-[#EF4444]">*</span></label>
                    <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                      placeholder="Senior Software Engineer" className={INPUT_CLASS}
                      aria-label="Target position" style={{ fontSize: '16px' }} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Company Name <span className="text-[#EF4444]">*</span></label>
                    <CompanyAutocomplete value={company} onChange={setCompany} placeholder="Acme Corp"
                      className={INPUT_CLASS} aria-label="Company name" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Hiring Manager Name <span className="text-[#60607A] font-normal">(optional)</span></label>
                    <input type="text" className={INPUT_CLASS} placeholder="Jane Smith"
                      value={hiringManagerName} onChange={(e) => setHiringManagerName(e.target.value)}
                      aria-label="Hiring manager name" />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Your City, State</label>
                    <LocationAutocomplete value={cityState} onChange={setCityState} placeholder="New York, NY"
                      className={INPUT_CLASS} aria-label="City and state" />
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Job Description <span className="text-[#60607A] font-normal">(paste for keyword match)</span></label>
                  <textarea className={TEXTAREA_CLASS} rows={4} placeholder="Paste the job description here…"
                    value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                    aria-label="Job description" />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Your Experience Summary</label>
                  <textarea className={TEXTAREA_CLASS} rows={5}
                    placeholder="Auto-filled from your profile, or paste a summary here…"
                    value={experienceSummary} onChange={(e) => setExperienceSummary(e.target.value)}
                    aria-label="Experience summary" />
                </div>

                {generateError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                    <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                    <p className="text-xs text-[#EF4444]">{generateError}</p>
                  </div>
                )}
              </div>

              {/* Generate button footer */}
              <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-white/[0.05]">
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
                    : <><Sparkles className="w-4 h-4" /> Generate Cover Letter</>}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Preview */}
        <motion.div
          ref={previewContainerRef}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden flex flex-col gap-4"
          style={{ minHeight: 0 }}
        >
          <AnimatePresence mode="wait">

            {/* Loading state */}
            {isStreaming && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 overflow-hidden"
              >
                <div className="rounded-xl border border-white/[0.05] overflow-hidden"
                  style={{
                    transformOrigin: 'top left',
                    transform: `scale(${scale})`,
                    width: `${LETTER_W}px`,
                    marginBottom: scale < 1 ? `${(scale - 1) * LETTER_H}px` : undefined,
                  }}
                >
                  <CoverLetterLoadingState />
                </div>
              </motion.div>
            )}

            {/* Result */}
            {!isStreaming && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
                className="space-y-4"
              >
                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-wrap print:hidden">
                  {/* Undo / Redo */}
                  <button onClick={handleUndo} disabled={!canUndo} aria-label="Undo"
                    className="p-2 rounded-lg border border-white/[0.08] text-[#A0A0B8]
                      hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleRedo} disabled={!canRedo} aria-label="Redo"
                    className="p-2 rounded-lg border border-white/[0.08] text-[#A0A0B8]
                      hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-5 bg-white/[0.08] mx-1" />

                  {/* Copy */}
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                      border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>

                  {/* Save */}
                  {user?.uid && (
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                        border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {saving ? 'Saving…' : savedId ? 'Saved ✓' : 'Save'}
                    </button>
                  )}

                  {/* Download PDF */}
                  <button onClick={handleDownloadPDF} disabled={downloading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                      bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white
                      shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/50 hover:scale-[1.02]
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {downloading ? 'Generating…' : 'Download PDF'}
                  </button>
                </div>

                {/* AI Assist hint */}
                {activeParagraphIdx !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="print:hidden flex items-center gap-3 px-4 py-2.5 rounded-xl
                      bg-[#F59E0B]/10 border border-[#F59E0B]/20"
                  >
                    <Wand2 className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                    <span className="text-xs text-[#FDE68A]">
                      Paragraph {activeParagraphIdx + 1} selected — edit inline or use AI Assist to rewrite it
                    </span>
                    <button
                      onClick={() => handleAIAssist(activeParagraphIdx)}
                      disabled={assistingIdx !== null}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-[#F59E0B] text-white hover:bg-[#D97706] transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assistingIdx === activeParagraphIdx
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Rewriting…</>
                        : <><Sparkles className="w-3 h-3" /> AI Assist</>}
                    </button>
                    <button onClick={() => setActiveParagraphIdx(null)} aria-label="Dismiss"
                      className="p-1 rounded text-[#A0A0B8] hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {/* Opening hook callout */}
                {result.opening_hook && (
                  <div className="print:hidden p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                    <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wide mb-1">Opening Hook</p>
                    <p className="text-sm text-[#FDE68A] italic">{result.opening_hook}</p>
                  </div>
                )}

                {/* Letter preview — scaled */}
                <div
                  className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 overflow-hidden"
                  onClick={() => { if (activeParagraphIdx !== null) setActiveParagraphIdx(null) }}
                >
                  {/* Only the div with ref is captured for PDF — no toolbar / UI chrome */}
                  <div
                    ref={letterPrintRef}
                    style={{
                      transformOrigin: 'top left',
                      transform: `scale(${scale})`,
                      width: `${LETTER_W}px`,
                      marginBottom: scale < 1 ? `${(scale - 1) * LETTER_H}px` : undefined,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={handleParagraphBlur}
                  >
                    <LetterDocument
                      result={result}
                      personal={personal}
                      company={company}
                      hiringManagerName={hiringManagerName}
                      paragraphs={paragraphs}
                      activeParagraphIdx={activeParagraphIdx}
                      assistingIdx={assistingIdx}
                      onParagraphClick={handleParagraphClick}
                      onParagraphChange={handleParagraphChange}
                    />
                  </div>
                </div>

                {/* Word count bar */}
                <div className="print:hidden rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                  <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4">
                    <WordCountBar wordCount={currentWordCount} />
                  </div>
                </div>

                {/* Easy Tune tip */}
                <p className="print:hidden text-xs text-center text-[#60607A]">
                  Click any paragraph to edit inline · Use AI Assist to rewrite · Ctrl+Z to undo
                </p>
              </motion.div>
            )}

            {/* Empty state */}
            {!isStreaming && !result && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center
                  rounded-2xl border border-dashed border-white/[0.08]"
                style={{ minHeight: '400px' }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20
                  flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <p className="text-sm font-medium text-[#A0A0B8]">Your cover letter will appear here</p>
                <p className="text-xs text-[#60607A] mt-1">Fill in the form and click Generate</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>

    </div>
  )
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={null}>
      <CoverLetterContent />
    </Suspense>
  )
}
