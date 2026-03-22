'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Upload,
  FileText,
  CheckCircle,
  X,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { getSavedResumes } from '@/lib/firestore'
import type { ResumeData, TemplateId, SavedResume } from '@/types'

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

interface SectionAcceptance {
  summary: boolean
  experience: boolean
  education: boolean
  skills: boolean
  certifications: boolean
  projects: boolean
}

function RewriteSkeleton({ streamText }: { streamText: string }) {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20">
        <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin flex-shrink-0" />
        <span className="text-sm text-[#6366F1] font-medium">Claude is rewriting your resume…</span>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-gray-100 animate-pulse" />
        {[95, 80, 88].map((w, i) => (
          <div key={i} className="h-3 rounded bg-gray-50 animate-pulse" style={{ width: `${w}%` }} />
        ))}
        <div className="h-4 w-28 rounded bg-gray-100 animate-pulse mt-4" />
        {[85, 75, 90, 70].map((w, i) => (
          <div key={i} className="h-3 rounded bg-gray-50 animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
      {streamText && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 font-mono text-xs text-gray-400 overflow-hidden max-h-24">
          {streamText.slice(-200)}
          <span className="animate-pulse">▌</span>
        </div>
      )}
    </div>
  )
}

function RewriteResult({
  data,
  accepted,
  onToggle,
  onAcceptAll,
  onApply,
}: {
  data: ResumeData
  accepted: SectionAcceptance
  onToggle: (key: keyof SectionAcceptance) => void
  onAcceptAll: () => void
  onApply: () => void
}) {
  const allAccepted = Object.values(accepted).every(Boolean)

  const Section = ({
    label,
    sectionKey,
    children,
  }: {
    label: string
    sectionKey: keyof SectionAcceptance
    children: React.ReactNode
  }) => (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${
      accepted[sectionKey] ? 'border-[#22C55E]/30 bg-[#22C55E]/5' : 'border-white/[0.06] bg-[#0A0A0F]/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wider">{label}</span>
        <button
          onClick={() => onToggle(sectionKey)}
          aria-label={accepted[sectionKey] ? `Unaccept ${label}` : `Accept ${label}`}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            accepted[sectionKey]
              ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
              : 'bg-white/5 text-[#A0A0B8] border border-white/[0.08] hover:border-[#6366F1]/40 hover:text-[#6366F1]'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {accepted[sectionKey] ? 'Accepted' : 'Accept'}
        </button>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-3">
      {data.summary && (
        <Section label="Summary" sectionKey="summary">
          <p className="text-sm text-[#A0A0B8] leading-relaxed">{data.summary}</p>
        </Section>
      )}

      {data.experience.length > 0 && (
        <Section label="Experience" sectionKey="experience">
          <div className="space-y-3">
            {data.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{exp.title}</span>
                  <span className="text-xs text-[#60607A]">{exp.start} – {exp.end}</span>
                </div>
                <span className="text-xs text-[#A0A0B8] italic">{exp.company}</span>
                <ul className="mt-1.5 space-y-1">
                  {exp.bullets.map((b, bi) => (
                    <li key={bi} className="text-xs text-[#A0A0B8] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#6366F1]">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.education.length > 0 && (
        <Section label="Education" sectionKey="education">
          {data.education.map((edu, i) => (
            <div key={i} className="flex items-baseline justify-between">
              <div>
                <span className="text-sm font-semibold text-white">{edu.degree} in {edu.field}</span>
                <span className="text-xs text-[#A0A0B8] block">{edu.institution}</span>
              </div>
              <span className="text-xs text-[#60607A]">{edu.year}</span>
            </div>
          ))}
        </Section>
      )}

      {data.skills.length > 0 && (
        <Section label="Skills" sectionKey="skills">
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-[#6366F1]/10 text-xs text-[#818CF8] border border-[#6366F1]/20">{s}</span>
            ))}
          </div>
        </Section>
      )}

      {data.certifications.length > 0 && (
        <Section label="Certifications" sectionKey="certifications">
          <ul className="space-y-1">
            {data.certifications.map((c, i) => (
              <li key={i} className="text-sm text-[#A0A0B8]">{c}</li>
            ))}
          </ul>
        </Section>
      )}

      {data.projects.length > 0 && (
        <Section label="Projects" sectionKey="projects">
          <div className="space-y-2">
            {data.projects.map((p, i) => (
              <div key={i}>
                <span className="text-sm font-semibold text-white">{p.name}</span>
                <p className="text-xs text-[#A0A0B8] mt-0.5">{p.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="pt-2 flex gap-3">
        <button
          onClick={onAcceptAll}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            allAccepted
              ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 cursor-default'
              : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50 hover:scale-[1.02]'
          }`}
        >
          {allAccepted ? '✓ All sections accepted' : 'Accept All Sections'}
        </button>
        <button
          onClick={onApply}
          disabled={!Object.values(accepted).some(Boolean)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            bg-[#1C1C26] border border-white/[0.08] text-[#A0A0B8]
            hover:text-white hover:border-[#6366F1]/40 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Apply to Resume Builder
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function RewriterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile, updateProfile, setResume } = useCareerStore()

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
  const [accepted, setAccepted] = useState<SectionAcceptance>({
    summary: false, experience: false, education: false,
    skills: false, certifications: false, projects: false,
  })
  const [copiedOriginal, setCopiedOriginal] = useState(false)

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
        // Auto-select most recent if nothing selected yet
        if (list.length > 0 && !selectedResumeId) {
          const first = list[0]
          setSelectedResumeId(first.id)
          setAuriText(resumeToPlainText(first.resumeData, first.personalInfo))
        }
      })
      .finally(() => setSavedResumesLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMethod, user?.uid])

  // Also auto-populate from current profile if guest or no saved resumes
  useEffect(() => {
    if (inputMethod !== 'auri') return
    if (user?.uid) return // handled above via Firestore
    if (!profile) return
    // Guest: use current in-memory resume data
    const r = profile.generated?.resume_html ? null : null // no saved resume data for guests
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
      void r
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
    setAccepted({ summary: false, experience: false, education: false, skills: false, certifications: false, projects: false })

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
        setRewrittenData({ ...parsed, templateId: 'classic-pro' as TemplateId })
      } catch {
        setGenerateError('Could not parse the rewritten resume. Please try again.')
      }
    }
  }, [inputMethod, pastedText, uploadedText, auriText, targetPosition, targetCompany, companyType, jobDescription, user?.uid, stream])

  const toggleSection = (key: keyof SectionAcceptance) => {
    setAccepted((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const acceptAll = () => {
    setAccepted({ summary: true, experience: true, education: true, skills: true, certifications: true, projects: true })
  }

  const applyToResumeBuilder = () => {
    if (!rewrittenData) return

    // Update the career profile with accepted sections
    const profileUpdates: Parameters<typeof updateProfile>[0] = {}
    if (accepted.experience) profileUpdates.experience = rewrittenData.experience
    if (accepted.education) profileUpdates.education = rewrittenData.education
    if (accepted.skills) profileUpdates.skills = rewrittenData.skills
    if (accepted.certifications) profileUpdates.certifications = rewrittenData.certifications
    if (accepted.projects) profileUpdates.projects = rewrittenData.projects

    // Sync target job info from the rewriter fields into the profile
    profileUpdates.target = {
      ...(profile?.target ?? {}),
      position: targetPosition,
      company: targetCompany,
      company_type: companyType,
      job_description: jobDescription,
    }

    updateProfile(profileUpdates)

    // Set currentResume so the Resume Builder preview shows the rewritten resume immediately.
    // Use rewritten sections where accepted, fall back to existing profile data otherwise.
    const mergedResume = {
      ...rewrittenData,
      summary: accepted.summary ? (rewrittenData.summary ?? '') : '',
      experience: accepted.experience ? rewrittenData.experience : (profile?.experience ?? []),
      education: accepted.education ? rewrittenData.education : (profile?.education ?? []),
      skills: accepted.skills ? rewrittenData.skills : (profile?.skills ?? []),
      certifications: accepted.certifications ? rewrittenData.certifications : (profile?.certifications ?? []),
      projects: accepted.projects ? rewrittenData.projects : (profile?.projects ?? []),
    }
    setResume(mergedResume)

    router.push('/dashboard/resume')
  }

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
          Load a saved AURI resume or paste your own — Claude will rewrite it for your target role.
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
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      aria-label="Upload PDF resume"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                    />
                    {!uploadedText ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadLoading}
                        className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed border-white/[0.10] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 transition-all"
                        aria-label="Click to upload PDF"
                      >
                        {isUploadLoading ? <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" /> : <Upload className="w-8 h-8 text-[#60607A]" />}
                        <div className="text-center">
                          <p className="text-sm font-medium text-[#A0A0B8]">{isUploadLoading ? 'Extracting text…' : 'Click to upload PDF'}</p>
                          <p className="text-xs text-[#60607A] mt-0.5">External PDFs only (Word exports, Google Docs, etc.)</p>
                        </div>
                      </button>
                    ) : (
                      <div className="rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/5 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                            <span className="text-sm font-medium text-white">{uploadedFileName}</span>
                          </div>
                          <button onClick={() => { setUploadedText(''); setUploadedFileName('') }} aria-label="Remove file" className="p-1 rounded-lg text-[#60607A] hover:text-[#EF4444]">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#60607A]">{uploadedText.length.toLocaleString()} characters extracted</p>
                      </div>
                    )}
                    {uploadError && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#EF4444]">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {uploadError}
                      </div>
                    )}
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
                  <input type="text" className={INPUT_CLASS} placeholder="Senior Product Manager" value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} aria-label="Target position" />
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

        {/* ── Right: Output ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
        >
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 min-h-[400px]">
            <h3 className="text-sm font-semibold text-white mb-4">Rewritten Resume</h3>
            <AnimatePresence mode="wait">
              {isStreaming ? (
                <motion.div key="streaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <RewriteSkeleton streamText={streamedText} />
                </motion.div>
              ) : rewrittenData ? (
                <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
                  <RewriteResult data={rewrittenData} accepted={accepted} onToggle={toggleSection} onAcceptAll={acceptAll} onApply={applyToResumeBuilder} />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mb-4">
                    <RefreshCw className="w-6 h-6 text-[#6366F1]" />
                  </div>
                  <p className="text-sm font-medium text-[#A0A0B8]">Rewritten resume will appear here</p>
                  <p className="text-xs text-[#60607A] mt-1">Select a resume on the left and click Rewrite Resume</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
