'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Sparkles, Loader2, AlertCircle, FileText, ClipboardList, Copy, CheckCircle, RefreshCw, Zap } from 'lucide-react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import ATSScorePanel from '@/components/resume/ATSScorePanel'
import RequirementCoveragePanel from '@/components/resume/RequirementCoveragePanel'
import SectionAnalysisPanel from '@/components/resume/SectionAnalysisPanel'
import type { ATSScore, RequirementCoverage, ATSOutcome } from '@/types'

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

export default function ATSPage() {
  const { user } = useAuth()
  const { profile, setATSScore, atsScore } = useCareerStore()

  const [resumeText, setResumeText] = useState(profile?.generated?.resume_plain ?? '')
  const [jobDescription, setJobDescription] = useState(profile?.target?.job_description ?? '')
  const [score, setScore] = useState<ATSScore | null>(atsScore)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [error, setError] = useState('')
  const [fixedResume, setFixedResume] = useState<string | null>(null)
  const [originalScore, setOriginalScore] = useState<number | null>(null)
  const [improvedScore, setImprovedScore] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [coverage, setCoverage] = useState<RequirementCoverage[] | null>(null)
  const [isCoverageLoading, setIsCoverageLoading] = useState(false)
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null)
  const [outcomeId, setOutcomeId] = useState<string | null>(null)
  const [selectedOutcome, setSelectedOutcome] = useState<ATSOutcome['outcome'] | null>(null)
  const [isSavingOutcome, setIsSavingOutcome] = useState(false)
  const improvedRef = useRef<HTMLDivElement>(null)

  const getIdTokenSafe = useCallback(async (): Promise<string | undefined> => {
    const current = auth.currentUser
    if (!current) return undefined
    try { return await getIdToken(current) } catch { return undefined }
  }, [])

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
    setFixedResume(null)
    setOriginalScore(null)
    setImprovedScore(null)
    setCoverage(null)
    setOutcomeId(null)
    setSelectedOutcome(null)

    // Semantic coverage runs in parallel (authenticated users only — reads Firestore profile)
    if (user) {
      setIsCoverageLoading(true)
      runCoverageAnalysis(jobDescription)
        .then((result) => { if (result) setCoverage(result) })
        .catch(() => { /* non-blocking: silently ignore coverage errors */ })
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

  const handleFixAll = useCallback(async () => {
    if (!resumeText.trim() || !score) return
    setIsFixing(true)
    setError('')
    setFixedResume(null)
    setImprovedScore(null)

    try {
      const idToken = await getIdTokenSafe()
      if (!idToken) {
        setError('Please sign in to use Fix All.')
        return
      }

      const callFix = async (text: string, atsData: ATSScore): Promise<string> => {
        const res = await fetch('/api/claude/ats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            mode: 'fix',
            resumeText: text,
            jobDescription,
            missingKeywords: atsData.missing_keywords ?? [],
            formattingIssues: atsData.formatting_issues ?? [],
            suggestions: atsData.suggestions ?? [],
          }),
        })
        if (res.status === 429) {
          const j = await res.json()
          throw new Error(`Rate limit reached. Try again in ${j.retryAfter}s.`)
        }
        if (!res.ok) {
          const j = await res.json().catch(() => ({ error: 'Fix failed' }))
          throw new Error(j.error ?? 'Fix failed')
        }
        const data = await res.json()
        if (!data.success || !data.improvedResume) throw new Error('No improved resume returned')
        return data.improvedResume as string
      }

      const originalScoreVal = score.score

      // First pass
      const fixed1 = await callFix(resumeText, score)
      setOriginalScore(originalScoreVal)
      setFixedResume(fixed1)
      setTimeout(() => improvedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)

      // Auto re-analyze after first pass
      const result1 = await runAnalysis(fixed1, jobDescription)
      if (result1) {
        setScore(result1)
        setATSScore(result1)

        // Auto-retry if improvement is less than 5 points
        if (result1.score - originalScoreVal < 5) {
          const fixed2 = await callFix(fixed1, result1)
          setFixedResume(fixed2)
          const result2 = await runAnalysis(fixed2, jobDescription)
          if (result2) {
            setImprovedScore(result2.score)
            setScore(result2)
            setATSScore(result2)
          } else {
            setImprovedScore(result1.score)
          }
        } else {
          setImprovedScore(result1.score)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fix All failed — please try again')
    } finally {
      setIsFixing(false)
    }
  }, [resumeText, jobDescription, score, getIdTokenSafe, runAnalysis, setATSScore])

  const handleReanalyze = useCallback(async () => {
    if (!fixedResume || !jobDescription.trim()) return
    setIsReanalyzing(true)
    setError('')
    try {
      const result = await runAnalysis(fixedResume, jobDescription)
      if (result) {
        setImprovedScore(result.score)
        setScore(result)
        setATSScore(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed')
    } finally {
      setIsReanalyzing(false)
    }
  }, [fixedResume, jobDescription, runAnalysis, setATSScore])

  const handleCopy = useCallback(async () => {
    if (!fixedResume) return
    await navigator.clipboard.writeText(fixedResume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [fixedResume])

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
          Paste your resume and job description to get a real-time ATS match score with keyword analysis.
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

              {profile?.generated?.resume_plain && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20">
                  <FileText className="w-4 h-4 text-[#6366F1] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#818CF8]">
                    Resume text auto-loaded from your last generated resume.
                  </p>
                </div>
              )}

              <div>
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
              </div>

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

        {/* ── Right: Score Panel + Improved Resume ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="space-y-4"
        >
          {/* ATS Score Panel */}
          {isAnalyzing ? (
            <ATSScorePanel score={null} isLoading={true} onFixAll={handleFixAll} isFixing={false} />
          ) : score ? (
            <ATSScorePanel
              score={score}
              isLoading={false}
              onFixAll={handleFixAll}
              isFixing={isFixing}
              fixingLabel="Rewriting resume…"
            />
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-16 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <p className="text-sm font-medium text-[#A0A0B8]">Your ATS score will appear here</p>
                <p className="text-xs text-[#60607A] mt-1">Paste your resume and job description, then click Analyze</p>
              </div>
            </div>
          )}

          {/* Section Analysis Panel — Pro users only; invisible to guests and free users */}
          {profile?.isPro && (
            <SectionAnalysisPanel
              sections={score?.section_analysis ?? null}
              isLoading={isAnalyzing}
            />
          )}

          {/* Requirement Coverage Panel — semantic matching alongside keyword panel */}
          {isCoverageLoading ? (
            <RequirementCoveragePanel coverage={null} isLoading={true} />
          ) : coverage ? (
            <RequirementCoveragePanel coverage={coverage} isLoading={false} />
          ) : null}

          {/* Outcome Tracker — authenticated users only, appears after first analysis */}
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
                      onClick={() => handleOutcome(value)}
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

          {/* Improved Resume Panel — rendered after Fix All completes */}
          <AnimatePresence>
            {fixedResume && (
              <motion.div
                ref={improvedRef}
                id="improved-resume"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
              >
                <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                  <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">

                    {/* Score comparison */}
                    <AnimatePresence>
                      {originalScore !== null && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={SPRING}
                          className={`flex items-center gap-3 p-4 rounded-xl ${
                            improvedScore !== null
                              ? 'bg-[#22C55E]/10 border border-[#22C55E]/20'
                              : 'bg-[#6366F1]/10 border border-[#6366F1]/20'
                          }`}
                        >
                          {improvedScore !== null ? (
                            <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                          ) : (
                            <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin flex-shrink-0" />
                          )}
                          <div>
                            {improvedScore !== null ? (
                              <>
                                <p className="text-sm font-semibold text-[#22C55E]">
                                  Score improved: {originalScore} → {improvedScore}
                                  {' '}({improvedScore >= originalScore ? '+' : ''}{improvedScore - originalScore} points)
                                </p>
                                <p className="text-xs text-[#22C55E]/70 mt-0.5">
                                  Keywords injected — copy the improved resume below
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-medium text-[#818CF8]">
                                Re-analyzing score…
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-[#6366F1]" />
                        <h3 className="text-white font-semibold text-base">Improved Resume</h3>
                      </div>
                      <p className="text-xs text-[#60607A]">
                        Review changes below. Edit if needed, then copy and use in your applications.
                      </p>
                    </div>

                    {/* Editable improved resume */}
                    <textarea
                      value={fixedResume}
                      onChange={(e) => setFixedResume(e.target.value)}
                      rows={20}
                      className="w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3
                        text-[#A0A0B8] text-sm font-mono resize-y
                        focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30
                        transition-all"
                      aria-label="Improved resume text"
                    />

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                          bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold text-sm
                          shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50 hover:scale-[1.01]
                          transition-all duration-200"
                      >
                        {copied
                          ? <><CheckCircle className="w-4 h-4" /> Copied!</>
                          : <><Copy className="w-4 h-4" /> Copy Improved Resume</>
                        }
                      </button>
                      <button
                        onClick={handleReanalyze}
                        disabled={isReanalyzing}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                          border border-white/[0.08] text-[#A0A0B8] text-sm font-medium
                          hover:text-white hover:bg-white/5 transition-all duration-200
                          disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Re-run ATS analysis on the improved resume"
                      >
                        {isReanalyzing
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <RefreshCw className="w-4 h-4" />
                        }
                        {isReanalyzing ? 'Analyzing…' : 'Re-run Analysis'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
