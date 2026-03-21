'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Linkedin,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  User,
  Briefcase,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import type { LinkedInRewrite, Experience } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      aria-label={`Copy ${label}`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
    >
      {copied ? <CheckCircle className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : `Copy ${label}`}
    </button>
  )
}

function LinkedInCard({ data }: { data: LinkedInRewrite }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
      <div className="h-16 bg-gradient-to-r from-[#0077B5] to-[#00A0DC]" />
      <div className="px-5 pb-4">
        <div className="-mt-8 mb-3">
          <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">Your Name</h3>
              <p className="text-sm text-gray-700 mt-0.5 leading-snug">{data.headline}</p>
            </div>
            <CopyButton text={data.headline} label="Headline" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">About</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.about}</p>
            </div>
            <CopyButton text={data.about} label="About" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</p>
          {data.experiences.map((exp, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{exp.title}</p>
                    <p className="text-xs text-gray-500">{exp.company}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{exp.description}</p>
                  </div>
                  <CopyButton text={`${exp.title} — ${exp.company}\n${exp.description}`} label={`Exp ${i + 1}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LinkedInPage() {
  const { user } = useAuth()
  const { profile, updateProfile } = useCareerStore()

  const [targetPosition, setTargetPosition] = useState(profile?.target?.position ?? '')
  const [sectorOrIndustry, setSectorOrIndustry] = useState(profile?.target?.industry ?? '')
  const [headline, setHeadline] = useState('')
  const [aboutSection, setAboutSection] = useState('')
  const [experiences, setExperiences] = useState('')

  const [result, setResult] = useState<LinkedInRewrite | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [appliedToResume, setAppliedToResume] = useState(false)

  const { isStreaming, stream } = useAIStream()

  const handleGenerate = useCallback(async () => {
    const parts: string[] = []
    if (headline.trim()) parts.push(`HEADLINE:\n${headline}`)
    if (aboutSection.trim()) parts.push(`ABOUT:\n${aboutSection}`)
    if (experiences.trim()) parts.push(`EXPERIENCES:\n${experiences}`)
    const profileText = parts.join('\n\n')
    if (!profileText.trim() || !targetPosition.trim()) return

    setResult(null)
    setGenerateError('')
    setAppliedToResume(false)

    const fullText = await stream('/api/claude/linkedin', {
      pastedProfile: profileText,
      targetPosition,
      sectorOrIndustry,
      uid: user?.uid,
      isPro: false,
    }, {
      onError: (err) => setGenerateError(err),
    })

    if (fullText) {
      try {
        const cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned) as LinkedInRewrite
        setResult(parsed)
        // Save to careerStore
        if (profile) {
          updateProfile({ generated: { ...profile.generated, linkedin_rewrite: parsed } })
        }
      } catch {
        setGenerateError('Could not parse the LinkedIn rewrite. Please try again.')
      }
    }
  }, [headline, aboutSection, experiences, targetPosition, sectorOrIndustry, user?.uid, stream, profile, updateProfile])

  const handleApplyToResume = () => {
    if (!result) return
    const updatedExperiences: Experience[] = result.experiences.map((exp, i) => ({
      id: profile?.experience[i]?.id ?? `li-${i}`,
      company: exp.company,
      title: exp.title,
      start: profile?.experience[i]?.start ?? '',
      end: profile?.experience[i]?.end ?? 'Present',
      bullets: exp.description.split('\n').map((b) => b.trim()).filter(Boolean),
    }))
    updateProfile({ experience: updatedExperiences })
    setAppliedToResume(true)
  }

  const hasProfileInput = headline.trim() || aboutSection.trim() || experiences.trim()

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">LinkedIn Profile Rewriter</h1>
        </div>
        <p className="text-[#A0A0B8] text-sm ml-12">
          Rewrite your headline, About, and top 3 experiences to attract recruiters for your target role.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Input ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
        >
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Target Position <span className="text-[#EF4444]">*</span></label>
                <input type="text" className={INPUT_CLASS} placeholder="Product Manager" value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} aria-label="Target position" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Sector / Industry</label>
                <input type="text" className={INPUT_CLASS} placeholder="B2B SaaS, FinTech…" value={sectorOrIndustry} onChange={(e) => setSectorOrIndustry(e.target.value)} aria-label="Sector or industry" />
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4 space-y-4">
              <p className="text-xs font-semibold text-[#A0A0B8] uppercase tracking-wide">Your Current LinkedIn Profile</p>
              <div>
                <label className={LABEL_CLASS}>Current Headline</label>
                <input type="text" className={INPUT_CLASS} placeholder="Software Engineer at Acme Corp" value={headline} onChange={(e) => setHeadline(e.target.value)} aria-label="Current headline" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Current About Section</label>
                <textarea className={TEXTAREA_CLASS} rows={4} placeholder="Paste your current About section here…" value={aboutSection} onChange={(e) => setAboutSection(e.target.value)} aria-label="Current About section" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Top 3 Experiences (paste all three)</label>
                <textarea className={TEXTAREA_CLASS} rows={6} placeholder={`Title at Company\nKey responsibilities...\n\nTitle at Company\n...`} value={experiences} onChange={(e) => setExperiences(e.target.value)} aria-label="Top 3 experiences" />
              </div>
            </div>

            {generateError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                <p className="text-xs text-[#EF4444]">{generateError}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!hasProfileInput || !targetPosition.trim() || isStreaming}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] text-white font-semibold text-sm
                shadow-lg shadow-[#0EA5E9]/25 hover:shadow-[#0EA5E9]/50 hover:scale-[1.01]
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" /> Rewriting…</> : <><Sparkles className="w-4 h-4" /> Rewrite LinkedIn Profile</>}
            </button>
          </div>
        </motion.div>

        {/* ── Right: Output ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {isStreaming ? (
              <motion.div key="streaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 space-y-3 min-h-[300px]">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0EA5E9]/10 border border-[#0EA5E9]/20">
                    <Loader2 className="w-4 h-4 text-[#0EA5E9] animate-spin" />
                    <span className="text-sm text-[#0EA5E9] font-medium">Claude is rewriting your LinkedIn profile…</span>
                  </div>
                  {[85, 70, 90, 75, 88, 60].map((w, i) => (
                    <div key={i} className="h-3 rounded-full bg-white/[0.04] animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="space-y-4">
                <LinkedInCard data={result} />
                <button
                  onClick={handleApplyToResume}
                  disabled={appliedToResume}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    appliedToResume
                      ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 cursor-default'
                      : 'bg-[#1C1C26] border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:border-[#6366F1]/40'
                  }`}
                >
                  {appliedToResume
                    ? <><CheckCircle className="w-4 h-4" /> Applied to Resume Builder</>
                    : <><ChevronRight className="w-4 h-4" /> Apply Experiences to Resume Builder</>}
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-12 flex flex-col items-center text-center min-h-[300px] justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center mb-4">
                    <Linkedin className="w-6 h-6 text-[#0EA5E9]" />
                  </div>
                  <p className="text-sm font-medium text-[#A0A0B8]">Your rewritten LinkedIn profile will appear here</p>
                  <p className="text-xs text-[#60607A] mt-1">Fill in your current profile and click Rewrite</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
