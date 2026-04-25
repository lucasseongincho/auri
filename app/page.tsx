'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import {
  FileText, Edit3, Layout, RefreshCw, Linkedin,
  Map, Mail, MessageSquare, CheckCircle, ArrowRight,
  Sparkles, Target, ChevronRight,
} from 'lucide-react'
import { APP_CONFIG } from '@/lib/config'
import { getStartedRedirect } from '@/lib/getStartedRedirect'

// Spring config per CLAUDE.md §9
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const SPRING_SLOW = { type: 'spring' as const, stiffness: 200, damping: 25 }

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCounter(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, start])
  return count
}

// ── Magnetic button effect ────────────────────────────────────────────────────
function MagneticButton({
  children,
  className,
  onClick,
  href,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15
    setPos({ x, y })
  }

  const handleMouseLeave = () => setPos({ x: 0, y: 0 })

  const content = (
    <motion.div
      ref={ref}
      animate={{ x: pos.x, y: pos.y }}
      transition={SPRING}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}

// ── Section wrapper with scroll-triggered fade-in ─────────────────────────────
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
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ ...SPRING_SLOW, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Feature data ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: FileText, label: 'Smart Resume Builder', desc: 'AI-generated, ATS-optimized resumes tailored to every job', href: '/dashboard/resume', color: 'from-[#6366F1] to-[#4F46E5]' },
  { icon: Target, label: 'ATS Score & Optimizer', desc: 'Real-time match score with one-click fix suggestions', href: '/dashboard/ats', color: 'from-[#8B5CF6] to-[#6366F1]' },
  { icon: Edit3, label: 'Easy Tune Editor', desc: 'Inline editing with per-bullet AI rewrites', href: '/dashboard/resume', color: 'from-[#A78BFA] to-[#8B5CF6]' },
  { icon: Layout, label: 'Resume Templates', desc: '5 premium templates that still pass ATS', href: '/dashboard/resume', color: 'from-[#6366F1] to-[#8B5CF6]' },
  { icon: RefreshCw, label: 'Resume Rewriter', desc: 'Transform your existing resume for any new role', href: '/dashboard/rewriter', color: 'from-[#4F46E5] to-[#6366F1]' },
  { icon: Linkedin, label: 'LinkedIn Rewriter', desc: 'Attract recruiters with an optimized profile', href: '/dashboard/linkedin', color: 'from-[#0EA5E9] to-[#6366F1]' },
  { icon: Map, label: '7-Day Job Strategy', desc: 'A personalized, day-by-day job search action plan', href: '/dashboard/strategy', color: 'from-[#22C55E] to-[#16A34A]' },
  { icon: Mail, label: 'Cover Letter Generator', desc: '280-300 word letters that open doors', href: '/dashboard/cover-letter', color: 'from-[#F59E0B] to-[#D97706]' },
  { icon: MessageSquare, label: 'Interview Prep', desc: '8 likely questions + STAR frameworks + flip cards', href: '/dashboard/interview', color: 'from-[#EF4444] to-[#DC2626]' },
]

// TODO: Replace with real testimonials after beta

const TEMPLATES = [
  { id: 'classic-pro', label: 'Classic Pro', desc: 'Timeless. Maximum ATS safety.' },
  { id: 'modern-edge', label: 'Modern Edge', desc: 'Sidebar layout with accent strip.' },
  { id: 'executive-dark', label: 'Executive Dark', desc: 'Premium typography for senior roles.' },
  { id: 'creative-pulse', label: 'Creative Pulse', desc: 'Bold name treatment for creative fields.' },
  { id: 'minimal-seoul', label: 'Minimal Seoul', desc: 'Ultra-minimal, inspired by Korean design.' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const atsRef = useRef(null)
  const atsInView = useInView(atsRef, { once: true })
  const atsScore = useCounter(87, 2500, atsInView)

  return (
    <main className="min-h-screen bg-[#0A0A0F] overflow-x-hidden">

      {/* ── Glass Navbar ── */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50
        rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
        shadow-xl shadow-black/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-lg">AURI</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Templates', 'Pricing'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm text-[#A0A0B8] hover:text-white transition-colors duration-200">
              {item}
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
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
              shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
              hover:scale-[1.02] transition-all duration-200">
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 px-6">
        {/* Gradient background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full
            bg-[#6366F1]/10 blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full
            bg-[#8B5CF6]/8 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                border border-[#6366F1]/30 bg-[#6366F1]/10 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
              <span className="text-xs font-medium text-[#818CF8]">Powered by AURI</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.2 }}
              className="font-heading text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6"
            >
              Get Hired{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#A78BFA]">
                Faster
              </span>{' '}
              with AI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.3 }}
              className="text-lg text-[#A0A0B8] leading-relaxed mb-8 max-w-lg"
            >
              Generate ATS-optimized resumes, rewrite your LinkedIn, craft cover letters,
              and prepare for interviews — all from one AI-powered career toolkit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <MagneticButton href="/login"
                className="px-8 py-4 rounded-xl font-semibold text-white cursor-pointer
                  bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                  shadow-lg shadow-[#6366F1]/30 hover:shadow-[#6366F1]/60
                  hover:scale-[1.02] transition-all duration-200 text-center">
                Start for Free
                <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </MagneticButton>
              <MagneticButton href="/login"
                className="px-8 py-4 rounded-xl font-medium cursor-pointer
                  border border-white/15 text-[#A0A0B8] hover:text-white
                  hover:bg-white/5 transition-all duration-200 text-center">
                Upload Existing Resume
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4 mt-8"
            >
              <div className="flex -space-x-2">
                {['#6366F1', '#8B5CF6', '#A78BFA', '#818CF8'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0F]"
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-sm text-[#60607A]">
                🧪 Currently in <span className="text-white font-medium">private beta</span>
              </p>
            </motion.div>
          </div>

          {/* Right — floating resume preview mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 3 }}
            transition={{ ...SPRING_SLOW, delay: 0.3 }}
            className="hidden lg:block relative"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          >
            <div className="rounded-2xl border border-white/10 bg-[#13131A] p-1 shadow-2xl shadow-[#6366F1]/10">
              <div className="rounded-xl bg-[#1C1C26] p-6 min-h-[480px]">
                {/* Fake resume content */}
                <div className="border-b border-white/10 pb-4 mb-4">
                  <div className="h-6 w-48 rounded bg-gradient-to-r from-[#6366F1]/30 to-[#8B5CF6]/30 mb-2" />
                  <div className="h-3 w-64 rounded bg-white/10 mb-1" />
                  <div className="h-3 w-56 rounded bg-white/[0.06]" />
                </div>
                <div className="mb-4">
                  <div className="h-3 w-24 rounded bg-[#6366F1]/40 mb-2" />
                  <div className="space-y-1.5">
                    {[80, 90, 70, 85].map((w, i) => (
                      <div key={i} className="h-2.5 rounded bg-white/[0.07]" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="h-3 w-28 rounded bg-[#6366F1]/40 mb-2" />
                  <div className="h-4 w-40 rounded bg-white/10 mb-1" />
                  <div className="space-y-1.5 ml-3">
                    {[75, 88, 65].map((w, i) => (
                      <div key={i} className="h-2 rounded bg-white/[0.06]" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-4">
                  {[60, 50, 70, 55, 65].map((w, i) => (
                    <div key={i} className="h-6 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/30"
                      style={{ width: `${w}px` }} />
                  ))}
                </div>
                {/* ATS badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5
                  rounded-full bg-[#22C55E]/20 border border-[#22C55E]/30">
                  <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-xs font-medium text-[#22C55E]">ATS 94%</span>
                </div>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute inset-0 rounded-2xl bg-[#6366F1]/5 blur-xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ── 2. Beta Banner (replaces social proof — TODO: Replace with real testimonials after beta) ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInSection>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
              border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#818CF8] text-xs font-semibold
              tracking-wide mb-6">
              🧪 Private Beta
            </div>

            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Built for real job seekers
            </h2>
            <p className="text-[#A0A0B8] text-lg max-w-xl mx-auto mb-12 leading-relaxed">
              AURI is currently in private beta. Every feature was designed to solve real hiring
              challenges. Your feedback shapes what we build next.
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { stat: '9 AI-powered tools', desc: 'Resume, cover letter, interview prep, and more' },
                { stat: 'ATS-optimized output', desc: 'Structured for Workday, Greenhouse, Lever & iCIMS' },
                { stat: 'Built with AURI AI', desc: 'Powered by Anthropic\'s most capable model' },
              ].map((item, i) => (
                <FadeInSection key={item.stat} delay={i * 0.1}>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 h-full">
                    <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 h-full flex flex-col items-center text-center gap-2">
                      <p className="font-heading font-bold text-white text-lg">{item.stat}</p>
                      <p className="text-xs text-[#60607A] leading-snug">{item.desc}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── 3. Features Grid ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#6366F1] mb-3 block">
              Everything you need
            </span>
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              One toolkit. Every career need.
            </h2>
            <p className="text-[#A0A0B8] max-w-xl mx-auto">
              Every feature shares your career data. Enter your experience once — use it everywhere.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            style={{ gridAutoRows: '1fr' }}>
            {FEATURES.map((f, i) => (
              <FadeInSection key={f.label} delay={i * 0.05} className="h-full">
                <Link href={f.href} className="h-full block">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={SPRING}
                    className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 cursor-pointer group h-full"
                  >
                    <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 h-full flex flex-col justify-start">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 flex-shrink-0
                        group-hover:shadow-lg group-hover:shadow-[#6366F1]/20 transition-shadow duration-300`}>
                        <f.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-heading font-semibold text-white mb-1.5">{f.label}</h3>
                      <p className="text-sm text-[#60607A] leading-relaxed flex-1">{f.desc}</p>
                      <div className="flex items-center gap-1 mt-3 text-[#6366F1] text-xs font-medium
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Try it <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. How It Works ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-[#A0A0B8]">From zero to hired in three steps.</p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line — z-0 so it sits behind the step boxes */}
            <div className="hidden md:block absolute left-0 right-0 h-px bg-gradient-to-r from-[#6366F1]/50 to-[#8B5CF6]/50"
              style={{ top: '40px', zIndex: 0 }} />

            {[
              { step: '01', title: 'Add Your Experience', desc: 'Fill in your background or paste your existing resume. Takes 3 minutes.' },
              { step: '02', title: 'AI Magic Happens', desc: 'Claude rewrites, optimizes, and tailors everything to your target role.' },
              { step: '03', title: 'Get Hired', desc: 'Download your ATS-optimized resume, apply, and land the interview.' },
            ].map((item, i) => (
              <FadeInSection key={item.step} delay={i * 0.15}>
                <div className="text-center relative" style={{ zIndex: 1 }}>
                  <div className="w-20 h-20 rounded-2xl bg-[#0A0A0F] bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20
                    border border-[#6366F1]/30 flex items-center justify-center mx-auto mb-4">
                    <span className="font-heading font-bold text-2xl
                      bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-[#60607A] leading-relaxed">{item.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. ATS Section ── */}
      <section id="ats" className="py-24 px-6" ref={atsRef}>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-10 lg:p-16
              grid lg:grid-cols-2 gap-12 items-center">
              {/* Score meter */}
              <FadeInSection className="text-center">
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <motion.circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke="url(#scoreGradient)" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                      animate={atsInView ? {
                        strokeDashoffset: 2 * Math.PI * 50 * (1 - atsScore / 100)
                      } : {}}
                      transition={{ duration: 2.5, ease: 'easeOut' }}
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#22C55E" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading font-bold text-4xl text-white">{atsScore}</span>
                    <span className="text-sm text-[#A0A0B8]">ATS Score</span>
                  </div>
                </div>
                <p className="text-[#22C55E] font-medium mt-4">Excellent Match</p>
              </FadeInSection>

              {/* Copy */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#6366F1] mb-3 block">
                  Why ATS matters
                </span>
                <h2 className="font-heading text-3xl font-bold text-white mb-4">
                  75% of resumes are rejected before a human sees them
                </h2>
                <p className="text-[#A0A0B8] leading-relaxed mb-6">
                  Applicant Tracking Systems filter resumes by keyword match, formatting,
                  and structure before any recruiter reads them. AURI ensures you
                  pass every filter.
                </p>
                <ul className="space-y-3">
                  {[
                    'Keyword optimization from the actual job description',
                    'ATS-safe formatting — no tables, no columns',
                    'Standard section headers every system recognizes',
                    'Real-time score with specific fix suggestions',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-[#22C55E] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[#A0A0B8]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Templates Preview ── */}
      <section id="templates" className="py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <FadeInSection className="text-center mb-12">
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              5 premium resume templates
            </h2>
            <p className="text-[#A0A0B8]">Visually stunning. ATS-safe. Switch anytime without losing your content.</p>
          </FadeInSection>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {TEMPLATES.map((t) => (
              <motion.div
                key={t.id}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={SPRING}
                className="flex-shrink-0 w-56 rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 cursor-pointer"
              >
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4">
                  {/* Mini template preview */}
                  <div className="w-full h-32 rounded-lg bg-gradient-to-br
                    from-white/[0.04] to-white/[0.02] mb-3 flex flex-col p-3 gap-1.5">
                    <div className="h-3 w-20 rounded bg-[#6366F1]/40" />
                    <div className="h-2 w-16 rounded bg-white/20" />
                    <div className="h-px w-full bg-white/10 my-1" />
                    <div className="h-2 w-12 rounded bg-white/30 mb-1" />
                    {[70, 85, 60].map((w, j) => (
                      <div key={j} className="h-1.5 rounded bg-white/[0.08]" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <p className="font-heading font-semibold text-white text-sm">{t.label}</p>
                  <p className="text-xs text-[#60607A] mt-0.5">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-white mb-4">Simple pricing</h2>
            <p className="text-[#A0A0B8]">Start free. Upgrade when you land the job.</p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <FadeInSection>
              <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8">
                  <p className="font-heading font-semibold text-[#A0A0B8] mb-1">Free</p>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="font-heading font-bold text-4xl text-white">$0</span>
                    <span className="text-[#60607A] mb-1">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {['3 resume generations/month', 'All 5 templates', 'ATS scoring', 'Cover letter generator'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                        <CheckCircle className="w-4 h-4 text-[#22C55E]" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => router.push(getStartedRedirect('free'))}
                    className="w-full py-3 rounded-xl border border-white/15
                      text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all duration-200 font-medium">
                    Get Started
                  </button>
                </div>
              </div>
            </FadeInSection>

            {/* Pro */}
            <FadeInSection delay={0.1}>
              <div className="rounded-2xl border border-[#6366F1]/40 bg-[#13131A] p-1 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full
                  bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-semibold">
                  {APP_CONFIG.BETA_MODE ? '🧪 Beta' : 'Most Popular'}
                </div>
                <div className="rounded-xl border border-[#6366F1]/20 bg-[#1C1C26] p-8">
                  <p className="font-heading font-semibold text-[#818CF8] mb-1">Pro</p>
                  {APP_CONFIG.BETA_MODE ? (
                    <div className="mb-6">
                      <div className="flex items-end gap-2">
                        <span className="font-heading font-bold text-4xl text-white">Free</span>
                        <span className="text-[#60607A] mb-1">during beta</span>
                      </div>
                      <p className="text-sm text-[#60607A] mt-1 line-through">$19/month after beta</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1 mb-6">
                      <span className="font-heading font-bold text-4xl text-white">$19</span>
                      <span className="text-[#60607A] mb-1">/month</span>
                    </div>
                  )}
                  <ul className="space-y-3 mb-8">
                    {[
                      'Unlimited generations',
                      'All Free features',
                      'LinkedIn rewriter',
                      '7-day job strategy',
                      'Interview prep system',
                      'Priority support',
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                        <CheckCircle className="w-4 h-4 text-[#6366F1]" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => router.push(getStartedRedirect('pro'))}
                    className="w-full py-3 rounded-xl font-semibold text-white
                      bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                      shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                      hover:scale-[1.02] transition-all duration-200">
                    {APP_CONFIG.BETA_MODE ? 'Join Beta' : 'Start Pro Free'}
                  </button>
                  {APP_CONFIG.BETA_MODE && (
                    <p className="text-center text-xs text-[#22C55E] mt-3">
                      Full Pro access while we&apos;re in beta 🎉
                    </p>
                  )}
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ── 8. Final CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20" />
            <div className="absolute inset-0 border border-[#6366F1]/30 rounded-2xl" />
            <div className="relative p-12 lg:p-16 text-center">
              <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4">
                Your next job is waiting.
              </h2>
              <p className="text-lg text-[#A0A0B8] mb-8 max-w-xl mx-auto">
                Join the private beta and get early access to every feature.
                Invite code required.
              </p>

              <button
                onClick={() => router.push(getStartedRedirect('free'))}
                className="px-8 py-3 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                  shadow-lg shadow-[#6366F1]/30 hover:shadow-[#6366F1]/60
                  hover:scale-[1.02] transition-all duration-200"
              >
                Get Started Free
              </button>

              <p className="text-xs text-[#60607A] mt-4">
                Private beta · Invite code required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-heading font-semibold text-white">AURI</span>
          </div>
          <p className="text-sm text-[#60607A]">© 2026 AURI. Powered by AI.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <a key={link} href="#" className="text-sm text-[#60607A] hover:text-white transition-colors duration-200">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
