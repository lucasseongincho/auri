'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, FolderOpen, RefreshCw, Target, Linkedin,
  Map, Mail, MessageSquare, Settings, ChevronRight,
  Sparkles, User, Cloud, CloudOff, FlaskConical,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCareerStore } from '@/store/careerStore'
import { useBetaUsage } from '@/hooks/useBetaUsage'
import { APP_CONFIG } from '@/lib/config'
import CareerProfileDrawer from '@/components/shared/CareerProfileDrawer'
import BetaLimitModal from '@/components/shared/BetaLimitModal'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const PATH_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/resume': 'Resume Builder',
  '/dashboard/resume/saved': 'My Resumes',
  '/dashboard/rewriter': 'Resume Rewriter',
  '/dashboard/ats': 'ATS Optimizer',
  '/dashboard/linkedin': 'LinkedIn',
  '/dashboard/strategy': 'Job Strategy',
  '/dashboard/cover-letter': 'Cover Letter',
  '/dashboard/cover-letter/saved': 'My Cover Letters',
  '/dashboard/interview': 'Interview Prep',
  '/dashboard/settings': 'Settings',
}

function getBreadcrumbLabel(pathname: string): string {
  if (PATH_LABELS[pathname]) return PATH_LABELS[pathname]
  const segments = pathname.split('/').filter(Boolean)
  const parent = segments[segments.length - 2]
  if (parent === 'resume') return 'Saved Resume'
  if (parent === 'cover-letter') return 'Cover Letter'
  const last = segments[segments.length - 1]
  return last ? last.replace(/-/g, ' ') : 'Dashboard'
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'resume', label: 'Resume Builder', icon: FileText, href: '/dashboard/resume' },
  { id: 'my-resumes', label: 'My Resumes', icon: FolderOpen, href: '/dashboard/resume/saved' },
  { id: 'rewriter', label: 'Resume Rewriter', icon: RefreshCw, href: '/dashboard/rewriter' },
  { id: 'ats', label: 'ATS Optimizer', icon: Target, href: '/dashboard/ats' },
  { id: 'strategy', label: 'Job Strategy', icon: Map, href: '/dashboard/strategy' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, href: '/dashboard/linkedin' },
  { id: 'cover-letter', label: 'Cover Letter', icon: Mail, href: '/dashboard/cover-letter' },
  { id: 'my-cover-letters', label: 'My Cover Letters', icon: FolderOpen, href: '/dashboard/cover-letter/saved' },
  { id: 'interview', label: 'Interview Prep', icon: MessageSquare, href: '/dashboard/interview' },
] as const

const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
] as const

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const { user, loading } = useAuth()
  const { isSyncing, syncError, isGenerating } = useCareerStore()
  const [betaRefreshKey, setBetaRefreshKey] = useState(0)
  const prevGenerating = useRef(false)
  const betaUsage = useBetaUsage(APP_CONFIG.BETA_MODE ? user?.uid : undefined, betaRefreshKey)

  // Refresh beta usage counter after each AI generation completes
  useEffect(() => {
    if (prevGenerating.current && !isGenerating) {
      setBetaRefreshKey((k) => k + 1)
    }
    prevGenerating.current = isGenerating
  }, [isGenerating])
  const isOwner = user?.email === process.env.NEXT_PUBLIC_OWNER_EMAIL && !!process.env.NEXT_PUBLIC_OWNER_EMAIL

  // Auth + beta gate
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!APP_CONFIG.BETA_MODE) return
    if (isOwner) return
    // Only redirect once we have usage data confirming they're not approved
    if (betaUsage && !betaUsage.betaApproved) {
      router.replace('/beta-access')
    }
  }, [betaUsage, user, loading, router, isOwner])

  const isActive = (href: string) => {
    // Dashboard: exact match only
    if (href === '/dashboard') return pathname === '/dashboard'
    // Resume Builder: exact match only — prevents /resume/saved and /resume/[id] from also lighting it up
    if (href === '/dashboard/resume') return pathname === '/dashboard/resume'
    // My Resumes: active on /dashboard/resume/saved AND any individual saved resume (/dashboard/resume/[id])
    if (href === '/dashboard/resume/saved') {
      return (
        pathname === '/dashboard/resume/saved' ||
        (pathname.startsWith('/dashboard/resume/') && pathname !== '/dashboard/resume')
      )
    }
    // Cover Letter: exact match only — prevents /cover-letter/saved and /cover-letter/[id] from lighting it up
    if (href === '/dashboard/cover-letter') return pathname === '/dashboard/cover-letter'
    // My Cover Letters: active on /saved AND any individual letter (/dashboard/cover-letter/[id])
    if (href === '/dashboard/cover-letter/saved') {
      return (
        pathname === '/dashboard/cover-letter/saved' ||
        (pathname.startsWith('/dashboard/cover-letter/') &&
          pathname !== '/dashboard/cover-letter' &&
          pathname !== '/dashboard/cover-letter/saved')
      )
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarExpanded ? 240 : 72 }}
        transition={SPRING}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40
          border-r border-white/[0.06] bg-[#13131A] overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
            flex items-center justify-center shadow-lg shadow-[#6366F1]/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="font-heading font-bold text-white text-base whitespace-nowrap"
              >
                AURI
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.id} href={item.href} aria-label={item.label}>
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={SPRING}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                    transition-colors duration-200 group
                    ${active
                      ? 'bg-[#6366F1]/20 text-white'
                      : 'text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/[0.04]'
                    }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#818CF8]' : ''}`} />
                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.12 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {active && (
                    <div className="ml-auto w-1 h-4 rounded-full bg-[#6366F1] flex-shrink-0" />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Beta usage indicator */}
        {APP_CONFIG.BETA_MODE && sidebarExpanded && isOwner && (
          <div className="px-2 pb-2">
            <div className="rounded-xl bg-[#0A0A0F] border border-white/[0.06] p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3 text-[#6366F1] flex-shrink-0" />
                <span className="text-xs font-semibold text-[#A0A0B8]">Beta Access</span>
              </div>
              <p className="text-[10px] text-[#22C55E]">Unlimited calls (owner)</p>
            </div>
          </div>
        )}
        {APP_CONFIG.BETA_MODE && betaUsage && sidebarExpanded && !isOwner && (
          <div className="px-2 pb-2">
            <div className="rounded-xl bg-[#0A0A0F] border border-white/[0.06] p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-3 h-3 text-[#6366F1] flex-shrink-0" />
                <span className="text-xs font-semibold text-[#A0A0B8]">Beta Access</span>
              </div>
              {betaUsage.remainingCalls === 0 ? (
                <p className="text-[10px] text-[#EF4444] leading-snug">
                  Weekly limit reached. Resets {betaUsage.resetsOn} 🔄
                </p>
              ) : (
                <>
                  <div
                    className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"
                    title={`Each AI generation uses 1 call. Easy Tune assists also count as 1 call each.`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((betaUsage.callsThisWeek / APP_CONFIG.BETA_WEEKLY_CALL_LIMIT) * 100, 100)}%`,
                        backgroundColor:
                          betaUsage.callsThisWeek >= 18
                            ? '#EF4444'
                            : betaUsage.callsThisWeek >= 14
                            ? '#F59E0B'
                            : '#22C55E',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#60607A]">
                    {betaUsage.callsThisWeek}/{APP_CONFIG.BETA_WEEKLY_CALL_LIMIT} calls · Resets {betaUsage.resetsOn}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom: sync status + settings + user */}
        <div className="py-4 px-2 border-t border-white/[0.06] space-y-1">
          {/* Sync indicator */}
          <AnimatePresence>
            {sidebarExpanded && (isSyncing || syncError) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs
                  ${syncError ? 'text-[#EF4444]' : 'text-[#60607A]'}`}
              >
                {syncError ? <CloudOff className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5 animate-pulse" />}
                {syncError ? 'Sync failed' : 'Syncing...'}
              </motion.div>
            )}
          </AnimatePresence>

          {BOTTOM_ITEMS.map((item) => (
            <Link key={item.id} href={item.href} aria-label={item.label}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                transition-colors duration-200
                ${isActive(item.href) ? 'bg-[#6366F1]/20 text-white' : 'text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/[0.04]'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          ))}

          {/* User */}
          <button
            onClick={() => setProfileDrawerOpen(true)}
            aria-label="Open career profile"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              cursor-pointer transition-colors duration-200
              text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/[0.04]"
          >
            <div className="w-5 h-5 flex-shrink-0 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-xs font-medium text-[#A0A0B8] truncate">
                    {user?.displayName ?? user?.email ?? 'Guest'}
                  </p>
                  <p className="text-[10px] text-[#60607A]">Pro</p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-[72px] flex flex-col h-screen">
        {/* Top header */}
        <header className="flex-shrink-0 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl px-6 py-4
          flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu - handled by bottom nav, this is a breadcrumb area */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <ChevronRight className="w-4 h-4 text-[#60607A]" />
              <span className="text-[#A0A0B8] capitalize">
                {getBreadcrumbLabel(pathname)}
              </span>
            </div>
            {/* Mobile: show logo */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-heading font-bold text-white">AURI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSyncing && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-[#60607A]">
                <Cloud className="w-3.5 h-3.5 animate-pulse" />
                Saving...
              </div>
            )}
            <button
              onClick={() => setProfileDrawerOpen(true)}
              aria-label="Open career profile drawer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10
                hover:bg-white/5 transition-all duration-200"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-[#A0A0B8] hidden sm:block">
                {user?.displayName ?? 'Profile'}
              </span>
            </button>
          </div>
        </header>

        {/* Page content — flex-1 overflow-y-auto so child pages that use h-full get a real height */}
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {/* Owner beta status banner */}
          {isOwner && APP_CONFIG.BETA_MODE && (
            <div className="mb-4 rounded-lg px-4 py-2 text-sm flex justify-between items-center
              bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#A5B4FC]">
              <span>🧪 Beta Mode is ON — all approved users get {APP_CONFIG.BETA_WEEKLY_CALL_LIMIT} calls/week free.</span>
              <span className="font-mono text-xs text-[#818CF8]">Set BETA_MODE = false in lib/config.ts to go paid</span>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40
        border-t border-white/[0.06] bg-[#13131A]/95 backdrop-blur-xl
        flex items-center justify-around px-2 pt-2"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        aria-label="Mobile navigation"
      >
        {[...NAV_ITEMS.slice(0, 4), ...BOTTOM_ITEMS].map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.id} href={item.href} aria-label={item.label}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl
                transition-colors duration-200 min-w-0 min-h-[44px] justify-center">
              <item.icon className={`w-5 h-5 ${active ? 'text-[#818CF8]' : 'text-[#60607A]'}`} />
              <span className={`text-[9px] font-medium truncate ${active ? 'text-[#818CF8]' : 'text-[#60607A]'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Career Profile Drawer ── */}
      <CareerProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />

      {/* ── Beta Limit Modal ── */}
      <BetaLimitModal />
    </div>
  )
}
