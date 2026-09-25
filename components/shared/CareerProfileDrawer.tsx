'use client'

import { useT } from '@/lib/i18n/client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  X, User, Briefcase, GraduationCap, Wrench, Target,
  Plus, LogOut, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCareerProfile } from '@/hooks/useCareerProfile'
import { useSignOut } from '@/hooks/useSignOut'

interface CareerProfileDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CareerProfileDrawer({ open, onClose }: CareerProfileDrawerProps) {
  const t = useT()
  const { user } = useAuth()
  const { profile } = useCareerProfile()
  const { handleSignOut } = useSignOut()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 "
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[400px] max-w-full z-50
              border-l border-lp-rule bg-[#FFFFFF] overflow-y-auto"
            aria-label={t("Career profile drawer")}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-lp-hairline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1F5C4A]/10
                  flex items-center justify-center">
                  <User className="w-4 h-4 text-lp-ink" />
                </div>
                <div>
                  <p className="font-semibold text-lp-ink text-sm">
                    {user?.displayName ?? user?.email ?? t("Guest User")}
                  </p>
                  <p className="text-xs text-[#5A5F5C]">
                    {user?.email ?? ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={t("Close profile drawer")}
                className="w-8 h-8 rounded-[4px] flex items-center justify-center
                  text-[#5A5F5C] hover:text-lp-ink hover:bg-lp-ink/5 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile sections */}
            <div className="p-6 space-y-6">

              {/* Target role */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#1F5C4A]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#5A5F5C]">{t("Target Role")}</span>
                  </div>
                  <Link href="/dashboard/resume" onClick={onClose}
                    className="text-xs text-[#1F5C4A] hover:text-[#1F5C4A] transition-colors flex items-center gap-0.5">
                    {t("Edit")}{' '}<ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                {profile?.target.position ? (
                  <div className="rounded-[10px] bg-[#FFFFFF]  p-4">
                    <p className="font-semibold text-lp-ink text-sm">{profile.target.position}</p>
                    {profile.target.company && <p className="text-xs text-[#3C403E] mt-0.5">@ {profile.target.company}</p>}
                    {profile.target.industry && <p className="text-xs text-[#5A5F5C]">{profile.target.industry}</p>}
                  </div>
                ) : (
                  <Link href="/dashboard/resume" onClick={onClose}>
                    <div className="rounded-[10px] bg-[#FFFFFF] border border-dashed border-lp-rule p-4
                      flex items-center gap-2 text-[#5A5F5C] hover:text-[#3C403E] hover:border-[#1F5C4A]/30 transition-all duration-200 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">{t("Set your target role")}</span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Experience */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#1F5C4A]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#5A5F5C]">{t("Experience")}</span>
                  </div>
                  <span className="text-xs text-[#5A5F5C]">{t("{v0} entries", { v0: profile?.experience.length ?? 0 })}</span>
                </div>
                {profile?.experience && profile.experience.length > 0 ? (
                  <div className="space-y-2">
                    {profile.experience.slice(0, 3).map((exp) => (
                      <div key={exp.id} className="rounded-[10px] bg-[#FFFFFF]  p-3">
                        <p className="text-sm font-medium text-lp-ink">{exp.title}</p>
                        <p className="text-xs text-[#3C403E]">{exp.company}</p>
                        <p className="text-xs text-[#5A5F5C]">{exp.start} – {exp.end}</p>
                      </div>
                    ))}
                    {profile.experience.length > 3 && (
                      <p className="text-xs text-[#5A5F5C] pl-1">{t("+{v0} more", { v0: profile.experience.length - 3 })}</p>
                    )}
                  </div>
                ) : (
                  <Link href="/dashboard/resume" onClick={onClose}>
                    <div className="rounded-[10px] bg-[#FFFFFF] border border-dashed border-lp-rule p-4
                      flex items-center gap-2 text-[#5A5F5C] hover:text-[#3C403E] hover:border-[#1F5C4A]/30 transition-all duration-200 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">{t("Add work experience")}</span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#1F5C4A]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#5A5F5C]">{t("Education")}</span>
                  </div>
                </div>
                {profile?.education && profile.education.length > 0 ? (
                  <div className="space-y-2">
                    {profile.education.map((edu) => (
                      <div key={edu.id} className="rounded-[10px] bg-[#FFFFFF]  p-3">
                        <p className="text-sm font-medium text-lp-ink">{t("{v0} in {v1}", { v0: edu.degree, v1: edu.field })}</p>
                        <p className="text-xs text-[#3C403E]">{edu.institution}</p>
                        <p className="text-xs text-[#5A5F5C]">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[10px] bg-[#FFFFFF] border border-dashed border-lp-rule p-3 text-[#5A5F5C] text-sm">
                    {t("No education added yet")}
                  </div>
                )}
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-[#1F7A4D]" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#5A5F5C]">{t("Skills")}</span>
                </div>
                {profile?.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 12).map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-full text-xs font-medium
                        bg-[#1F5C4A]/15 text-[#1F5C4A] border border-[#1F5C4A]/20">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 12 && (
                      <span className="px-2.5 py-1 rounded-full text-xs text-[#5A5F5C]">
                        +{profile.skills.length - 12}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="rounded-[10px] bg-[#FFFFFF] border border-dashed border-lp-rule p-3 text-[#5A5F5C] text-sm">
                    {t("No skills added yet")}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-lp-hairline">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px]
                  border border-lp-rule text-[#5A5F5C] hover:text-[#B42318] hover:border-[#B42318]/30
                  transition-all duration-200 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                {t("Sign Out")}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
