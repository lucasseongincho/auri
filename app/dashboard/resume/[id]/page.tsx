'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  FileText,
  Loader2,
  LogIn,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCareerStore } from '@/store/careerStore'
import ResumePreview from '@/components/resume/ResumePreview'
import {
  deleteSavedResume,
  getSavedResume,
  getSavedResumes,
  updateSavedResume,
} from '@/lib/firestore'
import type { SavedResume, TemplateId } from '@/types'
import { TEMPLATE_LABELS } from '@/types'

// ─── Constants ─────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: unknown): string {
  try {
    // Firestore serverTimestamp() returns a Timestamp object {seconds, nanoseconds}.
    // Convert it to a JS Date before formatting; fall back to ISO string parsing.
    let date: Date
    if (iso && typeof iso === 'object' && 'seconds' in iso) {
      date = new Date((iso as { seconds: number }).seconds * 1000)
    } else {
      date = new Date(iso as string)
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
}

function atsScoreBg(score: number): string {
  if (score >= 85) return 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]'
  if (score >= 70) return 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]'
  return 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Shimmer skeleton line */
function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return (
    <div className={`${height} ${width} rounded-full bg-white/[0.06] animate-pulse`} />
  )
}

/** Left sidebar skeleton for the resume list */
function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl p-3 border border-white/[0.05] bg-[#1C1C26] space-y-2">
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-1/2" height="h-2.5" />
          <SkeletonLine width="w-1/3" height="h-2" />
        </div>
      ))}
    </div>
  )
}

/** Main content skeleton */
function ContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-xl bg-white/[0.06] animate-pulse" />
        ))}
      </div>
      {/* Metadata card skeleton */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5 space-y-3">
          <SkeletonLine width="w-1/3" height="h-5" />
          <div className="flex gap-6">
            <SkeletonLine width="w-40" />
            <SkeletonLine width="w-36" />
            <SkeletonLine width="w-32" />
          </div>
        </div>
      </div>
      {/* Preview skeleton */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8 space-y-4">
          <SkeletonLine width="w-48 mx-auto" height="h-6" />
          <SkeletonLine width="w-64 mx-auto" />
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLine key={i} width={`w-${[90, 80, 85, 75, 88, 70, 82, 78][i] ?? 80}%`} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Delete confirmation modal */
function DeleteConfirmModal({
  resumeName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  resumeName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4
          bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={SPRING}
          className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
        >
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20
              flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-[#EF4444]" />
            </div>

            <h2 id="delete-dialog-title" className="font-heading font-semibold text-white text-lg mb-2">
              Delete resume?
            </h2>
            <p className="text-sm text-[#A0A0B8] mb-6 leading-relaxed">
              <span className="text-white font-medium">&ldquo;{resumeName}&rdquo;</span> will be
              permanently deleted. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                aria-label="Cancel delete"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                  border border-white/[0.08] text-[#A0A0B8]
                  hover:bg-white/5 hover:text-white
                  transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                aria-label="Confirm delete resume"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                  text-sm font-semibold bg-[#EF4444] text-white
                  hover:bg-[#DC2626] transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/** Sign-in prompt shown when user is not authenticated */
function SignInPrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 w-full max-w-md">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20
            flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-6 h-6 text-[#6366F1]" />
          </div>
          <h2 className="font-heading font-semibold text-white text-xl mb-2">
            Sign in to view saved resumes
          </h2>
          <p className="text-sm text-[#A0A0B8] mb-6 leading-relaxed">
            Your saved resumes are stored securely in the cloud. Sign in to access them from any
            device.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                hover:scale-[1.02] transition-all duration-200"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard/resume"
              className="px-5 py-2.5 rounded-xl text-sm font-medium
                border border-white/[0.08] text-[#A0A0B8]
                hover:bg-white/5 hover:text-white
                transition-all duration-200"
            >
              New resume
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** Not-found state */
function ResumeNotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 w-full max-w-md">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08]
            flex items-center justify-center mx-auto mb-5">
            <FileText className="w-6 h-6 text-[#60607A]" />
          </div>
          <h2 className="font-heading font-semibold text-white text-xl mb-2">
            Resume not found
          </h2>
          <p className="text-sm text-[#A0A0B8] mb-6 leading-relaxed">
            This resume may have been deleted or you may not have permission to view it.
          </p>
          <Link
            href="/dashboard/resume"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
              shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
              hover:scale-[1.02] transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Create new resume
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SavedResumePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { setResume, setSelectedTemplate } = useCareerStore()

  // ── State ────────────────────────────────────────────────────────────────────

  const [resume, setResumeData] = useState<SavedResume | null>(null)
  const [allResumes, setAllResumes] = useState<SavedResume[]>([])
  const [loadingResume, setLoadingResume] = useState(true)
  const [loadingList, setLoadingList] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Delete flow
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sidebar collapsed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Data loading ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !user) {
      setLoadingResume(false)
      setLoadingList(false)
      return
    }

    const uid = user.uid

    // Load the specific resume
    const loadResume = async () => {
      setLoadingResume(true)
      setNotFound(false)
      setError(null)
      try {
        const data = await getSavedResume(uid, params.id)
        if (!data) {
          setNotFound(true)
        } else {
          setResumeData(data)
          // Sync to global store
          setResume(data.resumeData)
          setSelectedTemplate(data.templateId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resume')
      } finally {
        setLoadingResume(false)
      }
    }

    // Load the full list for the sidebar
    const loadList = async () => {
      setLoadingList(true)
      try {
        const list = await getSavedResumes(uid)
        setAllResumes(list)
      } catch {
        // Non-critical; sidebar degrades gracefully
      } finally {
        setLoadingList(false)
      }
    }

    loadResume()
    loadList()
  }, [authLoading, isAuthenticated, user, params.id, setResume, setSelectedTemplate])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTemplateChange = useCallback(
    async (id: TemplateId) => {
      if (!resume || !user) return
      setSelectedTemplate(id)
      setResumeData((prev) => (prev ? { ...prev, templateId: id } : prev))
      try {
        await updateSavedResume(user.uid, resume.id, { templateId: id })
      } catch {
        // Silent — UI already updated optimistically
      }
    },
    [resume, user, setSelectedTemplate]
  )

  const handleDelete = useCallback(async () => {
    if (!user || !resume) return
    setIsDeleting(true)
    try {
      await deleteSavedResume(user.uid, resume.id)
      router.push('/dashboard/resume/saved')
    } catch {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }, [user, resume, router])

  // ── Auth / loading gates ──────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <SignInPrompt />
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6 min-h-[calc(100vh-96px)]">

      {/* ── Left Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 w-[250px]
          hidden lg:flex flex-col
          rounded-2xl border border-white/[0.08] bg-[#13131A] p-1
          self-start sticky top-6
          max-h-[calc(100vh-120px)]
        `}
        aria-label="Saved resumes list"
      >
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] flex flex-col overflow-hidden flex-1">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
            <span className="text-sm font-semibold text-white">Saved Resumes</span>
            <Link
              href="/dashboard/resume"
              aria-label="Create new resume"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#818CF8]
                hover:bg-[#6366F1]/20 transition-all duration-200"
            >
              <Plus className="w-3 h-3" />
              New
            </Link>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {loadingList ? (
              <SidebarSkeleton />
            ) : allResumes.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FileText className="w-6 h-6 text-[#60607A] mx-auto mb-2" />
                <p className="text-xs text-[#60607A]">No saved resumes yet</p>
              </div>
            ) : (
              <ul className="px-2 space-y-1">
                {allResumes.map((r) => {
                  const isActive = r.id === params.id
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/dashboard/resume/${r.id}`}
                        aria-label={`Open ${r.name}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <motion.div
                          whileHover={{ x: 2 }}
                          transition={SPRING}
                          className={`
                            rounded-xl px-3 py-2.5 cursor-pointer
                            transition-colors duration-200
                            ${isActive
                              ? 'bg-[#6366F1]/10 border border-[#6366F1]/20'
                              : 'border border-transparent hover:bg-white/[0.03] hover:border-white/[0.05]'
                            }
                          `}
                        >
                          {/* Resume name */}
                          <p className={`text-sm font-medium leading-snug truncate
                            ${isActive ? 'text-white' : 'text-[#A0A0B8]'}`}>
                            {r.name}
                          </p>

                          {/* Target position / company */}
                          {(r.targetPosition || r.targetCompany) && (
                            <p className="text-xs text-[#60607A] truncate mt-0.5">
                              {[r.targetPosition, r.targetCompany].filter(Boolean).join(' @ ')}
                            </p>
                          )}

                          {/* Date + ATS badge */}
                          <div className="flex items-center justify-between mt-1.5 gap-2">
                            <span className="text-[10px] text-[#60607A] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(r.createdAt)}
                            </span>
                            {r.atsScore !== undefined && (
                              <span className={`
                                text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                                border ${atsScoreBg(r.atsScore)}                              `}>
                                {r.atsScore}%
                              </span>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle resumes list"
          className="w-10 h-10 rounded-xl bg-[#6366F1] text-white flex items-center justify-center
            shadow-lg shadow-[#6366F1]/40 hover:bg-[#4F46E5] transition-all"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -280 }}
            transition={SPRING}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64
              bg-[#13131A] border-r border-white/[0.08] overflow-y-auto p-3 pt-16"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-semibold text-white">Saved Resumes</span>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close resumes list"
                className="p-1 rounded-lg hover:bg-white/5 text-[#60607A] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {loadingList ? (
              <SidebarSkeleton />
            ) : (
              <ul className="space-y-1">
                {allResumes.map((r) => {
                  const isActive = r.id === params.id
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/dashboard/resume/${r.id}`}
                        onClick={() => setSidebarOpen(false)}
                        aria-label={`Open ${r.name}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className={`
                          rounded-xl px-3 py-2.5 cursor-pointer transition-colors duration-200
                          ${isActive
                            ? 'bg-[#6366F1]/10 border border-[#6366F1]/20'
                            : 'border border-transparent hover:bg-white/[0.03]'
                          }
                        `}>
                          <p className={`text-sm font-medium truncate
                            ${isActive ? 'text-white' : 'text-[#A0A0B8]'}`}>
                            {r.name}
                          </p>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <span className="text-[10px] text-[#60607A]">
                              {formatDate(r.createdAt)}
                            </span>
                            {r.atsScore !== undefined && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5
                                rounded-full border ${atsScoreBg(r.atsScore)}`}>
                                {r.atsScore}%
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content area ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Loading state */}
        {loadingResume && <ContentSkeleton />}

        {/* Error state */}
        {!loadingResume && error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-5"
          >
            <p className="text-sm text-[#EF4444] font-medium">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-2 text-xs text-[#A0A0B8] hover:text-white underline"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Not found state */}
        {!loadingResume && notFound && <ResumeNotFound />}

        {/* Loaded resume */}
        {!loadingResume && !error && !notFound && resume && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="flex flex-col gap-4"
          >
            {/* Breadcrumb + action toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
                <Link
                  href="/dashboard/resume"
                  className="text-[#60607A] hover:text-[#A0A0B8] transition-colors"
                >
                  Resumes
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-[#60607A]" />
                <span className="text-[#A0A0B8] truncate max-w-[180px]">{resume.name}</span>
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Back */}
                <Link
                  href="/dashboard/resume"
                  aria-label="Back to resume builder"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                    border border-white/[0.08] text-[#A0A0B8]
                    hover:bg-white/5 hover:text-white transition-all duration-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </Link>

                {/* Edit in Builder */}
                <Link
                  href="/dashboard/resume"
                  aria-label="Edit this resume in the builder"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                    bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors duration-200"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit in Builder
                </Link>

                {/* Delete */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  aria-label="Delete this resume"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                    border border-[#EF4444]/20 text-[#EF4444]/70
                    hover:bg-[#EF4444]/10 hover:text-[#EF4444] hover:border-[#EF4444]/40
                    transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>

            {/* Metadata card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: title block */}
                  <div>
                    <h1 className="font-heading font-semibold text-white text-lg leading-tight">
                      {resume.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                      {resume.targetPosition && (
                        <span className="flex items-center gap-1.5 text-sm text-[#A0A0B8]">
                          <Target className="w-3.5 h-3.5 text-[#6366F1]" />
                          {resume.targetPosition}
                          {resume.targetCompany && (
                            <span className="text-[#60607A]">@ {resume.targetCompany}</span>
                          )}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-sm text-[#60607A]">
                        <Calendar className="w-3.5 h-3.5" />
                        Created {formatDate(resume.createdAt)}
                      </span>
                      {formatDate(resume.updatedAt) !== formatDate(resume.createdAt) && (
                        <span className="text-sm text-[#60607A]">
                          · Updated {formatDate(resume.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: meta chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Template badge */}
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium
                      bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#818CF8]">
                      {TEMPLATE_LABELS[resume.templateId]}
                    </span>

                    {/* ATS score badge */}
                    {resume.atsScore !== undefined && (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold
                        border ${atsScoreBg(resume.atsScore)}`}>
                        ATS {resume.atsScore}%
                      </span>
                    )}

                  </div>
                </div>
              </div>
            </div>

            {/* Resume Preview — PDF targets #resume-content inside ResumePreview, not this wrapper */}
            <ResumePreview
              data={resume.resumeData}
              personal={resume.personalInfo ?? { name: '', email: '', phone: '', location: '', linkedin_url: '', website: '' }}
              isStreaming={false}
              onTemplateChange={handleTemplateChange}
            />

          </motion.div>
        )}
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {showDeleteModal && resume && (
        <DeleteConfirmModal
          resumeName={resume.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
