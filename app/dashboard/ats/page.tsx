'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Target, Sparkles, Loader2, AlertCircle, FileText,
  ClipboardList, CheckCircle, Zap, Upload,
} from 'lucide-react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { getSavedResume, getSavedResumes, updateSavedResume } from '@/lib/firestore'
import { formatResumeDate } from '@/lib/utils'
import ATSScorePanel from '@/components/resume/ATSScorePanel'
import RequirementCoveragePanel from '@/components/resume/RequirementCoveragePanel'
import SectionAnalysisPanel from '@/components/resume/SectionAnalysisPanel'
import SuggestionsPanel from '@/components/resume/SuggestionsPanel'
import type {
  ATSScore, RequirementCoverage, ATSOutcome, StructuredSuggestion,
  ResumeData, SavedResume, ParsedResumeResult,
} from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const OUTCOME_OPTIONS: Array<{ value: ATSOutcome['outcome']; label: string }> = [
  { value: 'interview', label: 'Got an interview' },
  { value: 'rejected', label: 'Got rejected' },
  { value: 'no_response', label: 'No response yet' },
  { value: 'pending', label: 'Still pending' },
]

const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all resize-none'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'

function convertResumeToPlainText(data: ResumeData): string {
  const lines: string[] = []
  if (data.summary) lines.push(data.summary, '')
  if (data.experience.length > 0) {
    lines.push('EXPERIENCE')
    for (const exp of data.experience) {
      lines.push(`${exp.title} at ${exp.company} | ${exp.start} – ${exp.end}`)
      for (const bullet of exp.bullets) lines.push(`• ${bullet}`)
      lines.push('')
    }
  }
  if (data.education.length > 0) {
    lines.push('EDUCATION')
    for (const edu of data.education) {
      lines.push(`${edu.degree} in ${edu.field} — ${edu.institution} (${edu.year})`)
    }
    lines.push('')
  }
  if (data.skills.length > 0) {
    lines.push('SKILLS')
    lines.push(data.skills.join(', '), '')
  }
  if (data.projects.length > 0) {
    lines.push('PROJECTS')
    for (const proj of data.projects) {
      lines.push(proj.name)
      for (const bullet of proj.bullets) lines.push(`• ${bullet}`)
      lines.push('')
    }
  }
  if (data.leadership && data.leadership.length > 0) {
    lines.push('LEADERSHIP')
    for (const lead of data.leadership) {
      lines.push(`${lead.role} at ${lead.organization}`)
      for (const bullet of lead.bullets) lines.push(`• ${bullet}`)
      lines.push('')
    }
  }
  return lines.join('\n').trim()
}

export default function ATSPage() {
  const { user } = useAuth()
  const { profile, setATSScore, atsScore, currentResume, setResume } = useCareerStore()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')
  const [score, setScore] = useState<ATSScore | null>(atsScore)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [coverage, setCoverage] = useState<RequirementCoverage[] | null>(null)
  const [isCoverageLoading, setIsCoverageLoading] = useState(false)
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null)
  const [outcomeId, setOutcomeId] = useState<string | null>(null)
  const [selectedOutcome, setSelectedOutcome] = useState<ATSOutcome['outcome'] | null>(null)
  const [isSavingOutcome, setIsSavingOutcome] = useState(false)
  const [suggestions, setSuggestions] = useState<StructuredSuggestion[] | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [isApplyingSuggestions, setIsApplyingSuggestions] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string>('')

  // Resume selector state
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([])
  const [selectedResume, setSelectedResume] = useState<SavedResume | null>(null)
  const [isLoadingResumes, setIsLoadingResumes] = useState(false)
  const [resumeSource, setResumeSource] = useState<'auri' | 'upload' | null>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)

  const getIdTokenSafe = useCallback(async (): Promise<string | undefined> => {
    const current = auth.currentUser
    if (!current) return undefined
    try { return await getIdToken(current) } catch { return undefined }
  }, [])

  useEffect(() => {
    if (!user) return
    setIsLoadingResumes(true)
    getSavedResumes(user.uid)
      .then((resumes) => setSavedResumes(resumes))
      .catch(() => { /* non-blocking */ })
      .finally(() => setIsLoadingResumes(false))
  }, [user])

  const handleSelectResume = useCallback((resume: SavedResume) => {
    if (!user) return
    setIsLoadingResumes(true)
    getSavedResume(user.uid, resume.id)
      .then((fresh) => {
        const resolved = fresh ?? resume
        setSelectedResume(resolved)
        setResumeText(convertResumeToPlainText(resolved.resumeData))
      })
      .catch(() => {
        setSelectedResume(resume)
        setResumeText(convertResumeToPlainText(resume.resumeData))
      })
      .finally(() => {
        setResumeSource('auri')
        setIsLoadingResumes(false)
      })
  }, [user])

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploadingResume(true)
    setError('')
    try {
      const idToken = await getIdTokenSafe()
      if (!idToken) {
        setError('Please sign in to upload a resume.')
        return
      }
      const formData = new FormData()
      formData.append('resume', file)
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      })
      const json = await res.json() as
        | { success: true; data: ParsedResumeResult }
        | { success: false; error: string }
      if (!json.success) {
        setError(json.error)
        return
      }
      setSelectedResume(null)
      setResumeSource('upload')
      setResumeText(json.data.extractedText)
    } catch {
      setError('Failed to parse resume PDF. Please try again.')
    } finally {
      setIsUploadingResume(false)
    }
  }, [getIdTokenSafe])

  const runCoverageAnalysis = useCallback(
    async (jd: string): Promise<RequirementCoverage[] | null> => {
      if (!jd.trim()) return null
      const idToken = await getIdTokenSafe()
      if (!idToken) return null
      const res = await fetch('/api/semantic-coverage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ jobDescription: jd }),
      })
      if (!res.ok) return null
      const json = await res.json()
      if (!json.success) return null
      return json.data as RequirementCoverage[]
    },
    [getIdTokenSafe]
  )

  const runAnalysis = useCallback(async (text: string, jd: string): Promise<ATSScore | null> => {
    if (!text.trim() || !jd.trim()) return null
    const idToken = await getIdTokenSafe()
    const res = await fetch('/api/claude/ats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ resumePlainText: text, jobDescription: jd, uid: user?.uid }),
    })
    if (res.status === 429) {
      const j = await res.json()
      throw new Error(`Rate limit reached. Try again in ${j.retryAfter}s.`)
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Analysis failed' }))
      throw new Error(j.error ?? 'Analysis failed')
    }
    const json = await res.json()
    if (!json.success) throw new Error(json.error ?? 'Analysis failed')
    return json.data as ATSScore
  }, [user?.uid, getIdTokenSafe])

  const handleAnalyze = useCallback(async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return
    setIsAnalyzing(true)
    setError('')
    setCoverage(null)
    setOutcomeId(null)
    setSelectedOutcome(null)
    setSuggestions(null)
    setCheckedIds(new Set())
    setSuggestionsError('')

    if (user) {
      setIsCoverageLoading(true)
      runCoverageAnalysis(jobDescription)
        .then((result) => { if (result) setCoverage(result) })
        .catch(() => { /* non-blocking */ })
        .finally(() => setIsCoverageLoading(false))
    }

    try {
      const result = await runAnalysis(resumeText, jobDescription)
      if (result) {
        setScore(result)
        setATSScore(result)
        setAnalysisTimestamp(new Date().toISOString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [resumeText, jobDescription, runAnalysis, runCoverageAnalysis, setATSScore, user])

  const handleOutcome = useCallback(async (outcome: ATSOutcome['outcome']) => {
    if (!score || !analysisTimestamp) return
    setSelectedOutcome(outcome)
    setIsSavingOutcome(true)
    const idToken = await getIdTokenSafe()
    if (!idToken) {
      setIsSavingOutcome(false)
      return
    }
    try {
      const res = await fetch('/api/ats-outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          outcomeId: outcomeId ?? undefined,
          jobDescription,
          score: score.score,
          sectionScores: score.section_analysis
            ? Object.fromEntries(score.section_analysis.map((s) => [s.label, s.score]))
            : undefined,
          outcome,
          createdAt: analysisTimestamp,
        }),
      })
      if (res.ok) {
        const json = await res.json() as { success: boolean; outcomeId?: string }
        if (json.success && json.outcomeId) {
          setOutcomeId(json.outcomeId)
        }
      }
    } catch {
      // silently fail — outcome tracking is non-blocking
    } finally {
      setIsSavingOutcome(false)
    }
  }, [score, analysisTimestamp, outcomeId, jobDescription, getIdTokenSafe])

  const handleGenerateSuggestions = useCallback(async () => {
    if (!score || !user) return
    setIsGeneratingSuggestions(true)
    setSuggestionsError('')
    try {
      const idToken = await getIdTokenSafe()
      if (!idToken) {
        setSuggestionsError('Please sign in to use this feature.')
        return
      }
      const res = await fetch('/api/structured-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          jobDescription,
          missingKeywords: score.missing_keywords,
          sectionAnalysis: score.section_analysis ?? [],
          resumeId: selectedResume?.id ?? undefined,
        }),
      })
      const data = await res.json() as
        | { success: true; suggestions: StructuredSuggestion[] }
        | { success: false; error: string }
      if (!data.success) {
        setSuggestionsError(data.error)
        return
      }
      setSuggestions(data.suggestions)
      setCheckedIds(new Set(data.suggestions.map((s) => s.id)))
    } catch {
      setSuggestionsError('Failed to generate suggestions')
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }, [score, user, jobDescription, selectedResume, getIdTokenSafe])

  const handleApplySuggestions = useCallback(async () => {
    if (!suggestions || (!selectedResume && !currentResume)) return
    if (!selectedResume) {
      setSuggestionsError('Apply to Editor is only available for AURI-generated resumes.')
      return
    }
    if (!user) return
    setIsApplyingSuggestions(true)

    const updated: ResumeData = JSON.parse(JSON.stringify(selectedResume.resumeData)) as ResumeData
    const checked = suggestions.filter((s) => checkedIds.has(s.id))

    for (const s of checked) {
      const t = s.target
      if (t.section === 'summary') {
        updated.summary = s.suggested
      } else if (t.section === 'experience') {
        const entry = updated.experience.find((e) => e.id === t.entryId)
        if (entry && entry.bullets[t.bulletIndex] !== undefined) {
          entry.bullets[t.bulletIndex] = s.suggested
        }
      } else if (t.section === 'experience_title') {
        const entry = updated.experience.find((e) => e.id === t.entryId)
        if (entry) {
          entry.title = s.suggested
        }
      } else if (t.section === 'skills') {
        if (t.action === 'add') {
          if (!updated.skills.includes(s.suggested)) {
            updated.skills.push(s.suggested)
          }
        } else {
          const idx = updated.skills.indexOf(t.oldSkill)
          if (idx !== -1) updated.skills[idx] = s.suggested
        }
      } else if (t.section === 'projects') {
        const proj = (updated.projects ?? []).find((p) => p.id === t.entryId)
        if (proj && proj.bullets[t.bulletIndex] !== undefined) {
          proj.bullets[t.bulletIndex] = s.suggested
        }
      } else if (t.section === 'leadership') {
        const lead = updated.leadership?.find((l) => l.id === t.entryId)
        if (lead && lead.bullets[t.bulletIndex] !== undefined) {
          lead.bullets[t.bulletIndex] = s.suggested
        }
      }
    }

    try {
      // Strip the internal ResumeData.id field so Firestore only holds the doc-path ID.
      // Keeping it causes confusion: resumeData.id !== Firestore doc ID, which breaks
      // the isFromApply check on the [id] page and pollutes stored documents.
      const { id: _id, ...resumeDataToWrite } = updated
      await updateSavedResume(user.uid, selectedResume.id, {
        resumeData: resumeDataToWrite,
        updatedAt: new Date().toISOString(),
      })
      setResume({ ...resumeDataToWrite, id: selectedResume.id })
      router.push(`/dashboard/resume/${selectedResume.id}`)
    } catch {
      setSuggestionsError('Failed to save changes. Please try again.')
      setIsApplyingSuggestions(false)
    }
  }, [suggestions, selectedResume, currentResume, user, checkedIds, setResume, router])

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">ATS Optimizer</h1>
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">
          Select a resume and paste a job description to get a real-time ATS match score with keyword analysis.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* ── Left: Input Form ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">

              {/* Section A — AURI Saved Resumes */}
              <div>
                <label className={LABEL_CLASS}>
                  Your AURI Resumes <span className="text-[#EF4444]">*</span>
                </label>
                {isLoadingResumes ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin" />
                  </div>
                ) : savedResumes.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed border-white/[0.08] text-center">
                    <FileText className="w-5 h-5 text-[#60607A]" />
                    <p className="text-xs text-[#60607A]">No saved resumes yet.</p>
                    <Link
                      href="/dashboard/resume"
                      className="text-xs text-[#818CF8] hover:text-white transition-colors"
                    >
                      Build your first resume →
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {savedResumes.map((resume) => {
                      const isSelected = selectedResume?.id === resume.id
                      return (
                        <button
                          key={resume.id}
                          onClick={() => handleSelectResume(resume)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition-all duration-150
                            ${isSelected
                              ? 'border-[#6366F1]/50 bg-[#6366F1]/5 ring-1 ring-[#6366F1]/20'
                              : 'border-white/[0.06] bg-[#0A0A0F]/50 hover:border-white/[0.12] hover:bg-[#0A0A0F]'
                            }`}
                        >
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-[#E0E0F0]'}`}>
                            {resume.name}
                          </p>
                          <p className="text-xs text-[#60607A] truncate mt-0.5">
                            {resume.targetPosition}{resume.targetCompany ? ` · ${resume.targetCompany}` : ''}
                          </p>
                          <p className="text-[10px] text-[#4A4A6A] mt-1">
                            {formatResumeDate(resume.updatedAt, 'Updated')}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* OR Divider */}
              {profile?.isPro && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] font-medium text-[#4A4A6A] uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
              )}

              {/* Section B — PDF Upload (Pro only) */}
              {profile?.isPro && (
                <div>
                  <label className={LABEL_CLASS}>Upload a PDF Resume</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleFileUpload(file)
                      e.target.value = ''
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingResume}
                    className={`w-full flex flex-col items-center gap-2 py-5 rounded-xl border border-dashed
                      transition-all duration-150 disabled:cursor-not-allowed
                      ${resumeSource === 'upload'
                        ? 'border-[#6366F1]/50 bg-[#6366F1]/5'
                        : 'border-white/[0.10] hover:border-white/[0.20] hover:bg-white/[0.02]'
                      }`}
                  >
                    {isUploadingResume ? (
                      <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin" />
                    ) : (
                      <Upload className={`w-5 h-5 ${resumeSource === 'upload' ? 'text-[#818CF8]' : 'text-[#60607A]'}`} />
                    )}
                    <span className={`text-xs ${resumeSource === 'upload' ? 'text-[#818CF8]' : 'text-[#60607A]'}`}>
                      {isUploadingResume
                        ? 'Parsing PDF…'
                        : resumeSource === 'upload'
                          ? 'PDF loaded — click to replace'
                          : 'Click to upload PDF (max 5 MB)'}
                    </span>
                  </button>
                </div>
              )}

              <div>
                <label className={LABEL_CLASS}>
                  Job Description <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  className={INPUT_CLASS}
                  rows={8}
                  placeholder="Paste the job description here…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  aria-label="Job description"
                />
              </div>

              {error && (
                error === 'FREE_TIER_LIMIT_REACHED' ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20">
                    <Zap className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">Monthly limit reached</p>
                      <p className="text-xs text-[#A0A0B8]">You&apos;ve used all 3 free generations this month.</p>
                    </div>
                    <Link href="/pricing" className="flex-shrink-0 text-xs font-semibold text-[#818CF8] hover:text-white transition-colors">
                      Upgrade →
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                    <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                    <p className="text-xs text-[#EF4444]">{error}</p>
                  </div>
                )
              )}

              <button
                onClick={handleAnalyze}
                disabled={!resumeText.trim() || !jobDescription.trim() || isAnalyzing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-semibold text-sm
                  shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50 hover:scale-[1.01]
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isAnalyzing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                  : <><Sparkles className="w-4 h-4" /> Analyze ATS Score</>
                }
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Score Panel + Results ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="space-y-4"
        >
          {/* ATS Score Panel */}
          {isAnalyzing ? (
            <ATSScorePanel score={null} isLoading={true} />
          ) : score ? (
            <ATSScorePanel score={score} isLoading={false} />
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-16 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <p className="text-sm font-medium text-[#A0A0B8]">Your ATS score will appear here</p>
                <p className="text-xs text-[#60607A] mt-1">Select a resume and job description, then click Analyze</p>
              </div>
            </div>
          )}

          {/* Apply to Editor — Pro users only, appears after analysis */}
          {score && profile?.isPro && user && (
            <div className="space-y-2">
              <button
                onClick={() => void handleGenerateSuggestions()}
                disabled={isGeneratingSuggestions || isAnalyzing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  border border-[#6366F1]/30 text-[#818CF8] text-sm font-medium
                  hover:bg-[#6366F1]/10 hover:border-[#6366F1]/50 hover:text-white
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingSuggestions
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating suggestions…</>
                  : <><Sparkles className="w-4 h-4" /> Apply to Editor</>
                }
              </button>
              {suggestionsError && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] flex-shrink-0" />
                  <p className="text-xs text-[#EF4444]">{suggestionsError}</p>
                </div>
              )}
            </div>
          )}

          {/* Suggestions Panel */}
          {suggestions && (
            <SuggestionsPanel
              suggestions={suggestions}
              checkedIds={checkedIds}
              onToggle={(id) => setCheckedIds((prev) => {
                const next = new Set(prev)
                next.has(id) ? next.delete(id) : next.add(id)
                return next
              })}
              onApply={() => void handleApplySuggestions()}
              isApplying={isApplyingSuggestions}
              onDiscard={() => setSuggestions(null)}
            />
          )}

          {/* Section Analysis Panel — Pro users only */}
          {profile?.isPro && (
            <SectionAnalysisPanel
              sections={score?.section_analysis ?? null}
              isLoading={isAnalyzing}
            />
          )}

          {/* Requirement Coverage Panel */}
          {isCoverageLoading ? (
            <RequirementCoveragePanel coverage={null} isLoading={true} />
          ) : coverage ? (
            <RequirementCoveragePanel coverage={coverage} isLoading={false} />
          ) : null}

          {/* Outcome Tracker */}
          {user && score && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING}
              className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
            >
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-[#60607A] uppercase tracking-wide">
                    Track your application outcome
                  </p>
                  {isSavingOutcome ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#6366F1] animate-spin" />
                  ) : selectedOutcome ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-white">
                  Did this application lead to an interview?
                </p>
                <div className="flex flex-wrap gap-2">
                  {OUTCOME_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => void handleOutcome(value)}
                      disabled={isSavingOutcome || isAnalyzing}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150
                        ${selectedOutcome === value
                          ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/25'
                          : 'border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:border-white/[0.2] bg-transparent'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>

    </div>
  )
}
