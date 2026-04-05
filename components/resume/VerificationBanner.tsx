'use client'

interface VerificationBannerProps {
  estimateCount: number
  verifiedCount: number
  onReviewClick: () => void
}

/**
 * Banner shown above the resume preview when AI-estimated values are present.
 * Tracks how many have been verified and prompts the user to review the rest.
 */
export default function VerificationBanner({
  estimateCount,
  verifiedCount,
  onReviewClick,
}: VerificationBannerProps) {
  const remaining = estimateCount - verifiedCount

  if (estimateCount === 0) return null

  if (remaining === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5
        bg-green-500/10 border border-green-500/20 rounded-xl mb-3">
        <span className="text-green-400 text-sm">✓</span>
        <p className="text-green-400 text-sm font-medium">
          All numbers verified — your resume is ready to download
        </p>
      </div>
    )
  }

  const progressPct = estimateCount > 0
    ? Math.round((verifiedCount / estimateCount) * 100)
    : 0

  return (
    <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-amber-300 text-sm font-semibold">
            ⚠️ {remaining} AI-estimated number{remaining !== 1 ? 's' : ''} need verification
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            Amber highlights show where AURI added numbers not from your input.
            Click each one to replace with your real data before submitting.
          </p>
        </div>
        <button
          onClick={onReviewClick}
          className="shrink-0 text-xs text-amber-300 border border-amber-500/30
            rounded-lg px-3 py-1.5 hover:bg-amber-500/10 transition-colors whitespace-nowrap"
          aria-label="Jump to first unverified estimate"
        >
          Review all
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5 bg-white/5 rounded-full h-1.5">
        <div
          className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="text-gray-500 text-xs mt-1">{verifiedCount}/{estimateCount} verified</p>
    </div>
  )
}
