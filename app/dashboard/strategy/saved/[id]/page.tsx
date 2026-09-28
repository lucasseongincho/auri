'use client'

import { useLocale } from '@/lib/i18n/client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronDown, ChevronLeft, ChevronUp, Clock, Globe, Trash2 } from 'lucide-react'
import { IconJobStrategy } from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'
import {
  getSavedStrategy,
  deleteStrategy,
  getGuestStrategies,
  deleteGuestStrategy,
  updateStrategyCompleted,
} from '@/lib/firestore'
import type { SavedStrategy, JobStrategyAction, JobStrategyDay } from '@/types'

const DAY_COLORS = [
  { bg: 'bg-[#1F5C4A]/10', border: 'border-[#1F5C4A]/20', text: 'text-[#1F5C4A]' },
  { bg: 'bg-[#1F5C4A]/10', border: 'border-[#1F5C4A]/20', text: 'text-[#1F5C4A]' },
  { bg: 'bg-[#1F5C4A]/10', border: 'border-[#1F5C4A]/20', text: 'text-[#1F5C4A]' },
  { bg: 'bg-[#1F7A4D]/10', border: 'border-[#1F7A4D]/20', text: 'text-[#1F7A4D]' },
  { bg: 'bg-[#8A5A00]/10', border: 'border-[#8A5A00]/20', text: 'text-[#8A5A00]' },
  { bg: 'bg-[#B42318]/10', border: 'border-[#B42318]/20', text: 'text-[#B42318]' },
  { bg: 'bg-[#1F5C4A]/10', border: 'border-[#1F5C4A]/20', text: 'text-[#1F5C4A]' },
]

function ActionItem({ action, completed, onToggle }: {
  action: JobStrategyAction
  completed: boolean
  onToggle: () => void
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-[10px] border transition-all duration-200 ${
      completed ? 'border-[#1F7A4D]/20 bg-[#1F7A4D]/5' : 'border-lp-hairline bg-[#F4F2EC]/40'
    }`}>
      <div
        onClick={onToggle}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200 mt-0.5 ${
          completed ? 'border-[#1F7A4D] bg-[#1F7A4D]' : 'border-lp-rule hover:border-[#1F5C4A]'
        }`}
      >
        {completed && <CheckCircle className="w-3 h-3 text-lp-ink" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Clock className="w-3 h-3 text-[#5A5F5C] flex-shrink-0" />
          <span className="text-xs text-[#5A5F5C]">{action.time}</span>
        </div>
        <p className={`text-sm leading-relaxed ${completed ? 'line-through text-[#5A5F5C]' : 'text-[#1B1D1C]'}`}>
          {action.action}
        </p>
        {action.resource && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Globe className="w-3 h-3 text-[#1F5C4A] flex-shrink-0" />
            <span className="text-xs text-[#1F5C4A] break-all">{action.resource}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function DayCard({ day, dayIndex, completed, onToggle }: {
  day: JobStrategyDay
  dayIndex: number
  completed: Record<string, boolean>
  onToggle: (key: string) => void
}) {
  const { t, locale } = useLocale()
  const [expanded, setExpanded] = useState(dayIndex === 0)
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length]
  const completedCount = day.actions.filter((_, ai) => completed[`${day.day}-${ai}`]).length

  return (
    <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
      <div className="rounded-[10px]  bg-[#FFFFFF] overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-lp-ink/[0.02] transition-colors"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-[10px] ${color.bg} border ${color.border} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-sm font-bold ${color.text}`}>{day.day}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-lp-ink leading-tight">{day.theme}</p>
              <p className="text-xs text-[#5A5F5C] mt-0.5">{t("{v0}/{v1} actions complete", { v0: completedCount, v1: day.actions.length })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {completedCount === day.actions.length && day.actions.length > 0 && (
              <CheckCircle className="w-4 h-4 text-[#1F7A4D]" />
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-[#5A5F5C]" /> : <ChevronDown className="w-4 h-4 text-[#5A5F5C]" />}
          </div>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2 border-t border-lp-hairline pt-3">
                {day.actions.map((action, ai) => (
                  <ActionItem
                    key={ai}
                    action={action}
                    completed={completed[`${day.day}-${ai}`] ?? false}
                    onToggle={() => onToggle(`${day.day}-${ai}`)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function SavedStrategyDetailPage() {
  const { t, locale } = useLocale()
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [saved, setSaved] = useState<SavedStrategy | null>(null)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (authLoading || !id) return
    async function load() {
      try {
        let data: SavedStrategy | null = null
        if (user?.uid) {
          data = await getSavedStrategy(user.uid, id)
        } else {
          const all = getGuestStrategies()
          data = all.find((s) => s.id === id) ?? null
        }
        if (!data) {
          setNotFound(true)
        } else {
          setSaved(data)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading, id])

  useEffect(() => {
    if (saved) setCompleted(saved.completed ?? {})
  }, [saved])

  const handleToggle = useCallback(async (key: string) => {
    const updated = { ...completed, [key]: !completed[key] }
    setCompleted(updated)
    if (user && id) {
      try {
        await updateStrategyCompleted(user.uid, id as string, updated)
      } catch {
        // silent — state already updated locally
      }
    }
  }, [completed, user, id])

  async function handleDelete() {
    if (!saved) return
    setDeleting(true)
    try {
      if (user?.uid) {
        await deleteStrategy(user.uid, saved.id)
      } else {
        deleteGuestStrategy(saved.id)
      }
      router.push('/dashboard/strategy/saved')
    } catch {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  function formatDate(locale: 'en' | 'ko', iso: string) {
    try {
      return new Date(iso).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } catch { return iso }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#1F5C4A] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#3C403E] text-sm">{t("Loading strategy…")}</p>
        </div>
      </div>
    )
  }

  if (notFound || !saved) {
    return (
      <div className="min-h-screen bg-[#F4F2EC] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20 flex items-center justify-center mb-2">
          <IconJobStrategy className="w-7 h-7 text-[#B42318]" />
        </div>
        <h2 className="text-lg font-semibold text-[#1B1D1C]">{t("Strategy not found")}</h2>
        <p className="text-[#5A5F5C] text-sm">{t("This strategy may have been deleted.")}</p>
        <button
          onClick={() => router.push('/dashboard/strategy/saved')}
          className="mt-2 px-5 py-2.5 rounded-[4px] bg-[#1F5C4A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t("Back to strategies")}
        </button>
      </div>
    )
  }

  const totalActions = saved.strategy.days.reduce((sum, d) => sum + d.actions.length, 0)
  const completedCount = Object.values(completed).filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-[#1B1D1C]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/strategy/saved')}
              className="flex items-center gap-1.5 text-[#3C403E] hover:text-[#1B1D1C] transition-colors text-sm flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              {t("Back")}
            </button>
            <div className="w-px h-5 bg-lp-ink/10" />
            <div>
              <h1 className="text-xl font-bold text-[#1B1D1C] leading-tight">{saved.position}</h1>
              <p className="text-[#1F5C4A] text-sm font-medium">
                {[saved.industry, saved.city].filter(Boolean).join(' · ')}
              </p>
              <p className="text-[#5A5F5C] text-xs mt-0.5">
                {typeof saved.createdAt === 'string' ? formatDate(locale, saved.createdAt) : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 rounded-[4px] bg-lp-ink/5 hover:bg-[#B42318]/10 hover:text-[#B42318] text-[#5A5F5C] transition-colors flex-shrink-0"
            aria-label={t("Delete strategy")}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 mb-6">
          <div className="rounded-[10px]  bg-[#FFFFFF] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-lp-ink">{t("{v0} / {v1} actions completed", { v0: completedCount, v1: totalActions })}</p>
                <p className="text-xs text-[#5A5F5C] mt-0.5">{t("7-day plan · saved snapshot")}</p>
              </div>
              <span className="text-sm font-bold text-[#1F5C4A]">
                {totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-lp-ink/6 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#1F5C4A] "
                initial={{ width: 0 }}
                animate={{ width: totalActions > 0 ? `${(completedCount / totalActions) * 100}%` : '0%' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Day cards */}
        <div className="space-y-4">
          {saved.strategy.days.map((day, dayIndex) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
            >
              <DayCard day={day} dayIndex={dayIndex} completed={completed} onToggle={handleToggle} />
            </motion.div>
          ))}
        </div>

      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => !deleting && setShowDelete(false)}
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
                <h3 className="text-lg font-semibold text-[#1B1D1C] text-center mb-2">{t("Delete Strategy?")}</h3>
                <p className="text-[#3C403E] text-sm text-center mb-6">
                  {t("This strategy plan will be permanently deleted.")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDelete(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-[4px] bg-lp-ink/5 hover:bg-lp-ink/8 text-[#3C403E] text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    onClick={handleDelete}
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
