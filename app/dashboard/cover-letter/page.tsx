'use client'

import { useT } from '@/lib/i18n/client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  Suspense,
} from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, CheckCircle, Download, AlertCircle, X, Save, RotateCcw, RotateCw, Edit3, Zap, Eye, ChevronLeft } from 'lucide-react'
import { IconAiMark, IconCoverLetter, IconLoading, IconMyCoverLetters } from '@/components/icons'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { buildExperienceSummary } from '@/lib/prompts'
import { saveCoverLetter, getSavedCoverLetter, saveGuestCoverLetter } from '@/lib/firestore'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import CompanyAutocomplete from '@/components/ui/CompanyAutocomplete'
import type { CoverLetter } from '@/types'

// ── Constants ────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#F4F2EC] border border-lp-rule rounded-[4px] px-4 py-3 text-lp-ink text-sm placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F5C4A]/50 focus:ring-1 focus:ring-[#1F5C4A]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#3C403E] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

const LETTER_W = 816   // 8.5" at 96 dpi
const LETTER_H = 1056  // 11" at 96 dpi
const PAGE_PADDING_TOP = 45    // 12mm
const PAGE_PADDING_SIDE = 76   // 20mm
const PAGE_PADDING_BOTTOM = 38 // 10mm

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
  const t = useT()
  const pct = Math.min((wordCount / MAX_WORDS) * 100, 100)
  const color =
    wordCount > MAX_WORDS ? '#B42318'
    : wordCount >= MIN_WORDS ? '#1F7A4D'
    : wordCount >= WARN_WORDS ? '#8A5A00'
    : '#5A5F5C'

  const label =
    wordCount > MAX_WORDS
      ? t('{v0} words over limit — trim to 280-300', { v0: wordCount - MAX_WORDS })
      : wordCount >= MIN_WORDS
      ? t('{v0} words remaining', { v0: MAX_WORDS - wordCount })
      : wordCount >= WARN_WORDS
      ? t('{v0} more words to reach minimum', { v0: MIN_WORDS - wordCount })
      : t('Too short — aim for 280-300 words')

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#5A5F5C]">{t("Word count (body only)")}</span>
        <span style={{ color }} className="font-semibold tabular-nums">
          {wordCount} / {MAX_WORDS}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-lp-ink/6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs" style={{ color: wordCount > MAX_WORDS ? '#B42318' : wordCount < MIN_WORDS ? (wordCount >= WARN_WORDS ? '#8A5A00' : '#5A5F5C') : '#5A5F5C' }}>
        {label}
      </p>
    </div>
  )
}

// ── Loading Animation ────────────────────────────────────────────────────────

function CoverLetterLoadingState() {
  const t = useT()
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
        padding: `${PAGE_PADDING_TOP}px ${PAGE_PADDING_SIDE}px ${PAGE_PADDING_BOTTOM}px`,
        boxSizing: 'border-box',
      }}
      className="flex flex-col items-center justify-center gap-8"
    >
      {/* AURI pulsing icon */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="w-20 h-20 rounded-[10px] bg-[#1F5C4A]/10
            flex items-center justify-center "
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <IconCoverLetter className="w-9 h-9 text-lp-ink" />
        </motion.div>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-[10px] border border-[#1F5C4A]/30"
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
            {t(LOADING_MESSAGES[msgIdx])}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-[#999]">{t("AURI is writing your cover letter")}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[256px] h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#1F5C4A] "
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
  idx: number
  onClick: () => void
  onChange: (val: string) => void
}

function EditableParagraph({
  text,
  isActive,
  onClick,
  onChange,
}: EditableParagraphProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Runs synchronously (before paint) each time isActive becomes true.
  // useLayoutEffect ensures content is in the DOM before the browser draws,
  // so the paragraph never flashes empty. `text` is intentionally excluded
  // from deps — after init the browser owns the DOM; we must not overwrite
  // the user's in-progress edits on every keystroke.
  useLayoutEffect(() => {
    if (!isActive || !ref.current) return
    ref.current.innerText = text
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(ref.current)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
    ref.current.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const base: React.CSSProperties = {
    outline: 'none',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
    whiteSpace: 'pre-wrap',
  }

  return (
    <div style={{ position: 'relative', marginBottom: '14px' }} onClick={onClick}>
      {isActive ? (
        // key="edit" — fresh DOM node every time editing starts; useEffect sets
        // innerText on mount so React never writes children into this div.
        <div
          key="edit"
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange((e.target as HTMLDivElement).innerText)}
          onClick={(e) => e.stopPropagation()}
          style={{ ...base, padding: '6px 8px', cursor: 'text',
            border: '1.5px solid rgba(138,90,0,0.4)',
            background: 'rgba(138,90,0,0.04)' }}
        />
      ) : (
        // key="view" — fresh DOM node every time editing ends; React owns it
        // and renders {text}, which is always the latest typed value.
        <div
          key="view"
          style={{ ...base, padding: '0', cursor: 'pointer', border: '1.5px solid transparent' }}
        >
          {text}
        </div>
      )}
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
  onParagraphClick,
  onParagraphChange,
}: LetterDocProps) {
  const t = useT()
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
        padding: `${PAGE_PADDING_TOP}px ${PAGE_PADDING_SIDE}px ${PAGE_PADDING_BOTTOM}px`,
        minHeight: `${LETTER_H}px`,
        width: `${LETTER_W}px`,
        boxSizing: 'border-box',
      }}
    >
      {/* Sender block */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '13pt', margin: '0 0 4px 0' }}>
          {personal.name || t("Your Name")}
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
          onClick={() => onParagraphClick(i)}
          onChange={(val) => onParagraphChange(i, val)}
        />
      ))}

      {/* Closing */}
      <p style={{ marginBottom: '40px' }}>{t("Sincerely,")}</p>
      <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
        {personal.name || t("Your Name")}
      </p>

      {/* Invisible result reference for word count */}
      <span style={{ display: 'none' }}>{result.word_count}</span>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  const t = useT()
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
        px-4 py-3 rounded-[4px] border max-w-sm
        ${type === 'success'
          ? 'bg-[#1F7A4D]/10 border-[#1F7A4D]/30 text-[#1F7A4D]'
          : 'bg-[#B42318]/10 border-[#B42318]/30 text-[#B42318]'}`}
    >
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} aria-label={t("Dismiss")} className="p-0.5 ml-1 rounded opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function CoverLetterContent() {
  const t = useT()
  const { user } = useAuth()
  const { profile } = useCareerStore()
  const searchParams = useSearchParams()

  // Form fields
  const [position, setPosition] = useState(profile?.target?.position ?? '')
  const [company, setCompany] = useState(profile?.target?.company ?? '')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')
  const [experienceSummary, setExperienceSummary] = useState(
    profile && profile.experience.length > 0 ? buildExperienceSummary(profile, profile?.target?.position) : ''
  )
  const [hiringManagerName, setHiringManagerName] = useState('')
  const [cityState, setCityState] = useState(profile?.personal?.location ?? '')

  // Result + editing state
  const [result, setResult] = useState<CoverLetter | null>(null)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [history, setHistory] = useState<string[][]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [activeParagraphIdx, setActiveParagraphIdx] = useState<number | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form')

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
        setMobileView('preview')

        // Guest — save to localStorage so the letter survives a page refresh
        if (!user?.uid) {
          const guestId = saveGuestCoverLetter({
            company,
            position,
            content: ps.join('\n\n'),
            paragraphs: ps,
            wordCount: parsed.word_count,
            openingHook: parsed.opening_hook ?? '',
            signerName: profile?.personal?.name ?? '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          setSavedId(guestId)
        }
      } catch {
        setGenerateError(t("Could not parse the cover letter. Please try again."))
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

  // Copy
  const handleCopy = useCallback(async () => {
    if (!result) return
    const body = paragraphs.filter(Boolean).join('\n\n')
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result, paragraphs])

  // Download PDF — render through Puppeteer so the output has a real text layer
  const handleDownloadPDF = useCallback(async () => {
    if (!letterPrintRef.current) return
    setDownloading(true)
    const slug = `${company.replace(/\s+/g, '-').toLowerCase()}-${position.replace(/\s+/g, '-').toLowerCase()}`
    const filename = `cover-letter-${slug || 'download'}.pdf`
    try {
      const { getResumeHTML } = await import('@/lib/pdf')
      const html = getResumeHTML(letterPrintRef.current)
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? t("Server responded {v0}", { v0: res.status }))
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[pdf] Cover letter download failed:', err instanceof Error ? err.message : err)
      setToast({ message: t("PDF generation is temporarily unavailable — please try again in a moment."), type: 'error' })
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
        signerName: profile?.personal?.name ?? '',
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
      setToast({ message: t("Cover letter saved ✓"), type: 'success' })
    } catch {
      setToast({ message: t("Failed to save. Please try again."), type: 'error' })
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
          <div className="w-9 h-9 rounded-[10px] bg-[#1F5C4A]/10 flex items-center justify-center flex-shrink-0">
            <IconCoverLetter className="w-5 h-5 text-lp-ink" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-lp-ink leading-tight">{t("Cover Letter Generator")}</h1>
            <p className="text-xs text-[#5A5F5C] hidden sm:block">
              {t("280–300 words · Opens with a powerful hook · Never \"I am applying for…\"")}
            </p>
          </div>
        </div>

        {/* Mobile view toggle — only visible on mobile */}
        <div className="flex md:hidden items-center gap-1 p-0 rounded-[10px]
          bg-[#FFFFFF] border border-lp-rule">
          <button
            onClick={() => setMobileView('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-all
              ${mobileView === 'form'
                ? 'bg-[#1F5C4A] text-white '
                : 'text-[#5A5F5C] hover:text-[#3C403E]'
              }`}
          >
            <Edit3 className="w-3 h-3" />
            {t("Form")}
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-all
              ${mobileView === 'preview'
                ? 'bg-[#1F5C4A] text-white '
                : 'text-[#5A5F5C] hover:text-[#3C403E]'
              }`}
          >
            <Eye className="w-3 h-3" />
            {t("Preview")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Save — only show when a result exists */}
          {result && (
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={t("Save cover letter")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                bg-[#1F5C4A] text-white
                 transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving
                ? <IconLoading className="w-3.5 h-3.5 animate-spin" />
                : savedId
                ? <CheckCircle className="w-3.5 h-3.5" />
                : <Save className="w-3.5 h-3.5" />
              }
              {saving ? t("Saving…") : savedId ? t("Saved!") : t("Save")}
            </button>
          )}
          <Link
            href="/dashboard/cover-letter/saved"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium
              border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5
              transition-all duration-200"
          >
            <IconMyCoverLetters className="w-3.5 h-3.5" />
            {t("My Letters")}
          </Link>
        </div>
      </motion.div>

      {/* Split layout */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

        {/* LEFT: Form */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className={`flex flex-col overflow-hidden w-full md:w-[40%] md:min-w-[380px] md:flex-shrink-0
            ${mobileView === 'preview' ? 'hidden md:flex' : 'flex'}`}
        >
          <div className="flex-1 min-h-0 rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 flex flex-col">
            <div className="flex-1 min-h-0 rounded-[10px]  bg-[#FFFFFF] flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">

                {profile && profile.experience.length > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#1F7A4D]/10 border border-[#1F7A4D]/20">
                    <CheckCircle className="w-4 h-4 text-[#1F7A4D] flex-shrink-0" />
                    <p className="text-xs text-[#1F7A4D]">{t("Experience auto-filled from your Career Profile.")}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>{t("Position")}{' '}<span className="text-[#B42318]">*</span></label>
                    <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                      placeholder={t("Senior Software Engineer")} className={INPUT_CLASS}
                      aria-label={t("Target position")} style={{ fontSize: '16px' }} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>{t("Company Name")}{' '}<span className="text-[#B42318]">*</span></label>
                    <CompanyAutocomplete value={company} onChange={setCompany} placeholder={t("Acme Corp")}
                      className={INPUT_CLASS} aria-label={t("Company name")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>{t("Hiring Manager Name")}{' '}<span className="text-[#5A5F5C] font-normal">{t("(optional)")}</span></label>
                    <input type="text" className={INPUT_CLASS} placeholder={t("Jane Smith")}
                      value={hiringManagerName} onChange={(e) => setHiringManagerName(e.target.value)}
                      aria-label={t("Hiring manager name")} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>{t("Your City, State")}</label>
                    <LocationAutocomplete value={cityState} onChange={setCityState} placeholder={t("New York, NY")}
                      className={INPUT_CLASS} aria-label={t("City and state")} />
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>{t("Job Description")}{' '}<span className="text-[#5A5F5C] font-normal">{t("(paste for keyword match)")}</span></label>
                  <textarea className={TEXTAREA_CLASS} rows={4} placeholder={t("Paste the job description here…")}
                    value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                    aria-label={t("Job description")} />
                </div>

                <div>
                  <label className={LABEL_CLASS}>{t("Your Experience Summary")}</label>
                  <textarea className={TEXTAREA_CLASS} rows={5}
                    placeholder={t("Auto-filled from your profile, or paste a summary here…")}
                    value={experienceSummary} onChange={(e) => setExperienceSummary(e.target.value)}
                    aria-label={t("Experience summary")} />
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
              </div>

              {/* Generate button footer */}
              <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-lp-hairline">
                <button
                  onClick={handleGenerate}
                  disabled={!position.trim() || !company.trim() || isStreaming}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px]
                    bg-[#1F5C4A] text-white font-semibold text-sm
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isStreaming
                    ? <><IconLoading className="w-4 h-4 animate-spin" />{' '}{t("Generating…")}</>
                    : <><IconAiMark className="w-4 h-4" />{' '}{t("Generate Cover Letter")}</>}
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
          className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden flex flex-col gap-4
            ${mobileView === 'form' ? 'hidden md:flex' : 'flex'}`}
          style={{ minHeight: 0 }}
        >
          {mobileView === 'preview' && (
            <button
              onClick={() => setMobileView('form')}
              className="md:hidden flex items-center gap-1.5 text-xs text-[#3C403E]
                hover:text-lp-ink transition-colors mb-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t("Back to form")}
            </button>
          )}

          <AnimatePresence mode="wait">

            {/* Loading state */}
            {isStreaming && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 overflow-hidden"
              >
                <div className="rounded-[10px]  overflow-hidden"
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
                  <button onClick={handleUndo} disabled={!canUndo} aria-label={t("Undo")}
                    className="p-2 min-h-[36px] rounded-[4px] border border-lp-rule text-[#3C403E]
                      hover:text-lp-ink hover:bg-lp-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleRedo} disabled={!canRedo} aria-label={t("Redo")}
                    className="p-2 min-h-[36px] rounded-[4px] border border-lp-rule text-[#3C403E]
                      hover:text-lp-ink hover:bg-lp-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-5 bg-lp-ink/8 mx-1" />

                  {/* Copy */}
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-[4px] text-sm font-medium
                      border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5 transition-all">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#1F7A4D]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t("Copied!") : t("Copy")}
                  </button>

                  {/* Download PDF */}
                  <button onClick={handleDownloadPDF} disabled={downloading}
                    className="flex items-center gap-1.5 px-4 py-2 min-h-[36px] rounded-[4px] text-sm font-semibold
                      bg-[#1F5C4A] text-white
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    {downloading ? <IconLoading className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {downloading ? t("Generating…") : t("Download PDF")}
                  </button>
                </div>

                {/* Opening hook callout */}
                {result.opening_hook && (
                  <div className="print:hidden p-3 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20">
                    <p className="text-xs font-semibold text-[#1F5C4A] uppercase tracking-wide mb-1">{t("Opening Hook")}</p>
                    <p className="text-sm text-lp-ink italic">{result.opening_hook}</p>
                  </div>
                )}

                {/* Letter preview — scaled */}
                <div
                  className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 overflow-hidden"
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
                      onParagraphClick={handleParagraphClick}
                      onParagraphChange={handleParagraphChange}
                    />
                  </div>
                </div>

                {/* Word count bar */}
                <div className="print:hidden rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                  <div className="rounded-[10px]  bg-[#FFFFFF] p-4">
                    <WordCountBar wordCount={currentWordCount} />
                  </div>
                </div>

                {/* Easy Tune tip */}
                <p className="print:hidden text-xs text-center text-[#5A5F5C]">
                  {t("Click any paragraph to edit inline · Ctrl+Z to undo")}
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
                  rounded-[10px] border border-dashed border-lp-rule"
                style={{ minHeight: '400px' }}
              >
                <div className="w-14 h-14 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20
                  flex items-center justify-center mb-4">
                  <IconCoverLetter className="w-6 h-6 text-[#1F5C4A]" />
                </div>
                <p className="text-sm font-medium text-[#3C403E]">{t("Your cover letter will appear here")}</p>
                <p className="text-xs text-[#5A5F5C] mt-1">{t("Fill in the form and click Generate")}</p>
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
