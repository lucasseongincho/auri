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
            className="fixed inset-0 z-[60] bg-black/60 "
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
            <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 ">
              <div className="rounded-[10px]  bg-[#FFFFFF] p-5">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-lp-ink">Send Feedback</h2>
                  <button
                    onClick={handleClose}
                    aria-label="Close feedback"
                    className="p-1 rounded-[4px] text-[#5A5F5C] hover:text-lp-ink hover:bg-lp-ink/6 transition-colors"
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
                    <CheckCircle className="w-8 h-8 text-[#1F7A4D]" />
                    <p className="text-lp-ink font-semibold text-sm">Thanks — we'll look into it</p>
                    <p className="text-[#5A5F5C] text-xs">Closing in a moment…</p>
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
                          className={`flex-1 py-1.5 px-2 rounded-[4px] text-[10px] font-medium transition-all duration-150 leading-tight text-center
                            ${category === c
                              ? 'bg-[#1F5C4A]/20 text-[#1F5C4A] border border-[#1F5C4A]/40'
                              : 'text-[#5A5F5C] border border-lp-hairline hover:text-[#3C403E] hover:border-lp-rule'
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
                        className="w-full px-3 py-2.5 rounded-[4px] bg-[#FFFFFF] border border-lp-rule text-lp-ink
                          placeholder-[#5A5F5C] text-sm focus:outline-none focus:border-[#1F5C4A]/50
                          transition-colors resize-none"
                      />
                      <p className={`text-[10px] mt-1 text-right transition-colors
                        ${message.length < 20 && message.length > 0 ? 'text-[#8A5A00]' : 'text-[#5A5F5C]'}`}>
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
                        className="flex items-center gap-2 text-xs text-[#5A5F5C] hover:text-[#3C403E] transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                        {file ? (
                          <span className="text-[#3C403E] truncate max-w-[200px]">{file.name}</span>
                        ) : (
                          <span>Attach image or PDF (optional, max 5MB)</span>
                        )}
                      </button>
                    </div>

                    {error && (
                      <p className="text-xs text-[#B42318]">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] font-semibold text-white text-sm
                        bg-[#1F5C4A]
                         transition-all duration-200
                        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-lp-rule border-t-lp-rule rounded-full animate-spin" />
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
