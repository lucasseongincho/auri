'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  getSavedStrategy,
  deleteStrategy,
  getGuestStrategies,
  deleteGuestStrategy,
} from '@/lib/firestore'
import type { SavedStrategy, JobStrategyAction, JobStrategyDay } from '@/types'

const DAY_COLORS = [
  { bg: 'bg-[#6366F1]/10', border: 'border-[#6366F1]/20', text: 'text-[#818CF8]' },
  { bg: 'bg-[#8B5CF6]/10', border: 'border-[#8B5CF6]/20', text: 'text-[#A78BFA]' },
  { bg: 'bg-[#0EA5E9]/10', border: 'border-[#0EA5E9]/20', text: 'text-[#38BDF8]' },
  { bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/20', text: 'text-[#4ADE80]' },
  { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', text: 'text-[#FCD34D]' },
  { bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', text: 'text-[#F87171]' },
  { bg: 'bg-[#EC4899]/10', border: 'border-[#EC4899]/20', text: 'text-[#F472B6]' },
]

function ActionItem({ action, completed }: { action: JobStrategyAction; completed: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
      completed ? 'border-[#22C55E]/20 bg-[#22C55E]/5' : 'border-white/[0.06] bg-[#0A0A0F]/40'
    }`}>
      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
        completed ? 'border-[#22C55E] bg-[#22C55E]' : 'border-white/20'
      }`}>
        {completed && <CheckCircle className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Clock className="w-3 h-3 text-[#60607A] flex-shrink-0" />
          <span className="text-xs text-[#60607A]">{action.time}</span>
        </div>
        <p className={`text-sm leading-relaxed ${completed ? 'line-through text-[#60607A]' : 'text-[#E8E8F0]'}`}>
          {action.action}
        </p>
        {action.resource && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Globe className="w-3 h-3 text-[#6366F1] flex-shrink-0" />
            <span className="text-xs text-[#6366F1] break-all">{action.resource}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function DayCard({ day, dayIndex, completed }: {
  day: JobStrategyDay
  dayIndex: number
  completed: Record<string, boolean>
}) {
  const [expanded, setExpanded] = useState(dayIndex === 0)
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length]
  const completedCount = day.actions.filter((_, ai) => completed[`${day.day}-${ai}`]).length

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
      <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-sm font-bold ${color.text}`}>{day.day}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{day.theme}</p>
              <p className="text-xs text-[#60607A] mt-0.5">{completedCount}/{day.actions.length} actions complete</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {completedCount === day.actions.length && day.actions.length > 0 && (
              <CheckCircle className="w-4 h-4 text-[#22C55E]" />
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-[#60607A]" /> : <ChevronDown className="w-4 h-4 text-[#60607A]" />}
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
              <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-3">
                {day.actions.map((action, ai) => (
                  <ActionItem
                    key={ai}
                    action={action}
                    completed={completed[`${day.day}-${ai}`] ?? false}
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
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [saved, setSaved] = useState<SavedStrategy | null>(null)
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

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } catch { return iso }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#A0A0B8] text-sm">Loading strategy…</p>
        </div>
      </div>
    )
  }

  if (notFound || !saved) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mb-2">
          <Map className="w-7 h-7 text-[#EF4444]" />
        </div>
        <h2 className="text-lg font-semibold text-[#F8F8FF]">Strategy not found</h2>
        <p className="text-[#60607A] text-sm">This strategy may have been deleted.</p>
        <button
          onClick={() => router.push('/dashboard/strategy/saved')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-[#6366F1] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Back to strategies
        </button>
      </div>
    )
  }

  const totalActions = saved.strategy.days.reduce((sum, d) => sum + d.actions.length, 0)
  const completedCount = Object.values(saved.completed).filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8F8FF]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/strategy/saved')}
              className="flex items-center gap-1.5 text-[#A0A0B8] hover:text-[#F8F8FF] transition-colors text-sm flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div>
              <h1 className="text-xl font-bold text-[#F8F8FF] leading-tight">{saved.position}</h1>
              <p className="text-[#6366F1] text-sm font-medium">
                {[saved.industry, saved.city].filter(Boolean).join(' · ')}
              </p>
              <p className="text-[#60607A] text-xs mt-0.5">
                {typeof saved.createdAt === 'string' ? formatDate(saved.createdAt) : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-[#EF4444]/10 hover:text-[#EF4444] text-[#60607A] transition-colors flex-shrink-0"
            aria-label="Delete strategy"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 mb-6">
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-white">{completedCount} / {totalActions} actions completed</p>
                <p className="text-xs text-[#60607A] mt-0.5">7-day plan · saved snapshot</p>
              </div>
              <span className="text-sm font-bold text-[#6366F1]">
                {totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
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
              <DayCard day={day} dayIndex={dayIndex} completed={saved.completed} />
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => !deleting && setShowDelete(false)}
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
                <h3 className="text-lg font-semibold text-[#F8F8FF] text-center mb-2">Delete Strategy?</h3>
                <p className="text-[#A0A0B8] text-sm text-center mb-6">
                  This strategy plan will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDelete(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-[#A0A0B8] text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
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
