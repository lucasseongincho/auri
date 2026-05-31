'use client'

import { ErrorBoundary } from '@sentry/nextjs'

function Fallback() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 w-full max-w-md">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8 text-center">
          <h2 className="text-lg font-semibold text-[#F8F8FF] mb-2">Something went wrong</h2>
          <p className="text-sm text-[#A0A0B8] mb-6">
            We've been notified and are looking into it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
              shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
              hover:scale-[1.02] transition-all duration-200"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SentryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<Fallback />}>
      {children}
    </ErrorBoundary>
  )
}
