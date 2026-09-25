'use client'

import { useT } from '@/lib/i18n/client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Linkedin,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  Zap,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import ProGate from '@/components/shared/ProGate'
import type { LinkedInRewrite } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const INPUT_CLASS =
  'w-full bg-[#F4F2EC] border border-lp-rule rounded-[4px] px-4 py-3 text-lp-ink text-sm placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F5C4A]/50 focus:ring-1 focus:ring-[#1F5C4A]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#3C403E] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      aria-label={`Copy ${label}`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5 transition-all flex-shrink-0"
    >
      {copied ? <CheckCircle className="w-3 h-3 text-[#1F7A4D]" /> : <Copy className="w-3 h-3" />}
      {copied ? t("Copied!") : `Copy ${label}`}
    </button>
  )
}

function LinkedInCard({ data }: { data: LinkedInRewrite }) {
  const t = useT()
  return (
    <div className="rounded-[10px] bg-white border border-gray-200 overflow-hidden ">
      <div className="h-16 bg-[#0077B5] " />
      <div className="px-5 pb-4">
        <div className="-mt-8 mb-3">
          <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-lp-rule flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">{t("Your Name")}</h3>
              <p className="text-sm text-gray-700 mt-0.5 leading-snug">{data.headline}</p>
            </div>
            <CopyButton text={data.headline} label={t("Headline")} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t("About")}</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.about}</p>
            </div>
            <CopyButton text={data.about} label={t("About")} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("Experience")}</p>
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
  const t = useT()
  const { user } = useAuth()
  const { profile, updateProfile } = useCareerStore()

  const [targetPosition, setTargetPosition] = useState(profile?.target?.position ?? '')
  const [sectorOrIndustry, setSectorOrIndustry] = useState(profile?.target?.industry ?? '')
  const [headline, setHeadline] = useState('')
  const [aboutSection, setAboutSection] = useState('')
  const [experiences, setExperiences] = useState('')

  const [result, setResult] = useState<LinkedInRewrite | null>(null)
  const [generateError, setGenerateError] = useState('')

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
        let cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}')
        if (fb !== -1 && lb > fb) cleaned = cleaned.slice(fb, lb + 1)
        const parsed = JSON.parse(cleaned) as LinkedInRewrite
        setResult(parsed)
        // Save to careerStore
        if (profile) {
          updateProfile({ generated: { ...profile.generated, linkedin_rewrite: parsed } })
        }
      } catch {
        setGenerateError(t("Could not parse the LinkedIn rewrite. Please try again."))
      }
    }
  }, [headline, aboutSection, experiences, targetPosition, sectorOrIndustry, user?.uid, stream, profile, updateProfile])

  const hasProfileInput = headline.trim() || aboutSection.trim() || experiences.trim()

  return (
    <ProGate
      featureName={t("LinkedIn Profile Rewriter")}
      featureDescription={t("Rewrite your headline, About section, and top experiences to attract recruiters for your target role. Optimized for LinkedIn's search algorithm.")}
      icon={<Linkedin className="w-6 h-6 text-[#1F5C4A]" />}
    >
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-[10px] bg-[#1F5C4A]/10 flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-lp-ink" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-lp-ink">{t("LinkedIn Profile Rewriter")}</h1>
        </div>
        <p className="text-[#3C403E] text-sm ml-12">
          {t("Rewrite your headline, About, and top 3 experiences to attract recruiters for your target role.")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Input ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
        >
          <div className="rounded-[10px]  bg-[#FFFFFF] p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>{t("Target Position")}{' '}<span className="text-[#B42318]">*</span></label>
                <input type="text" value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} placeholder={t("Product Manager")} className={INPUT_CLASS} aria-label={t("Target position")} style={{ fontSize: '16px' }} />
              </div>
              <div>
                <label className={LABEL_CLASS}>{t("Sector / Industry")}</label>
                <input type="text" className={INPUT_CLASS} placeholder={t("B2B SaaS, FinTech…")} value={sectorOrIndustry} onChange={(e) => setSectorOrIndustry(e.target.value)} aria-label={t("Sector or industry")} />
              </div>
            </div>

            <div className="border-t border-lp-hairline pt-4 space-y-4">
              <p className="text-xs font-semibold text-[#3C403E] uppercase tracking-wide">{t("Your Current LinkedIn Profile")}</p>
              <div>
                <label className={LABEL_CLASS}>{t("Current Headline")}</label>
                <input type="text" className={INPUT_CLASS} placeholder={t("Software Engineer at Acme Corp")} value={headline} onChange={(e) => setHeadline(e.target.value)} aria-label={t("Current headline")} />
              </div>
              <div>
                <label className={LABEL_CLASS}>{t("Current About Section")}</label>
                <textarea className={TEXTAREA_CLASS} rows={4} placeholder={t("Paste your current About section here…")} value={aboutSection} onChange={(e) => setAboutSection(e.target.value)} aria-label={t("Current About section")} />
              </div>
              <div>
                <label className={LABEL_CLASS}>{t("Top 3 Experiences (paste all three)")}</label>
                <textarea className={TEXTAREA_CLASS} rows={6} placeholder={t("Title at Company\nKey responsibilities...\n\nTitle at Company\n...")} value={experiences} onChange={(e) => setExperiences(e.target.value)} aria-label={t("Top 3 experiences")} />
              </div>
            </div>

            {generateError && (
              generateError === 'FREE_TIER_LIMIT_REACHED' ? (
                <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20">
                  <Zap className="w-4 h-4 text-[#1F5C4A] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-lp-ink">{t("Monthly limit reached")}</p>
                    <p className="text-xs text-[#3C403E]">{t("You've used all 3 free generations this month.")}</p>
                  </div>
                  <Link href="/pricing" className="flex-shrink-0 text-xs font-semibold text-[#1F5C4A] hover:text-lp-ink transition-colors">
                    {t("Upgrade →")}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20">
                  <AlertCircle className="w-4 h-4 text-[#B42318] flex-shrink-0" />
                  <p className="text-xs text-[#B42318]">{generateError}</p>
                </div>
              )
            )}

            <button
              onClick={handleGenerate}
              disabled={!hasProfileInput || !targetPosition.trim() || isStreaming}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px]
                bg-[#1F5C4A] text-white font-semibold text-sm
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" />{' '}{t("Rewriting…")}</> : <><Sparkles className="w-4 h-4" />{' '}{t("Rewrite LinkedIn Profile")}</>}
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
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                <div className="rounded-[10px]  bg-[#FFFFFF] p-6 space-y-3 min-h-[300px]">
                  <div className="flex items-center gap-2 p-3 rounded-[4px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20">
                    <Loader2 className="w-4 h-4 text-[#1F5C4A] animate-spin" />
                    <span className="text-sm text-[#1F5C4A] font-medium">{t("AURI is rewriting your LinkedIn profile…")}</span>
                  </div>
                  {[85, 70, 90, 75, 88, 60].map((w, i) => (
                    <div key={i} className="h-3 rounded-full bg-lp-ink/[0.04] animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
                <LinkedInCard data={result} />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                <div className="rounded-[10px]  bg-[#FFFFFF] p-12 flex flex-col items-center text-center min-h-[300px] justify-center">
                  <div className="w-14 h-14 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 flex items-center justify-center mb-4">
                    <Linkedin className="w-6 h-6 text-[#1F5C4A]" />
                  </div>
                  <p className="text-sm font-medium text-[#3C403E]">{t("Your rewritten LinkedIn profile will appear here")}</p>
                  <p className="text-xs text-[#5A5F5C] mt-1">{t("Fill in your current profile and click Rewrite")}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
    </ProGate>
  )
}
