'use client'

import { useLocale } from '@/lib/i18n/client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calendar, Building2, AlertCircle, SortAsc, X, Search } from 'lucide-react'
import { IconCoverLetter, IconLoading, IconTargetJob } from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'
import { getSavedCoverLetters, deleteCoverLetter, getGuestCoverLetters, deleteGuestCoverLetter } from '@/lib/firestore'
import { toDate, formatResumeDate } from '@/lib/utils'
import type { SavedCoverLetter } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
type SortOption = 'newest' | 'oldest' | 'az' | 'za'

function toMs(val: unknown): number {
  return toDate(val)?.getTime() ?? 0
}

function formatDate(locale: 'en' | 'ko', val: unknown) {
  return formatResumeDate(val, 'Saved', locale)
}

function WordBadge({ count }: { count: number }) {
  const color =
    count > 300 ? 'text-[#B42318] bg-[#B42318]/10 border-[#B42318]/20'
    : count >= 280 ? 'text-[#1F7A4D] bg-[#1F7A4D]/10 border-[#1F7A4D]/20'
    : 'text-[#1F5C4A] bg-[#1F5C4A]/10 border-[#1F5C4A]/20'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {count}w
    </span>
  )
}

export default function SavedCoverLettersPage() {
  const { t, locale } = useLocale()
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
        setError(t("Failed to load saved cover letters."))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  useEffect(() => {
    if (user) return // authenticated users use Firestore
    if (authLoading) return
    const guestLetters = getGuestCoverLetters()
    setLetters(guestLetters)
    setLoading(false)
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
    setDeleting(true)
    try {
      if (user?.uid) {
        await deleteCoverLetter(user.uid, id)
      } else {
        deleteGuestCoverLetter(id)
      }
      setLetters((prev) => prev.filter((l) => l.id !== id))
    } catch {
      setError(t("Failed to delete cover letter."))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="h-full flex flex-col pb-20 md:pb-0">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="flex-shrink-0 flex items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1F5C4A]/10
            flex items-center justify-center flex-shrink-0">
            <IconCoverLetter className="w-5 h-5 text-lp-ink" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-lp-ink leading-tight">{t("Saved Cover Letters")}</h1>
            <p className="text-xs text-[#5A5F5C]">
              {loading ? t("Loading…") : t("{v0} saved letter{v1}", { v0: letters.length, v1: letters.length !== 1 ? 's' : '' })}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/cover-letter"
          className="flex items-center gap-2 px-4 py-2 rounded-[4px] text-sm font-semibold
            bg-[#1F5C4A] text-white
             transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          {t("New Letter")}
        </Link>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 flex items-center gap-2 mb-4 p-3 rounded-[10px]
              bg-[#B42318]/10 border border-[#B42318]/20 text-[#B42318] text-sm"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5F5C]" />
            <input
              type="text"
              placeholder={t("Search by company or position…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-[10px] text-sm
                bg-[#FFFFFF] border border-lp-rule text-lp-ink placeholder-[#5A5F5C]
                focus:outline-none focus:border-[#1F5C4A]/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-[#5A5F5C] flex-shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-2 rounded-[4px] text-sm bg-[#FFFFFF] border border-lp-rule
                text-[#3C403E] focus:outline-none focus:border-[#1F5C4A]/50 transition-colors"
            >
              <option value="newest">{t("Newest first")}</option>
              <option value="oldest">{t("Oldest first")}</option>
              <option value="az">{t("Company A–Z")}</option>
              <option value="za">{t("Company Z–A")}</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {loading && (
          <div className="flex items-center justify-center py-20">
            <IconLoading className="w-6 h-6 text-[#1F5C4A] animate-spin" />
          </div>
        )}

        {!loading && letters.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center px-6"
          >
            <div className="w-16 h-16 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20
              flex items-center justify-center mb-4">
              <IconCoverLetter className="w-8 h-8 text-[#1F5C4A]" />
            </div>
            <h3 className="font-heading text-base font-semibold text-lp-ink mb-2">{t("No saved cover letters yet")}</h3>
            <p className="text-sm text-[#5A5F5C] mb-5 max-w-sm">
              {t("Generate a cover letter and click Save to access it here.")}
            </p>
            <Link
              href="/dashboard/cover-letter"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-sm font-semibold
                bg-[#1F5C4A] text-white
                    transition-all"
            >
              <Plus className="w-4 h-4" />
              {t("Generate your first letter")}
            </Link>
          </motion.div>
        )}

        {!loading && letters.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Search className="w-8 h-8 text-[#5A5F5C] mb-3" />
            <p className="text-sm text-[#3C403E]">{t("No letters match “{v0}”", { v0: search })}</p>
            <button onClick={() => setSearch('')} className="mt-2 text-xs text-[#1F5C4A] hover:underline">
              {t("Clear search")}
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
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 group"
              >
                <div className="rounded-[10px]  bg-[#FFFFFF] p-4 flex flex-col gap-3 h-full">

                  {/* Company + word badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-[4px] bg-[#1F5C4A]/20
                        border border-[#1F5C4A]/30 flex items-center justify-center flex-shrink-0">
                        <IconCoverLetter className="w-3.5 h-3.5 text-[#1F5C4A]" />
                      </div>
                      <p className="text-sm font-bold text-lp-ink truncate">{letter.company}</p>
                    </div>
                    <WordBadge count={letter.wordCount} />
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5">
                    {letter.position && (
                      <div className="flex items-center gap-1.5 text-xs text-[#3C403E]">
                        <IconTargetJob className="w-3.5 h-3.5 text-[#5A5F5C] flex-shrink-0" />
                        <span className="truncate">{letter.position}</span>
                      </div>
                    )}
                    {letter.openingHook && (
                      <div className="flex items-start gap-1.5 text-xs text-[#5A5F5C]">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 italic">{t("“{v0}”", { v0: letter.openingHook })}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-[#5A5F5C]">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formatDate(locale, letter.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-2 border-t border-lp-hairline">
                    <Link
                      href={`/dashboard/cover-letter/${letter.id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2
                        rounded-[4px] text-xs font-semibold bg-[#1F5C4A] text-white
                        hover:bg-[#15443A] transition-colors"
                    >
                      {t("Open")}
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(letter.id)}
                      aria-label={t("Delete letter for {v0}", { v0: letter.company })}
                      className="p-2 rounded-[4px] text-[#5A5F5C] hover:text-[#B42318]
                        hover:bg-[#B42318]/10 transition-all duration-200"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 "
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={SPRING}
              className="w-full max-w-sm rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
            >
              <div className="rounded-[10px]  bg-[#FFFFFF] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20
                    flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-[#B42318]" />
                  </div>
                  <button onClick={() => setDeleteTarget(null)}
                    className="p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-lp-ink hover:bg-lp-ink/5 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-heading text-base font-semibold text-lp-ink mb-1">{t("Delete cover letter?")}</h3>
                <p className="text-sm text-[#5A5F5C] mb-6">
                  {t("This will be permanently deleted. This action cannot be undone.")}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)}
                    className="flex-1 px-4 py-2.5 rounded-[4px] text-sm font-medium
                      border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5 transition-all">
                    {t("Cancel")}
                  </button>
                  <button
                    onClick={() => handleDelete(deleteTarget)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-[4px] text-sm font-semibold
                      bg-[#B42318] text-white hover:bg-[#912018] transition-colors
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deleting ? <IconLoading className="w-4 h-4 animate-spin mx-auto" /> : t("Delete")}
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
