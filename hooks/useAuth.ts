// Re-export from AuthContext — single Firebase listener via React Context.
// All components share the same auth state (no per-component onAuthStateChanged).
export { useAuth } from '@/lib/auth-context'
