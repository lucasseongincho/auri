'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface AILoadingStateProps {
  message?: string
  variant?: 'inline' | 'full' | 'skeleton'
  lines?: number
}

export default function AILoadingState({
  message = 'AURI is thinking...',
  variant = 'inline',
  lines = 4,
}: AILoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-3 animate-pulse" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-white/[0.06]"
            style={{ width: `${[95, 80, 88, 70][i % 4]}%` }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16" aria-live="polite" aria-label={message}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
            flex items-center justify-center shadow-lg shadow-[#6366F1]/30"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        <p className="text-[#A0A0B8] font-medium">{message}</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-[#6366F1]"
            />
          ))}
        </div>
      </div>
    )
  }

  // inline variant
  return (
    <div className="flex items-center gap-2" aria-live="polite" aria-label={message}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
          flex items-center justify-center"
      >
        <Sparkles className="w-3 h-3 text-white" />
      </motion.div>
      <span className="text-sm text-[#A0A0B8]">{message}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            className="w-1 h-1 rounded-full bg-[#6366F1]"
          />
        ))}
      </div>
    </div>
  )
}
