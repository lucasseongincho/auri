'use client'

import { useT } from '@/lib/i18n/client'
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
  const t = useT()
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
          className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 max-w-md w-full"
        >
          <div className="rounded-[10px]  bg-[#FFFFFF] p-8
            flex flex-col items-center gap-4">

            <div className="w-14 h-14 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20
              flex items-center justify-center">
              {icon ?? <Lock className="w-6 h-6 text-[#1F5C4A]" />}
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Crown className="w-3.5 h-3.5 text-[#8A5A00]" />
                <span className="text-xs font-semibold text-[#8A5A00] uppercase tracking-wide">
                  {t("Pro Feature")}
                </span>
              </div>
              <h2 className="font-heading text-xl font-bold text-lp-ink mb-2">
                {featureName}
              </h2>
              <p className="text-sm text-[#5A5F5C] leading-relaxed">
                {featureDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Link
                href="/pricing"
                className="w-full py-3 rounded-[10px] font-semibold text-white text-sm
                  bg-[#1F5C4A]
                   transition-all duration-200 text-center"
              >
                {t("Upgrade to Pro — $19/month")}
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-[10px] text-sm font-medium text-center
                    border border-lp-rule text-[#3C403E] hover:text-lp-ink
                    hover:bg-lp-ink/5 transition-all duration-200"
                >
                  {t("Sign in to existing account")}
                </Link>
              )}
            </div>

            <p className="text-xs text-[#5A5F5C]">
              {t("Free plan includes resume builder, ATS optimizer & cover letter generator")}
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
