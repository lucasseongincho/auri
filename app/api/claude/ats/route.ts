import { NextRequest } from 'next/server'
import { callClaude, buildErrorResponse, parseClaudeJSON, MAX_TOKENS_ANALYSIS } from '@/lib/claude'
import { buildATSScorePrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkBetaLimits, incrementBetaCall } from '@/lib/betaGuard'
import { APP_CONFIG } from '@/lib/config'
import type { ATSScore } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') ?? '0')
    if (contentLength > 50_000) {
      return Response.json({ error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
    }
    const body = await req.json() as {
      resumePlainText: string
      jobDescription: string
      uid?: string
      isPro?: boolean
    }

    // Server-side auth + rate limiting (guests allowed — fall back to IP rate limit)
    const verifiedUser = await getAuthenticatedUser(req)
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    if (!body.resumePlainText || !body.jobDescription) {
      return buildErrorResponse('resumePlainText and jobDescription are required', 400)
    }

    // Beta gate — requires sign-in; guests are blocked in beta mode
    if (APP_CONFIG.BETA_MODE) {
      if (!verifiedUser?.uid) {
        return Response.json({ error: 'Beta requires sign-in', code: 'AUTH_REQUIRED' }, { status: 401 })
      }
      const beta = await checkBetaLimits(verifiedUser.uid, verifiedUser.email)
      if (!beta.allowed) return Response.json(beta.body, { status: beta.status })
    }

    const prompt = buildATSScorePrompt(body.resumePlainText, body.jobDescription)
    const { text, inputTokens, outputTokens } = await callClaude(prompt, MAX_TOKENS_ANALYSIS)
    const data = parseClaudeJSON<ATSScore>(text)
    if (APP_CONFIG.BETA_MODE && verifiedUser?.uid) await incrementBetaCall(verifiedUser.uid)

    return Response.json({
      success: true,
      data,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    })
  } catch (err) {
    return buildErrorResponse(err instanceof Error ? err.message : 'ATS scoring failed')
  }
}
