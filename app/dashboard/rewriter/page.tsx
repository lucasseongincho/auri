'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Save,
  FolderOpen,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { saveResume } from '@/lib/firestore'
import ResumePreview from '@/components/resume/ResumePreview'
import type { ResumeData, PersonalInfo } from '@/types'
import JobTitleAutocomplete from '@/components/ui/JobTitleAutocomplete'
import CompanyAutocomplete from '@/components/ui/CompanyAutocomplete'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

const EMPTY_PERSONAL: PersonalInfo = { name: '', email: '', phone: '', location: '', linkedin_url: '', website: '' }

export default function RewriterPage() {
  const { user } = useAuth()
  const { profile, selectedTemplate } = useCareerStore()

  const [pastedText, setPastedText] = useState('')
  const [copiedOriginal, setCopiedOriginal] = useState(false)

  const [targetPosition, setTargetPosition] = useState(profile?.target?.position ?? '')
  const [targetCompany, setTargetCompany] = useState(profile?.target?.company ?? '')
  const [companyType, setCompanyType] = useState(profile?.target?.company_type ?? '')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')

  const [rewrittenData, setRewrittenData] = useState<ResumeData | null>(null)
  const [generateError, setGenerateError] = useState('')

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const { isStreaming, streamedText, stream } = useAIStream()

  const handleGenerate = useCallback(async () => {
    if (!pastedText.trim() || !targetPosition.trim()) return

    setRewrittenData(null)
    setGenerateError('')
    setSaveSuccess(false)
    setSaveError('')

    const fullText = await stream('/api/claude/rewriter', {
      originalText: pastedText,
      targetPosition,
      targetCompany,
      companyType,
      jobDescription,
      uid: user?.uid,
      isPro: false,
    }, {
      onError: (err) => setGenerateError(err),
    })

    if (fullText) {
      try {
        console.log('[rewriter] raw response length:', fullText.length)
        // Robust JSON extraction: strip fences, find outer braces, fix trailing commas
        let cleaned = fullText.trim()
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```json\n?/i, '').replace(/^```\n?/, '').replace(/```\s*$/, '').trim()
        }
        const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}')
        if (fb !== -1 && lb > fb) cleaned = cleaned.slice(fb, lb + 1)
        let parsed: ResumeData
        try {
          parsed = JSON.parse(cleaned) as ResumeData
        } catch {
          parsed = JSON.parse(cleaned.replace(/,(\s*[}\]])/g, '$1')) as ResumeData
        }
        setRewrittenData({ ...parsed, templateId: selectedTemplate })
      } catch {
        setGenerateError('Could not parse the rewritten resume. Please try again.')
      }
    }
  }, [pastedText, targetPosition, targetCompany, companyType, jobDescription, user?.uid, selectedTemplate, stream])

  const handleSave = useCallback(async () => {
    if (!rewrittenData || !user?.uid) return
    setIsSaving(true)
    setSaveError('')
    try {
      const name = [targetPosition, targetCompany].filter(Boolean).join(' @ ') || 'Rewritten Resume'
      await saveResume(user.uid, {
        name: `${name} (Rewritten)`,
        targetPosition,
        targetCompany,
        templateId: selectedTemplate,
        resumeData: { ...rewrittenData, templateId: selectedTemplate },
        personalInfo: profile?.personal ?? EMPTY_PERSONAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [rewrittenData, user?.uid, targetPosition, targetCompany, selectedTemplate, profile?.personal])

  const isGenerateDisabled = !pastedText.trim() || !targetPosition.trim() || isStreaming

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Resume Rewriter</h1>
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">
          Paste your existing resume — AURI will rewrite it for your target role.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Input ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-3">
              <label className={LABEL_CLASS}>Paste your current resume</label>
              <textarea
                className={`${TEXTAREA_CLASS} font-mono text-xs`}
                rows={14}
                placeholder="Paste your existing resume text here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                aria-label="Paste resume text"
                style={{ fontSize: '16px' }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#60607A]">{pastedText.length} characters</span>
                {pastedText && (
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(pastedText)
                      setCopiedOriginal(true)
                      setTimeout(() => setCopiedOriginal(false), 1500)
                    }}
                    className="flex items-center gap-1 text-xs text-[#60607A] hover:text-[#A0A0B8] transition-colors"
                  >
                    {copiedOriginal ? <CheckCircle className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Target fields */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Target Job</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Target Position <span className="text-[#EF4444]">*</span></label>
                  <JobTitleAutocomplete value={targetPosition} onChange={setTargetPosition} placeholder="Senior Product Manager" className={INPUT_CLASS} aria-label="Target position" />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Company Name</label>
                  <CompanyAutocomplete value={targetCompany} onChange={setTargetCompany} placeholder="Acme Corp" className={INPUT_CLASS} aria-label="Company name" />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>Company Type / Industry</label>
                  <input type="text" className={INPUT_CLASS} placeholder="B2B SaaS startup, Series B" value={companyType} onChange={(e) => setCompanyType(e.target.value)} aria-label="Company type" />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Job Description (paste only)</label>
                <textarea className={TEXTAREA_CLASS} rows={5} placeholder="Paste the full job description here for best keyword matching…" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} aria-label="Job description" />
              </div>

              {generateError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  <p className="text-xs text-[#EF4444]">{generateError}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm
                  shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50 hover:scale-[1.01]
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isStreaming ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Rewriting…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Rewrite Resume</>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Preview ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          {/* Save to My Resumes — shown only when result is ready */}
          <AnimatePresence>
            {rewrittenData && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={SPRING}
                className="flex items-center justify-between gap-3"
              >
                <p className="text-sm font-medium text-white">Your rewritten resume</p>
                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-xs text-[#22C55E]">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved to My Resumes
                    </span>
                  )}
                  {saveError && (
                    <span className="flex items-center gap-1.5 text-xs text-[#EF4444]">
                      <AlertCircle className="w-3.5 h-3.5" /> {saveError}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving || saveSuccess || !user?.uid}
                    aria-label="Save rewritten resume to My Resumes"
                    title={!user?.uid ? 'Sign in to save resumes' : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5
                      transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    ) : saveSuccess ? (
                      <><Check className="w-3.5 h-3.5 text-[#22C55E]" /> Saved!</>
                    ) : (
                      <><Save className="w-3.5 h-3.5" /> Save to My Resumes</>
                    )}
                  </button>
                  {saveSuccess && (
                    <a
                      href="/dashboard/resume/saved"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30
                        hover:bg-[#6366F1]/30 transition-all duration-200"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> View My Resumes
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resume preview — handles streaming state, template switcher, and PDF download internally */}
          <div className="flex-1">
            <ResumePreview
              data={rewrittenData}
              personal={profile?.personal ?? EMPTY_PERSONAL}
              isStreaming={isStreaming}
              streamText={streamedText}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
