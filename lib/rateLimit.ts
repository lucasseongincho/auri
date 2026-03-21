// ── Rate Limiter — Upstash Redis sliding window with in-memory fallback ───────
//
// Primary backend: Upstash Redis (production Vercel deploys)
//   - Persists across serverless function invocations and multiple instances
//   - Configured via UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//
// Fallback: In-memory sliding window (local dev / when Upstash not configured)
//   - Correct for single-process use; resets on function cold start
//
// Limits per CLAUDE.md §12: 10 calls/min free, 60 calls/min Pro
// Sliding window prevents burst abuse at window boundaries.

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const WINDOW_MS = 60_000
const LIMITS = { free: 10, pro: 60 } as const

// ── In-memory fallback ────────────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[]
}

const memoryStore = new Map<string, WindowEntry>()

function checkInMemory(
  identifier: string,
  isPro: boolean
): { allowed: boolean; retryAfter: number } {
  const limit = isPro ? LIMITS.pro : LIMITS.free
  const now = Date.now()
  const entry = memoryStore.get(identifier) ?? { timestamps: [] }
  entry.timestamps = entry.timestamps.filter((t) => t > now - WINDOW_MS)

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0]
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000)
    memoryStore.set(identifier, entry)
    return { allowed: false, retryAfter: Math.max(1, retryAfter) }
  }

  entry.timestamps.push(now)
  memoryStore.set(identifier, entry)
  return { allowed: true, retryAfter: 0 }
}

// ── Upstash Redis ─────────────────────────────────────────────────────────────

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

let ratelimitFree: Ratelimit | null = null
let ratelimitPro: Ratelimit | null = null

if (hasUpstash) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  ratelimitFree = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LIMITS.free, '1 m'),
    prefix: 'auri:rl',
  })
  ratelimitPro = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LIMITS.pro, '1 m'),
    prefix: 'auri:rl:pro',
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check whether the given identifier is within its rate limit.
 * Uses Upstash Redis in production, falls back to in-memory if not configured.
 */
export async function checkRateLimit(
  identifier: string,
  isPro: boolean
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (hasUpstash && ratelimitFree && ratelimitPro) {
    try {
      const limiter = isPro ? ratelimitPro : ratelimitFree
      const { success, reset } = await limiter.limit(identifier)
      if (success) return { allowed: true, retryAfter: 0 }
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return { allowed: false, retryAfter: Math.max(1, retryAfter) }
    } catch {
      // Redis error — fall through to in-memory
    }
  }
  return checkInMemory(identifier, isPro)
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
 * Build a standardized 429 rate-limit response per task spec:
 * { error: "Rate limit reached", retryAfter: seconds }
 */
export function rateLimitResponse(retryAfter: number): Response {
  return Response.json(
    { error: 'Rate limit reached', retryAfter },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(LIMITS.free),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}
