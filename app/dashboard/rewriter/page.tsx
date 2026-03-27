'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Upload,
  FileText,
  CheckCircle,
  X,
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
import { getSavedResumes, saveResume } from '@/lib/firestore'
import ResumePreview from '@/components/resume/ResumePreview'
import type { ResumeData, TemplateId, SavedResume, PersonalInfo } from '@/types'
import JobTitleAutocomplete from '@/components/ui/JobTitleAutocomplete'

// Convert ResumeData → plain text for the rewriter API
function resumeToPlainText(r: ResumeData, personal?: { name?: string; email?: string; phone?: string; location?: string }): string {
  const lines: string[] = []
  if (personal?.name) lines.push(personal.name)
  const contact = [personal?.email, personal?.phone, personal?.location].filter(Boolean).join(' | ')
  if (contact) lines.push(contact)
  if (r.summary) { lines.push('', 'SUMMARY', r.summary) }
  if (r.experience.length > 0) {
    lines.push('', 'EXPERIENCE')
    for (const exp of r.experience) {
      lines.push(`${exp.title} at ${exp.company} (${exp.start} – ${exp.end})`)
      for (const b of exp.bullets) lines.push(`• ${b}`)
    }
  }
  if (r.education.length > 0) {
    lines.push('', 'EDUCATION')
    for (const edu of r.education) {
      lines.push(`${edu.degree} in ${edu.field}, ${edu.institution} (${edu.year})${edu.gpa ? ` — GPA ${edu.gpa}` : ''}`)
    }
  }
  if (r.skills.length > 0) lines.push('', 'SKILLS', r.skills.join(', '))
  if (r.certifications.length > 0) lines.push('', 'CERTIFICATIONS', r.certifications.join(', '))
  if (r.projects.length > 0) {
    lines.push('', 'PROJECTS')
    for (const p of r.projects) {
      lines.push(p.name)
      if (p.description) lines.push(p.description)
      for (const b of p.bullets) lines.push(`• ${b}`)
    }
  }
  return lines.join('\n').trim()
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

type InputMethod = 'paste' | 'upload' | 'auri'

const EMPTY_PERSONAL: PersonalInfo = { name: '', email: '', phone: '', location: '', linkedin_url: '', website: '' }

export default function RewriterPage() {
  const { user } = useAuth()
  const { profile, selectedTemplate } = useCareerStore()

  const [inputMethod, setInputMethod] = useState<InputMethod>('auri')
  const [pastedText, setPastedText] = useState('')
  const [uploadedText, setUploadedText] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [isUploadLoading, setIsUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // AURI saved resumes
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([])
  const [savedResumesLoading, setSavedResumesLoading] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [auriText, setAuriText] = useState('')

  const [targetPosition, setTargetPosition] = useState(profile?.target?.position ?? '')
  const [targetCompany, setTargetCompany] = useState(profile?.target?.company ?? '')
  const [companyType, setCompanyType] = useState(profile?.target?.company_type ?? '')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')

  const [rewrittenData, setRewrittenData] = useState<ResumeData | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [copiedOriginal, setCopiedOriginal] = useState(false)

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isStreaming, streamedText, stream } = useAIStream()

  // Load saved AURI resumes when tab is selected or user is known
  useEffect(() => {
    if (inputMethod !== 'auri') return
    if (!user?.uid) return
    setSavedResumesLoading(true)
    getSavedResumes(user.uid)
      .then((list) => {
        setSavedResumes(list)
        if (list.length > 0 && !selectedResumeId) {
          const first = list[0]
          setSelectedResumeId(first.id)
          setAuriText(resumeToPlainText(first.resumeData, first.personalInfo))
        }
      })
      .finally(() => setSavedResumesLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMethod, user?.uid])

  // Guest: auto-populate from current profile if no saved resumes
  useEffect(() => {
    if (inputMethod !== 'auri') return
    if (user?.uid) return
    if (!profile) return
    if (!auriText && profile.experience.length > 0) {
      const fakeResume: ResumeData = {
        summary: (profile.generated as { resume_plain?: string })?.resume_plain ?? '',
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
        certifications: profile.certifications,
        projects: profile.projects,
        templateId: 'classic-pro' as TemplateId,
      }
      setAuriText(resumeToPlainText(fakeResume, profile.personal))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMethod, user?.uid, profile])

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadError('')
    setIsUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Failed to parse PDF')
      setUploadedText(json.text)
      setUploadedFileName(file.name)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'PDF upload failed')
    } finally {
      setIsUploadLoading(false)
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    const text = inputMethod === 'paste' ? pastedText : inputMethod === 'auri' ? auriText : uploadedText
    if (!text.trim() || !targetPosition.trim()) return

    setRewrittenData(null)
    setGenerateError('')
    setSaveSuccess(false)
    setSaveError('')

    const fullText = await stream('/api/claude/rewriter', {
      originalText: text,
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
        const cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned) as ResumeData
        setRewrittenData({ ...parsed, templateId: selectedTemplate })
      } catch {
        setGenerateError('Could not parse the rewritten resume. Please try again.')
      }
    }
  }, [inputMethod, pastedText, uploadedText, auriText, targetPosition, targetCompany, companyType, jobDescription, user?.uid, selectedTemplate, stream])

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

  const originalText = inputMethod === 'paste' ? pastedText : inputMethod === 'auri' ? auriText : uploadedText
  const isGenerateDisabled = !originalText.trim() || !targetPosition.trim() || isStreaming || isUploadLoading || savedResumesLoading

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
          Load a saved AURI resume or paste your own — AURI will rewrite it for your target role.
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
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-4">
              {/* Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0A0A0F] border border-white/[0.08]">
                {([
                  { id: 'auri', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'From AURI' },
                  { id: 'paste', icon: <FileText className="w-3.5 h-3.5" />, label: 'Paste Text' },
                  { id: 'upload', icon: <Upload className="w-3.5 h-3.5" />, label: 'Upload PDF' },
                ] as const).map(({ id, icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setInputMethod(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                      inputMethod === id ? 'bg-[#6366F1] text-white' : 'text-[#60607A] hover:text-[#A0A0B8]'
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {inputMethod === 'auri' ? (
                  <motion.div key="auri" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {savedResumesLoading ? (
                      <div className="flex items-center gap-2 py-4 text-[#60607A] text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading your saved resumes…
                      </div>
                    ) : !user?.uid ? (
                      <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0F]/50 p-4 text-center">
                        <p className="text-sm text-[#A0A0B8] mb-1">Sign in to load your saved AURI resumes</p>
                        <p className="text-xs text-[#60607A]">Or use Paste Text to paste your resume manually</p>
                      </div>
                    ) : savedResumes.length === 0 ? (
                      <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0F]/50 p-4 text-center">
                        <p className="text-sm text-[#A0A0B8] mb-1">No saved resumes found</p>
                        <p className="text-xs text-[#60607A]">Build a resume first, then come back to rewrite it for a new role.</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className={LABEL_CLASS}>Select a saved resume</label>
                          <div className="space-y-2">
                            {savedResumes.map((r) => (
                              <button
                                key={r.id}
                                onClick={() => {
                                  setSelectedResumeId(r.id)
                                  setAuriText(resumeToPlainText(r.resumeData, r.personalInfo))
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                                  selectedResumeId === r.id
                                    ? 'border-[#6366F1]/50 bg-[#6366F1]/8'
                                    : 'border-white/[0.08] bg-[#0A0A0F]/50 hover:border-white/[0.14]'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-white">{r.name || r.targetPosition}</p>
                                    <p className="text-xs text-[#60607A] mt-0.5">{r.targetCompany ? `${r.targetPosition} @ ${r.targetCompany}` : r.targetPosition}</p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {selectedResumeId === r.id && <CheckCircle className="w-4 h-4 text-[#6366F1]" />}
                                    <span className="text-xs text-[#60607A]">{new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        {auriText && (
                          <div className="rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/5 p-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                            <p className="text-xs text-[#22C55E]">Resume loaded — {auriText.length.toLocaleString()} characters ready</p>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ) : inputMethod === 'paste' ? (
                  <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <label className={LABEL_CLASS}>Paste your current resume</label>
                    <textarea
                      className={`${TEXTAREA_CLASS} font-mono text-xs`}
                      rows={12}
                      placeholder="Paste your entire resume here — any format is fine..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      aria-label="Paste resume text"
                    />
                    <div className="mt-1 flex items-center justify-between">
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
                  </motion.div>
                ) : (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      aria-label="Upload resume file"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                    />
                    {!uploadedText ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#6366F1]', 'bg-[#6366F1]/5') }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#6366F1]', 'bg-[#6366F1]/5') }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove('border-[#6366F1]', 'bg-[#6366F1]/5')
                          const f = e.dataTransfer.files[0]
                          if (f) handleFileUpload(f)
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed border-white/[0.10] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 transition-all cursor-pointer"
                      >
                        {isUploadLoading ? (
                          <>
                            <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
                            <p className="text-sm font-medium text-[#A0A0B8]">Parsing your resume…</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-[#60607A]" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-[#A0A0B8]">Drag your resume here or click to browse</p>
                              <p className="text-xs text-[#60607A] mt-0.5">Supports PDF, Word (.doc, .docx), and text files</p>
                              <p className="text-xs text-[#6366F1] mt-1">✨ Works with AURI-generated resumes</p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/5 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                            <span className="text-sm font-medium text-white">{uploadedFileName}</span>
                          </div>
                          <button onClick={() => { setUploadedText(''); setUploadedFileName('') }} aria-label="Remove file" className="p-1 rounded-lg text-[#60607A] hover:text-[#EF4444]">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#60607A]">{uploadedText.length.toLocaleString()} characters extracted</p>
                        <p className="text-xs text-[#A0A0B8] bg-white/[0.04] rounded-lg p-2 line-clamp-2 font-mono">
                          {uploadedText.substring(0, 160)}…
                        </p>
                      </div>
                    )}
                    {uploadError && (
                      <div className="mt-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                        <div className="flex items-center gap-2 text-xs text-[#EF4444] mb-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {uploadError}
                        </div>
                        <p className="text-xs text-[#60607A]">Try the Paste Text tab instead.</p>
                      </div>
                    )}
                    <p className="text-xs text-[#60607A] flex items-start gap-1.5 pt-1">
                      <span>💡</span>
                      <span>For best results, upload a PDF with selectable text. Scanned or image-based PDFs cannot be parsed — use the Paste Text tab instead.</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <input type="text" className={INPUT_CLASS} placeholder="Acme Corp" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} aria-label="Company name" />
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
