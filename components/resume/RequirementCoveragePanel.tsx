'use client'

import { useT } from '@/lib/i18n/client'

import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Layers, Loader2 } from 'lucide-react'
import type { RequirementCoverage } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const STATUS_CONFIG = {
  strong: {
    color: 'text-[#1F7A4D]',
    bg: 'bg-[#1F7A4D]/10',
    border: 'border-[#1F7A4D]/20',
    Icon: CheckCircle,
  },
  partial: {
    color: 'text-[#8A5A00]',
    bg: 'bg-[#8A5A00]/10',
    border: 'border-[#8A5A00]/20',
    Icon: AlertTriangle,
  },
  missing: {
    color: 'text-[#B42318]',
    bg: 'bg-[#B42318]/10',
    border: 'border-[#B42318]/20',
    Icon: XCircle,
  },
} as const

const STATUS_ORDER: Record<RequirementCoverage['status'], number> = {
  missing: 0,
  partial: 1,
  strong: 2,
}

interface RequirementCoveragePanelProps {
  coverage: RequirementCoverage[] | null
  isLoading: boolean
}

export default function RequirementCoveragePanel({
  coverage,
  isLoading,
}: RequirementCoveragePanelProps) {
  const t = useT()
  if (isLoading) {
    return (
      <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-[#1F5C4A]" />
            <span className="text-sm font-semibold text-lp-ink">{t("Running semantic analysis…")}</span>
            <Loader2 className="w-3.5 h-3.5 text-[#1F5C4A] animate-spin ml-auto" />
          </div>
          <div className="space-y-2">
            {[75, 55, 85, 65, 70].map((w, i) => (
              <div
                key={i}
                className="h-10 rounded-[10px] bg-lp-ink/[0.04] animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!coverage || coverage.length === 0) return null

  const sorted = [...coverage].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  )

  const counts = {
    strong: coverage.filter((c) => c.status === 'strong').length,
    partial: coverage.filter((c) => c.status === 'partial').length,
    missing: coverage.filter((c) => c.status === 'missing').length,
  }

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
          <Layers className="w-4 h-4 text-[#1F5C4A]" />
          <span className="text-sm font-semibold text-lp-ink">{t("Requirement Coverage")}</span>
          <span className="text-[10px] text-[#5A5F5C] ml-auto uppercase tracking-wide">
            {t("semantic")}
          </span>
        </div>

        {/* Summary chips */}
        <div className="flex gap-2 flex-wrap">
          {counts.strong > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#1F7A4D]/10 text-[#1F7A4D] border border-[#1F7A4D]/20">
              {t("{v0} strong", { v0: counts.strong })}
            </span>
          )}
          {counts.partial > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#8A5A00]/10 text-[#8A5A00] border border-[#8A5A00]/20">
              {t("{v0} partial", { v0: counts.partial })}
            </span>
          )}
          {counts.missing > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#B42318]/10 text-[#B42318] border border-[#B42318]/20">
              {t("{v0} missing", { v0: counts.missing })}
            </span>
          )}
        </div>

        {/* Rows — missing first, then partial, then strong */}
        <div className="space-y-2">
          {sorted.map((item, i) => {
            const cfg = STATUS_CONFIG[item.status]
            const { Icon } = cfg
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: i * 0.025 }}
                className={`rounded-[10px] border p-3 ${cfg.bg} ${cfg.border}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-lp-ink leading-snug">
                        {item.requirement}
                      </p>
                      <span className={`text-xs font-semibold flex-shrink-0 ${cfg.color}`}>
                        {Math.round(item.score * 100)}%
                      </span>
                    </div>
                    {item.bestMatch && (
                      <p className="text-[11px] text-[#5A5F5C] leading-snug line-clamp-1">
                        ↳ {item.bestMatch}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
