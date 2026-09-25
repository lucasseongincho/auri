'use client'

import { useT } from '@/lib/i18n/client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User } from 'lucide-react'
import { IconLogoMark } from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

export default function SignupPage() {
  const t = useT()
  const router = useRouter()
  const { signInWithGoogle, signUpWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError(t("Password must be at least 6 characters."))
      return
    }
    setLoading(true)
    try {
      await signUpWithEmail(email, password, { name, marketingConsent })
      router.push('/dashboard')
    } catch {
      setError(t("Account creation failed. This email may already be in use."))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push('/dashboard')
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
                <IconLogoMark className="w-5 h-5 text-[#1F5C4A]" />
              </div>
              <span className="font-heading font-bold text-lp-ink text-lg">{t("AURI")}</span>
            </div>

            <h1 className="font-heading text-2xl font-bold text-lp-ink mb-2">{t("Create your account")}</h1>
            <p className="text-[#3C403E] text-sm mb-8">{t("Start building your career toolkit")}</p>

            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              aria-label={t("Sign up with Google")}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-[10px]
                border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5
                transition-all duration-200 font-medium mb-6 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              {t("Continue with Google")}
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-lp-ink/8" />
              <span className="text-xs text-[#5A5F5C]">{t("or")}</span>
              <div className="flex-1 h-px bg-lp-ink/8" />
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#3C403E] mb-1.5 block" htmlFor="name">
                  {t("Full Name")}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5F5C]" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("Jane Smith")}
                    className="w-full pl-10 pr-4 py-3 rounded-[10px] bg-lp-ink/5 border border-lp-rule
                      text-lp-ink placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F5C4A]
                      transition-colors duration-200 text-sm"
                  />
                </div>
              </div>

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
                    placeholder={t("Min. 6 characters")}
                    className="w-full pl-10 pr-4 py-3 rounded-[10px] bg-lp-ink/5 border border-lp-rule
                      text-lp-ink placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F5C4A]
                      transition-colors duration-200 text-sm"
                    required
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border border-lp-rule bg-lp-ink/5 accent-[#1F5C4A] flex-shrink-0"
                  aria-label={t("Marketing consent")}
                />
                <span className="text-xs text-[#3C403E] leading-relaxed">
                  {t("Send me tips on getting hired, product updates, and career advice. Unsubscribe anytime.")}
                </span>
              </label>

              {error && <p className="text-[#B42318] text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-[10px] font-semibold text-white
                  bg-[#1F5C4A]
                   transition-all duration-200 disabled:opacity-50"
              >
                {loading ? t("Creating account...") : t("Create Account")}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#5A5F5C]">
              {t("Already have an account?")}{' '}
              <Link href="/login" className="text-[#1F5C4A] underline underline-offset-2 hover:text-[#15443A] transition-colors">
                {t("Sign in")}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
