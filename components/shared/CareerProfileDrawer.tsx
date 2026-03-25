'use client'

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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[400px] max-w-full z-50
              border-l border-white/[0.08] bg-[#13131A] overflow-y-auto"
            aria-label="Career profile drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
                  flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {user?.displayName ?? user?.email ?? 'Guest User'}
                  </p>
                  <p className="text-xs text-[#60607A]">
                    {user?.email ?? ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close profile drawer"
                className="w-8 h-8 rounded-lg flex items-center justify-center
                  text-[#60607A] hover:text-white hover:bg-white/5 transition-all duration-200"
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
                    <Target className="w-4 h-4 text-[#6366F1]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#60607A]">Target Role</span>
                  </div>
                  <Link href="/dashboard/resume" onClick={onClose}
                    className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors flex items-center gap-0.5">
                    Edit <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                {profile?.target.position ? (
                  <div className="rounded-xl bg-[#1C1C26] border border-white/[0.05] p-4">
                    <p className="font-semibold text-white text-sm">{profile.target.position}</p>
                    {profile.target.company && <p className="text-xs text-[#A0A0B8] mt-0.5">@ {profile.target.company}</p>}
                    {profile.target.industry && <p className="text-xs text-[#60607A]">{profile.target.industry}</p>}
                  </div>
                ) : (
                  <Link href="/dashboard/resume" onClick={onClose}>
                    <div className="rounded-xl bg-[#1C1C26] border border-dashed border-white/[0.1] p-4
                      flex items-center gap-2 text-[#60607A] hover:text-[#A0A0B8] hover:border-[#6366F1]/30 transition-all duration-200 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Set your target role</span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Experience */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#8B5CF6]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#60607A]">Experience</span>
                  </div>
                  <span className="text-xs text-[#60607A]">{profile?.experience.length ?? 0} entries</span>
                </div>
                {profile?.experience && profile.experience.length > 0 ? (
                  <div className="space-y-2">
                    {profile.experience.slice(0, 3).map((exp) => (
                      <div key={exp.id} className="rounded-xl bg-[#1C1C26] border border-white/[0.05] p-3">
                        <p className="text-sm font-medium text-white">{exp.title}</p>
                        <p className="text-xs text-[#A0A0B8]">{exp.company}</p>
                        <p className="text-xs text-[#60607A]">{exp.start} – {exp.end}</p>
                      </div>
                    ))}
                    {profile.experience.length > 3 && (
                      <p className="text-xs text-[#60607A] pl-1">+{profile.experience.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <Link href="/dashboard/resume" onClick={onClose}>
                    <div className="rounded-xl bg-[#1C1C26] border border-dashed border-white/[0.1] p-4
                      flex items-center gap-2 text-[#60607A] hover:text-[#A0A0B8] hover:border-[#8B5CF6]/30 transition-all duration-200 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add work experience</span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#A78BFA]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#60607A]">Education</span>
                  </div>
                </div>
                {profile?.education && profile.education.length > 0 ? (
                  <div className="space-y-2">
                    {profile.education.map((edu) => (
                      <div key={edu.id} className="rounded-xl bg-[#1C1C26] border border-white/[0.05] p-3">
                        <p className="text-sm font-medium text-white">{edu.degree} in {edu.field}</p>
                        <p className="text-xs text-[#A0A0B8]">{edu.institution}</p>
                        <p className="text-xs text-[#60607A]">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#1C1C26] border border-dashed border-white/[0.1] p-3 text-[#60607A] text-sm">
                    No education added yet
                  </div>
                )}
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#60607A]">Skills</span>
                </div>
                {profile?.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 12).map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-full text-xs font-medium
                        bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/20">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 12 && (
                      <span className="px-2.5 py-1 rounded-full text-xs text-[#60607A]">
                        +{profile.skills.length - 12}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#1C1C26] border border-dashed border-white/[0.1] p-3 text-[#60607A] text-sm">
                    No skills added yet
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  border border-white/10 text-[#60607A] hover:text-[#EF4444] hover:border-[#EF4444]/30
                  transition-all duration-200 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
