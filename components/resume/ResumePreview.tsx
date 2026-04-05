'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Copy, CheckCircle, Loader2, Layout, AlertTriangle, X } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import ClassicPro from '@/components/resume/templates/ClassicPro'
import ModernEdge from '@/components/resume/templates/ModernEdge'
import MinimalSeoul from '@/components/resume/templates/MinimalSeoul'
import ExecutiveDark from '@/components/resume/templates/ExecutiveDark'
import CreativePulse from '@/components/resume/templates/CreativePulse'
import VerificationBanner from '@/components/resume/VerificationBanner'
import ResumeHighlightedText from '@/components/resume/ResumeHighlightedText'
import { countAllEstimates, stripAllAITags } from '@/lib/resumeHighlight'
import type { ResumeData, TemplateId, PersonalInfo } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'classic-pro', label: 'Classic Pro' },
  { id: 'modern-edge', label: 'Modern Edge' },
  { id: 'minimal-seoul', label: 'Minimal Seoul' },
  { id: 'executive-dark', label: 'Executive Dark' },
  { id: 'creative-pulse', label: 'Creative Pulse' },
]

interface ResumePreviewProps {
  data: ResumeData | null
  personal: PersonalInfo
  isStreaming: boolean
  streamText?: string
  onTemplateChange?: (id: TemplateId) => void
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

export default function ResumePreview({
  data,
  personal,
  isStreaming,
  streamText = '',
  onTemplateChange,
}: ResumePreviewProps) {
  const { selectedTemplate, setSelectedTemplate } = useCareerStore()
  const previewRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showPDFWarning, setShowPDFWarning] = useState(false)
  const [verifiedCount, setVerifiedCount] = useState(0)

  // Sanitise data once so all 5 templates receive guaranteed non-null arrays.
  const safeData = data ? sanitizeResumeData(data) : null

  // Count total AI estimates in the current resume data
  const totalEstimates = safeData ? countAllEstimates(safeData) : 0

  // Reset verified count whenever data changes (e.g. after Easy Tune saves cleaned text)
  useEffect(() => {
    setVerifiedCount(0)
  }, [data])

  // renderText: passed to templates to convert <ai-estimate> tags into
  // interactive amber highlights. When the user verifies an estimate,
  // we increment the verified counter for the banner.
  const renderText = useCallback(
    (text: string) => (
      <ResumeHighlightedText
        text={text}
        onVerify={() => setVerifiedCount((c) => c + 1)}
      />
    ),
    []
  )

  const handleTemplateChange = (id: TemplateId) => {
    setSelectedTemplate(id)
    onTemplateChange?.(id)
  }

  // Scroll to first unverified amber highlight
  const handleReviewClick = useCallback(() => {
    const firstHighlight = previewRef.current?.querySelector('[data-estimate="true"]')
    firstHighlight?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const executePDFDownload = useCallback(async () => {
    if (!previewRef.current || !safeData) return
    setDownloading(true)
    setShowPDFWarning(false)
    try {
      const { generatePDFFromElement } = await import('@/lib/pdf')
      const el = previewRef.current

      // Add .printing class so amber highlights render as plain text in html2canvas
      el.classList.add('printing')

      const name = personal.name?.replace(/\s+/g, '-').toLowerCase() || 'resume'
      await generatePDFFromElement(el, {
        filename: `${name}-resume.pdf`,
        imageQuality: 0.98,
      })

      el.classList.remove('printing')
    } finally {
      setDownloading(false)
    }
  }, [safeData, personal])

  const handleDownloadPDF = useCallback(async () => {
    if (!safeData) return
    const remaining = totalEstimates - verifiedCount
    if (remaining > 0) {
      setShowPDFWarning(true)
    } else {
      await executePDFDownload()
    }
  }, [safeData, totalEstimates, verifiedCount, executePDFDownload])

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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar — no-print ensures it never appears in PDF export */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        {/* Template switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#13131A] border border-white/[0.08] overflow-x-auto max-w-full">
          <Layout className="w-3.5 h-3.5 text-[#60607A] ml-2 flex-shrink-0" />
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTemplateChange(t.id)}
              aria-label={`Switch to ${t.label} template`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${selectedTemplate === t.id
                  ? 'bg-[#6366F1] text-white shadow-sm'
                  : 'text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/5'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
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

      {/* Verification Banner — shown after generation when estimates exist */}
      {safeData && !isStreaming && (
        <VerificationBanner
          estimateCount={totalEstimates}
          verifiedCount={verifiedCount}
          onReviewClick={handleReviewClick}
        />
      )}

      {/* Preview area */}
      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 overflow-hidden">
        <div
          className="rounded-xl border border-white/[0.05] bg-white overflow-auto h-full relative"
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
                className="p-6"
              >
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20">
                  <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin" />
                  <span className="text-sm text-[#6366F1] font-medium">AURI is generating your resume...</span>
                </div>
                <div className="space-y-3">
                  <div className="h-8 w-48 rounded bg-gray-100 animate-pulse mx-auto" />
                  <div className="h-3 w-64 rounded bg-gray-100 animate-pulse mx-auto" />
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-24 rounded bg-gray-100 animate-pulse" />
                    {[90, 80, 85, 75].map((w, i) => (
                      <div key={i} className="h-2.5 rounded bg-gray-50 animate-pulse" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-28 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-48 rounded bg-gray-100 animate-pulse" />
                    {[85, 70, 80].map((w, i) => (
                      <div key={i} className="h-2.5 rounded bg-gray-50 animate-pulse" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-20 rounded bg-gray-100 animate-pulse" />
                    {[90, 75, 88, 65, 80].map((w, i) => (
                      <div key={i} className="h-2.5 rounded bg-gray-50 animate-pulse" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  {streamText && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 font-mono text-xs text-gray-400 overflow-hidden max-h-32">
                      {streamText.slice(-300)}
                      <span className="animate-pulse">▌</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : safeData ? (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
                ref={previewRef}
                id="resume-content"
                className="w-full"
              >
                {selectedTemplate === 'classic-pro' && (
                  <ClassicPro data={safeData} personal={personal} renderText={renderText} />
                )}
                {selectedTemplate === 'modern-edge' && (
                  <ModernEdge data={safeData} personal={personal} renderText={renderText} />
                )}
                {selectedTemplate === 'minimal-seoul' && (
                  <MinimalSeoul data={safeData} personal={personal} renderText={renderText} />
                )}
                {selectedTemplate === 'executive-dark' && (
                  <ExecutiveDark data={safeData} personal={personal} renderText={renderText} />
                )}
                {selectedTemplate === 'creative-pulse' && (
                  <CreativePulse data={safeData} personal={personal} renderText={renderText} />
                )}
              </motion.div>
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

      {/* PDF Download Warning Modal */}
      <AnimatePresence>
        {showPDFWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowPDFWarning(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={SPRING}
              className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 w-full max-w-md"
            >
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <h3 className="text-white font-semibold text-base">Your resume has unverified numbers</h3>
                  </div>
                  <button
                    onClick={() => setShowPDFWarning(false)}
                    className="text-[#60607A] hover:text-white transition-colors"
                    aria-label="Close warning"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[#A0A0B8] text-sm mb-2">
                  AURI estimated <span className="text-amber-300 font-medium">{totalEstimates - verifiedCount} numbers</span> that
                  you haven&apos;t verified yet. Submitting a resume with unverified numbers could hurt you in interviews.
                </p>
                <p className="text-[#60607A] text-xs mb-6">
                  Amber highlights in the preview show exactly which numbers to check.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowPDFWarning(false); handleReviewClick() }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                      bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                      shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                      hover:scale-[1.02] transition-all duration-200"
                  >
                    Review &amp; Fix
                  </button>
                  <button
                    onClick={executePDFDownload}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                      border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5
                      transition-all duration-200"
                  >
                    Download Anyway
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
