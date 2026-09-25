'use client'

import { useLocale } from '@/lib/i18n/client'
import { IconInterviewPrep } from '@/components/icons'
import { AlertCircle, ChevronLeft, Clock, HelpCircle, Search, Trash2 } from 'lucide-react'

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
  const { t, locale } = useLocale()
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
        setError(t("Failed to load saved sessions."))
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
      setError(t("Failed to delete session."))
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(locale: 'en' | 'ko', iso: string) {
    try {
      return new Date(iso).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
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
      <div className="min-h-screen bg-[#F4F2EC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#1F5C4A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#3C403E] text-sm">{t("Loading sessions…")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-[#1B1D1C]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/interview')}
            className="flex items-center gap-2 text-[#3C403E] hover:text-[#1B1D1C] transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            {t("Back")}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1B1D1C]">{t("Saved Interview Sessions")}</h1>
            <p className="text-[#5A5F5C] text-sm mt-0.5">
              {t("{v0} session{v1} saved", { v0: preps.length, v1: preps.length !== 1 ? 's' : '' })}
            </p>
          </div>
        </div>

        {/* Search + Sort bar */}
        {preps.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5F5C]" aria-hidden="true" />
              <input
                type="text"
                placeholder={t("Search by role or company…")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-[10px] bg-[#FFFFFF] border border-lp-rule text-[#1B1D1C] placeholder-[#5A5F5C] text-sm focus:outline-none focus:border-[#1F5C4A]/50 transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-4 py-2.5 rounded-[4px] bg-[#FFFFFF] border border-lp-rule text-[#1B1D1C] text-sm focus:outline-none focus:border-[#1F5C4A]/50 transition-colors cursor-pointer"
            >
              <option value="newest">{t("Newest first")}</option>
              <option value="oldest">{t("Oldest first")}</option>
              <option value="az">{t("Company A → Z")}</option>
              <option value="za">{t("Company Z → A")}</option>
            </select>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-[4px] bg-[#B42318]/10 border border-[#B42318]/30 text-[#B42318] text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
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
            <div className="w-16 h-16 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 flex items-center justify-center mb-4">
              <IconInterviewPrep className="w-8 h-8 text-[#1F5C4A]" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-[#1B1D1C] mb-2">{t("No saved sessions yet")}</h2>
            <p className="text-[#5A5F5C] text-sm max-w-xs mb-6">
              {t("Generate interview prep and save your sessions to study later.")}
            </p>
            <Link
              href="/dashboard/interview"
              className="px-5 py-2.5 rounded-[4px] bg-[#1F5C4A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t("Generate Interview Prep")}
            </Link>
          </motion.div>
        )}

        {/* No results after filter */}
        {preps.length > 0 && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[#5A5F5C] text-sm">{t("No sessions match your search.")}</p>
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
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 group"
              >
                <div className="rounded-[10px]  bg-[#FFFFFF] p-5 h-full flex flex-col">

                  {/* Company / Role */}
                  <div className="flex-1 mb-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-[#1B1D1C] text-base leading-tight line-clamp-1">
                        {prep.company || t("Unknown Company")}
                      </h3>
                      <span className="flex-shrink-0 text-xs text-[#5A5F5C] mt-0.5">
                        {formatDate(locale, prep.createdAt)}
                      </span>
                    </div>
                    <p className="text-[#1F5C4A] text-sm font-medium line-clamp-1">{prep.position}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1.5 text-xs text-[#3C403E]">
                      <Clock className="w-3.5 h-3.5 text-[#1F5C4A]" aria-hidden="true" />
                      {t("{v0} questions", { v0: prep.prep.questions.length })}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#3C403E]">
                      <HelpCircle className="w-3.5 h-3.5 text-[#1F7A4D]" aria-hidden="true" />
                      {t("{v0} to ask", { v0: prep.prep.questions_to_ask.length })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/interview/saved/${prep.id}`}
                      className="flex-1 text-center px-3 py-2 rounded-[4px] bg-[#1F5C4A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      {t("Study")}
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(prep.id)}
                      className="p-2 rounded-[4px] bg-lp-ink/5 hover:bg-[#B42318]/10 hover:text-[#B42318] text-[#5A5F5C] transition-colors"
                      aria-label={t("Delete session")}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
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
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => !deleting && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-6 max-w-sm w-full ">
                <div className="w-12 h-12 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-[#B42318]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-[#1B1D1C] text-center mb-2">{t("Delete Session?")}</h3>
                <p className="text-[#3C403E] text-sm text-center mb-6">
                  {t("This prep session will be permanently deleted. You can't undo this.")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-[4px] bg-lp-ink/5 hover:bg-lp-ink/8 text-[#3C403E] text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    onClick={() => handleDelete(deleteTarget)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-[4px] bg-[#B42318] hover:bg-[#912018] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <><div className="w-4 h-4 border-2 border-lp-rule border-t-lp-rule rounded-full animate-spin" />{t("Deleting…")}</>
                    ) : t("Delete")}
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
