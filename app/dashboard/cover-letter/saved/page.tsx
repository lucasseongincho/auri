'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Target,
  Loader2,
  AlertCircle,
  SortAsc,
  X,
  Search,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getSavedCoverLetters, deleteCoverLetter } from '@/lib/firestore'
import { toDate, formatResumeDate } from '@/lib/utils'
import type { SavedCoverLetter } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
type SortOption = 'newest' | 'oldest' | 'az' | 'za'

function toMs(val: unknown): number {
  return toDate(val)?.getTime() ?? 0
}

function formatDate(val: unknown) {
  return formatResumeDate(val, 'Saved')
}

function WordBadge({ count }: { count: number }) {
  const color =
    count > 300 ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20'
    : count >= 280 ? 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20'
    : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {count}w
    </span>
  )
}

export default function SavedCoverLettersPage() {
  const { user, loading: authLoading } = useAuth()

  const [letters, setLetters] = useState<SavedCoverLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    async function load() {
      try {
        if (user?.uid) {
          const data = await getSavedCoverLetters(user.uid)
          setLetters(data)
        } else {
          setLetters([])
        }
      } catch {
        setError('Failed to load saved cover letters.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  const filtered = useMemo(() => {
    let list = [...letters]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) => l.company.toLowerCase().includes(q) || l.position.toLowerCase().includes(q)
      )
    }
    switch (sort) {
      case 'newest': list.sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt)); break
      case 'oldest': list.sort((a, b) => toMs(a.updatedAt) - toMs(b.updatedAt)); break
      case 'az': list.sort((a, b) => a.company.localeCompare(b.company)); break
      case 'za': list.sort((a, b) => b.company.localeCompare(a.company)); break
    }
    return list
  }, [letters, search, sort])

  async function handleDelete(id: string) {
    if (!user?.uid) return
    setDeleting(true)
    try {
      await deleteCoverLetter(user.uid, id)
      setLetters((prev) => prev.filter((l) => l.id !== id))
    } catch {
      setError('Failed to delete cover letter.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706]
            flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-white leading-tight">Saved Cover Letters</h1>
            <p className="text-xs text-[#60607A]">
              {loading ? 'Loading…' : `${letters.length} saved letter${letters.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/cover-letter"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white
            shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/50
            hover:scale-[1.02] transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          New Letter
        </Link>
      </motion.div>

      {/* Error */}
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
      {!loading && letters.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-shrink-0 flex flex-col sm:flex-row gap-3 mb-5"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#60607A]" />
            <input
              type="text"
              placeholder="Search by company or position…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm
                bg-[#13131A] border border-white/[0.08] text-white placeholder-[#60607A]
                focus:outline-none focus:border-[#F59E0B]/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-[#60607A] flex-shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-2 rounded-xl text-sm bg-[#13131A] border border-white/[0.08]
                text-[#A0A0B8] focus:outline-none focus:border-[#F59E0B]/50 transition-colors"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">Company A–Z</option>
              <option value="za">Company Z–A</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#F59E0B] animate-spin" />
          </div>
        )}

        {!loading && user?.uid && letters.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20
              flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <h3 className="font-heading text-base font-semibold text-white mb-2">No saved cover letters yet</h3>
            <p className="text-sm text-[#60607A] mb-5 max-w-sm">
              Generate a cover letter and click Save to access it here.
            </p>
            <Link
              href="/dashboard/cover-letter"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white
                shadow-lg shadow-[#F59E0B]/25 hover:shadow-[#F59E0B]/50 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" />
              Generate your first letter
            </Link>
          </motion.div>
        )}

        {!loading && user?.uid && letters.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Search className="w-8 h-8 text-[#60607A] mb-3" />
            <p className="text-sm text-[#A0A0B8]">No letters match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch('')} className="mt-2 text-xs text-[#F59E0B] hover:underline">
              Clear search
            </button>
          </motion.div>
        )}

        {!loading && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6"
          >
            {filtered.map((letter, i) => (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: i * 0.04 }}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 group"
              >
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 flex flex-col gap-3 h-full">

                  {/* Company + word badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/20
                        border border-[#F59E0B]/30 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-3.5 h-3.5 text-[#F59E0B]" />
                      </div>
                      <p className="text-sm font-bold text-white truncate">{letter.company}</p>
                    </div>
                    <WordBadge count={letter.wordCount} />
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5">
                    {letter.position && (
                      <div className="flex items-center gap-1.5 text-xs text-[#A0A0B8]">
                        <Target className="w-3.5 h-3.5 text-[#60607A] flex-shrink-0" />
                        <span className="truncate">{letter.position}</span>
                      </div>
                    )}
                    {letter.openingHook && (
                      <div className="flex items-start gap-1.5 text-xs text-[#60607A]">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 italic">&ldquo;{letter.openingHook}&rdquo;</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-[#60607A]">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formatDate(letter.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-2 border-t border-white/[0.05]">
                    <Link
                      href={`/dashboard/cover-letter/${letter.id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2
                        rounded-lg text-xs font-semibold bg-[#F59E0B] text-white
                        hover:bg-[#D97706] transition-colors"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(letter.id)}
                      aria-label={`Delete letter for ${letter.company}`}
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

      {/* Delete confirmation */}
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
                  <button onClick={() => setDeleteTarget(null)}
                    className="p-1.5 rounded-lg text-[#60607A] hover:text-white hover:bg-white/5 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-heading text-base font-semibold text-white mb-1">Delete cover letter?</h3>
                <p className="text-sm text-[#60607A] mb-6">
                  This will be permanently deleted. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                      border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all">
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
