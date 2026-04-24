'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Plus, Search, Trash2, Calendar,
  Target, Building2, Loader2, AlertCircle, SortAsc,
  X, Star, Layout, Pencil, Check,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getSavedResumes, deleteSavedResume, updateSavedResume } from '@/lib/firestore'
import type { SavedResume } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

type SortOption = 'newest' | 'oldest' | 'az' | 'za'

const TEMPLATE_LABELS: Record<string, string> = {
  'classic-pro': 'Classic Pro',
  'modern-edge': 'Modern Edge',
  'minimal-seoul': 'Minimal Seoul',
  'executive-dark': 'Executive Dark',
  'creative-pulse': 'Creative Pulse',
}

function toMs(val: unknown): number {
  if (!val) return 0
  if (typeof val === 'object' && 'seconds' in (val as object))
    return (val as { seconds: number }).seconds * 1000
  if (typeof val === 'object' && 'toDate' in (val as object))
    return (val as { toDate: () => Date }).toDate().getTime()
  return new Date(val as string).getTime()
}

function formatDate(iso: unknown) {
  try {
    return new Date(toMs(iso)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

function ATSBadge({ score }: { score?: number }) {
  if (score == null) return null
  const color =
    score >= 85 ? 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20' :
    score >= 70 ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20' :
                  'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20'
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <Star className="w-3 h-3" />
      {score}
    </span>
  )
}

export default function SavedResumesPage() {
  const { user, loading: authLoading } = useAuth()

  const [resumes, setResumes] = useState<SavedResume[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameSaving, setRenameSaving] = useState(false)
  const [renameSuccessId, setRenameSuccessId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    async function load() {
      try {
        if (user?.uid) {
          const data = await getSavedResumes(user.uid)
          setResumes(data)
        } else {
          setResumes([])
        }
      } catch {
        setError('Failed to load saved resumes.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  const filtered = useMemo(() => {
    let list = [...resumes]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.targetPosition?.toLowerCase().includes(q) ||
          r.targetCompany?.toLowerCase().includes(q)
      )
    }
    switch (sort) {
      case 'newest': list.sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt)); break
      case 'oldest': list.sort((a, b) => toMs(a.updatedAt) - toMs(b.updatedAt)); break
      case 'az': list.sort((a, b) => (a.targetPosition ?? '').localeCompare(b.targetPosition ?? '')); break
      case 'za': list.sort((a, b) => (b.targetPosition ?? '').localeCompare(a.targetPosition ?? '')); break
    }
    return list
  }, [resumes, search, sort])

  async function handleDelete(id: string) {
    if (!user?.uid) return
    setDeleting(true)
    try {
      await deleteSavedResume(user.uid, id)
      setResumes((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setError('Failed to delete resume.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  function handleStartRename(resume: SavedResume) {
    setRenamingId(resume.id)
    setRenameValue(resume.name || resume.targetPosition || 'Untitled')
  }

  function handleCancelRename() {
    setRenamingId(null)
    setRenameValue('')
  }

  async function handleSaveRename(id: string) {
    if (!user?.uid || !renameValue.trim()) return
    setRenameSaving(true)
    try {
      await updateSavedResume(user.uid, id, { name: renameValue.trim() })
      setResumes((prev) => prev.map((r) => r.id === id ? { ...r, name: renameValue.trim() } : r))
      setRenamingId(null)
      setRenameSuccessId(id)
      setTimeout(() => setRenameSuccessId(null), 2000)
    } catch {
      setError('Failed to rename resume.')
    } finally {
      setRenameSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="flex-shrink-0 flex items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5]
            flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-white leading-tight">My Resumes</h1>
            <p className="text-xs text-[#60607A]">
              {loading ? 'Loading…' : `${resumes.length} saved resume${resumes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/resume"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
            shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
            hover:scale-[1.02] transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          New Resume
        </Link>
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 flex items-center gap-2 mb-4 p-3 rounded-xl
              bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      {!loading && resumes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-shrink-0 flex flex-col sm:flex-row gap-3 mb-5"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#60607A]" />
            <input
              type="text"
              placeholder="Search by position, company, or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm
                bg-[#13131A] border border-white/[0.08] text-white placeholder-[#60607A]
                focus:outline-none focus:border-[#6366F1]/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-[#60607A] flex-shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-2 rounded-xl text-sm bg-[#13131A] border border-white/[0.08]
                text-[#A0A0B8] focus:outline-none focus:border-[#6366F1]/50 transition-colors"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">Position A–Z</option>
              <option value="za">Position Z–A</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && user?.uid && resumes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20
              flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#6366F1]" />
            </div>
            <h3 className="font-heading text-base font-semibold text-white mb-2">No saved resumes yet</h3>
            <p className="text-sm text-[#60607A] mb-5 max-w-sm">
              Build your first AI-powered resume and hit Save to see it here.
            </p>
            <Link
              href="/dashboard/resume"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" />
              Build your first resume
            </Link>
          </motion.div>
        )}

        {/* No search results */}
        {!loading && user?.uid && resumes.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Search className="w-8 h-8 text-[#60607A] mb-3" />
            <p className="text-sm text-[#A0A0B8]">No resumes match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch('')} className="mt-2 text-xs text-[#6366F1] hover:underline">
              Clear search
            </button>
          </motion.div>
        )}

        {/* Resume grid */}
        {!loading && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6"
          >
            {filtered.map((resume, i) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: i * 0.04 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 group"
              >
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 flex flex-col gap-3 h-full">

                  {/* Top: name + ATS badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20
                        border border-[#6366F1]/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-[#6366F1]" />
                      </div>
                      {renamingId === resume.id ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(resume.id)
                              if (e.key === 'Escape') handleCancelRename()
                            }}
                            className="flex-1 min-w-0 bg-transparent border border-[#6366F1]/50 rounded-lg
                              px-2 py-0.5 text-sm font-semibold text-white outline-none
                              focus:border-[#6366F1] transition-colors"
                          />
                          <button
                            onClick={() => handleSaveRename(resume.id)}
                            disabled={renameSaving}
                            aria-label="Save rename"
                            className="p-1 rounded-lg text-[#22C55E] hover:bg-[#22C55E]/10 transition-colors flex-shrink-0"
                          >
                            {renameSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={handleCancelRename}
                            aria-label="Cancel rename"
                            className="p-1 rounded-lg text-[#60607A] hover:bg-white/5 transition-colors flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {renameSuccessId === resume.id ? (
                              <span className="text-[#22C55E]">Renamed ✓</span>
                            ) : (
                              resume.name || resume.targetPosition || 'Untitled'
                            )}
                          </p>
                          <button
                            onClick={() => handleStartRename(resume)}
                            aria-label="Rename resume"
                            className="p-1 rounded-lg text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/5
                              transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <ATSBadge score={resume.atsScore} />
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5">
                    {resume.targetPosition && (
                      <div className="flex items-center gap-1.5 text-xs text-[#A0A0B8]">
                        <Target className="w-3.5 h-3.5 text-[#60607A] flex-shrink-0" />
                        <span className="truncate">{resume.targetPosition}</span>
                      </div>
                    )}
                    {resume.targetCompany && (
                      <div className="flex items-center gap-1.5 text-xs text-[#A0A0B8]">
                        <Building2 className="w-3.5 h-3.5 text-[#60607A] flex-shrink-0" />
                        <span className="truncate">{resume.targetCompany}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-[#60607A]">
                      <Layout className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{TEMPLATE_LABELS[resume.templateId] ?? resume.templateId}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#60607A]">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Updated {formatDate(resume.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-2 border-t border-white/[0.05]">
                    <Link
                      href={`/dashboard/resume/${resume.id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2
                        rounded-lg text-xs font-semibold bg-[#6366F1] text-white
                        hover:bg-[#4F46E5] transition-colors"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(resume.id)}
                      aria-label={`Delete resume ${resume.name}`}
                      className="p-2 rounded-lg text-[#60607A] hover:text-[#EF4444]
                        hover:bg-[#EF4444]/10 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={SPRING}
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
            >
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20
                    flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-[#EF4444]" />
                  </div>
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="p-1.5 rounded-lg text-[#60607A] hover:text-white hover:bg-white/5 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-heading text-base font-semibold text-white mb-1">Delete resume?</h3>
                <p className="text-sm text-[#60607A] mb-6">
                  This resume will be permanently deleted. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                      border border-white/[0.08] text-[#A0A0B8]
                      hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteTarget)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                      bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
