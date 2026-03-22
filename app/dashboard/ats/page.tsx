'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Target, Sparkles, Loader2, AlertCircle, FileText, ClipboardList } from 'lucide-react'
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
  const [error, setError] = useState('')

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
    // "Fix All" re-runs the analysis so users can iterate after editing their resume text
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
                <p className="text-xs text-[#60607A] mt-1">Paste your resume and job description, then click Analyze</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
