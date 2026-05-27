'use client'
import { motion } from 'framer-motion'
import { Crown, Lock } from 'lucide-react'
import Link from 'next/link'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

interface ProGateProps {
  children: React.ReactNode
  featureName: string
  featureDescription: string
  icon?: React.ReactNode
}

export default function ProGate({
  children,
  featureName,
  featureDescription,
  icon,
}: ProGateProps) {
  const { profile } = useCareerStore()
  const { user, loading } = useAuth()

  if (loading) return null

  const isPro = profile?.isPro === true

  if (!user || !isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 max-w-md w-full"
        >
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8
            flex flex-col items-center gap-4">

            <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20
              flex items-center justify-center">
              {icon ?? <Lock className="w-6 h-6 text-[#6366F1]" />}
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Crown className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wide">
                  Pro Feature
                </span>
              </div>
              <h2 className="font-heading text-xl font-bold text-white mb-2">
                {featureName}
              </h2>
              <p className="text-sm text-[#60607A] leading-relaxed">
                {featureDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Link
                href="/pricing"
                className="w-full py-3 rounded-xl font-semibold text-white text-sm
                  bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                  shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                  hover:scale-[1.02] transition-all duration-200 text-center"
              >
                Upgrade to Pro — $19/month
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-center
                    border border-white/[0.08] text-[#A0A0B8] hover:text-white
                    hover:bg-white/5 transition-all duration-200"
                >
                  Sign in to existing account
                </Link>
              )}
            </div>

            <p className="text-xs text-[#60607A]">
              Free plan includes resume builder, ATS optimizer &amp; cover letter generator
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
