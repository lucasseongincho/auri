'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Send, CheckCircle } from 'lucide-react'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 text-[#A0A0B8] hover:text-white transition-colors">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]" />
            <span className="font-semibold text-white">AURI</span>
          </Link>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 border border-[#6366F1]/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#6366F1]" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white font-heading mb-2">Get in touch</h1>
          <p className="text-[#A0A0B8] text-sm">Questions, feedback, or just want to say hi — we read everything.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING}
                className="flex flex-col items-center gap-3 py-8 text-center"
              >
                <CheckCircle className="w-10 h-10 text-[#22C55E]" />
                <p className="text-white font-semibold text-lg">Message sent!</p>
                <p className="text-[#A0A0B8] text-sm">We'll get back to you as soon as possible.</p>
                <Link href="/" className="mt-4 text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors">
                  ← Back to AURI
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-[#A0A0B8] font-medium">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl bg-[#13131A] border border-white/[0.08] text-white placeholder-[#60607A] text-sm focus:outline-none focus:border-[#6366F1]/50 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-[#A0A0B8] font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#13131A] border border-white/[0.08] text-white placeholder-[#60607A] text-sm focus:outline-none focus:border-[#6366F1]/50 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-[#A0A0B8] font-medium">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-3 rounded-xl bg-[#13131A] border border-white/[0.08] text-white placeholder-[#60607A] text-sm focus:outline-none focus:border-[#6366F1]/50 transition-colors resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-[#EF4444]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
                    bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                    shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                    hover:scale-[1.02] transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loading ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  )
}
