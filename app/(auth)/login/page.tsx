'use client'

import { useT } from '@/lib/i18n/client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, Chrome } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

export default function LoginPage() {
  const t = useT()
  const router = useRouter()
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getPostAuthRedirect = (): string => {
    const intent = sessionStorage.getItem('postAuthIntent')
    sessionStorage.removeItem('postAuthIntent')
    if (intent === 'pro') {
      return '/api/stripe/checkout'
    }
    return '/dashboard'
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      router.push(getPostAuthRedirect())
    } catch {
      setError(t("Invalid email or password."))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push(getPostAuthRedirect())
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      console.error('[Google Sign-In Error]', err)
      if (code === 'auth/popup-blocked') {
        setError(t("Popup was blocked. Please allow popups and try again."))
      } else if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        setError(t("Sign-in was cancelled. Please try again."))
      } else if (code === 'auth/unauthorized-domain') {
        setError(t("This domain is not authorized. Please contact support."))
      } else if (code) {
        setError(t("Sign-in failed: {code}", { code }))
      } else {
        setError(t("Google sign-in failed. Please try again."))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F2EC] flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full
          bg-[#1F5C4A]/8 hidden" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
          <div className="rounded-[10px]  bg-[#FFFFFF] p-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-[4px] bg-[#1F5C4A]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-lp-ink" />
              </div>
              <span className="font-heading font-bold text-lp-ink text-lg">{t("AURI")}</span>
            </div>

            <h1 className="font-heading text-2xl font-bold text-lp-ink mb-2">{t("Welcome back")}</h1>
            <p className="text-[#3C403E] text-sm mb-8">{t("Sign in to your career toolkit")}</p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              aria-label={t("Sign in with Google")}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-[10px]
                border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5
                transition-all duration-200 font-medium mb-6 disabled:opacity-50"
            >
              <Chrome className="w-4 h-4" />
              {t("Continue with Google")}
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-lp-ink/8" />
              <span className="text-xs text-[#5A5F5C]">{t("or")}</span>
              <div className="flex-1 h-px bg-lp-ink/8" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#3C403E] mb-1.5 block" htmlFor="email">
                  {t("Email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5F5C]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("you@example.com")}
                    className="w-full pl-10 pr-4 py-3 rounded-[10px] bg-lp-ink/5 border border-lp-rule
                      text-lp-ink placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F5C4A]
                      transition-colors duration-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#3C403E] mb-1.5 block" htmlFor="password">
                  {t("Password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5F5C]" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-[10px] bg-lp-ink/5 border border-lp-rule
                      text-lp-ink placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F5C4A]
                      transition-colors duration-200 text-sm"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-[#B42318] text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-[10px] font-semibold text-white
                  bg-[#1F5C4A]
                   transition-all duration-200 disabled:opacity-50"
              >
                {loading ? t("Signing in...") : t("Sign In")}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-lp-hairline text-center">
              <p className="text-sm text-[#5A5F5C]">
                {t("Don't have an account?")}{' '}
                <Link href="/signup" className="text-[#1F5C4A] underline underline-offset-2 hover:text-[#15443A] transition-colors">
                  {t("Sign up")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
