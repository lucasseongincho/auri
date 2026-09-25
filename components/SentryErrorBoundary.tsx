'use client'

import { useT } from '@/lib/i18n/client'

import { ErrorBoundary } from '@sentry/nextjs'

function Fallback() {
  const t = useT()
  return (
    <div className="min-h-screen bg-[#F4F2EC] flex items-center justify-center p-6">
      <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 w-full max-w-md">
        <div className="rounded-[10px]  bg-[#FFFFFF] p-8 text-center">
          <h2 className="text-lg font-semibold text-[#1B1D1C] mb-2">{t("Something went wrong")}</h2>
          <p className="text-sm text-[#3C403E] mb-6">
            {t("We've been notified and are looking into it.")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-[4px] text-sm font-semibold text-white
              bg-[#1F5C4A]
               transition-all duration-200"
          >
            {t("Reload page")}
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
