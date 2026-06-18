'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scan,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import ProGate from '@/components/shared/ProGate'
import type { ParsedResumeResult, ParseFailure } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

type PageState = 'upload' | 'loading' | 'results'

const FAILURE_LABELS: Record<ParseFailure['type'], string> = {
  column_merge:      'Column Layout Merge',
  missing_headers:   'Missing Section Headers',
  date_fragmented:   'Fragmented Date Ranges',
  bullets_stripped:  'Bullet Points Stripped',
  encoding_artifact: 'Encoding Artifacts',
  contact_garbled:   'Contact Info Not Parseable',
}

const SEVERITY_ORDER: Record<ParseFailure['severity'], number> = {
  high: 3,
  medium: 2,
  low: 1,
}

const SEVERITY_STYLES: Record<ParseFailure['severity'], { badge: string; label: string }> = {
  high:   { badge: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20', label: 'High Risk' },
  medium: { badge: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20', label: 'Medium Risk' },
  low:    { badge: 'bg-white/10 text-[#A0A0B8] border border-white/[0.12]',      label: 'Low Risk' },
}

const LINE_HIGHLIGHT: Record<ParseFailure['severity'], string> = {
  high:   'bg-[#EF4444]/10 border-l-2 border-[#EF4444]/60 pl-3',
  medium: 'bg-[#F59E0B]/10 border-l-2 border-[#F59E0B]/60 pl-3',
  low:    'bg-white/[0.04] border-l-2 border-white/20 pl-3',
}

function buildLineHighlights(failures: ParseFailure[]): Map<number, ParseFailure['severity']> {
  const map = new Map<number, ParseFailure['severity']>()
  for (const failure of failures) {
    for (const idx of failure.affectedLines) {
      const current = map.get(idx)
      if (!current || SEVERITY_ORDER[failure.severity] > SEVERITY_ORDER[current]) {
        map.set(idx, failure.severity)
      }
    }
  }
  return map
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  error,
}: {
  onFile: (file: File) => void
  error: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="max-w-lg mx-auto"
    >
      <div
        onClick={() => fileRef.current?.click()}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-white/[0.08]
          hover:border-[#6366F1]/40 transition-all duration-200 group"
      >
        <div className="rounded-xl bg-[#13131A] p-16 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20
            flex items-center justify-center group-hover:bg-[#6366F1]/15 transition-colors">
            <FileText className="w-7 h-7 text-[#6366F1]" />
          </div>
          <div>
            <p className="text-base font-semibold text-white mb-1">
              Upload your resume PDF
            </p>
            <p className="text-sm text-[#60607A] leading-relaxed">
              See exactly what ATS systems extract from your file — including garbled text,
              merged columns, and lost structure.
            </p>
          </div>
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]
              text-white text-sm font-semibold shadow-lg shadow-[#6366F1]/25
              hover:shadow-[#6366F1]/50 hover:scale-[1.02] transition-all duration-200"
          >
            Choose PDF
          </button>
          <p className="text-xs text-[#60607A]">PDF only · Max 5 MB</p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20"
          >
            <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            <p className="text-xs text-[#EF4444]">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Loading State ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING}
      className="flex flex-col items-center justify-center gap-4 py-24"
    >
      <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      <p className="text-sm font-medium text-[#A0A0B8]">Parsing your resume…</p>
      <p className="text-xs text-[#60607A]">Running extraction and failure detection</p>
    </motion.div>
  )
}

// ── Panel A — Extracted Text ──────────────────────────────────────────────────

function ExtractedTextPanel({ result }: { result: ParsedResumeResult }) {
  const highlights = buildLineHighlights(result.failures)

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
      <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-sm font-semibold text-white">What ATS Systems See</h2>
          <p className="text-xs text-[#60607A] mt-0.5">
            Raw text extracted from your PDF, exactly as an ATS parser would read it.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {(
            [
              { sev: 'high',   label: 'High Risk' },
              { sev: 'medium', label: 'Medium Risk' },
              { sev: 'low',    label: 'Low Risk' },
            ] as const
          ).map(({ sev, label }) => (
            <div key={sev} className="flex items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-sm border-l-2 ${
                  sev === 'high'
                    ? 'bg-[#EF4444]/20 border-[#EF4444]'
                    : sev === 'medium'
                    ? 'bg-[#F59E0B]/20 border-[#F59E0B]'
                    : 'bg-white/10 border-white/40'
                }`}
              />
              <span className="text-[11px] text-[#60607A]">{label}</span>
            </div>
          ))}
        </div>

        {/* Extracted text, line by line */}
        <div className="rounded-xl bg-[#0A0A0F] border border-white/[0.06] overflow-auto max-h-[55vh]">
          <pre className="font-mono text-xs text-[#A0A0B8] leading-relaxed p-4 whitespace-pre-wrap break-words">
            {result.lines.map((line, i) => {
              const sev = highlights.get(i)
              return (
                <span
                  key={i}
                  className={`block py-px ${sev ? LINE_HIGHLIGHT[sev] : ''}`}
                >
                  {line || ' '}
                </span>
              )
            })}
          </pre>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 pt-1">
          <p className="text-xs text-[#60607A]">
            <span className="text-[#A0A0B8] font-medium">{result.stats.totalLines}</span>{' '}
            lines extracted
          </p>
          <p className="text-xs text-[#60607A]">
            <span className="text-[#A0A0B8] font-medium">{result.stats.totalChars.toLocaleString()}</span>{' '}
            characters
          </p>
          {result.stats.detectedSections.length > 0 && (
            <p className="text-xs text-[#60607A]">
              Sections found:{' '}
              <span className="text-[#A0A0B8] font-medium">
                {result.stats.detectedSections.join(', ')}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Panel B — Issues Found ────────────────────────────────────────────────────

function IssuesPanel({ failures }: { failures: ParseFailure[] }) {
  const sorted = [...failures].sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]
  )

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
      <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Issues Found</h2>
          <p className="text-xs text-[#60607A] mt-0.5">
            Problems that may prevent ATS systems from reading your resume correctly.
          </p>
        </div>

        {failures.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20">
            <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#22C55E]">No major parsing issues detected</p>
              <p className="text-xs text-[#22C55E]/70 mt-0.5">
                Your PDF appears to extract cleanly — good sign for ATS compatibility.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((failure, i) => {
              const styles = SEVERITY_STYLES[failure.severity]
              const SeverityIcon =
                failure.severity === 'high'
                  ? XCircle
                  : failure.severity === 'medium'
                  ? AlertTriangle
                  : AlertCircle

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING, delay: i * 0.04 }}
                  className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles.badge}`}>
                      <SeverityIcon className="w-3 h-3" />
                      {styles.label}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {FAILURE_LABELS[failure.type]}
                    </span>
                  </div>

                  <p className="text-xs text-[#A0A0B8] leading-relaxed">
                    {failure.description}
                  </p>

                  {failure.affectedPlatforms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] text-[#60607A]">Affects:</span>
                      {failure.affectedPlatforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-0.5 rounded-full text-[11px] bg-white/[0.06] text-[#A0A0B8] border border-white/[0.08]"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div className="pt-1 border-t border-white/[0.05]">
          <Link
            href="/dashboard/ats"
            className="flex items-center gap-2 text-sm font-medium text-[#818CF8] hover:text-white transition-colors"
          >
            Fix these issues → Analyze with ATS Optimizer
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Results View ──────────────────────────────────────────────────────────────

function ResultsView({
  result,
  onReset,
}: {
  result: ParsedResumeResult
  onReset: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#60607A]">
          {result.failures.length === 0
            ? 'No parsing issues found'
            : `${result.failures.length} issue${result.failures.length === 1 ? '' : 's'} detected`}
        </p>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-[#60607A] hover:text-[#A0A0B8] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try another PDF
        </button>
      </div>
      <ExtractedTextPanel result={result} />
      <IssuesPanel failures={result.failures} />
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ATSScannerContent() {
  const [pageState, setPageState] = useState<PageState>('upload')
  const [result, setResult] = useState<ParsedResumeResult | null>(null)
  const [error, setError] = useState('')

  const getIdTokenSafe = useCallback(async (): Promise<string | undefined> => {
    const current = auth.currentUser
    if (!current) return undefined
    try { return await getIdToken(current) } catch { return undefined }
  }, [])

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        setError('File exceeds 5 MB limit — please use a smaller PDF.')
        return
      }

      setPageState('loading')
      setError('')

      try {
        const idToken = await getIdTokenSafe()
        const formData = new FormData()
        formData.append('resume', file)

        const res = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
          body: formData,
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: 'Parsing failed' }))
          throw new Error((json as { error?: string }).error ?? 'Parsing failed')
        }

        const json = (await res.json()) as { success: boolean; data: ParsedResumeResult; error?: string }
        if (!json.success) throw new Error(json.error ?? 'Parsing failed')

        setResult(json.data)
        setPageState('results')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Parsing failed')
        setPageState('upload')
      }
    },
    [getIdTokenSafe]
  )

  const handleReset = useCallback(() => {
    setPageState('upload')
    setResult(null)
    setError('')
  }, [])

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Resume Parser</h1>
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">
          Upload your PDF to see exactly what ATS systems extract — including garbled text,
          merged columns, and encoding errors.
        </p>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {pageState === 'upload' && (
          <motion.div key="upload" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <UploadZone onFile={handleFile} error={error} />
          </motion.div>
        )}
        {pageState === 'loading' && (
          <motion.div key="loading" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <LoadingState />
          </motion.div>
        )}
        {pageState === 'results' && result && (
          <motion.div key="results" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <ResultsView result={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ATSScannerPage() {
  return (
    <ProGate
      featureName="Resume Parser"
      featureDescription="Upload your PDF resume and see exactly what ATS systems extract — including column merge issues, encoding artifacts, and missing section headers."
      icon={<Scan className="w-6 h-6 text-[#6366F1]" />}
    >
      <ATSScannerContent />
    </ProGate>
  )
}
