'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  CheckCircle,
  ChevronDown,
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Save,
  FolderOpen,
  FileText,
  ArrowLeft,
} from 'lucide-react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { getSavedResumes, saveResume } from '@/lib/firestore'
import ResumePreview from '@/components/resume/ResumePreview'
import ResumeEditor from '@/components/resume/ResumeEditor'
import ATSScorePanel from '@/components/resume/ATSScorePanel'
import EstimateDisclaimerModal from '@/components/resume/EstimateDisclaimerModal'
import { stripAITags } from '@/lib/resumeHighlight'
import ClassicPro from '@/components/resume/templates/ClassicPro'
import ModernEdge from '@/components/resume/templates/ModernEdge'
import MinimalSeoul from '@/components/resume/templates/MinimalSeoul'
import ExecutiveDark from '@/components/resume/templates/ExecutiveDark'
import CreativePulse from '@/components/resume/templates/CreativePulse'
import type { ResumeData, PersonalInfo, SavedResume, ATSScore, TemplateId } from '@/types'
import JobTitleAutocomplete from '@/components/ui/JobTitleAutocomplete'
import CompanyAutocomplete from '@/components/ui/CompanyAutocomplete'

// ── Helpers ───────────────────────────────────────────────────────────────────

function resumeToPlainText(
  r: ResumeData,
  personal?: { name?: string; email?: string; phone?: string; location?: string }
): string {
  const lines: string[] = []
  if (personal?.name) lines.push(personal.name)
  const contact = [personal?.email, personal?.phone, personal?.location].filter(Boolean).join(' | ')
  if (contact) lines.push(contact)
  if (r.summary) lines.push('', 'SUMMARY', r.summary)
  if (r.experience?.length) {
    lines.push('', 'EXPERIENCE')
    for (const exp of r.experience) {
      lines.push(`${exp.title} at ${exp.company} (${exp.start} – ${exp.end})`)
      for (const b of exp.bullets ?? []) lines.push(`• ${b}`)
    }
  }
  if (r.education?.length) {
    lines.push('', 'EDUCATION')
    for (const edu of r.education)
      lines.push(`${edu.degree} in ${edu.field}, ${edu.institution} (${edu.year})`)
  }
  if (r.skills?.length) lines.push('', 'SKILLS', r.skills.join(', '))
  if (r.certifications?.length) lines.push('', 'CERTIFICATIONS', r.certifications.join(', '))
  if (r.projects?.length) {
    lines.push('', 'PROJECTS')
    for (const p of r.projects) {
      lines.push(p.name)
      for (const b of p.bullets ?? []) lines.push(`• ${b}`)
    }
  }
  return lines.join('\n').trim()
}

function parseResumeJSON(raw: string): ResumeData {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\n?/i, '').replace(/^```\n?/, '').replace(/```\s*$/, '').trim()
  }
  const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}')
  if (fb !== -1 && lb > fb) cleaned = cleaned.slice(fb, lb + 1)
  try {
    return JSON.parse(cleaned) as ResumeData
  } catch {
    return JSON.parse(cleaned.replace(/,(\s*[}\]])/g, '$1')) as ResumeData
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`
const EMPTY_PERSONAL: PersonalInfo = { name: '', email: '', phone: '', location: '', linkedin_url: '', website: '', github: '', portfolioLabel: '' }

type InputMethod = 'auri' | 'paste'
type PagePhase = 'input' | 'review' | 'tune'

// ── Component ─────────────────────────────────────────────────────────────────

export default function RewriterPage() {
  const { user } = useAuth()
  const { profile, selectedTemplate, setSelectedTemplate, updateProfile } = useCareerStore()

  // ── Phase ──────────────────────────────────────────────────────────────────
  const [pagePhase, setPagePhase] = useState<PagePhase>('input')

  // ── Input method ───────────────────────────────────────────────────────────
  const [inputMethod, setInputMethod] = useState<InputMethod>('auri')

  // ── AURI saved resumes ─────────────────────────────────────────────────────
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([])
  const [savedResumesLoading, setSavedResumesLoading] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [auriText, setAuriText] = useState('')

  // ── Paste text ─────────────────────────────────────────────────────────────
  const [pastedText, setPastedText] = useState('')
  const [copiedOriginal, setCopiedOriginal] = useState(false)

  // ── Extra sections panel ───────────────────────────────────────────────────
  const [extraToggles, setExtraToggles] = useState<Record<string, boolean>>({})
  const [extraPanelOpen, setExtraPanelOpen] = useState(false)

  const extraSections = {
    certifications: profile?.certifications?.length ? profile.certifications : null,
    languages: profile?.languages?.length ? profile.languages : null,
    leadership: profile?.leadership?.length ? profile.leadership : null,
    volunteer: profile?.volunteer?.length ? profile.volunteer : null,
  }
  const hasAnyExtra = Object.values(extraSections).some((v) => v !== null)

  useEffect(() => {
    setExtraToggles((prev) => {
      const next = { ...prev }
      if (profile?.certifications?.length && prev.certifications === undefined) next.certifications = true
      if (profile?.languages?.length && prev.languages === undefined) next.languages = true
      if (profile?.leadership?.length && prev.leadership === undefined) next.leadership = true
      if (profile?.volunteer?.length && prev.volunteer === undefined) next.volunteer = true
      return next
    })
  }, [profile])

  // ── Target job fields ──────────────────────────────────────────────────────
  const [targetPosition, setTargetPosition] = useState(profile?.target?.position ?? '')
  const [targetCompany, setTargetCompany] = useState(profile?.target?.company ?? '')
  const [companyType, setCompanyType] = useState(profile?.target?.company_type ?? '')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')

  // ── Rewrite result ─────────────────────────────────────────────────────────
  const [rewrittenData, setRewrittenData] = useState<ResumeData | null>(null)
  const [editedResume, setEditedResume] = useState<ResumeData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [generateError, setGenerateError] = useState('')

  // ── ATS Score (local — not polluting careerStore) ──────────────────────────
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null)
  const [isATSLoading, setIsATSLoading] = useState(false)
  const [isFixingATS, setIsFixingATS] = useState(false)

  // ── Save state ─────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showEstimateDisclaimer, setShowEstimateDisclaimer] = useState(false)

  const { isStreaming, streamedText, stream } = useAIStream()

  // Derived values
  const inputText = inputMethod === 'auri' ? auriText : pastedText
  const activeResume = editedResume ?? rewrittenData
  const personal = profile?.personal ?? EMPTY_PERSONAL

  // ── Load AURI saved resumes ────────────────────────────────────────────────
  useEffect(() => {
    if (inputMethod !== 'auri' || !user?.uid) return
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

  // ── ATS Score ──────────────────────────────────────────────────────────────
  const runATSScore = useCallback(async (plainText: string, jd: string) => {
    if (!plainText || !jd) return
    setIsATSLoading(true)
    try {
      let idToken: string | undefined
      if (auth.currentUser) {
        try { idToken = await getIdToken(auth.currentUser) } catch { /* guest */ }
      }
      const res = await fetch('/api/claude/ats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ resumePlainText: plainText, jobDescription: jd }),
      })
      const json = await res.json() as { success: boolean; data: ATSScore }
      if (json.success) setAtsScore(json.data)
    } catch {
      // Non-blocking — ATS failure shouldn't break the flow
    } finally {
      setIsATSLoading(false)
    }
  }, [])

  // ── Build extra sections payload ───────────────────────────────────────────
  const buildExtraPayload = () => ({
    certifications: extraToggles.certifications ? extraSections.certifications : null,
    languages: extraToggles.languages ? extraSections.languages : null,
    leadership: extraToggles.leadership ? extraSections.leadership : null,
    volunteer: extraToggles.volunteer ? extraSections.volunteer : null,
    extras: null,
  })

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const text = inputMethod === 'auri' ? auriText : pastedText
    if (!text.trim() || !targetPosition.trim()) return

    setRewrittenData(null)
    setEditedResume(null)
    setGenerateError('')
    setSaveSuccess(false)
    setSaveError('')
    setAtsScore(null)
    setIsEditing(false)

    const fullText = await stream('/api/claude/rewriter', {
      originalText: text,
      targetPosition,
      targetCompany,
      companyType,
      jobDescription,
      extraSections: buildExtraPayload(),
      uid: user?.uid,
      isPro: false,
    }, {
      onError: (err) => setGenerateError(err),
    })

    if (fullText) {
      try {
        const parsed = parseResumeJSON(fullText)
        setRewrittenData({ ...parsed, templateId: selectedTemplate })
        setPagePhase('review')
        if (!profile?.hasSeenEstimateDisclaimer) {
          setShowEstimateDisclaimer(true)
        }
      } catch {
        setGenerateError('Could not parse the rewritten resume. Please try again.')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMethod, auriText, pastedText, targetPosition, targetCompany, companyType, jobDescription, extraToggles, user?.uid, selectedTemplate, stream])

  // ── Accept All ─────────────────────────────────────────────────────────────
  const handleAcceptAll = useCallback(() => {
    if (!rewrittenData) return
    setEditedResume({ ...rewrittenData, templateId: selectedTemplate })
    setPagePhase('tune')
    setIsEditing(false)
  }, [rewrittenData, selectedTemplate])

  // ── Fix All ATS Issues ─────────────────────────────────────────────────────
  const handleFixAll = useCallback(async () => {
    const text = inputMethod === 'auri' ? auriText : pastedText
    if (!text || !editedResume) return
    setIsFixingATS(true)
    try {
      const fullText = await stream('/api/claude/rewriter', {
        originalText: text,
        targetPosition,
        targetCompany,
        companyType,
        jobDescription,
        extraSections: buildExtraPayload(),
        uid: user?.uid,
        isPro: false,
      })
      if (fullText) {
        const parsed = parseResumeJSON(fullText)
        const updated = { ...editedResume, ...parsed, templateId: selectedTemplate }
        setEditedResume(updated)
        if (jobDescription) {
          await runATSScore(resumeToPlainText(updated, personal), jobDescription)
        }
      }
    } catch {
      // Silent — user can retry
    } finally {
      setIsFixingATS(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMethod, auriText, pastedText, editedResume, targetPosition, targetCompany, companyType, jobDescription, extraToggles, user?.uid, selectedTemplate, stream, runATSScore, personal])

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const toSave = editedResume ?? rewrittenData
    if (!toSave || !user?.uid) return
    setIsSaving(true)
    setSaveError('')
    try {
      const tag = [targetPosition, targetCompany].filter(Boolean).join(' @ ') || 'Resume'
      await saveResume(user.uid, {
        name: `Rewritten — ${tag}`,
        targetPosition,
        targetCompany,
        templateId: selectedTemplate,
        resumeData: { ...toSave, templateId: selectedTemplate },
        personalInfo: personal,
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
  }, [editedResume, rewrittenData, user?.uid, targetPosition, targetCompany, selectedTemplate, personal])

  // ── Template renderer for ResumeEditor ────────────────────────────────────
  const renderTemplate = (data: ResumeData) => {
    switch (selectedTemplate) {
      case 'modern-edge':    return <ModernEdge data={data} personal={personal} isEditing renderText={stripAITags} />
      case 'minimal-seoul':  return <MinimalSeoul data={data} personal={personal} isEditing renderText={stripAITags} />
      case 'executive-dark': return <ExecutiveDark data={data} personal={personal} isEditing renderText={stripAITags} />
      case 'creative-pulse': return <CreativePulse data={data} personal={personal} isEditing renderText={stripAITags} />
      default:               return <ClassicPro data={data} personal={personal} isEditing renderText={stripAITags} />
    }
  }

  // ── Start Over ─────────────────────────────────────────────────────────────
  const handleStartOver = () => {
    setPagePhase('input')
    setRewrittenData(null)
    setEditedResume(null)
    setAtsScore(null)
    setIsEditing(false)
    setGenerateError('')
  }

  const isGenerateDisabled =
    !inputText.trim() || !targetPosition.trim() || isStreaming || savedResumesLoading

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 md:pb-0">

      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Resume Rewriter</h1>
          {pagePhase !== 'input' && (
            <button
              onClick={handleStartOver}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Start Over
            </button>
          )}
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">
          {pagePhase === 'input' && 'Choose your existing resume — AURI will rewrite it for your target role.'}
          {pagePhase === 'review' && 'Review the rewrite. Accept all changes to proceed to Easy Tune and ATS scoring.'}
          {pagePhase === 'tune' && 'Fine-tune your resume and check your ATS score before downloading.'}
        </p>

        {/* Step pills */}
        <div className="flex items-center gap-2 mt-3 ml-12">
          {(['input', 'review', 'tune'] as PagePhase[]).map((phase, i) => {
            const labels = ['1. Input', '2. Review', '3. Tune']
            const isDone =
              (phase === 'input' && pagePhase !== 'input') ||
              (phase === 'review' && pagePhase === 'tune')
            const isActive = pagePhase === phase
            return (
              <span
                key={phase}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  isActive
                    ? 'bg-[#6366F1] text-white'
                    : isDone
                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                    : 'bg-white/[0.06] text-[#60607A]'
                }`}
              >
                {labels[i]}
              </span>
            )
          })}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PHASE: INPUT                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {pagePhase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SPRING}
            className="grid grid-cols-1 xl:grid-cols-2 gap-6"
          >
            {/* Left: Input form */}
            <div className="space-y-4">

              {/* ── Input Method Tabs ── */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-4">
                  <p className="text-sm font-semibold text-white">How would you like to add your existing resume?</p>

                  {/* Tab toggle */}
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0A0A0F] border border-white/[0.08]">
                    <button
                      onClick={() => setInputMethod('auri')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                        inputMethod === 'auri' ? 'bg-[#6366F1] text-white' : 'text-[#60607A] hover:text-[#A0A0B8]'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> My AURI Resumes
                    </button>
                    <button
                      onClick={() => setInputMethod('paste')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                        inputMethod === 'paste' ? 'bg-[#6366F1] text-white' : 'text-[#60607A] hover:text-[#A0A0B8]'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Paste Text
                    </button>
                  </div>

                  {/* Tab content */}
                  <AnimatePresence mode="wait">
                    {inputMethod === 'auri' ? (
                      <motion.div
                        key="auri"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                      >
                        {savedResumesLoading ? (
                          <div className="flex items-center gap-2 py-4 text-[#60607A] text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading your saved resumes…
                          </div>
                        ) : !user?.uid ? (
                          <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0F]/50 p-4 text-center">
                            <p className="text-sm text-[#A0A0B8] mb-1">Sign in to access your saved AURI resumes</p>
                            <a href="/login" className="text-xs text-[#818CF8] hover:underline">Sign in →</a>
                          </div>
                        ) : savedResumes.length === 0 ? (
                          <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0F]/50 p-4 text-center">
                            <p className="text-sm text-[#A0A0B8] mb-1">No saved resumes yet</p>
                            <a href="/dashboard/resume" className="text-xs text-[#818CF8] hover:underline">
                              Build one first →
                            </a>
                          </div>
                        ) : (
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
                                    <p className="text-xs text-[#60607A] mt-0.5">
                                      {r.targetCompany
                                        ? `${r.targetPosition} @ ${r.targetCompany}`
                                        : r.targetPosition}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {selectedResumeId === r.id && (
                                      <CheckCircle className="w-4 h-4 text-[#6366F1]" />
                                    )}
                                    <span className="text-xs text-[#60607A]">
                                      {new Date(r.updatedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))}
                            {auriText && (
                              <div className="rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/5 p-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                                <p className="text-xs text-[#22C55E]">
                                  Resume loaded — {auriText.length.toLocaleString()} characters ready
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="paste"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <label className={LABEL_CLASS}>Paste your current resume</label>
                        <textarea
                          className={`${TEXTAREA_CLASS} font-mono text-xs`}
                          rows={12}
                          placeholder="Paste your existing resume text here..."
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          aria-label="Paste resume text"
                          style={{ fontSize: '16px' }}
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
                              {copiedOriginal
                                ? <CheckCircle className="w-3 h-3 text-[#22C55E]" />
                                : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── Extra Sections from careerStore ── */}
              {hasAnyExtra ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                  <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4">
                    <button
                      onClick={() => setExtraPanelOpen((o) => !o)}
                      className="w-full flex items-center justify-between gap-3"
                      aria-expanded={extraPanelOpen}
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#818CF8] flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white">Extra Sections</p>
                          <p className="text-xs text-[#60607A]">
                            Found in your profile — used to fill your resume
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#60607A] flex-shrink-0 transition-transform duration-200 ${
                          extraPanelOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {extraPanelOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-3 border-t border-white/[0.06] space-y-3">
                            {(Object.entries(extraSections) as [string, unknown[] | null][]).map(
                              ([key, data]) => {
                                if (!data) return null
                                const LABELS: Record<string, string> = {
                                  certifications: 'Certifications',
                                  languages: 'Languages',
                                  leadership: 'Leadership',
                                  volunteer: 'Volunteer',
                                }
                                return (
                                  <div key={key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                                      <span className="text-sm text-[#E8E8F0]">
                                        {LABELS[key]}{' '}
                                        <span className="text-[#60607A]">({data.length} found)</span>
                                      </span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        setExtraToggles((prev) => ({ ...prev, [key]: !prev[key] }))
                                      }
                                      aria-label={`Toggle ${LABELS[key]}`}
                                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                                        extraToggles[key] ? 'bg-[#6366F1]' : 'bg-white/10'
                                      }`}
                                    >
                                      <span
                                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                                          extraToggles[key] ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                )
                              }
                            )}
                            <p className="text-xs text-[#60607A] pt-1">
                              Toggle sections on/off to include or exclude from the rewritten resume
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F]/50 px-4 py-3">
                  <p className="text-xs text-[#60607A]">
                    💡 Add certifications, languages, or extra sections to your{' '}
                    <a href="/dashboard" className="text-[#818CF8] hover:underline">
                      profile
                    </a>{' '}
                    to help fill your resume
                  </p>
                </div>
              )}

              {/* ── Target Job ── */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white">Target Job</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLASS}>
                        Target Position <span className="text-[#EF4444]">*</span>
                      </label>
                      <JobTitleAutocomplete
                        value={targetPosition}
                        onChange={setTargetPosition}
                        placeholder="Senior Product Manager"
                        className={INPUT_CLASS}
                        aria-label="Target position"
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Company Name</label>
                      <CompanyAutocomplete
                        value={targetCompany}
                        onChange={setTargetCompany}
                        placeholder="Acme Corp"
                        className={INPUT_CLASS}
                        aria-label="Company name"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={LABEL_CLASS}>Company Type / Industry</label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        placeholder="B2B SaaS startup, Series B"
                        value={companyType}
                        onChange={(e) => setCompanyType(e.target.value)}
                        aria-label="Company type"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Job Description</label>
                    <textarea
                      className={TEXTAREA_CLASS}
                      rows={5}
                      placeholder="Paste the full job description here for best keyword matching…"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      aria-label="Job description"
                    />
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
            </div>

            {/* Right: Streaming preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.1 }}
            >
              <ResumePreview
                data={rewrittenData}
                personal={personal}
                isStreaming={isStreaming}
                streamText={streamedText}
              />
            </motion.div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* PHASE: REVIEW                                                         */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {pagePhase === 'review' && rewrittenData && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SPRING}
            className="space-y-4"
          >
            {/* Accept / Re-generate bar */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/[0.08] bg-[#13131A]">
              <div>
                <p className="text-sm font-semibold text-white">Ready to accept?</p>
                <p className="text-xs text-[#60607A]">
                  Accept the rewritten resume to proceed to Easy Tune and ATS scoring.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setPagePhase('input'); setRewrittenData(null) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium
                    border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Re-generate
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                    bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                    shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                    hover:scale-[1.02] transition-all duration-200"
                >
                  <Check className="w-3.5 h-3.5" /> Accept All
                </button>
              </div>
            </div>

            {/* Before / After grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Before */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/[0.06]">
                    <span className="text-xs font-semibold text-[#60607A] uppercase tracking-wide">
                      Before — Original
                    </span>
                  </div>
                  <pre
                    className="p-4 text-xs text-[#A0A0B8] font-mono leading-relaxed overflow-auto"
                    style={{ maxHeight: '640px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {inputText}
                  </pre>
                </div>
              </div>

              {/* After */}
              <div className="space-y-2">
                <div className="px-1">
                  <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wide">
                    After — AURI Rewrite
                  </span>
                </div>
                <ResumePreview
                  data={rewrittenData}
                  personal={personal}
                  isStreaming={false}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* PHASE: TUNE                                                           */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {pagePhase === 'tune' && activeResume && (
          <motion.div
            key="tune"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SPRING}
            className="space-y-4"
          >
            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-medium text-white">Step 3 — Fine-tune your resume</p>
              <div className="flex items-center gap-2 flex-wrap">
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
            </div>

            {/* Preview / Editor + ATS grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
              {/* Left: Resume preview or editor */}
              <div className="space-y-3">
                {isEditing ? (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                    <div className="rounded-xl border border-white/[0.05] bg-white overflow-auto" style={{ minHeight: '600px' }}>
                      <ResumeEditor
                        resumeData={activeResume}
                        personal={personal}
                        onDataChange={(updated) => setEditedResume(updated)}
                      >
                        {renderTemplate(activeResume)}
                      </ResumeEditor>
                    </div>
                  </div>
                ) : (
                  <ResumePreview
                    data={activeResume}
                    personal={personal}
                    isStreaming={isStreaming}
                    streamText={streamedText}
                    onTemplateChange={(id: TemplateId) => {
                      setSelectedTemplate(id)
                      if (editedResume) setEditedResume({ ...editedResume, templateId: id })
                    }}
                  />
                )}

                {/* Easy Tune toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsEditing((v) => !v)}
                    aria-label={isEditing ? 'Exit editing mode' : 'Enter Easy Tune editing mode'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium
                      border transition-all duration-200 ${
                        isEditing
                          ? 'border-[#22C55E]/30 text-[#22C55E] bg-[#22C55E]/5 hover:bg-[#22C55E]/10'
                          : 'border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {isEditing ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Done Editing</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Easy Tune — Edit Inline</>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: ATS Score */}
              <div>
                {!atsScore && !isATSLoading ? (
                  jobDescription ? (
                    <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                      <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 text-center space-y-3">
                        <p className="text-sm font-semibold text-white">Check ATS Score</p>
                        <p className="text-xs text-[#60607A]">
                          Analyze your rewritten resume against the job description for keyword match and formatting.
                        </p>
                        <button
                          onClick={() => {
                            const plain = resumeToPlainText(activeResume, personal)
                            runATSScore(plain, jobDescription)
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold
                            bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                            shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                            hover:scale-[1.02] transition-all duration-200"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Run ATS Score
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F]/50 px-4 py-3">
                      <p className="text-xs text-[#60607A]">
                        💡 Add a job description in Step 1 to enable ATS scoring
                      </p>
                    </div>
                  )
                ) : (
                  <ATSScorePanel
                    score={atsScore}
                    isLoading={isATSLoading}
                    onFixAll={handleFixAll}
                    isFixing={isFixingATS || isStreaming}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First-use AI estimate disclaimer */}
      <EstimateDisclaimerModal
        open={showEstimateDisclaimer}
        onClose={() => {
          setShowEstimateDisclaimer(false)
          if (profile && !profile.hasSeenEstimateDisclaimer) {
            updateProfile({ hasSeenEstimateDisclaimer: true })
          }
        }}
      />
    </div>
  )
}
