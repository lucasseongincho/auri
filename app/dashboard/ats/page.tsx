'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Sparkles, Loader2, AlertCircle, FileText, ClipboardList, ChevronRight } from 'lucide-react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { getSavedResumes } from '@/lib/firestore'
import ATSScorePanel from '@/components/resume/ATSScorePanel'
import type { ATSScore, SavedResume, ResumeData } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all resize-none'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'

// Derive plain text from structured ResumeData + personal info
function resumeToPlainText(saved: SavedResume): string {
  const data: ResumeData = saved.resumeData
  const personal = saved.personalInfo
  const lines: string[] = []
  if (personal?.name) lines.push(personal.name)
  const contact = [personal?.email, personal?.phone, personal?.location].filter(Boolean).join(' | ')
  if (contact) lines.push(contact)
  if (data.summary) lines.push('', 'SUMMARY', data.summary)
  if (data.experience?.length) {
    lines.push('', 'EXPERIENCE')
    for (const exp of data.experience) {
      lines.push(`${exp.title} at ${exp.company} (${exp.start} – ${exp.end})`)
      for (const b of (exp.bullets ?? [])) lines.push(`• ${b}`)
    }
  }
  if (data.education?.length) {
    lines.push('', 'EDUCATION')
    for (const edu of data.education)
      lines.push(`${edu.degree} in ${edu.field}, ${edu.institution} (${edu.year})`)
  }
  if (data.skills?.length) lines.push('', 'SKILLS', data.skills.join(', '))
  if (data.certifications?.length) lines.push('', 'CERTIFICATIONS', data.certifications.join(', '))
  if (data.projects?.length) {
    lines.push('', 'PROJECTS')
    for (const p of data.projects) {
      lines.push(p.name)
      for (const b of (p.bullets ?? [])) lines.push(`• ${b}`)
    }
  }
  return lines.join('\n').trim()
}

export default function ATSPage() {
  const { user } = useAuth()
  const { profile, setATSScore, atsScore, currentResume } = useCareerStore()

  const [inputMode, setInputMode] = useState<'auri' | 'paste'>('auri')
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')
  const [score, setScore] = useState<ATSScore | null>(atsScore)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [error, setError] = useState('')

  // AURI resume picker state
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  // Load saved resumes when AURI tab is active and user is authenticated
  useEffect(() => {
    if (inputMode !== 'auri' || !user?.uid) return
    setLoadingResumes(true)
    getSavedResumes(user.uid)
      .then((resumes) => setSavedResumes(resumes))
      .catch(() => setSavedResumes([]))
      .finally(() => setLoadingResumes(false))
  }, [inputMode, user?.uid])

  // When a saved resume is selected, derive its plain text
  const handleSelectResume = useCallback((saved: SavedResume) => {
    setSelectedResumeId(saved.id ?? null)
    setResumeText(resumeToPlainText(saved))
  }, [])

  // If the user has a currently built resume (in store), offer it at the top
  const handleUseCurrentResume = useCallback(() => {
    if (!currentResume) return
    const personalInfo = profile?.personal ?? { name: '', email: '', phone: '', location: '', linkedin_url: '', website: '' }
    const plain = currentResume.plain ?? resumeToPlainText({ resumeData: currentResume, personalInfo } as SavedResume)
    setResumeText(plain)
    setSelectedResumeId('__current__')
  }, [currentResume, profile?.personal])

  const runAnalysis = useCallback(async (resumePlainText: string, jd: string) => {
    if (!resumePlainText.trim() || !jd.trim()) return

    let idToken: string | undefined
    if (auth.currentUser) {
      try { idToken = await getIdToken(auth.currentUser) } catch { /* guest — IP rate limit applies */ }
    }

    const res = await fetch('/api/claude/ats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ resumePlainText, jobDescription: jd, uid: user?.uid }),
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
  }, [user?.uid])

  const handleAnalyze = useCallback(async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return
    setIsAnalyzing(true)
    setError('')
    try {
      const result = await runAnalysis(resumeText, jobDescription)
      if (result) {
        setScore(result)
        setATSScore(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [resumeText, jobDescription, runAnalysis, setATSScore])

  const handleFixAll = useCallback(async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return
    setIsFixing(true)
    setError('')
    try {
      const result = await runAnalysis(resumeText, jobDescription)
      if (result) {
        setScore(result)
        setATSScore(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed')
    } finally {
      setIsFixing(false)
    }
  }, [resumeText, jobDescription, runAnalysis, setATSScore])

  const canAnalyze = resumeText.trim().length > 0 && jobDescription.trim().length > 0

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
          Score your resume against a job description to see keyword matches and get improvement suggestions.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
        {/* ── Left: Input Form ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">

              {/* Resume source tab toggle */}
              <div>
                <p className={LABEL_CLASS}>Resume Source</p>
                <div className="flex gap-1 p-1 rounded-xl bg-[#0A0A0F] border border-white/[0.08]">
                  <button
                    onClick={() => setInputMode('auri')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                      ${inputMode === 'auri'
                        ? 'bg-[#6366F1] text-white shadow-sm'
                        : 'text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/5'
                      }`}
                  >
                    From AURI
                  </button>
                  <button
                    onClick={() => setInputMode('paste')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                      ${inputMode === 'paste'
                        ? 'bg-[#6366F1] text-white shadow-sm'
                        : 'text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/5'
                      }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {/* Resume input area */}
              <AnimatePresence mode="wait">
                {inputMode === 'auri' ? (
                  <motion.div
                    key="auri"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    {/* Currently built resume shortcut */}
                    {currentResume && (
                      <button
                        onClick={handleUseCurrentResume}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200
                          ${selectedResumeId === '__current__'
                            ? 'border-[#6366F1]/50 bg-[#6366F1]/10'
                            : 'border-white/[0.08] bg-[#0A0A0F] hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5'
                          }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">Currently built resume</p>
                          <p className="text-[10px] text-[#60607A]">Not yet saved · Resume Builder</p>
                        </div>
                        {selectedResumeId === '__current__' && (
                          <ChevronRight className="w-3.5 h-3.5 text-[#6366F1] flex-shrink-0" />
                        )}
                      </button>
                    )}

                    {/* Saved resumes list */}
                    {loadingResumes ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin" />
                      </div>
                    ) : !user?.uid ? (
                      <div className="p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08] text-center">
                        <p className="text-xs text-[#60607A]">Sign in to load your saved resumes</p>
                      </div>
                    ) : savedResumes.length === 0 && !currentResume ? (
                      <div className="p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08] text-center">
                        <p className="text-xs text-[#60607A]">No saved resumes yet — generate one in Resume Builder</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                        {savedResumes.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleSelectResume(r)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200
                              ${selectedResumeId === r.id
                                ? 'border-[#6366F1]/50 bg-[#6366F1]/10'
                                : 'border-white/[0.08] bg-[#0A0A0F] hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5'
                              }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#1C1C26] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                              <FileText className="w-3.5 h-3.5 text-[#60607A]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{r.name}</p>
                              {r.targetPosition && (
                                <p className="text-[10px] text-[#60607A] truncate">{r.targetPosition}{r.targetCompany ? ` · ${r.targetCompany}` : ''}</p>
                              )}
                            </div>
                            {selectedResumeId === r.id && (
                              <ChevronRight className="w-3.5 h-3.5 text-[#6366F1] flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {resumeText && selectedResumeId && (
                      <p className="text-[10px] text-[#22C55E] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block" />
                        Resume loaded — ready to analyze
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="paste"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <label className={LABEL_CLASS}>
                      Resume Text <span className="text-[#EF4444]">*</span>
                    </label>
                    <textarea
                      className={INPUT_CLASS}
                      rows={10}
                      placeholder="Paste your plain-text resume here…"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      aria-label="Resume text"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Job description */}
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
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  <p className="text-xs text-[#EF4444]">{error}</p>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
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

        {/* ── Right: Score Panel ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          {isAnalyzing ? (
            <ATSScorePanel score={null} isLoading={true} onFixAll={handleFixAll} isFixing={false} />
          ) : score ? (
            <ATSScorePanel score={score} isLoading={false} onFixAll={handleFixAll} isFixing={isFixing} />
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-16 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <p className="text-sm font-medium text-[#A0A0B8]">Your ATS score will appear here</p>
                <p className="text-xs text-[#60607A] mt-1">
                  {inputMode === 'auri' ? 'Select a resume and paste a job description, then click Analyze' : 'Paste your resume and job description, then click Analyze'}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
