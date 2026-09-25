'use client'

import { useT } from '@/lib/i18n/client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Home } from 'lucide-react'
import { IconWarning } from '@/components/icons'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 max-w-md w-full"
      >
        <div className="rounded-[10px]  bg-[#FFFFFF] p-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20
            flex items-center justify-center">
            <IconWarning className="w-7 h-7 text-[#B42318]" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-lp-ink mb-1">
              {t("Something went wrong")}
            </h2>
            <p className="text-sm text-[#5A5F5C]">
              {t("An unexpected error occurred. Your data is safe — try refreshing or go back to the dashboard.")}
            </p>
            {error.digest && (
              <p className="text-[10px] text-[#5A5F5C]/60 mt-2 font-mono">
                {t("Error ID: {v0}", { v0: error.digest })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                rounded-[4px] text-sm font-semibold bg-[#1F5C4A] text-white
                hover:bg-[#15443A] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t("Try again")}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                rounded-[4px] text-sm font-medium border border-lp-rule
                text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5 transition-all"
            >
              <Home className="w-4 h-4" />
              {t("Dashboard")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
