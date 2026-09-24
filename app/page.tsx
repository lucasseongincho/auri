'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useInView, MotionConfig } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { getStartedRedirect } from '@/lib/getStartedRedirect'

// Spring config per CLAUDE.md §9
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

// ── Section wrapper with scroll-triggered fade-in ─────────────────────────────
// Transform is dropped automatically for prefers-reduced-motion via <MotionConfig reducedMotion="user">.
function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ ...SPRING, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Content ───────────────────────────────────────────────────────────────────
// Grouped by where each tool sits in the job-application workflow.
const FEATURE_GROUPS = [
  {
    title: 'Your resume, matched to one posting',
    items: [
      { label: 'Resume Builder', desc: 'Generates a single-column, ATS-parseable resume from your career profile and a target job description.', href: '/dashboard/resume', pro: false },
      { label: 'ATS Score & Optimizer', desc: 'Scores your resume against the posting and lists missing keywords with specific fixes.', href: '/dashboard/ats', pro: false },
      { label: 'Easy Tune Editor', desc: 'A structured form editor. Rewrite any single bullet with AI without regenerating the rest.', href: '/dashboard/resume', pro: false },
    ],
  },
  {
    title: 'Everything around the application',
    items: [
      { label: 'Cover Letter Generator', desc: 'A 280 to 300 word letter written from the same profile and posting.', href: '/dashboard/cover-letter', pro: false },
      { label: 'Interview Prep', desc: 'Eight likely questions for the role, each with a STAR answer outline and practice flip cards.', href: '/dashboard/interview', pro: true },
      { label: 'LinkedIn Rewriter', desc: 'Headline and About section rewritten for recruiter search.', href: '/dashboard/linkedin', pro: true },
      { label: '7-Day Job Strategy', desc: 'A day-by-day plan for applications, outreach, and follow-ups.', href: '/dashboard/strategy', pro: true },
    ],
  },
]

// Mirrors lib/prompts.ts ATS rubric and the ATSScorePanel dimension labels.
const ATS_DIMENSIONS = [
  { label: 'Keyword Match', max: 40, desc: 'Exact and semantic matches to terms in the job description, including the critical ones.' },
  { label: 'Achievement Orientation', max: 25, desc: 'Bullets that state measurable results and use action verbs, not lists of duties.' },
  { label: 'Formatting Compliance', max: 20, desc: 'Parseable structure and standard section headers. No tables, columns, or graphics.' },
  { label: 'Readability', max: 15, desc: 'Clear, concise sentences with consistent tense and appropriate length.' },
]

const SAMPLE_SCORES = [
  { label: 'Keyword Match', value: 31, max: 40 },
  { label: 'Achievement Orientation', value: 20, max: 25 },
  { label: 'Formatting Compliance', value: 18, max: 20 },
  { label: 'Readability', value: 13, max: 15 },
]

const FREE_FEATURES = ['3 AI generations per month', 'Resume builder and ATS optimizer', 'Cover letter generator']
const PRO_FEATURES = [
  'Unlimited AI generations',
  'Everything in Free',
  'LinkedIn profile rewriter',
  '7-day job search strategy',
  'Interview prep',
  'Priority support',
]

// ── Hero product sample: job description in, score and rewrite out ────────────
function ProductSample() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
      <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] text-left">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <p className="text-xs font-semibold text-[#F8F8FF]">ATS analysis</p>
          <p className="text-[11px] text-[#8B8BA3]">Sample data</p>
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B8BA3] mb-2">Job description</p>
          <p className="text-sm text-[#A0A0B8] leading-relaxed">
            <span className="text-[#F8F8FF]">Product Analyst, Growth.</span> Own experiment design and
            analysis. Requirements: SQL, A/B testing, Looker, stakeholder communication.
          </p>
        </div>

        {/* Keywords */}
        <div className="px-5 py-4 border-b border-white/[0.06] grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B8BA3] mb-2">Matched</p>
            <ul className="flex flex-wrap gap-1.5">
              {['SQL', 'Stakeholder communication'].map((k) => (
                <li key={k} className="text-xs px-2 py-1 rounded-md bg-[#22C55E]/10 text-[#4ADE80]">{k}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B8BA3] mb-2">Missing</p>
            <ul className="flex flex-wrap gap-1.5">
              {['A/B testing', 'Looker'].map((k) => (
                <li key={k} className="text-xs px-2 py-1 rounded-md border border-white/[0.12] text-[#F8F8FF]">{k}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bullet rewrite */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B8BA3] mb-2">Bullet rewrite</p>
          <p className="text-sm text-[#8B8BA3] line-through decoration-white/20 mb-2">
            Responsible for weekly reports on product metrics.
          </p>
          <p className="text-sm text-[#F8F8FF] leading-relaxed">
            Built weekly product-metrics reports in SQL for three product teams, used to set quarterly growth targets.
          </p>
        </div>

        {/* Result */}
        <div className="px-5 py-4 flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="flex items-baseline gap-2 sm:w-32 flex-shrink-0">
            <span className="font-heading text-4xl font-bold tracking-tight text-[#F8F8FF]">82</span>
            <span className="text-xs text-[#8B8BA3]">/100<br />was 64</span>
          </div>
          <dl className="flex-1 space-y-2">
            {SAMPLE_SCORES.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <dt className="text-[#A0A0B8]">{s.label}</dt>
                  <dd className="text-[#F8F8FF] tabular-nums">{s.value}/{s.max}</dd>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06]" aria-hidden="true">
                  <div className="h-1 rounded-full bg-[#6366F1]" style={{ width: `${(s.value / s.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  const primaryBtn = 'rounded-lg font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors duration-200'
  const secondaryBtn = 'rounded-lg font-medium text-[#F8F8FF] border border-white/15 hover:bg-white/5 transition-colors duration-200'

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-[#0A0A0F] overflow-x-hidden">

        {/* ── Navbar ── */}
        <nav className="sticky top-0 z-50 bg-[#0A0A0F] border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white text-lg">AURI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {[['Features', '#features'], ['How It Works', '#how-it-works'], ['Pricing', '#pricing']].map(([label, href]) => (
                <a key={label} href={href}
                  className="text-sm text-[#A0A0B8] hover:text-white transition-colors duration-200">
                  {label}
                </a>
              ))}
              <Link href="/blog"
                className="text-sm text-[#A0A0B8] hover:text-white transition-colors duration-200">
                Blog
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login"
                className="text-sm text-[#A0A0B8] hover:text-white transition-colors duration-200 hidden md:block">
                Sign In
              </Link>
              <button
                onClick={() => router.push(getStartedRedirect('free'))}
                className={`px-3 py-2 sm:px-4 text-sm ${primaryBtn}`}>
                Get Started Free
              </button>
            </div>
          </div>
        </nav>

        {/* ── 1. Hero: copy + product sample ── */}
        <section className="px-4 md:px-6 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-sm font-medium text-[#818CF8] mb-4">ATS resume toolkit</p>
              <h1 className="font-heading text-[2rem] leading-[1.1] sm:text-5xl lg:text-[3.5rem] font-bold tracking-[-0.02em] text-white mb-6">
                Paste the job description. See what your resume is missing.
              </h1>
              <p className="text-base md:text-lg text-[#A0A0B8] leading-relaxed mb-8 max-w-xl">
                AURI scores your resume against a specific posting on keyword match, achievements,
                formatting, and readability, then rewrites the weak bullets. Your cover letter,
                interview prep, and LinkedIn copy are built from the same profile.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup" className={`px-6 py-3 text-center ${primaryBtn}`}>
                  Start for free
                </Link>
                <Link href="/login" className={`px-6 py-3 text-center ${secondaryBtn}`}>
                  Upload existing resume
                </Link>
              </div>
              <p className="text-sm text-[#8B8BA3] mt-4">3 free AI generations a month. No credit card.</p>
            </div>

            <ProductSample />
          </div>
        </section>

        {/* ── 1.5. Social proof ── */}
        <section className="px-4 md:px-6 py-10 border-t border-white/[0.06]">
          <p className="max-w-6xl mx-auto text-base md:text-lg text-[#A0A0B8]">
            Our users have landed interviews at{' '}
            <span className="text-white font-medium">Amazon</span>,{' '}
            <span className="text-white font-medium">Advantest</span>, and{' '}
            <span className="text-white font-medium">Toss</span>.
          </p>
        </section>

        {/* ── 2. Features ── */}
        <section id="features" className="py-16 md:py-24 px-4 md:px-6 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
            <FadeInSection>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-tight text-white mb-4">
                Enter your experience once. Use it for every application.
              </h2>
              <p className="text-[#A0A0B8] leading-relaxed">
                Every tool reads from the same career profile, so the resume, cover letter, and
                interview answers stay consistent.
              </p>
            </FadeInSection>

            <div className="space-y-12">
              {FEATURE_GROUPS.map((group) => (
                <FadeInSection key={group.title}>
                  <h3 className="text-sm font-semibold text-[#818CF8] mb-2">{group.title}</h3>
                  <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                    {group.items.map((f) => (
                      <li key={f.label}>
                        <Link href={f.href}
                          className="group grid sm:grid-cols-[14rem_1fr_auto] gap-1 sm:gap-6 py-4 items-baseline">
                          <span className="font-heading font-semibold text-white flex items-center gap-2">
                            {f.label}
                            {f.pro && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] text-[#A0A0B8]">PRO</span>
                            )}
                          </span>
                          <span className="text-sm text-[#A0A0B8] leading-relaxed">{f.desc}</span>
                          <span aria-hidden="true"
                            className="hidden sm:block text-sm text-[#60607A] group-hover:text-[#818CF8] transition-colors duration-200">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. How It Works ── */}
        <section id="how-it-works" className="py-16 md:py-24 px-4 md:px-6 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <FadeInSection className="mb-12 max-w-2xl">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-tight text-white">
                How it works
              </h2>
            </FadeInSection>

            <FadeInSection>
            <ol className="grid md:grid-cols-3 gap-10 md:gap-8">
              {[
                { step: '1', title: 'Add your experience', desc: 'Fill in the career profile form, or upload the resume you already have.' },
                { step: '2', title: 'Paste a job description', desc: 'AURI rewrites your bullets toward the posting and scores the match on four dimensions.' },
                { step: '3', title: 'Edit and export', desc: 'Adjust any line in the structured editor, re-check the score, and download a PDF.' },
              ].map((item) => (
                  <li key={item.step} className="border-t border-white/15 pt-5">
                    <span className="block font-heading text-sm font-semibold text-[#818CF8] tabular-nums mb-3">
                      Step {item.step}
                    </span>
                    <h3 className="font-heading text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-[#A0A0B8] leading-relaxed">{item.desc}</p>
                  </li>
              ))}
            </ol>
            </FadeInSection>
          </div>
        </section>

        {/* ── 4. ATS scoring rubric ── */}
        <section id="ats" className="py-16 md:py-24 px-4 md:px-6 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
            <FadeInSection>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-tight text-white mb-4">
                What the ATS score measures
              </h2>
              <p className="text-[#A0A0B8] leading-relaxed">
                Applicant tracking systems parse and filter resumes before a recruiter reads them.
                The score adds up four parts, and each result lists the specific lines to fix.
              </p>
            </FadeInSection>

            <FadeInSection>
              <dl className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {ATS_DIMENSIONS.map((d) => (
                  <div key={d.label} className="grid grid-cols-[1fr_auto] sm:grid-cols-[14rem_1fr_auto] gap-x-6 gap-y-1 py-4 items-baseline">
                    <dt className="font-heading font-semibold text-white">{d.label}</dt>
                    <dd className="col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto text-sm text-[#A0A0B8] leading-relaxed">{d.desc}</dd>
                    <dd className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto text-sm text-[#F8F8FF] tabular-nums text-right">
                      {d.max} pts
                    </dd>
                  </div>
                ))}
              </dl>
            </FadeInSection>
          </div>
        </section>

        {/* ── 5. Pricing ── */}
        <section id="pricing" className="py-16 md:py-24 px-4 md:px-6 border-t border-white/[0.06]">
          <div className="max-w-4xl mx-auto">
            <FadeInSection className="text-center mb-10">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[-0.02em] text-white mb-4">Pricing</h2>
              <p className="text-[#A0A0B8]">Start free. Upgrade when you need the full toolkit.</p>
            </FadeInSection>

            <div className="flex justify-center mb-10">
              <div role="group" aria-label="Billing period"
                className="inline-flex items-center rounded-lg border border-white/[0.08] bg-[#13131A] p-1 gap-1">
                {(['monthly', 'annual'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setBilling(period)}
                    aria-pressed={billing === period}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      billing === period
                        ? 'bg-[#1C1C26] text-white'
                        : 'text-[#A0A0B8] hover:text-white'
                    }`}
                  >
                    {period === 'monthly' ? 'Monthly' : 'Annual · save 17%'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free */}
              <FadeInSection>
                <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 h-full">
                  <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 md:p-8 h-full flex flex-col">
                    <h3 className="font-heading font-semibold text-[#A0A0B8] mb-1">Free</h3>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="font-heading font-bold text-4xl tracking-tight text-white">$0</span>
                      <span className="text-[#8B8BA3] mb-1">/month</span>
                    </div>
                    <p className="text-sm text-[#8B8BA3] mb-6">No card required</p>
                    <ul className="space-y-2 mb-4 flex-1 text-sm text-[#A0A0B8] list-disc pl-5 marker:text-[#60607A]">
                      {FREE_FEATURES.map(f => <li key={f}>{f}</li>)}
                    </ul>
                    <p className="text-sm text-[#8B8BA3] mb-8">
                      LinkedIn, Strategy, Interview, and Rewriter require Pro.
                    </p>
                    <button
                      onClick={() => router.push(getStartedRedirect('free'))}
                      className={`w-full py-3 ${secondaryBtn}`}>
                      Get started
                    </button>
                  </div>
                </div>
              </FadeInSection>

              {/* Pro */}
              <FadeInSection delay={0.08}>
                <div className="rounded-2xl border border-[#6366F1]/40 bg-[#13131A] p-1 h-full">
                  <div className="rounded-xl border border-[#6366F1]/20 bg-[#1C1C26] p-6 md:p-8 h-full flex flex-col">
                    <h3 className="font-heading font-semibold text-[#818CF8] mb-1">Pro</h3>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="font-heading font-bold text-4xl tracking-tight text-white tabular-nums">
                        {billing === 'annual' ? '$15.83' : '$19'}
                      </span>
                      <span className="text-[#8B8BA3] mb-1">/month</span>
                    </div>
                    <p className="text-sm text-[#8B8BA3] mb-6" aria-live="polite">
                      {billing === 'annual' ? '$190 billed once a year, 2 months free' : 'Billed monthly'}
                    </p>
                    <ul className="space-y-2 mb-8 flex-1 text-sm text-[#A0A0B8] list-disc pl-5 marker:text-[#6366F1]">
                      {PRO_FEATURES.map(f => <li key={f}>{f}</li>)}
                    </ul>
                    <button
                      onClick={() => router.push(getStartedRedirect('pro'))}
                      className={`w-full py-3 ${primaryBtn}`}>
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* ── 6. Final CTA ── */}
        <section className="py-16 md:py-24 px-4 md:px-6 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-tight text-white mb-4">
                Check your resume against the next job you apply to.
              </h2>
              <p className="text-[#A0A0B8]">Free to start. No credit card required.</p>
            </div>
            <button
              onClick={() => router.push(getStartedRedirect('free'))}
              className={`px-8 py-3 flex-shrink-0 ${primaryBtn}`}
            >
              Get Started Free
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-4 md:px-6 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-heading font-semibold text-white">AURI</span>
            </div>
            <p className="text-sm text-[#8B8BA3]">© 2026 AURI</p>
            <div className="flex gap-6">
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Contact', href: '/contact' },
              ].map(({ label, href }) => (
                <Link key={label} href={href} className="text-sm text-[#8B8BA3] hover:text-white transition-colors duration-200">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </MotionConfig>
  )
}
