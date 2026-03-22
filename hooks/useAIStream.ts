'use client'

import { useState, useCallback } from 'react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'

interface StreamOptions {
  onChunk?: (chunk: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: string) => void
}

interface StreamState {
  isStreaming: boolean
  streamedText: string
  error: string | null
}

/**
 * Hook for consuming Claude streaming API responses.
 *
 * Why streaming: CLAUDE.md §12 mandates token-by-token output.
 * Users see the resume being written in real time — dramatically
 * reduces perceived latency for what is a 5-10 second generation.
 *
 * Why ReadableStream over WebSocket: Server-Sent Events via
 * Next.js streaming responses are simpler, stateless, and
 * work out of the box on Vercel Edge/Serverless.
 */
export function useAIStream() {
  const { setIsGenerating, setBetaLimitData } = useCareerStore()
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    streamedText: '',
    error: null,
  })

  const stream = useCallback(
    async (
      endpoint: string,
      body: Record<string, unknown>,
      options: StreamOptions = {}
    ) => {
      setState({ isStreaming: true, streamedText: '', error: null })
      setIsGenerating(true)

      let retryCount = 0
      const MAX_RETRIES = 1 // Per CLAUDE.md §7: 1 retry on 529

      const attempt = async (): Promise<string> => {
        // Attach Firebase ID token for server-side auth verification + isPro check
        let idToken: string | undefined
        if (auth.currentUser) {
          try {
            idToken = await getIdToken(auth.currentUser)
          } catch { /* guest users have no token — IP-based rate limiting applies */ }
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify(body),
        })

        // Retry on 529 (Claude overloaded) — once only
        if (response.status === 529 && retryCount < MAX_RETRIES) {
          retryCount++
          return attempt()
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          if (errorData.error === 'BETA_LIMIT_REACHED') {
            setBetaLimitData({
              resetsOn: errorData.resetsOn ?? 'next Monday',
              callsUsed: errorData.callsUsed ?? 0,
              callsTotal: errorData.callsTotal ?? 20,
            })
          }
          throw new Error(errorData.error ?? `Request failed: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setState((prev) => ({ ...prev, streamedText: prev.streamedText + chunk }))
          options.onChunk?.(chunk)
        }

        return fullText
      }

      try {
        const fullText = await attempt()
        setState((prev) => ({ ...prev, isStreaming: false }))
        options.onComplete?.(fullText)
        return fullText
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Stream failed'
        setState({ isStreaming: false, streamedText: '', error: message })
        options.onError?.(message)
        return null
      } finally {
        setIsGenerating(false)
      }
    },
    [setIsGenerating]
  )

  const reset = useCallback(() => {
    setState({ isStreaming: false, streamedText: '', error: null })
  }, [])

  return { ...state, stream, reset }
}
