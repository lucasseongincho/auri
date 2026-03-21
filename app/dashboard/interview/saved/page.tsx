'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import {
  getSavedInterviewPreps,
  deleteInterviewPrep,
  getGuestInterviewPreps,
  deleteGuestInterviewPrep,
} from '@/lib/firestore'
import type { SavedInterviewPrep } from '@/types'

type SortOption = 'newest' | 'oldest' | 'az' | 'za'

export default function SavedInterviewPrepsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [preps, setPreps] = useState<SavedInterviewPrep[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load sessions
  useEffect(() => {
    if (authLoading) return
    async function load() {
      try {
        if (user?.uid) {
          const data = await getSavedInterviewPreps(user.uid)
          setPreps(data)
        } else {
          setPreps(getGuestInterviewPreps())
        }
      } catch {
        setError('Failed to load saved sessions.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...preps]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.position.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q)
      )
    }
    switch (sort) {
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'az':
        list.sort((a, b) => a.company.localeCompare(b.company))
        break
      case 'za':
        list.sort((a, b) => b.company.localeCompare(a.company))
        break
    }
    return list
  }, [preps, search, sort])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      if (user?.uid) {
        await deleteInterviewPrep(user.uid, id)
      } else {
        deleteGuestInterviewPrep(id)
      }
      setPreps((prev) => prev.filter((p) => p.id !== id))
      setDeleteTarget(null)
    } catch {
      setError('Failed to delete session.')
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#A0A0B8] text-sm">Loading sessions…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8F8FF]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/interview')}
            className="flex items-center gap-2 text-[#A0A0B8] hover:text-[#F8F8FF] transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#F8F8FF]">Saved Interview Sessions</h1>
            <p className="text-[#60607A] text-sm mt-0.5">
              {preps.length} session{preps.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {/* Search + Sort bar */}
        {preps.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#60607A]"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by role or company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#13131A] border border-white/8 text-[#F8F8FF] placeholder-[#60607A] text-sm focus:outline-none focus:border-[#6366F1]/50 transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-4 py-2.5 rounded-xl bg-[#13131A] border border-white/8 text-[#F8F8FF] text-sm focus:outline-none focus:border-[#6366F1]/50 transition-colors cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">Company A → Z</option>
              <option value="za">Company Z → A</option>
            </select>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Empty state */}
        {preps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.057.587A2.25 2.25 0 0116.7 16h-7.4a2.25 2.25 0 01-2.043-1.313L6.2 13.5m0 0l-2.7-5.414m0 0A2.25 2.25 0 015.5 6h13a2.25 2.25 0 012 1.086L18.8 8.1" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#F8F8FF] mb-2">No saved sessions yet</h2>
            <p className="text-[#60607A] text-sm max-w-xs mb-6">
              Generate interview prep and save your sessions to study later.
            </p>
            <Link
              href="/dashboard/interview"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Generate Interview Prep
            </Link>
          </motion.div>
        )}

        {/* No results after filter */}
        {preps.length > 0 && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[#60607A] text-sm">No sessions match your search.</p>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((prep, i) => (
              <motion.div
                key={prep.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/8 bg-[#13131A] p-1 group"
              >
                <div className="rounded-xl border border-white/5 bg-[#1C1C26] p-5 h-full flex flex-col">

                  {/* Company / Role */}
                  <div className="flex-1 mb-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-[#F8F8FF] text-base leading-tight line-clamp-1">
                        {prep.company || 'Unknown Company'}
                      </h3>
                      <span className="flex-shrink-0 text-xs text-[#60607A] mt-0.5">
                        {formatDate(prep.createdAt)}
                      </span>
                    </div>
                    <p className="text-[#8B5CF6] text-sm font-medium line-clamp-1">{prep.position}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1.5 text-xs text-[#A0A0B8]">
                      <svg className="w-3.5 h-3.5 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                      </svg>
                      {prep.prep.questions.length} questions
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#A0A0B8]">
                      <svg className="w-3.5 h-3.5 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {prep.prep.questions_to_ask.length} to ask
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/interview/saved/${prep.id}`}
                      className="flex-1 text-center px-3 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Study
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(prep.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-[#EF4444]/10 hover:text-[#EF4444] text-[#60607A] transition-colors"
                      aria-label="Delete session"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => !deleting && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="rounded-2xl border border-white/10 bg-[#1C1C26] p-6 max-w-sm w-full shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#F8F8FF] text-center mb-2">Delete Session?</h3>
                <p className="text-[#A0A0B8] text-sm text-center mb-6">
                  This prep session will be permanently deleted. You can&apos;t undo this.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-[#A0A0B8] text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteTarget)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
                    ) : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
