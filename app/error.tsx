'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html>
      <body style={{ background: '#F4F2EC', display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', margin: 0, fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#1B1D1C', padding: '2rem', maxWidth: '400px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8A5A00" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ margin: '0 auto 1rem' }}><path d="M11.02 5.24Q12 3.5 12.98 5.24L20.02 17.76Q21 19.5 19 19.5H5Q3 19.5 3.98 17.76zM12 9.5V14M12 16.75v.01" /></svg>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#3C403E', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{ background: '#1F5C4A', color: 'white', border: 'none',
              borderRadius: '0.75rem', padding: '0.625rem 1.5rem',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
