import { APP_CONFIG } from './config'
import { auth } from './firebase'

/**
 * Returns the correct redirect path for any "Get Started" / "Join Beta" button.
 * - Not signed in → /login (stores pro intent for post-auth if needed)
 * - Signed in → /dashboard (dashboard layout handles beta-access gate)
 */
export function getStartedRedirect(intent?: 'free' | 'pro'): string {
  const user = auth.currentUser

  if (!user) {
    // Store pro intent so login page can redirect to Stripe after auth
    // (only relevant when BETA_MODE = false)
    if (intent === 'pro' && !APP_CONFIG.BETA_MODE && typeof window !== 'undefined') {
      sessionStorage.setItem('postAuthIntent', 'pro')
    }
    return '/login'
  }

  // Signed in — dashboard layout handles /beta-access redirect if not approved
  return '/dashboard'
}
