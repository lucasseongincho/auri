'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, FolderOpen, Target, Linkedin,
  Map, Mail, MessageSquare, Settings, ChevronRight,
  Sparkles, User, Cloud, CloudOff, MoreHorizontal, X, Crown,
} from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import { useAuth } from '@/hooks/useAuth'
import { useCareerStore } from '@/store/careerStore'
import CareerProfileDrawer from '@/components/shared/CareerProfileDrawer'
import FeedbackModal from '@/components/shared/FeedbackModal'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const PATH_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/resume': 'Resume Builder',
  '/dashboard/resume/saved': 'My Resumes',
  '/dashboard/ats': 'ATS Optimizer',
  '/dashboard/linkedin': 'LinkedIn',
  '/dashboard/strategy': 'Job Strategy',
  '/dashboard/strategy/saved': 'My Strategies',
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
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', isPro: false },
  { id: 'resume', label: 'Resume Builder', icon: FileText, href: '/dashboard/resume', isPro: false },
  { id: 'my-resumes', label: 'My Resumes', icon: FolderOpen, href: '/dashboard/resume/saved', isPro: false },
  { id: 'ats', label: 'ATS Optimizer', icon: Target, href: '/dashboard/ats', isPro: false },
  { id: 'strategy', label: 'Job Strategy', icon: Map, href: '/dashboard/strategy', isPro: true },
  { id: 'my-strategies', label: 'My Strategies', icon: FolderOpen, href: '/dashboard/strategy/saved', isPro: false },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, href: '/dashboard/linkedin', isPro: true },
  { id: 'cover-letter', label: 'Cover Letter', icon: Mail, href: '/dashboard/cover-letter', isPro: false },
  { id: 'my-cover-letters', label: 'My Cover Letters', icon: FolderOpen, href: '/dashboard/cover-letter/saved', isPro: false },
  { id: 'interview', label: 'Interview Prep', icon: MessageSquare, href: '/dashboard/interview', isPro: true },
]

const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
] as const

const MOBILE_PRIMARY_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'resume', label: 'Resume', icon: FileText, href: '/dashboard/resume' },
  { id: 'my-resumes', label: 'My Resumes', icon: FolderOpen, href: '/dashboard/resume/saved' },
  { id: 'cover-letter', label: 'Cover Letter', icon: Mail, href: '/dashboard/cover-letter' },
] as const

const MOBILE_MORE_ITEMS = [
  { id: 'ats', label: 'ATS Score', icon: Target, href: '/dashboard/ats', isPro: false },
  { id: 'strategy', label: 'Strategy', icon: Map, href: '/dashboard/strategy', isPro: true },
  { id: 'my-strategies', label: 'My Strategies', icon: FolderOpen, href: '/dashboard/strategy/saved', isPro: false },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, href: '/dashboard/linkedin', isPro: true },
  { id: 'my-cover-letters', label: 'My Letters', icon: FolderOpen, href: '/dashboard/cover-letter/saved', isPro: false },
  { id: 'interview', label: 'Interview', icon: MessageSquare, href: '/dashboard/interview', isPro: true },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings', isPro: false },
]

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { user, loading } = useAuth()
  const { isSyncing, syncError, profile } = useCareerStore()
  const userIsPro = profile?.isPro === true

  // Tag Sentry errors with the authenticated user
  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user.uid, email: user.email ?? undefined })
    }
  }, [user])

  // Close More drawer on route change
  useEffect(() => { setMoreDrawerOpen(false) }, [pathname])

  // Auth gate
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
    }
  }, [user, loading, router])

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
    if (href === '/dashboard/strategy') return pathname === '/dashboard/strategy'
    if (href === '/dashboard/strategy/saved') {
      return (
        pathname === '/dashboard/strategy/saved' ||
        pathname.startsWith('/dashboard/strategy/saved/')
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
                  {sidebarExpanded && item.isPro && !userIsPro && !active && (
                    <Crown className="w-3 h-3 text-[#F59E0B] flex-shrink-0 ml-auto" />
                  )}
                  {active && (
                    <div className="ml-auto w-1 h-4 rounded-full bg-[#6366F1] flex-shrink-0" />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

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
      <div className="flex-1 md:ml-[72px] flex flex-col h-screen overflow-x-hidden">
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto">
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
        {MOBILE_PRIMARY_ITEMS.map((item) => {
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
        <button
          onClick={() => setMoreDrawerOpen(true)}
          aria-label="More navigation options"
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl
            transition-colors duration-200 min-w-0 min-h-[44px] justify-center"
        >
          <MoreHorizontal className={`w-5 h-5 ${moreDrawerOpen ? 'text-[#818CF8]' : 'text-[#60607A]'}`} />
          <span className={`text-[9px] font-medium ${moreDrawerOpen ? 'text-[#818CF8]' : 'text-[#60607A]'}`}>More</span>
        </button>
      </nav>

      {/* ── Mobile More Drawer ── */}
      <AnimatePresence>
        {moreDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreDrawerOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SPRING}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50
                bg-[#13131A] border-t border-white/[0.08] rounded-t-2xl"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              {/* Close button */}
              <button
                onClick={() => setMoreDrawerOpen(false)}
                aria-label="Close menu"
                className="absolute top-3 right-4 p-1.5 rounded-lg text-[#60607A] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {/* 3-column grid */}
              <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                {MOBILE_MORE_ITEMS.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link key={item.id} href={item.href} aria-label={item.label}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl
                        transition-colors duration-200 text-center
                        ${active
                          ? 'bg-[#6366F1]/20 text-white'
                          : 'text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/[0.04]'
                        }`}
                    >
                      <item.icon className={`w-5 h-5 ${active ? 'text-[#818CF8]' : ''}`} />
                      {item.isPro && !userIsPro && (
                        <Crown className="w-3 h-3 text-[#F59E0B]" />
                      )}
                      <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
              {/* User section */}
              <div className="border-t border-white/[0.06] mx-4 pt-4 pb-2">
                <button
                  onClick={() => { setMoreDrawerOpen(false); setProfileDrawerOpen(true) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/[0.04] transition-colors duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#A0A0B8]">
                      {user?.displayName ?? user?.email ?? 'Guest'}
                    </p>
                    <p className="text-xs text-[#60607A]">View Profile</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Career Profile Drawer ── */}
      <CareerProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />

      {/* ── Floating Feedback Button ── */}
      {user && (
        <button
          onClick={() => setFeedbackOpen(true)}
          aria-label="Send feedback"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50
            flex items-center gap-2 px-3.5 py-2 rounded-full
            bg-[#13131A] border border-white/[0.10] text-[#A0A0B8]
            hover:text-white hover:border-[#6366F1]/50 hover:bg-[#1C1C26]
            shadow-lg shadow-black/40 transition-all duration-200 text-sm font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#6366F1]" />
          Feedback
        </button>
      )}

      {/* ── Feedback Modal ── */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userEmail={user?.email ?? ''}
      />

    </div>
  )
}
