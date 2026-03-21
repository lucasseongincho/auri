'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Copy, CheckCircle, Loader2, Layout } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import ClassicPro from '@/components/resume/templates/ClassicPro'
import ModernEdge from '@/components/resume/templates/ModernEdge'
import MinimalSeoul from '@/components/resume/templates/MinimalSeoul'
import type { ResumeData, TemplateId, PersonalInfo } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'classic-pro', label: 'Classic Pro' },
  { id: 'modern-edge', label: 'Modern Edge' },
  { id: 'minimal-seoul', label: 'Minimal Seoul' },
]

interface ResumePreviewProps {
  data: ResumeData | null
  personal: PersonalInfo
  isStreaming: boolean
  streamText?: string
  onTemplateChange?: (id: TemplateId) => void
}

// Extract plain text from the resume element for ATS copy
function extractPlainTextFromElement(el: HTMLElement): string {
  const fields = el.querySelectorAll('[data-ats-field]')
  const lines: string[] = []
  fields.forEach((f) => {
    const text = (f as HTMLElement).innerText?.trim()
    if (text && !['resume-root', 'sidebar', 'header', 'contact'].includes(f.getAttribute('data-ats-field') ?? '')) {
      lines.push(text)
    }
  })
  // Fallback: use innerText of the whole element
  return lines.length ? lines.join('\n\n') : el.innerText
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

  const handleTemplateChange = (id: TemplateId) => {
    setSelectedTemplate(id)
    onTemplateChange?.(id)
  }

  const handleDownloadPDF = useCallback(async () => {
    if (!previewRef.current || !data) return
    setDownloading(true)
    try {
      const { generatePDFFromElement } = await import('@/lib/pdf')
      const name = personal.name?.replace(/\s+/g, '-').toLowerCase() || 'resume'
      // We need to access target from the store - get from window or pass as prop
      // Use data to generate filename
      await generatePDFFromElement(previewRef.current, {
        filename: `${name}-resume.pdf`,
        imageQuality: 0.98,
      })
    } finally {
      setDownloading(false)
    }
  }, [data, personal])

  const handleCopyATS = useCallback(async () => {
    if (!previewRef.current || !data) return
    const text = extractPlainTextFromElement(previewRef.current)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [data])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        {/* Template switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#13131A] border border-white/[0.08]">
          <Layout className="w-3.5 h-3.5 text-[#60607A] ml-2" />
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyATS}
            disabled={!data || isStreaming}
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
            disabled={!data || isStreaming || downloading}
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
        <div className="rounded-xl border border-white/[0.05] bg-white overflow-auto h-full relative"
          style={{ minHeight: '600px' }}>

          <AnimatePresence mode="wait">
            {isStreaming ? (
              <motion.div
                key="streaming"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                {/* Streaming indicator */}
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20">
                  <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin" />
                  <span className="text-sm text-[#6366F1] font-medium">Claude is generating your resume...</span>
                </div>
                {/* Skeleton */}
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
                  {/* Live stream text */}
                  {streamText && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 font-mono text-xs text-gray-400 overflow-hidden max-h-32">
                      {streamText.slice(-300)}
                      <span className="animate-pulse">▌</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : data ? (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
                ref={previewRef}
                className="w-full"
              >
                {selectedTemplate === 'classic-pro' && (
                  <ClassicPro data={data} personal={personal} />
                )}
                {selectedTemplate === 'modern-edge' && (
                  <ModernEdge data={data} personal={personal} />
                )}
                {selectedTemplate === 'minimal-seoul' && (
                  <MinimalSeoul data={data} personal={personal} />
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
    </div>
  )
}
