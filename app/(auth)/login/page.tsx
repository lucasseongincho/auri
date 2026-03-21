'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, Chrome, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

export default function LoginPage() {
  const router = useRouter()
  const { signInWithGoogle, signInWithEmail, continueAsGuest } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      router.push('/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push('/dashboard')
    } catch {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = () => {
    continueAsGuest()
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full
          bg-[#6366F1]/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
          <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white text-lg">AURI</span>
            </div>

            <h1 className="font-heading text-2xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-[#A0A0B8] text-sm mb-8">Sign in to your career toolkit</p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              aria-label="Sign in with Google"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl
                border border-white/15 text-[#A0A0B8] hover:text-white hover:bg-white/5
                transition-all duration-200 font-medium mb-6 disabled:opacity-50"
            >
              <Chrome className="w-4 h-4" />
              Continue with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-xs text-[#60607A]">or</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#A0A0B8] mb-1.5 block" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#60607A]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                      text-white placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]
                      transition-colors duration-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#A0A0B8] mb-1.5 block" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#60607A]" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                      text-white placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]
                      transition-colors duration-200 text-sm"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-[#EF4444] text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                  shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                  hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-3 text-center">
              <p className="text-sm text-[#60607A]">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-[#6366F1] hover:text-[#818CF8] transition-colors">
                  Sign up
                </Link>
              </p>
              <button
                onClick={handleGuest}
                className="text-sm text-[#60607A] hover:text-[#A0A0B8] transition-colors flex items-center gap-1 mx-auto"
              >
                Continue as guest <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
