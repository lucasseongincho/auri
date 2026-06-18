// Server-side only — uses Node.js crypto and Upstash Redis REST API.
import { createHash } from 'crypto'
import { Redis } from '@upstash/redis'

const EMBED_TTL = 2592000 // 30 days

function cacheKey(texts: string[], inputType: 'query' | 'document'): string {
  const hash = createHash('sha256')
    .update(inputType + '\0' + texts.join('\n'), 'utf8')
    .digest('hex')
  return `embed:v1:${hash}`
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export async function getCachedEmbeddings(
  texts: string[],
  inputType: 'query' | 'document'
): Promise<number[][] | null> {
  if (!redis) return null
  try {
    return await redis.get<number[][]>(cacheKey(texts, inputType))
  } catch {
    return null
  }
}

export async function setCachedEmbeddings(
  texts: string[],
  inputType: 'query' | 'document',
  vectors: number[][]
): Promise<void> {
  if (!redis) return
  try {
    await redis.set(cacheKey(texts, inputType), vectors, { ex: EMBED_TTL })
  } catch {
    // non-fatal: next call will re-embed
  }
}
