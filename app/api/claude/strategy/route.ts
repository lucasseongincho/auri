import { NextRequest } from 'next/server'
import { streamClaude, buildErrorResponse } from '@/lib/claude'
import { buildJobStrategyPrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'

export const runtime = 'nodejs'
export const maxDuration = 60

interface StrategyRequestBody {
  targetPosition: string
  sectorOrIndustry: string
  cityOrRemote: string
  companySizeOrType: string
  uid?: string
  isPro?: boolean
}

async function attemptStream(prompt: string, retryCount = 0): Promise<ReadableStream<Uint8Array>> {
  try {
    const claudeStream = await streamClaude(prompt, 4096)
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of claudeStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 529 && retryCount < 1) {
      await new Promise((r) => setTimeout(r, 2000))
      return attemptStream(prompt, retryCount + 1)
    }
    throw err
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as StrategyRequestBody

    // Server-side auth + rate limiting
    const verifiedUser = await getAuthenticatedUser(req)
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    if (!body.targetPosition?.trim()) {
      return buildErrorResponse('targetPosition is required', 400)
    }

    const prompt = buildJobStrategyPrompt(
      body.targetPosition,
      body.sectorOrIndustry ?? '',
      body.cityOrRemote ?? 'Remote',
      body.companySizeOrType ?? ''
    )

    const stream = await attemptStream(prompt)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    return buildErrorResponse(err instanceof Error ? err.message : 'Strategy generation failed')
  }
}
