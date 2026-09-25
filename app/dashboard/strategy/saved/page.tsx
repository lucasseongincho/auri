'use client'

import { useLocale } from '@/lib/i18n/client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Map } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  getSavedStrategies,
  deleteStrategy,
  getGuestStrategies,
  deleteGuestStrategy,
} from '@/lib/firestore'
import type { SavedStrategy } from '@/types'

type SortOption = 'newest' | 'oldest' | 'az' | 'za'

export default function SavedStrategiesPage() {
  const { t, locale } = useLocale()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [strategies, setStrategies] = useState<SavedStrategy[]>([])
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
          const data = await getSavedStrategies(user.uid)
          setStrategies(data)
        } else {
          setStrategies(getGuestStrategies())
        }
      } catch {
        setError(t("Failed to load saved strategies."))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  const filtered = useMemo(() => {
    let list = [...strategies]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.position.toLowerCase().includes(q) ||
          s.industry.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      )
    }
    switch (sort) {
      case 'newest':
        list.sort((a, b) => {
          const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0
          const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0
          return bTime - aTime
        })
        break
      case 'oldest':
        list.sort((a, b) => {
          const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0
          const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0
          return aTime - bTime
        })
        break
      case 'az':
        list.sort((a, b) => a.position.localeCompare(b.position))
        break
      case 'za':
        list.sort((a, b) => b.position.localeCompare(a.position))
        break
    }
    return list
  }, [strategies, search, sort])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      if (user?.uid) {
        await deleteStrategy(user.uid, id)
      } else {
        deleteGuestStrategy(id)
      }
      setStrategies((prev) => prev.filter((s) => s.id !== id))
      setDeleteTarget(null)
    } catch {
      setError(t("Failed to delete strategy."))
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

  function getCompletionStats(s: SavedStrategy) {
    const total = s.strategy.days.reduce((sum, d) => sum + d.actions.length, 0)
    const done = Object.values(s.completed).filter(Boolean).length
    return { total, done }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#1F5C4A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#3C403E] text-sm">{t("Loading strategies…")}</p>
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
            onClick={() => router.push('/dashboard/strategy')}
            className="flex items-center gap-2 text-[#3C403E] hover:text-[#1B1D1C] transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t("Back")}
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1B1D1C]">{t("My Strategies")}</h1>
            <p className="text-[#5A5F5C] text-sm mt-0.5">
              {t("{v0} plan{v1} saved", { v0: strategies.length, v1: strategies.length !== 1 ? 's' : '' })}
            </p>
          </div>
        </div>

        {/* Search + Sort bar */}
        {strategies.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5F5C]"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder={t("Search by role, industry, or city…")}
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
              <option value="az">{t("Role A → Z")}</option>
              <option value="za">{t("Role Z → A")}</option>
            </select>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-[4px] bg-[#B42318]/10 border border-[#B42318]/30 text-[#B42318] text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Empty state */}
        {strategies.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 flex items-center justify-center mb-4">
              <Map className="w-8 h-8 text-[#1F5C4A]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1B1D1C] mb-2">{t("No saved strategies yet")}</h2>
            <p className="text-[#5A5F5C] text-sm max-w-xs mb-6">
              {t("Generate your first 7-day plan and save it to track your progress.")}
            </p>
            <Link
              href="/dashboard/strategy"
              className="px-5 py-2.5 rounded-[4px] bg-[#1F5C4A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t("Build a Strategy")}
            </Link>
          </motion.div>
        )}

        {/* No results after filter */}
        {strategies.length > 0 && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[#5A5F5C] text-sm">{t("No strategies match your search.")}</p>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((s, i) => {
              const { total, done } = getCompletionStats(s)
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 group"
                >
                  <div className="rounded-[10px]  bg-[#FFFFFF] p-5 h-full flex flex-col">

                    {/* Role / Meta */}
                    <div className="flex-1 mb-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-[#1B1D1C] text-base leading-tight line-clamp-1">
                          {s.position || t("Untitled")}
                        </h3>
                        <span className="flex-shrink-0 text-xs text-[#5A5F5C] mt-0.5">
                          {typeof s.createdAt === 'string' ? formatDate(locale, s.createdAt) : ''}
                        </span>
                      </div>
                      <p className="text-[#1F5C4A] text-sm font-medium line-clamp-1">
                        {[s.industry, s.city].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#3C403E]">
                        <span>{t("{v0} days", { v0: s.strategy.days.length })}</span>
                        <span>{t("{v0}/{v1} actions", { v0: done, v1: total })}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-lp-ink/6 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1F5C4A] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/strategy/saved/${s.id}`}
                        className="flex-1 text-center px-3 py-2 rounded-[4px] bg-[#1F5C4A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        {t("View")}
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(s.id)}
                        className="p-2 rounded-[4px] bg-lp-ink/5 hover:bg-[#B42318]/10 hover:text-[#B42318] text-[#5A5F5C] transition-colors"
                        aria-label={t("Delete strategy")}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                  </div>
                </motion.div>
              )
            })}
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
                  <svg className="w-6 h-6 text-[#B42318]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#1B1D1C] text-center mb-2">{t("Delete Strategy?")}</h3>
                <p className="text-[#3C403E] text-sm text-center mb-6">
                  {t("This strategy plan will be permanently deleted. You can't undo this.")}
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
