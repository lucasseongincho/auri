import { auth } from './firebase'

export function getStartedRedirect(intent?: 'free' | 'pro'): string {
  const user = auth.currentUser

  if (!user) {
    if (intent === 'pro' && typeof window !== 'undefined') {
      sessionStorage.setItem('postAuthIntent', 'pro')
    }
    return '/signup'
  }

  return '/dashboard'
}
