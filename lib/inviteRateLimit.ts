// Rate limiting for invite endpoints — separate from Claude route limiter
// because invite routes need a longer window (15 min) and IP-only keying
// (users are not authenticated when they validate/redeem an invite code).

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const INVITE_LIMIT = 10        // attempts per window
const INVITE_WINDOW = '15 m'   // per 15 minutes per IP

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

let upstashLimiter: Ratelimit | null = null

if (hasUpstash) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  upstashLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(INVITE_LIMIT, INVITE_WINDOW),
    prefix: 'auri:invite',
  })
}

// In-memory fallback for local dev / missing Upstash
interface WindowEntry { timestamps: number[] }
const memStore = new Map<string, WindowEntry>()
const WINDOW_MS = 15 * 60_000

function checkInMemory(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = memStore.get(ip) ?? { timestamps: [] }
  entry.timestamps = entry.timestamps.filter((t) => t > now - WINDOW_MS)
  if (entry.timestamps.length >= INVITE_LIMIT) {
    const retryAfter = Math.ceil((entry.timestamps[0] + WINDOW_MS - now) / 1000)
    memStore.set(ip, entry)
    return { allowed: false, retryAfter: Math.max(1, retryAfter) }
  }
  entry.timestamps.push(now)
  memStore.set(ip, entry)
  return { allowed: true, retryAfter: 0 }
}

export async function checkInviteRateLimit(req: Request): Promise<{ allowed: boolean; retryAfter: number }> {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = (forwarded ? forwarded.split(',')[0].trim() : realIp) ?? 'unknown'
  const key = `ip:${ip}`

  if (upstashLimiter) {
    try {
      const { success, reset } = await upstashLimiter.limit(key)
      if (success) return { allowed: true, retryAfter: 0 }
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) }
    } catch {
      // Redis error — fall through to in-memory
    }
  }
  return checkInMemory(key)
}
