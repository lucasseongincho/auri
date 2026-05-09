'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 max-w-md w-full"
      >
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20
            flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-white mb-1">
              Something went wrong
            </h2>
            <p className="text-sm text-[#60607A]">
              An unexpected error occurred. Your data is safe — try refreshing
              or go back to the dashboard.
            </p>
            {error.digest && (
              <p className="text-[10px] text-[#60607A]/60 mt-2 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                rounded-xl text-sm font-semibold bg-[#6366F1] text-white
                hover:bg-[#4F46E5] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                rounded-xl text-sm font-medium border border-white/[0.08]
                text-[#A0A0B8] hover:text-white hover:bg-white/5 transition-all"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
