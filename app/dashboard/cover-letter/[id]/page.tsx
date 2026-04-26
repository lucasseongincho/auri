'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Plus,
  Trash2,
  Calendar,
  Target,
  Loader2,
  AlertCircle,
  X,
  Pencil,
  ArrowLeft,
  Download,
  Check,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCareerStore } from '@/store/careerStore'
import {
  getSavedCoverLetter,
  getSavedCoverLetters,
  deleteCoverLetter,
  updateCoverLetter,
} from '@/lib/firestore'
import { toDate, formatResumeDate } from '@/lib/utils'
import type { SavedCoverLetter } from '@/types'

const LETTER_W = 816
const LETTER_H = 1056
const PAGE_PADDING = 96

// ── EditableParagraph ─────────────────────────────────────────────────────────
// Verbatim copy from app/dashboard/cover-letter/page.tsx.
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

  useEffect(() => {
    if (!isAssisting && ref.current) {
      ref.current.innerText = text
      try {
        const sel = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(ref.current)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssisting])

  const base: React.CSSProperties = {
    outline: 'none',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
    whiteSpace: 'pre-wrap',
  }

  return (
    <div style={{ position: 'relative', marginBottom: '14px' }} onClick={onClick}>
      {isActive ? (
        <div
          key="edit"
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange((e.target as HTMLDivElement).innerText)}
          onClick={(e) => e.stopPropagation()}
          style={{ ...base, padding: '6px 8px', cursor: 'text',
            border: '1.5px solid rgba(245,158,11,0.4)',
            background: 'rgba(245,158,11,0.04)' }}
        />
      ) : (
        <div
          key="view"
          style={{ ...base, padding: '0', cursor: 'pointer',
            border: '1.5px solid transparent',
            background: isAssisting ? 'rgba(245,158,11,0.06)' : 'transparent' }}
        >
          {isAssisting
            ? <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Rewriting…</span>
            : text}
        </div>
      )}
    </div>
  )
}

// ── Shared letter header/footer layout ────────────────────────────────────────

interface LetterShellProps {
  company: string
  name: string
  email: string
  phone: string
  location: string
  children: React.ReactNode
}

function LetterShell({ company, name, email, phone, location, children }: LetterShellProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return (
    <div style={{
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '11pt',
      lineHeight: '1.6',
      color: '#1a1a1a',
      background: 'white',
      padding: `${PAGE_PADDING}px`,
      minHeight: `${LETTER_H}px`,
      width: `${LETTER_W}px`,
      boxSizing: 'border-box',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '13pt', margin: '0 0 4px 0' }}>
          {name || 'Your Name'}
        </p>
        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '9.5pt', color: '#555', margin: 0 }}>
          {[location, email, phone].filter(Boolean).join('  ·  ')}
        </p>
      </div>
      <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#444', marginBottom: '20px' }}>
        {today}
      </p>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: 0 }}>{company}</p>
      </div>
      <p style={{ marginBottom: '16px', fontWeight: 500 }}>Dear Hiring Manager,</p>
      {children}
      <p style={{ marginBottom: '40px' }}>Sincerely,</p>
      <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
        {name || 'Your Name'}
      </p>
    </div>
  )
}

// ── LetterDocReadOnly ─────────────────────────────────────────────────────────

function LetterDocReadOnly(props: Omit<LetterShellProps, 'children'> & { paragraphs: string[] }) {
  const { paragraphs, ...shellProps } = props
  return (
    <LetterShell {...shellProps}>
      {paragraphs.map((text, i) => (
        <p key={i} style={{ marginBottom: '14px', whiteSpace: 'pre-wrap' }}>{text}</p>
      ))}
    </LetterShell>
  )
}

// ── LetterDocEditable ─────────────────────────────────────────────────────────

interface LetterDocEditableProps extends Omit<LetterShellProps, 'children'> {
  paragraphs: string[]
  activeParagraphIdx: number | null
  assistingIdx: number | null
  onParagraphClick: (idx: number) => void
  onParagraphChange: (idx: number, val: string) => void
}

function LetterDocEditable({
  paragraphs,
  activeParagraphIdx,
  assistingIdx,
  onParagraphClick,
  onParagraphChange,
  ...shellProps
}: LetterDocEditableProps) {
  return (
    <LetterShell {...shellProps}>
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
    </LetterShell>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

function formatDate(val: unknown) {
  return formatResumeDate(val, 'Saved')
}

function toMs(val: unknown): number {
  return toDate(val)?.getTime() ?? 0
}

function WordBadge({ count }: { count: number }) {
  const color =
    count > 300 ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20'
    : count >= 280 ? 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20'
    : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {count}w
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CoverLetterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile } = useCareerStore()

  const [letter, setLetter] = useState<SavedCoverLetter | null>(null)
  const [allLetters, setAllLetters] = useState<SavedCoverLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [downloading, setDownloading] = useState(false)

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedParagraphs, setEditedParagraphs] = useState<string[]>([])
  const [activeParagraphIdx, setActiveParagraphIdx] = useState<number | null>(null)
  const [assistingIdx, setAssistingIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const letterDocRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth - 32
      setScale(Math.min(1, w / LETTER_W))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user?.uid) {
      setLoading(false)
      return
    }
    async function load() {
      try {
        const [single, all] = await Promise.all([
          getSavedCoverLetter(user!.uid, id),
          getSavedCoverLetters(user!.uid),
        ])
        if (!single) {
          setNotFound(true)
        } else {
          setLetter(single)
          setEditedParagraphs(single.paragraphs?.length ? single.paragraphs : [single.content])
        }
        setAllLetters(all.sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt)))
      } catch {
        setError('Failed to load cover letter.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user, id])

  const handleSaveEdits = useCallback(async () => {
    if (!user || !letter) return
    setSaving(true)
    try {
      const wordCount = editedParagraphs.join(' ').split(/\s+/).filter(Boolean).length
      await updateCoverLetter(user.uid, id, {
        paragraphs: editedParagraphs,
        wordCount,
        updatedAt: new Date().toISOString(),
      })
      setLetter((prev) => prev ? { ...prev, paragraphs: editedParagraphs, wordCount } : prev)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      setIsEditMode(false)
      setActiveParagraphIdx(null)
    } catch {
      setError('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }, [user, letter, id, editedParagraphs])

  const handleAIAssist = useCallback(async (idx: number) => {
    if (!letter || assistingIdx !== null) return
    setAssistingIdx(idx)
    try {
      const res = await fetch('/api/claude/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'assist',
          position: letter.position,
          company: letter.company,
          selectedParagraph: editedParagraphs[idx],
          allParagraphs: editedParagraphs,
          uid: user?.uid,
        }),
      })
      if (!res.ok) throw new Error('Assist failed')
      const rewritten = (await res.text()).trim()
      if (rewritten) {
        setEditedParagraphs((prev) => prev.map((p, i) => (i === idx ? rewritten : p)))
      }
    } catch {
      // silent — user can try again
    } finally {
      setAssistingIdx(null)
    }
  }, [letter, assistingIdx, editedParagraphs, user])

  async function handleDownloadPDF() {
    if (!letterDocRef.current || !letter) return
    setDownloading(true)
    try {
      const { generatePDFFromElement } = await import('@/lib/pdf')
      const slug = `${letter.company.replace(/\s+/g, '-').toLowerCase()}-${letter.position.replace(/\s+/g, '-').toLowerCase()}`
      await generatePDFFromElement(letterDocRef.current, {
        filename: `cover-letter-${slug || 'download'}.pdf`,
      })
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    if (!user?.uid) return
    setDeleting(true)
    try {
      await deleteCoverLetter(user.uid, id)
      router.push('/dashboard/cover-letter/saved')
    } catch {
      setError('Failed to delete cover letter.')
      setDeleting(false)
      setDeleteTarget(false)
    }
  }

  const personal = {
    name: profile?.personal?.name ?? '',
    email: profile?.personal?.email ?? '',
    phone: profile?.personal?.phone ?? '',
    location: profile?.personal?.location ?? '',
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20
          flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-[#F59E0B]" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-white mb-2">Sign in to view your cover letters</h2>
        <p className="text-sm text-[#60607A] mb-5">Your saved cover letters are stored securely in your account.</p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white
          shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/50 hover:scale-[1.02] transition-all">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-6 min-h-0">

      {/* ── Left sidebar ──────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[250px] flex-shrink-0 h-full">
        <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 flex flex-col h-full">
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-3 flex flex-col h-full">

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wide">
                Saved Letters
              </span>
              <Link
                href="/dashboard/cover-letter"
                aria-label="New cover letter"
                className="w-6 h-6 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20
                  flex items-center justify-center hover:bg-[#F59E0B]/20 transition-colors"
              >
                <Plus className="w-3 h-3 text-[#F59E0B]" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 text-[#F59E0B] animate-spin" />
                </div>
              )}
              {!loading && allLetters.map((l) => {
                const isActive = l.id === id
                return (
                  <button
                    key={l.id}
                    onClick={() => router.push(`/dashboard/cover-letter/${l.id}`)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-all duration-150
                      ${isActive
                        ? 'border border-[#F59E0B]/40 bg-[#F59E0B]/5'
                        : 'border border-transparent hover:bg-white/[0.03]'
                      }`}
                  >
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#F59E0B]' : 'text-white'}`}>
                      {l.company}
                    </p>
                    <p className="text-[10px] text-[#60607A] truncate mt-0.5">{l.position}</p>
                    <p className="text-[10px] text-[#60607A] mt-0.5">{formatDate(l.updatedAt)}</p>
                  </button>
                )
              })}
              {!loading && allLetters.length === 0 && (
                <p className="text-xs text-[#60607A] text-center py-6">No saved letters</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto">

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-4 p-3 rounded-xl
                bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="h-8 rounded-xl bg-white/[0.04] animate-pulse w-48" />
            <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 space-y-3">
                {[80, 65, 90, 72, 85, 60, 78].map((w, i) => (
                  <div key={i} className="h-3 rounded-full bg-white/[0.06] animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20
              flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-white mb-2">Cover letter not found</h2>
            <p className="text-sm text-[#60607A] mb-5">This letter may have been deleted.</p>
            <Link href="/dashboard/cover-letter/saved"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white
                shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/50 hover:scale-[1.02] transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to My Cover Letters
            </Link>
          </motion.div>
        )}

        {/* Letter content */}
        {!loading && letter && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="space-y-4 pb-6"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href="/dashboard/cover-letter/saved"
                  className="p-1.5 rounded-lg text-[#60607A] hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
                  aria-label="Back to My Cover Letters"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/20
                  border border-[#F59E0B]/30 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-heading text-lg font-bold text-white truncate">{letter.company}</h1>
                  <p className="text-xs text-[#60607A] truncate">{letter.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <WordBadge count={isEditMode
                  ? editedParagraphs.join(' ').split(/\s+/).filter(Boolean).length
                  : letter.wordCount}
                />

                {/* Download PDF — always available */}
                {!isEditMode && (
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    aria-label="Download cover letter as PDF"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                      bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white
                      shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/50 hover:scale-[1.02]
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    {downloading ? 'Generating…' : 'Download PDF'}
                  </button>
                )}

                {/* Edit / Save / Cancel */}
                {!isEditMode ? (
                  <button
                    onClick={() => {
                      setIsEditMode(true)
                      setEditedParagraphs(letter.paragraphs?.length ? letter.paragraphs : [letter.content])
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                      border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdits}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                        bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      {saving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(false)
                        setActiveParagraphIdx(null)
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                        border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </>
                )}

                <button
                  onClick={() => setDeleteTarget(true)}
                  aria-label="Delete this cover letter"
                  className="p-2 rounded-xl text-[#60607A] hover:text-[#EF4444]
                    hover:bg-[#EF4444]/10 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-[#60607A]">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                {letter.position}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(letter.updatedAt)}
              </div>
              {isEditMode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                  bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B]">
                  Editing
                </span>
              )}
            </div>

            {/* Opening hook callout */}
            {letter.openingHook && (
              <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-4 py-3">
                <p className="text-xs font-semibold text-[#F59E0B] mb-1">Opening hook</p>
                <p className="text-sm text-[#A0A0B8] italic">&ldquo;{letter.openingHook}&rdquo;</p>
              </div>
            )}

            {/* AI Assist bar — edit mode only */}
            {isEditMode && activeParagraphIdx !== null && (
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl
                border border-[#F59E0B]/20 bg-[#F59E0B]/5">
                <p className="text-xs text-[#A0A0B8]">
                  Paragraph {activeParagraphIdx + 1} selected — edit inline or rewrite with AI
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAIAssist(activeParagraphIdx)}
                    disabled={assistingIdx !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                      bg-[#F59E0B] text-white hover:bg-[#D97706] transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assistingIdx === activeParagraphIdx
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Sparkles className="w-3 h-3" />}
                    {assistingIdx === activeParagraphIdx ? 'Rewriting…' : 'AI Rewrite'}
                  </button>
                  <button
                    onClick={() => setActiveParagraphIdx(null)}
                    className="p-1 rounded-lg text-[#60607A] hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Edit mode hint */}
            {isEditMode && activeParagraphIdx === null && (
              <p className="text-xs text-[#60607A] text-center py-1">
                Click any paragraph to edit · AI Rewrite available per paragraph
              </p>
            )}

            {/* Letter document */}
            <div
              ref={previewContainerRef}
              className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 overflow-hidden"
              onClick={() => {
                if (isEditMode && activeParagraphIdx !== null) setActiveParagraphIdx(null)
              }}
            >
              <div
                className="rounded-xl border border-white/[0.05] overflow-hidden"
                style={{
                  transformOrigin: 'top left',
                  transform: `scale(${scale})`,
                  width: `${LETTER_W}px`,
                  marginBottom: scale < 1 ? `${(scale - 1) * LETTER_H}px` : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div ref={letterDocRef}>
                  {isEditMode ? (
                    <LetterDocEditable
                      company={letter.company}
                      {...personal}
                      paragraphs={editedParagraphs}
                      activeParagraphIdx={activeParagraphIdx}
                      assistingIdx={assistingIdx}
                      onParagraphClick={(idx) =>
                        setActiveParagraphIdx((prev) => prev === idx ? prev : idx)
                      }
                      onParagraphChange={(idx, val) =>
                        setEditedParagraphs((prev) => prev.map((p, i) => (i === idx ? val : p)))
                      }
                    />
                  ) : (
                    <LetterDocReadOnly
                      company={letter.company}
                      {...personal}
                      paragraphs={letter.paragraphs?.length ? letter.paragraphs : [letter.content]}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={SPRING}
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
            >
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20
                    flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-[#EF4444]" />
                  </div>
                  <button
                    onClick={() => setDeleteTarget(false)}
                    className="p-1.5 rounded-lg text-[#60607A] hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-heading text-base font-semibold text-white mb-1">Delete cover letter?</h3>
                <p className="text-sm text-[#60607A] mb-6">
                  This will be permanently deleted. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                      border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                      bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
