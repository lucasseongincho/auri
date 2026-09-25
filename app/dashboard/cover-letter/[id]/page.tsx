'use client'

import { useLocale } from '@/lib/i18n/client'

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
const PAGE_PADDING_TOP = 45
const PAGE_PADDING_SIDE = 76
const PAGE_PADDING_BOTTOM = 38

// ── EditableParagraph ─────────────────────────────────────────────────────────
// Verbatim copy from app/dashboard/cover-letter/page.tsx.
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

// ── Shared letter header/footer layout ────────────────────────────────────────

interface LetterShellProps {
  company: string
  name: string
  email: string
  phone: string
  location: string
  children: React.ReactNode
  signerName?: string
  onSignerNameChange?: (val: string) => void
}

function LetterShell({ company, name, email, phone, location, children, signerName, onSignerNameChange }: LetterShellProps) {
  const { t, locale } = useLocale()
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
      padding: `${PAGE_PADDING_TOP}px ${PAGE_PADDING_SIDE}px ${PAGE_PADDING_BOTTOM}px`,
      minHeight: `${LETTER_H}px`,
      width: `${LETTER_W}px`,
      boxSizing: 'border-box',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '13pt', margin: '0 0 4px 0' }}>
          {name || t("Your Name")}
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
      <p style={{ marginBottom: '16px', fontWeight: 500 }}>{t("Dear Hiring Manager,")}</p>
      {children}
      <p style={{ marginBottom: '40px' }}>{t("Sincerely,")}</p>
      {onSignerNameChange ? (
        <input
          value={signerName ?? name}
          onChange={(e) => onSignerNameChange(e.target.value)}
          placeholder={t("Your Name")}
          style={{
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
            fontSize: '11pt',
            color: '#1a1a1a',
            border: '1.5px solid rgba(138,90,0,0.4)',
            background: 'rgba(138,90,0,0.04)',
            borderRadius: '4px',
            padding: '4px 8px',
            width: '280px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <p style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700 }}>
          {(signerName ?? name) || t("Your Name")}
        </p>
      )}
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
  onParagraphClick: (idx: number) => void
  onParagraphChange: (idx: number, val: string) => void
}

function LetterDocEditable({
  paragraphs,
  activeParagraphIdx,
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
          onClick={() => onParagraphClick(i)}
          onChange={(val) => onParagraphChange(i, val)}
        />
      ))}
    </LetterShell>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

function formatDate(locale: 'en' | 'ko', val: unknown) {
  return formatResumeDate(val, 'Saved', locale)
}

function toMs(val: unknown): number {
  return toDate(val)?.getTime() ?? 0
}

function WordBadge({ count }: { count: number }) {
  const color =
    count > 300 ? 'text-[#B42318] bg-[#B42318]/10 border-[#B42318]/20'
    : count >= 280 ? 'text-[#1F7A4D] bg-[#1F7A4D]/10 border-[#1F7A4D]/20'
    : 'text-[#8A5A00] bg-[#8A5A00]/10 border-[#8A5A00]/20'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {count}w
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CoverLetterDetailPage() {
  const { t, locale } = useLocale()
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedParagraphs, setEditedParagraphs] = useState<string[]>([])
  const [editedSignerName, setEditedSignerName] = useState('')
  const [activeParagraphIdx, setActiveParagraphIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [contentHeight, setContentHeight] = useState(LETTER_H)

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const letterDocRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setSidebarOpen(false) }, [id])

  useLayoutEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth - 32
      setScale(Math.min(1, w / LETTER_W))
    })
    observer.observe(el)
    const w = el.clientWidth - 32
    if (w > 0) setScale(Math.min(1, w / LETTER_W))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!letter || !previewContainerRef.current) return
    const w = previewContainerRef.current.clientWidth - 32
    if (w > 0) setScale(Math.min(1, w / LETTER_W))
  }, [letter])

  // Track actual letter content height to avoid clipping the signature
  useEffect(() => {
    const el = letterDocRef.current
    if (!el || !letter) return
    const update = () => setContentHeight(el.offsetHeight || LETTER_H)
    const observer = new ResizeObserver(update)
    observer.observe(el)
    update()
    return () => observer.disconnect()
  }, [letter])

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
          setEditedSignerName(single.signerName ?? '')
        }
        setAllLetters(all.sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt)))
      } catch {
        setError(t("Failed to load cover letter."))
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
        signerName: editedSignerName,
        wordCount,
        updatedAt: new Date().toISOString(),
      })
      setLetter((prev) => prev ? { ...prev, paragraphs: editedParagraphs, signerName: editedSignerName, wordCount } : prev)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      setIsEditMode(false)
      setActiveParagraphIdx(null)
    } catch {
      setError(t("Failed to save changes."))
    } finally {
      setSaving(false)
    }
  }, [user, letter, id, editedParagraphs, editedSignerName])

  async function handleDownloadPDF() {
    if (!letterDocRef.current || !letter) return
    setDownloading(true)
    const slug = `${letter.company.replace(/\s+/g, '-').toLowerCase()}-${letter.position.replace(/\s+/g, '-').toLowerCase()}`
    const filename = `cover-letter-${slug || 'download'}.pdf`
    try {
      const { getResumeHTML } = await import('@/lib/pdf')
      const html = getResumeHTML(letterDocRef.current)
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
      console.error('[pdf] Saved cover letter download failed:', err instanceof Error ? err.message : err)
      setError(t("PDF generation is temporarily unavailable — please try again in a moment."))
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
      setError(t("Failed to delete cover letter."))
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
        <div className="w-16 h-16 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20
          flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-[#1F5C4A]" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-lp-ink mb-2">{t("Sign in to view your cover letters")}</h2>
        <p className="text-sm text-[#5A5F5C] mb-5">{t("Your saved cover letters are stored securely in your account.")}</p>
        <Link href="/login" className="px-5 py-2.5 rounded-[4px] text-sm font-semibold
          bg-[#1F5C4A] text-white
              transition-all">
          {t("Sign in")}
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full flex gap-6 min-h-0 overflow-x-hidden">

      {/* ── Left sidebar ──────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[250px] flex-shrink-0 h-full">
        <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 flex flex-col h-full">
          <div className="rounded-[10px]  bg-[#FFFFFF] p-3 flex flex-col h-full">

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#3C403E] uppercase tracking-wide">
                {t("Saved Letters")}
              </span>
              <Link
                href="/dashboard/cover-letter"
                aria-label={t("New cover letter")}
                className="w-6 h-6 rounded-[4px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20
                  flex items-center justify-center hover:bg-[#1F5C4A]/20 transition-colors"
              >
                <Plus className="w-3 h-3 text-[#1F5C4A]" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 text-[#1F5C4A] animate-spin" />
                </div>
              )}
              {!loading && allLetters.map((l) => {
                const isActive = l.id === id
                return (
                  <button
                    key={l.id}
                    onClick={() => router.push(`/dashboard/cover-letter/${l.id}`)}
                    className={`w-full text-left px-2.5 py-2 rounded-[4px] transition-all duration-150
                      ${isActive
                        ? 'border border-[#1F5C4A]/40 bg-[#1F5C4A]/5'
                        : 'border border-transparent hover:bg-lp-ink/[0.03]'
                      }`}
                  >
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#1F5C4A]' : 'text-lp-ink'}`}>
                      {l.company}
                    </p>
                    <p className="text-[10px] text-[#5A5F5C] truncate mt-0.5">{l.position}</p>
                    <p className="text-[10px] text-[#5A5F5C] mt-0.5">{formatDate(locale, l.updatedAt)}</p>
                  </button>
                )
              })}
              {!loading && allLetters.length === 0 && (
                <p className="text-xs text-[#5A5F5C] text-center py-6">{t("No saved letters")}</p>
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
              className="flex items-center gap-2 mb-4 p-3 rounded-[10px]
                bg-[#B42318]/10 border border-[#B42318]/20 text-[#B42318] text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="h-8 rounded-[10px] bg-lp-ink/[0.04] animate-pulse w-48" />
            <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
              <div className="rounded-[10px]  bg-[#FFFFFF] p-6 space-y-3">
                {[80, 65, 90, 72, 85, 60, 78].map((w, i) => (
                  <div key={i} className="h-3 rounded-full bg-lp-ink/6 animate-pulse" style={{ width: `${w}%` }} />
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
            <div className="w-16 h-16 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20
              flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-[#1F5C4A]" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-lp-ink mb-2">{t("Cover letter not found")}</h2>
            <p className="text-sm text-[#5A5F5C] mb-5">{t("This letter may have been deleted.")}</p>
            <Link href="/dashboard/cover-letter/saved"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-sm font-semibold
                bg-[#1F5C4A] text-white
                    transition-all">
              <ArrowLeft className="w-4 h-4" />
              {t("Back to My Cover Letters")}
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
            <div className="flex flex-col gap-2 w-full min-w-0">

              {/* Row 1 — back arrow + title + delete */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Link
                    href="/dashboard/cover-letter/saved"
                    className="p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-lp-ink hover:bg-lp-ink/5
                      transition-all flex-shrink-0"
                    aria-label={t("Back to My Cover Letters")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                  <div className="w-7 h-7 rounded-[4px] bg-[#1F5C4A]/20
                    border border-[#1F5C4A]/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-[#1F5C4A]" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-heading text-base font-bold text-lp-ink truncate">
                      {letter.company}
                    </h1>
                    <p className="text-xs text-[#5A5F5C] truncate">{letter.position}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(true)}
                  aria-label={t("Delete this cover letter")}
                  className="p-2 rounded-[10px] text-[#5A5F5C] hover:text-[#B42318]
                    hover:bg-[#B42318]/10 transition-all duration-200 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Row 2 — word count + actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <WordBadge count={isEditMode
                  ? editedParagraphs.join(' ').split(/\s+/).filter(Boolean).length
                  : letter.wordCount}
                />

                {!isEditMode && (
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    aria-label={t("Download cover letter as PDF")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                      bg-[#1F5C4A] text-white
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    {downloading ? t("Generating…") : t("Download PDF")}
                  </button>
                )}

                {!isEditMode ? (
                  <button
                    onClick={() => {
                      setIsEditMode(true)
                      setEditedParagraphs(letter.paragraphs?.length ? letter.paragraphs : [letter.content])
                      setEditedSignerName(letter.signerName ?? personal.name)
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                      border border-[#1F5C4A]/40 text-[#1F5C4A] hover:bg-[#1F5C4A]/10 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    {t("Edit")}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdits}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                        bg-[#1F7A4D] text-white hover:bg-[#17603C] transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      {saving ? t("Saving…") : saveSuccess ? t("Saved!") : t("Save Changes")}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(false)
                        setActiveParagraphIdx(null)
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium
                        border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5 transition-all"
                    >
                      <X className="w-3 h-3" />
                      {t("Cancel")}
                    </button>
                  </>
                )}
              </div>

            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-[#5A5F5C]">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                {letter.position}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(locale, letter.updatedAt)}
              </div>
              {isEditMode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                  bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A]">
                  {t("Editing")}
                </span>
              )}
            </div>

            {/* Opening hook callout */}
            {letter.openingHook && (
              <div className="rounded-[4px] border border-[#1F5C4A]/20 bg-[#1F5C4A]/5 px-4 py-3">
                <p className="text-xs font-semibold text-[#1F5C4A] mb-1">{t("Opening hook")}</p>
                <p className="text-sm text-[#3C403E] italic">{t("“{v0}”", { v0: letter.openingHook })}</p>
              </div>
            )}

            {/* Edit mode hint */}
            {isEditMode && activeParagraphIdx === null && (
              <p className="text-xs text-[#5A5F5C] text-center py-1">
                {t("Click any paragraph to edit inline")}
              </p>
            )}

            {/* Letter document */}
            <div
              ref={previewContainerRef}
              className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 overflow-hidden"
              style={{
                height: `${contentHeight * scale + 32}px`,
              }}
              onClick={() => {
                if (isEditMode && activeParagraphIdx !== null) setActiveParagraphIdx(null)
              }}
            >
              <div
                className="rounded-[10px]  overflow-hidden"
                style={{
                  transformOrigin: 'top left',
                  transform: `scale(${scale})`,
                  width: `${LETTER_W}px`,
                  marginBottom: scale < 1 ? `${(scale - 1) * contentHeight}px` : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div ref={letterDocRef}>
                  {isEditMode ? (
                    <LetterDocEditable
                      company={letter.company}
                      {...personal}
                      signerName={editedSignerName}
                      onSignerNameChange={setEditedSignerName}
                      paragraphs={editedParagraphs}
                      activeParagraphIdx={activeParagraphIdx}
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
                      signerName={letter.signerName}
                      paragraphs={letter.paragraphs?.length ? letter.paragraphs : [letter.content]}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Mobile sidebar toggle FAB ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={t("Toggle saved letters list")}
          className="w-10 h-10 rounded-[10px] bg-[#1F5C4A] text-white flex items-center justify-center
              hover:bg-[#15443A] transition-all"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-30 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -280 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -280 }}
              transition={SPRING}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64
                bg-[#FFFFFF] border-r border-lp-rule overflow-y-auto p-3 pt-16"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-semibold text-lp-ink">{t("Saved Letters")}</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label={t("Close letters list")}
                  className="p-1 rounded-[4px] hover:bg-lp-ink/5 text-[#5A5F5C] hover:text-lp-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Link
                href="/dashboard/cover-letter"
                className="flex items-center gap-2 px-3 py-2 rounded-[4px] mb-3
                  bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A] text-xs font-semibold"
                onClick={() => setSidebarOpen(false)}
              >
                <Plus className="w-3.5 h-3.5" />{' '}{t("New Cover Letter")}
              </Link>
              <ul className="space-y-1">
                {allLetters.map((l) => {
                  const isActive = l.id === id
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => {
                          router.push(`/dashboard/cover-letter/${l.id}`)
                          setSidebarOpen(false)
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-[4px] transition-all
                          ${isActive
                            ? 'border border-[#1F5C4A]/40 bg-[#1F5C4A]/5'
                            : 'border border-transparent hover:bg-lp-ink/[0.03]'
                          }`}
                      >
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#1F5C4A]' : 'text-lp-ink'}`}>
                          {l.company}
                        </p>
                        <p className="text-[10px] text-[#5A5F5C] truncate mt-0.5">{l.position}</p>
                        <p className="text-[10px] text-[#5A5F5C] mt-0.5">{formatDate(locale, l.updatedAt)}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 "
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={SPRING}
              className="w-full max-w-sm rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
            >
              <div className="rounded-[10px]  bg-[#FFFFFF] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20
                    flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-[#B42318]" />
                  </div>
                  <button
                    onClick={() => setDeleteTarget(false)}
                    className="p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-lp-ink hover:bg-lp-ink/5 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-heading text-base font-semibold text-lp-ink mb-1">{t("Delete cover letter?")}</h3>
                <p className="text-sm text-[#5A5F5C] mb-6">
                  {t("This will be permanently deleted. This action cannot be undone.")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(false)}
                    className="flex-1 px-4 py-2.5 rounded-[4px] text-sm font-medium
                      border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5 transition-all"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-[4px] text-sm font-semibold
                      bg-[#B42318] text-white hover:bg-[#912018] transition-colors
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t("Delete")}
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
