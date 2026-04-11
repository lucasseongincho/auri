'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Sparkles, Loader2, AlertCircle, FileText, ClipboardList, Copy, CheckCircle, RefreshCw } from 'lucide-react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import ATSScorePanel from '@/components/resume/ATSScorePanel'
import type { ATSScore } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

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
  const improvedRef = useRef<HTMLDivElement>(null)

  const getIdTokenSafe = useCallback(async (): Promise<string | undefined> => {
    const current = auth.currentUser
    if (!current) return undefined
    try { return await getIdToken(current) } catch { return undefined }
  }, [])

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

      const res = await fetch('/api/claude/ats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          mode: 'fix',
          resumeText,
          jobDescription,
          missingKeywords: score.missing_keywords ?? [],
          formattingIssues: score.formatting_issues ?? [],
          suggestions: score.suggestions ?? [],
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
      if (data.success && data.improvedResume) {
        setFixedResume(data.improvedResume)
        setOriginalScore(score.score)
        setTimeout(() => {
          improvedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      } else {
        throw new Error('No improved resume returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fix All failed — please try again')
    } finally {
      setIsFixing(false)
    }
  }, [resumeText, jobDescription, score, getIdTokenSafe])

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
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                  <p className="text-xs text-[#EF4444]">{error}</p>
                </div>
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
                      {originalScore !== null && improvedScore !== null && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={SPRING}
                          className="flex items-center gap-3 p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20"
                        >
                          <CheckCircle className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-[#22C55E]">
                              Score improved: {originalScore} → {improvedScore}
                              {' '}(+{improvedScore - originalScore} points)
                            </p>
                            <p className="text-xs text-[#22C55E]/70 mt-0.5">
                              Missing keywords have been naturally incorporated
                            </p>
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
                        aria-label="Re-analyze the improved resume"
                      >
                        {isReanalyzing
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <RefreshCw className="w-4 h-4" />
                        }
                        {isReanalyzing ? 'Analyzing…' : 'Re-analyze Score'}
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
