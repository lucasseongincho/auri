'use client'

import { motion } from 'framer-motion'
import { Wand2, Loader2 } from 'lucide-react'
import type { StructuredSuggestion } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const SECTION_ORDER: Record<string, number> = {
  experience: 0,
  experience_title: 1,
  skills: 2,
  projects: 3,
  leadership: 4,
  summary: 5,
}

interface SuggestionsPanelProps {
  suggestions: StructuredSuggestion[]
  checkedIds: Set<string>
  onToggle: (id: string) => void
  onApply: () => void
  isApplying: boolean
  onDiscard: () => void
}

function truncate(text: string, maxLen = 80): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen) + '…'
}

export default function SuggestionsPanel({
  suggestions,
  checkedIds,
  onToggle,
  onApply,
  isApplying,
  onDiscard,
}: SuggestionsPanelProps) {
  const allChecked =
    suggestions.length > 0 && suggestions.every((s) => checkedIds.has(s.id))

  const handleToggleAll = () => {
    if (allChecked) {
      suggestions.forEach((s) => { if (checkedIds.has(s.id)) onToggle(s.id) })
    } else {
      suggestions.forEach((s) => { if (!checkedIds.has(s.id)) onToggle(s.id) })
    }
  }

  const sorted = [...suggestions].sort((a, b) => {
    const ao = SECTION_ORDER[a.target.section] ?? 99
    const bo = SECTION_ORDER[b.target.section] ?? 99
    return ao - bo
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
    >
      <div className="rounded-[10px]  bg-[#FFFFFF] p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[#1F5C4A]" />
          <span className="text-sm font-semibold text-lp-ink">Suggested Edits</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A]">
            {suggestions.length}
          </span>
          <span className="text-[10px] text-[#5A5F5C] ml-auto uppercase tracking-wide">pro</span>
          <button
            onClick={handleToggleAll}
            className="text-xs text-[#5A5F5C] hover:text-[#3C403E] transition-colors"
          >
            {allChecked ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Suggestion rows */}
        <div className="space-y-2">
          {sorted.map((s, i) => {
            const checked = checkedIds.has(s.id)
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: i * 0.03 }}
                onClick={() => onToggle(s.id)}
                className={`rounded-[10px] border p-3 cursor-pointer transition-all duration-150 ${
                  checked
                    ? 'border-[#1F5C4A]/30 bg-[#1F5C4A]/5'
                    : 'border-lp-hairline bg-[#F4F2EC]/60 hover:border-lp-rule'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Checkbox */}
                  <div
                    className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 transition-all duration-150
                      flex items-center justify-center ${
                      checked
                        ? 'bg-[#1F5C4A] border-[#1F5C4A]'
                        : 'bg-transparent border-lp-rule'
                    }`}
                  >
                    {checked && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path
                          d="M1 3L3 5L7 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Label + reason */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-lp-ink leading-snug">
                        {s.label}
                      </span>
                      <span className="text-[10px] text-[#5A5F5C] leading-snug">
                        {s.reason}
                      </span>
                    </div>

                    {/* Original (struck-through when checked) */}
                    {s.original && (
                      <p
                        title={s.original}
                        className={`text-xs leading-snug truncate ${
                          checked ? 'line-through text-[#5A5F5C]' : 'text-[#5A5F5C]'
                        }`}
                      >
                        {truncate(s.original)}
                      </p>
                    )}

                    {/* Suggested */}
                    <p
                      title={s.suggested}
                      className="text-xs text-lp-ink leading-snug"
                    >
                      → {truncate(s.suggested)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1 border-t border-lp-hairline">
          <button
            onClick={onApply}
            disabled={checkedIds.size === 0 || isApplying}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px]
              bg-[#1F5C4A] text-white font-semibold text-sm
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isApplying
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
              : `Apply ${checkedIds.size} Selected`
            }
          </button>
          <button
            onClick={onDiscard}
            className="text-sm text-[#5A5F5C] hover:text-[#3C403E] transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </motion.div>
  )
}
