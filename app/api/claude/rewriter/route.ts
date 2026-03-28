import { NextRequest } from 'next/server'
import { streamClaude, buildErrorResponse } from '@/lib/claude'
import { buildRewriterPrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkBetaLimits, incrementBetaCall } from '@/lib/betaGuard'
import { APP_CONFIG } from '@/lib/config'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ExtraSectionsPayload {
  certifications?: unknown[] | null
  languages?: unknown[] | null
  leadership?: unknown[] | null
  volunteer?: unknown[] | null
  extras?: unknown[] | null
}

interface RewriterRequestBody {
  originalText: string
  targetPosition: string
  targetCompany: string
  companyType: string
  jobDescription: string
  extraSections?: ExtraSectionsPayload
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
    const body = await req.json() as RewriterRequestBody

    // Server-side auth + rate limiting (guests allowed — fall back to IP rate limit)
    const verifiedUser = await getAuthenticatedUser(req)
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    const { originalText, targetPosition, targetCompany, companyType, jobDescription, extraSections } = body

    if (!originalText?.trim() || !targetPosition?.trim()) {
      return buildErrorResponse('originalText and targetPosition are required', 400)
    }

    if (APP_CONFIG.BETA_MODE && verifiedUser?.uid) {
      const beta = await checkBetaLimits(verifiedUser.uid, verifiedUser.email)
      if (!beta.allowed) return Response.json(beta.body, { status: beta.status })
    }
    if (APP_CONFIG.BETA_MODE && verifiedUser?.uid) await incrementBetaCall(verifiedUser.uid)

    const prompt = buildRewriterPrompt(
      originalText,
      targetPosition,
      targetCompany ?? '',
      companyType ?? '',
      jobDescription ?? '',
      extraSections
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
    const message = err instanceof Error ? err.message : 'Resume rewrite failed'
    return buildErrorResponse(message)
  }
}
