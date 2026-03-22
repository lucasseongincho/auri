'use client'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSignOut } from '@/hooks/useSignOut'
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
export default function SettingsPage() {
  const { user } = useAuth()
  const { handleSignOut } = useSignOut()
  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#60607A] to-[#A0A0B8] flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Settings</h1>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 space-y-4">
          <h2 className="font-heading font-semibold text-white">Account</h2>
          <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
            <div>
              <p className="text-sm text-white">{user?.displayName ?? 'Guest User'}</p>
              <p className="text-xs text-[#60607A]">{user?.email ?? 'No email — guest mode'}</p>
            </div>
          </div>
          <button type="button" onClick={handleSignOut}
            className="px-4 py-2 rounded-xl border border-[#EF4444]/30 text-[#EF4444]
              hover:bg-[#EF4444]/10 transition-all duration-200 text-sm font-medium">
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  )
}
