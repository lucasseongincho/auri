'use client'

import { useLocale } from '@/lib/i18n/client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, Check, ChevronRight, LogIn, Pencil, Plus, Trash2, X } from 'lucide-react'
import { IconAtsOptimizer, IconLoading, IconResumeBuilder } from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'
import { useCareerStore } from '@/store/careerStore'
import { useLetterScale } from '@/hooks/useLetterScale'
import ResumePreview from '@/components/resume/ResumePreview'
import ResumeEditor from '@/components/resume/ResumeEditor'
import {
  deleteSavedResume,
  getSavedResume,
  getSavedResumes,
  updateSavedResume,
} from '@/lib/firestore'
import type { ResumeData, SavedResume } from '@/types'
import { TEMPLATE_LABELS } from '@/types'

// ─── Constants ─────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(locale: 'en' | 'ko', iso: unknown): string {
  try {
    // Firestore serverTimestamp() returns a Timestamp object {seconds, nanoseconds}.
    // Convert it to a JS Date before formatting; fall back to ISO string parsing.
    let date: Date
    if (iso && typeof iso === 'object' && 'seconds' in iso) {
      date = new Date((iso as { seconds: number }).seconds * 1000)
    } else {
      date = new Date(iso as string)
    }
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      month: locale === 'ko' ? 'long' : 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
}

function atsScoreBg(score: number): string {
  if (score >= 85) return 'bg-[#1F7A4D]/10 border-[#1F7A4D]/20 text-[#1F7A4D]'
  if (score >= 70) return 'bg-[#8A5A00]/10 border-[#8A5A00]/20 text-[#8A5A00]'
  return 'bg-[#B42318]/10 border-[#B42318]/20 text-[#B42318]'
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Shimmer skeleton line */
function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return (
    <div className={`${height} ${width} rounded-full bg-lp-ink/6 animate-pulse`} />
  )
}

/** Left sidebar skeleton for the resume list */
function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[10px] p-3  bg-[#FFFFFF] space-y-2">
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
          <div key={i} className="h-9 w-28 rounded-[10px] bg-lp-ink/6 animate-pulse" />
        ))}
      </div>
      {/* Metadata card skeleton */}
      <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-5 space-y-3">
          <SkeletonLine width="w-1/3" height="h-5" />
          <div className="flex gap-6">
            <SkeletonLine width="w-40" />
            <SkeletonLine width="w-36" />
            <SkeletonLine width="w-32" />
          </div>
        </div>
      </div>
      {/* Preview skeleton */}
      <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-8 space-y-4">
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
  const { t, locale } = useLocale()
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4
          bg-black/60 "
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={SPRING}
          className="w-full max-w-md rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
        >
          <div className="rounded-[10px]  bg-[#FFFFFF] p-6">
            {/* Icon */}
            <div className="w-12 h-12 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20
              flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-[#B42318]" />
            </div>

            <h2 id="delete-dialog-title" className="font-heading font-semibold text-lp-ink text-lg mb-2">
              {t("Delete resume?")}
            </h2>
            <p className="text-sm text-[#3C403E] mb-6 leading-relaxed">
              <span className="text-lp-ink font-medium">{t("“{v0}”", { v0: resumeName })}</span>{' '}{t("will be permanently deleted. This action cannot be undone.")}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                aria-label={t("Cancel delete")}
                className="flex-1 px-4 py-2.5 rounded-[4px] text-sm font-medium
                  border border-lp-rule text-[#3C403E]
                  hover:bg-lp-ink/5 hover:text-lp-ink
                  transition-all duration-200 disabled:opacity-50"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                aria-label={t("Confirm delete resume")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px]
                  text-sm font-semibold bg-[#B42318] text-white
                  hover:bg-[#912018] transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <IconLoading className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeleting ? 'Deleting...' : t("Delete")}
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
  const { t, locale } = useLocale()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 w-full max-w-md">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-8 text-center">
          <div className="w-14 h-14 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20
            flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-6 h-6 text-[#1F5C4A]" />
          </div>
          <h2 className="font-heading font-semibold text-lp-ink text-xl mb-2">
            {t("Sign in to view saved resumes")}
          </h2>
          <p className="text-sm text-[#3C403E] mb-6 leading-relaxed">
            {t("Your saved resumes are stored securely in the cloud. Sign in to access them from any device.")}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-[4px] text-sm font-semibold
                bg-[#1F5C4A] text-white
                 transition-all duration-200"
            >
              {t("Sign in")}
            </Link>
            <Link
              href="/dashboard/resume"
              className="px-5 py-2.5 rounded-[4px] text-sm font-medium
                border border-lp-rule text-[#3C403E]
                hover:bg-lp-ink/5 hover:text-lp-ink
                transition-all duration-200"
            >
              {t("New resume")}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** Not-found state */
function ResumeNotFound() {
  const { t, locale } = useLocale()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 w-full max-w-md">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-8 text-center">
          <div className="w-14 h-14 rounded-[10px] bg-lp-ink/[0.04] border border-lp-rule
            flex items-center justify-center mx-auto mb-5">
            <IconResumeBuilder className="w-6 h-6 text-[#5A5F5C]" />
          </div>
          <h2 className="font-heading font-semibold text-lp-ink text-xl mb-2">
            {t("Resume not found")}
          </h2>
          <p className="text-sm text-[#3C403E] mb-6 leading-relaxed">
            {t("This resume may have been deleted or you may not have permission to view it.")}
          </p>
          <Link
            href="/dashboard/resume"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-sm font-semibold
              bg-[#1F5C4A] text-white
               transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            {t("Create new resume")}
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SavedResumePage() {
  const { t, locale } = useLocale()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { setResume, currentResume, profile } = useCareerStore()
  // Measure the shared wrapper that holds both view and edit modes.
  // innerPadding=8 accounts for the p-1 card (4px × 2 sides) sitting between
  // this container and the actual template, so the scale is identical in both modes.
  const { containerRef: editContainerRef, scale: editScale } = useLetterScale(8)

  // ── State ────────────────────────────────────────────────────────────────────

  const [resume, setResumeData] = useState<SavedResume | null>(null)
  const [allResumes, setAllResumes] = useState<SavedResume[]>([])
  const [loadingResume, setLoadingResume] = useState(true)
  const [loadingList, setLoadingList] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedResumeData, setEditedResumeData] = useState<ResumeData | null>(null)
  // Ref stays in sync synchronously so handleSaveEdits always reads the latest
  // data even when the blur→setState hasn't re-rendered yet at click time.
  const editedResumeDataRef = useRef<ResumeData | null>(null)
  const appliedFromATS = useRef(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

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

    // Pre-seed the preview from Zustand when arriving from Apply to Editor.
    // handleApplySuggestions sets id: selectedResume.id on currentResume before navigating here,
    // so this condition is only true for the exact resume that was just applied to.
    const isFromApply = currentResume !== null && currentResume.id === params.id && resume === null
    if (isFromApply) {
      const seed: SavedResume = {
        id: params.id,
        name: '',
        targetPosition: '',
        targetCompany: '',
        templateId: currentResume.templateId,
        resumeData: currentResume,
        personalInfo: profile?.personal ?? {
          name: '', email: '', phone: '', location: '', linkedin_url: '', website: '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setResumeData(seed)
      editedResumeDataRef.current = currentResume
      setEditedResumeData(currentResume)
      setLoadingResume(false)
      appliedFromATS.current = true
    }

    // Load the specific resume
    const loadResume = async () => {
      // Skip the loading skeleton if we pre-seeded from Zustand — the preview is already visible.
      if (!isFromApply) {
        setLoadingResume(true)
      }
      setNotFound(false)
      setError(null)
      try {
        const data = await getSavedResume(uid, params.id)
        if (!data) {
          setNotFound(true)
        } else if (appliedFromATS.current) {
          // Keep the pre-seeded resumeData (which has the applied changes) but update
          // metadata fields from Firestore (name, personalInfo, atsScore, etc.).
          // Zustand already has the correct resumeData from handleApplySuggestions.
          setResumeData((prev) => prev ? { ...data, resumeData: prev.resumeData } : data)
          appliedFromATS.current = false
        } else {
          setResumeData(data)
          editedResumeDataRef.current = data.resumeData
          setEditedResumeData(data.resumeData)
          setResume(data.resumeData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Failed to load resume"))
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
  }, [authLoading, isAuthenticated, user, params.id, setResume])

  // ── Handlers ─────────────────────────────────────────────────────────────────


  const handleSaveEdits = useCallback(async () => {
    const dataToSave = editedResumeDataRef.current ?? editedResumeData
    if (!user || !resume || !dataToSave) return
    setSaving(true)
    try {
      await updateSavedResume(user.uid, resume.id, {
        resumeData: dataToSave,
        updatedAt: new Date().toISOString(),
      })
      setResumeData((prev) => prev ? { ...prev, resumeData: dataToSave } : prev)
      setSaveSuccess(true)
      // Delay exiting edit mode so the "Saved!" state on the button is visible
      setTimeout(() => {
        setIsEditMode(false)
        setSaveSuccess(false)
      }, 1200)
    } catch {
      setError(t("Failed to save changes."))
    } finally {
      setSaving(false)
    }
  }, [user, resume, editedResumeData])

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
        <IconLoading className="w-6 h-6 text-[#1F5C4A] animate-spin" />
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
          rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0
          self-start sticky top-6
          max-h-[calc(100vh-120px)]
        `}
        aria-label={t("Saved resumes list")}
      >
        <div className="rounded-[10px]  bg-[#FFFFFF] flex flex-col overflow-hidden flex-1">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-lp-hairline">
            <span className="text-sm font-semibold text-lp-ink">{t("Saved Resumes")}</span>
            <Link
              href="/dashboard/resume"
              aria-label={t("Create new resume")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-medium
                bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A]
                hover:bg-[#1F5C4A]/20 transition-all duration-200"
            >
              <Plus className="w-3 h-3" />
              {t("New")}
            </Link>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {loadingList ? (
              <SidebarSkeleton />
            ) : allResumes.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <IconResumeBuilder className="w-6 h-6 text-[#5A5F5C] mx-auto mb-2" />
                <p className="text-xs text-[#5A5F5C]">{t("No saved resumes yet")}</p>
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
                            rounded-[4px] px-3 py-2.5 cursor-pointer
                            transition-colors duration-200
                            ${isActive
                              ? 'bg-[#1F5C4A]/10 border border-[#1F5C4A]/20'
                              : 'border border-transparent hover:bg-lp-ink/[0.03] hover:border-lp-hairline'
                            }
                          `}
                        >
                          {/* Resume name */}
                          <p className={`text-sm font-medium leading-snug truncate
                            ${isActive ? 'text-lp-ink' : 'text-[#3C403E]'}`}>
                            {r.name}
                          </p>

                          {/* Target position / company */}
                          {(r.targetPosition || r.targetCompany) && (
                            <p className="text-xs text-[#5A5F5C] truncate mt-0.5">
                              {[r.targetPosition, r.targetCompany].filter(Boolean).join(' @ ')}
                            </p>
                          )}

                          {/* Date + ATS badge */}
                          <div className="flex items-center justify-between mt-1.5 gap-2">
                            <span className="text-[10px] text-[#5A5F5C] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(locale, r.createdAt)}
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
          aria-label={t("Toggle resumes list")}
          className="w-10 h-10 rounded-[10px] bg-[#1F5C4A] text-white flex items-center justify-center
              hover:bg-[#15443A] transition-all"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <IconResumeBuilder className="w-4 h-4" />}
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
              bg-[#FFFFFF] border-r border-lp-rule overflow-y-auto p-3 pt-16"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-semibold text-lp-ink">{t("Saved Resumes")}</span>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label={t("Close resumes list")}
                className="p-1 rounded-[4px] hover:bg-lp-ink/5 text-[#5A5F5C] hover:text-lp-ink"
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
                          rounded-[4px] px-3 py-2.5 cursor-pointer transition-colors duration-200
                          ${isActive
                            ? 'bg-[#1F5C4A]/10 border border-[#1F5C4A]/20'
                            : 'border border-transparent hover:bg-lp-ink/[0.03]'
                          }
                        `}>
                          <p className={`text-sm font-medium truncate
                            ${isActive ? 'text-lp-ink' : 'text-[#3C403E]'}`}>
                            {r.name}
                          </p>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <span className="text-[10px] text-[#5A5F5C]">
                              {formatDate(locale, r.createdAt)}
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
            className="rounded-[10px] border border-[#B42318]/20 bg-[#B42318]/5 p-5"
          >
            <p className="text-sm text-[#B42318] font-medium">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-2 text-xs text-[#3C403E] hover:text-lp-ink underline"
            >
              {t("Try again")}
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
              <nav aria-label={t("Breadcrumb")} className="flex items-center gap-1.5 text-sm">
                <Link
                  href="/dashboard/resume"
                  className="text-[#5A5F5C] hover:text-[#3C403E] transition-colors"
                >
                  {t("Resumes")}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-[#5A5F5C]" />
                <span className="text-[#3C403E] truncate max-w-[180px]">{resume.name}</span>
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Back */}
                {!isEditMode && (
                  <Link
                    href="/dashboard/resume/saved"
                    aria-label={t("Back to saved resumes")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium
                      border border-lp-rule text-[#3C403E]
                      hover:bg-lp-ink/5 hover:text-lp-ink transition-all duration-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t("Back")}
                  </Link>
                )}

                {/* Edit / Save / Cancel */}
                {!isEditMode ? (
                  <button
                    onClick={() => setIsEditMode(true)}
                    aria-label={t("Edit this resume")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                      bg-[#1F5C4A] text-white hover:bg-[#15443A] transition-colors duration-200"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t("Edit")}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdits}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                        bg-[#1F7A4D] text-white hover:bg-[#17603C] transition-colors duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? <IconLoading className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {saving ? t("Saving…") : saveSuccess ? t("Saved!") : t("Save Changes")}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditMode(false)
                        editedResumeDataRef.current = resume.resumeData
                        setEditedResumeData(resume.resumeData)
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium
                        border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5
                        transition-all duration-200"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t("Cancel")}
                    </button>
                  </>
                )}

                {/* Delete */}
                {!isEditMode && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    aria-label={t("Delete this resume")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium
                      border border-[#B42318]/20 text-[#B42318]/70
                      hover:bg-[#B42318]/10 hover:text-[#B42318] hover:border-[#B42318]/40
                      transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("Delete")}
                  </button>
                )}
              </div>
            </div>

            {/* Metadata card */}
            <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
              <div className="rounded-[4px]  bg-[#FFFFFF] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: title block */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-heading font-semibold text-lp-ink text-lg leading-tight">
                        {resume.name}
                      </h1>
                      {isEditMode && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                          bg-[#8A5A00]/10 border border-[#8A5A00]/20 text-[#8A5A00]">
                          {t("Editing")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                      {resume.targetPosition && (
                        <span className="flex items-center gap-1.5 text-sm text-[#3C403E]">
                          <IconAtsOptimizer className="w-3.5 h-3.5 text-[#1F5C4A]" />
                          {resume.targetPosition}
                          {resume.targetCompany && (
                            <span className="text-[#5A5F5C]">@ {resume.targetCompany}</span>
                          )}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-sm text-[#5A5F5C]">
                        <Calendar className="w-3.5 h-3.5" />
                        {t("Created {v0}", { v0: formatDate(locale, resume.createdAt) })}
                      </span>
                      {formatDate(locale, resume.updatedAt) !== formatDate(locale, resume.createdAt) && (
                        <span className="text-sm text-[#5A5F5C]">
                          {t("· Updated {v0}", { v0: formatDate(locale, resume.updatedAt) })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: meta chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Template badge */}
                    <span className="px-2.5 py-1 rounded-[4px] text-xs font-medium
                      bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A]">
                      {TEMPLATE_LABELS[resume.templateId]}
                    </span>

                    {/* ATS score badge */}
                    {resume.atsScore !== undefined && (
                      <span className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold
                        border ${atsScoreBg(resume.atsScore)}`}>
                        {t("ATS {v0}%", { v0: resume.atsScore })}
                      </span>
                    )}

                  </div>
                </div>
              </div>
            </div>

            {/* Resume Preview / Editor — ref lives here so both modes share the same scale */}
            <div ref={editContainerRef} className="overflow-x-hidden">
              {isEditMode && editedResumeData ? (
                <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                  <div
                    className="rounded-[10px]  bg-[#F4F2EC] overflow-x-hidden overflow-y-auto"
                    style={{ minHeight: '600px' }}>
                    <ResumeEditor
                      resumeData={editedResumeData}
                      personal={resume.personalInfo ?? { name: '', email: '', phone: '', location: '', linkedin_url: '', website: '' }}
                      onDataChange={(updated) => {
                        editedResumeDataRef.current = updated
                        setEditedResumeData(updated)
                      }}
                    />
                  </div>
                </div>
              ) : (
                <ResumePreview
                  data={resume.resumeData}
                  personal={resume.personalInfo ?? { name: '', email: '', phone: '', location: '', linkedin_url: '', website: '' }}
                  isStreaming={false}
                  forcedScale={editScale}
                />
              )}
            </div>

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
