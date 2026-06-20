'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Copy, CheckCircle, Loader2, Layout, AlertCircle, X } from 'lucide-react'
import ClassicPro from '@/components/resume/templates/ClassicPro'
import { stripAllAITags } from '@/lib/resumeHighlight'
import type { ResumeData, PersonalInfo } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const LOADING_MESSAGES = [
  'Analyzing job description…',
  'Matching keywords to your experience…',
  'Rewriting achievements…',
  'Optimizing for ATS…',
  'Adding measurable impacts…',
  'Polishing the final resume…',
]

const LETTER_W = 816  // 8.5in at 96 dpi
const LETTER_H = 1056 // 11in at 96 dpi

interface ResumePreviewProps {
  data: ResumeData | null
  personal: PersonalInfo
  isStreaming: boolean
  streamText?: string
  /** When provided, overrides the internal ResizeObserver scale. Use this to sync with an adjacent edit mode. */
  forcedScale?: number
}

// Normalise resume data from Firestore: arrays may be null/undefined if the AI
// returned null or if optional fields were stripped during JSON serialisation.
// All templates assume arrays are non-null, so guard here in one place.
function sanitizeResumeData(data: ResumeData): ResumeData {
  return {
    ...data,
    experience: (data.experience ?? []).map((exp) => ({
      ...exp,
      bullets: exp.bullets ?? [],
    })),
    education: data.education ?? [],
    skills: data.skills ?? [],
    certifications: data.certifications ?? [],
    projects: (data.projects ?? []).map((proj) => ({
      ...proj,
      bullets: proj.bullets ?? [],
    })),
    leadership: (data.leadership ?? []).map((item) => ({
      ...item,
      bullets: item.bullets ?? [],
    })),
    volunteer: data.volunteer ?? [],
    languages: data.languages ?? [],
  }
}

// Build ATS-safe plain text directly from resume data — avoids DOM button artifacts.
// Uses the exact field names from the ResumeData TypeScript interface.
function buildPlainTextFromData(data: ResumeData, personal: PersonalInfo): string {
  const lines: string[] = []

  // Header
  if (personal.name) lines.push(personal.name)
  const contact = [personal.email, personal.phone, personal.location].filter(Boolean).join(' | ')
  if (contact) lines.push(contact)
  // Show links as labeled plain text so ATS systems can parse URLs without confusion
  if (personal.linkedin_url) lines.push(`LinkedIn: ${personal.linkedin_url}`)
  if (personal.website) lines.push(`${personal.portfolioLabel || 'Portfolio'}: ${personal.website}`)
  if (personal.github) lines.push(`GitHub: ${personal.github}`)

  // Summary
  if (data.summary) {
    lines.push('', 'SUMMARY')
    lines.push(data.summary)
  }

  // Experience
  if (data.experience?.length) {
    lines.push('', 'EXPERIENCE')
    for (const exp of data.experience) {
      lines.push(`${exp.title} | ${exp.company} | ${exp.start} – ${exp.end}`)
      for (const bullet of (exp.bullets ?? [])) lines.push(`• ${bullet}`)
    }
  }

  // Education
  if (data.education?.length) {
    lines.push('', 'EDUCATION')
    for (const edu of data.education) {
      const gpaStr = edu.gpa ? ` | GPA ${edu.gpa}` : ''
      lines.push(`${edu.degree} in ${edu.field} | ${edu.institution} | ${edu.year}${gpaStr}`)
    }
  }

  // Skills
  if (data.skills?.length) {
    lines.push('', 'SKILLS')
    lines.push(data.skills.join(', '))
  }

  // Certifications
  if (data.certifications?.length) {
    lines.push('', 'CERTIFICATIONS')
    for (const cert of data.certifications) lines.push(cert)
  }

  // Projects
  if (data.projects?.length) {
    lines.push('', 'PROJECTS')
    for (const proj of data.projects) {
      lines.push(proj.name)
      if (proj.description) lines.push(proj.description)
      for (const b of (proj.bullets ?? [])) lines.push(`• ${b}`)
    }
  }

  // Leadership
  if (data.leadership?.length) {
    lines.push('', 'LEADERSHIP')
    for (const lead of data.leadership) {
      lines.push(`${lead.role} | ${lead.organization} | ${lead.start} – ${lead.end}`)
      for (const b of (lead.bullets ?? [])) lines.push(`• ${b}`)
    }
  }

  // Volunteer
  if (data.volunteer?.length) {
    lines.push('', 'VOLUNTEER')
    for (const v of data.volunteer) {
      lines.push(`${v.role} | ${v.organization} | ${v.date}`)
      if (v.description) lines.push(v.description)
    }
  }

  // Languages
  if (data.languages?.length) {
    lines.push('', 'LANGUAGES')
    for (const lang of data.languages) lines.push(`${lang.name}: ${lang.proficiency}`)
  }

  return lines.join('\n').trim()
}

// ── Mobile card view (replaces the scaled paper preview on small screens) ────

interface MobileResumeCardProps {
  data: ResumeData
  personal: PersonalInfo
}

function MobileResumeCard({ data, personal }: MobileResumeCardProps) {
  const safe = sanitizeResumeData(data)
  return (
    <div className="md:hidden w-full rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
      <div className="rounded-xl border border-white/[0.05] bg-white p-5 space-y-4 text-gray-900">

        {/* Header */}
        <div className="border-b border-gray-100 pb-3">
          <h1 className="text-lg font-bold text-gray-900">{personal.name}</h1>
          <p className="text-xs text-gray-500 mt-0.5 break-words">
            {[personal.email, personal.phone, personal.location].filter(Boolean).join(' · ')}
          </p>
          {(personal.linkedin_url || personal.website) && (
            <p className="text-xs text-gray-400 mt-0.5 break-all">
              {[personal.linkedin_url, personal.website].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Summary */}
        {safe.summary && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Summary</h2>
            <p className="text-xs text-gray-700 leading-relaxed">{safe.summary}</p>
          </div>
        )}

        {/* Experience */}
        {safe.experience.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Experience</h2>
            <div className="space-y-3">
              {safe.experience.map((job, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.company}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                      {job.start} – {job.end || 'Present'}
                    </p>
                  </div>
                  {job.bullets.length > 0 && (
                    <ul className="mt-1 space-y-0.5 ml-2">
                      {job.bullets.map((b, j) => (
                        <li key={j} className="text-[11px] text-gray-600 leading-relaxed flex gap-1.5">
                          <span className="text-gray-400 flex-shrink-0 mt-0.5">·</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {safe.education.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Education</h2>
            <div className="space-y-1.5">
              {safe.education.map((edu, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{edu.institution}</p>
                    <p className="text-xs text-gray-500">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {safe.skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {safe.skills.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-600 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {safe.certifications && safe.certifications.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Certifications</h2>
            <ul className="space-y-0.5">
              {safe.certifications.map((c, i) => (
                <li key={i} className="text-xs text-gray-700">· {c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResumePreview({
  data,
  personal,
  isStreaming,
  streamText = '',
  forcedScale,
}: ResumePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [msgIdx, setMsgIdx] = useState(0)
  const [containerWidth, setContainerWidth] = useState(LETTER_W)

  // Cycle loading messages every 2s while streaming
  useEffect(() => {
    if (!isStreaming) { setMsgIdx(0); return }
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 2000)
    return () => clearInterval(id)
  }, [isStreaming])

  // Track container width for scale transform
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth || LETTER_W)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setContainerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = forcedScale ?? Math.min(1, containerWidth / LETTER_W)

  // Sanitise data once so all 5 templates receive guaranteed non-null arrays.
  const safeData = data ? sanitizeResumeData(data) : null

  const executePDFDownload = useCallback(async () => {
    if (!previewRef.current || !safeData) return
    setDownloading(true)
    setPdfError(null)

    const el = previewRef.current
    const name = personal.name?.replace(/\s+/g, '-').toLowerCase() || 'resume'
    const filename = `${name}-resume.pdf`

    try {
      el.classList.add('printing')

      const { getResumeHTML } = await import('@/lib/pdf')
      const html = getResumeHTML(el)

      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Server responded ${res.status}`)
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
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[pdf] Download failed:', msg)
      setPdfError('PDF generation is temporarily unavailable — please try again in a moment.')
    } finally {
      el.classList.remove('printing')
      setDownloading(false)
    }
  }, [safeData, personal])

  const handleDownloadPDF = useCallback(async () => {
    if (!safeData) return
    await executePDFDownload()
  }, [safeData, executePDFDownload])

  const handleCopyATS = useCallback(async () => {
    if (!safeData) return
    // Build plain text from data (not DOM) to avoid capturing button text artifacts
    // from amber highlight components (✓ ✕ tooltips etc.)
    const rawText = buildPlainTextFromData(safeData, personal)
    const cleanText = stripAllAITags(rawText)
    await navigator.clipboard.writeText(cleanText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [safeData, personal])

  if (!data && !isStreaming) return null

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar — no-print ensures it never appears in PDF export */}
      <div className="no-print flex items-center justify-end gap-2 mb-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopyATS}
            disabled={!safeData || isStreaming}
            aria-label="Copy plain text for ATS portals"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5
              transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy for ATS'}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!safeData || isStreaming || downloading}
            aria-label="Download resume as PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
              bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
              shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
              hover:scale-[1.02] transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 overflow-hidden">
        <div
          ref={containerRef}
          className="rounded-xl border border-white/[0.05] bg-white overflow-y-auto overflow-x-hidden h-full relative"
          style={{ minHeight: '600px' }}
        >
          {/* Global CSS: hide amber highlight styling when .printing class is active (html2pdf capture) */}
          <style>{`
            .printing .ai-estimate-highlight-btn {
              background: none !important;
              border-bottom: none !important;
              color: inherit !important;
              padding: 0 !important;
            }
            .printing .ai-estimate-verified {
              color: inherit !important;
            }
            .printing [data-estimate],
            .printing .print-plain {
              display: inline !important;
            }
          `}</style>

          <AnimatePresence mode="wait">
            {isStreaming ? (
              <motion.div
                key="streaming"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 flex flex-col items-center justify-center min-h-[480px]"
              >
                {/* Spinner */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1]/15 to-[#8B5CF6]/15
                  border border-[#6366F1]/25 flex items-center justify-center mb-5">
                  <Loader2 className="w-7 h-7 text-[#6366F1] animate-spin" />
                </div>

                {/* Cycling message */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={msgIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-medium text-[#6366F1] mb-2 text-center"
                  >
                    {LOADING_MESSAGES[msgIdx]}
                  </motion.p>
                </AnimatePresence>

                <p className="text-xs text-gray-400 mb-6">
                  Step {msgIdx + 1} of {LOADING_MESSAGES.length}
                </p>

                {/* Progress bar */}
                <div className="w-48 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
                    animate={{ width: `${((msgIdx + 1) / LOADING_MESSAGES.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>

                {/* Skeleton preview */}
                <div className="w-full mt-8 space-y-3 opacity-40">
                  <div className="h-6 w-40 rounded bg-gray-100 animate-pulse mx-auto" />
                  <div className="h-2.5 w-56 rounded bg-gray-100 animate-pulse mx-auto" />
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-20 rounded bg-gray-100 animate-pulse" />
                    {[92, 78, 85, 70].map((w, i) => (
                      <div key={i} className="h-2 rounded bg-gray-50 animate-pulse" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-24 rounded bg-gray-100 animate-pulse" />
                    {[88, 72, 80].map((w, i) => (
                      <div key={i} className="h-2 rounded bg-gray-50 animate-pulse" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : safeData ? (
              <>
                {/* Mobile card view — readable text, no scale transform */}
                <MobileResumeCard data={safeData} personal={personal} />

                {/* Desktop paper preview — hidden on mobile */}
                <div className="hidden md:block">
                  {containerWidth > 0 ? (
                    /* Scale wrapper — sets the scroll area to the scaled dimensions */
                    <div style={{ width: `${LETTER_W * scale}px`, minHeight: `${LETTER_H * scale}px`, margin: '0 auto', overflow: 'hidden' }}>
                      {/* Transform wrapper — scales the 816px content visually without affecting html2canvas capture */}
                      <div style={{ width: LETTER_W, minHeight: LETTER_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                        <motion.div
                          key="resume"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={SPRING}
                          ref={previewRef}
                          id="resume-content"
                          className="w-full"
                        >
                          <ClassicPro data={safeData} personal={personal} renderText={stripAllAITags} />
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full py-20 px-8 text-center"
                style={{ minHeight: '400px' }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Layout className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">Your resume preview will appear here</p>
                <p className="text-xs text-gray-300 mt-1">Fill in the form and click Generate Resume</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* PDF error toast */}
      <AnimatePresence>
        {pdfError && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={SPRING}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50
              flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl
              bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] max-w-sm w-full"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-medium flex-1">{pdfError}</span>
            <button
              onClick={() => setPdfError(null)}
              aria-label="Dismiss"
              className="p-0.5 rounded opacity-60 hover:opacity-100 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
