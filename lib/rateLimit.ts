// ── Rate Limiter — in-memory sliding window ───────────────────────────────────
// Per CLAUDE.md Phase 3: 10 calls/min free tier, 60 calls/min Pro tier.
//
// Why in-memory: Avoids Upstash/Redis dependency for Phase 3. Works correctly
// for single-process deployments (local dev, single Vercel instance). A Redis
// backend would be needed for multi-region deploys — noted as Phase 4 upgrade.
//
// Why sliding window vs fixed window: Prevents burst abuse at window boundaries
// (a fixed window allows 2× the limit by hitting end + start of adjacent windows).

interface WindowEntry {
  timestamps: number[]
}

const store = new Map<string, WindowEntry>()

const WINDOW_MS = 60_000 // 1 minute

const LIMITS = {
  free: 10,
  pro: 60,
} as const

/**
 * Check whether the given identifier is within its rate limit.
 * @param identifier - uid for authenticated users, IP for guests
 * @param isPro      - whether the user is on the Pro tier
 * @returns { allowed: boolean; retryAfter: number } — retryAfter is in seconds
 */
export function checkRateLimit(
  identifier: string,
  isPro: boolean
): { allowed: boolean; retryAfter: number } {
  const limit = isPro ? LIMITS.pro : LIMITS.free
  const now = Date.now()

  const entry = store.get(identifier) ?? { timestamps: [] }

  // Prune timestamps outside the sliding window
  const windowStart = now - WINDOW_MS
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  if (entry.timestamps.length >= limit) {
    // Oldest timestamp in window + 1 minute = when the earliest slot frees up
    const oldest = entry.timestamps[0]
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000)
    store.set(identifier, entry)
    return { allowed: false, retryAfter: Math.max(1, retryAfter) }
  }

  entry.timestamps.push(now)
  store.set(identifier, entry)
  return { allowed: true, retryAfter: 0 }
}

/**
 * Extract the best available identifier from a Next.js request.
 * Falls back through uid → x-forwarded-for → x-real-ip → 'unknown'.
 */
export function getIdentifier(req: Request, uid?: string): string {
  if (uid) return `uid:${uid}`
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return `ip:${forwarded.split(',')[0].trim()}`
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return `ip:${realIp}`
  return 'ip:unknown'
}

/**
 * Build a standardized 429 rate-limit response.
 */
export function rateLimitResponse(retryAfter: number): Response {
  return Response.json(
    {
      success: false,
      data: null,
      usage: { input_tokens: 0, output_tokens: 0 },
      error: 'Rate limit reached',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}
