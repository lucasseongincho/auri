'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Paperclip, CheckCircle, Send } from 'lucide-react'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const CATEGORIES = ['Bug Report', 'Feature Request', 'General Feedback'] as const
type Category = typeof CATEGORIES[number]

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  userEmail: string
}

export default function FeedbackModal({ open, onClose, userEmail }: FeedbackModalProps) {
  const [category, setCategory] = useState<Category>('General Feedback')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setCategory('General Feedback')
      setMessage('')
      setFile(null)
      setError('')
      setSubmitted(false)
    }, 300)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (f && f.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.')
      return
    }
    setError('')
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim().length < 20) {
      setError('Please write at least 20 characters.')
      return
    }
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('category', category)
    formData.append('message', message.trim())
    formData.append('userEmail', userEmail)
    if (file) formData.append('file', file)

    try {
      const res = await fetch('/api/feedback', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed to send')
      setSubmitted(true)
      setTimeout(handleClose, 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={SPRING}
            className="fixed z-[61] bottom-20 right-6 md:bottom-20 md:right-6
              w-[calc(100vw-48px)] max-w-sm"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 shadow-2xl shadow-black/50">
              <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Send Feedback</h2>
                  <button
                    onClick={handleClose}
                    aria-label="Close feedback"
                    className="p-1 rounded-lg text-[#60607A] hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING}
                    className="flex flex-col items-center gap-2 py-6 text-center"
                  >
                    <CheckCircle className="w-8 h-8 text-[#22C55E]" />
                    <p className="text-white font-semibold text-sm">Thanks — we'll look into it</p>
                    <p className="text-[#60607A] text-xs">Closing in a moment…</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {/* Category */}
                    <div className="flex gap-1.5">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(c)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all duration-150 leading-tight text-center
                            ${category === c
                              ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/40'
                              : 'text-[#60607A] border border-white/[0.06] hover:text-[#A0A0B8] hover:border-white/[0.12]'
                            }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* Message */}
                    <div>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe the issue or idea… (min 20 characters)"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#13131A] border border-white/[0.08] text-white
                          placeholder-[#60607A] text-sm focus:outline-none focus:border-[#6366F1]/50
                          transition-colors resize-none"
                      />
                      <p className={`text-[10px] mt-1 text-right transition-colors
                        ${message.length < 20 && message.length > 0 ? 'text-[#F59E0B]' : 'text-[#60607A]'}`}>
                        {message.length} / 20 min
                      </p>
                    </div>

                    {/* File upload */}
                    <div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFile}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 text-xs text-[#60607A] hover:text-[#A0A0B8] transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                        {file ? (
                          <span className="text-[#A0A0B8] truncate max-w-[200px]">{file.name}</span>
                        ) : (
                          <span>Attach image or PDF (optional, max 5MB)</span>
                        )}
                      </button>
                    </div>

                    {error && (
                      <p className="text-xs text-[#EF4444]">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-white text-sm
                        bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                        shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                        hover:scale-[1.02] transition-all duration-200
                        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {loading ? 'Sending…' : 'Send feedback'}
                    </button>
                  </form>
                )}

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
