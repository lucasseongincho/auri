import { NextRequest } from 'next/server'
import { callClaudeJSON, buildErrorResponse } from '@/lib/claude'
import { buildInterviewPrepPrompt, buildPracticeFeedbackPrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkAndIncrementBetaCall } from '@/lib/betaGuard'
import { APP_CONFIG } from '@/lib/config'
import type { InterviewPrep } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface InterviewRequestBody {
  mode: 'generate' | 'practice'
  // generate mode
  position?: string
  company?: string
  experienceSummary?: string
  // practice mode
  question?: string
  userAnswer?: string
  targetPosition?: string
  // auth
  uid?: string
  isPro?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') ?? '0')
    if (contentLength > 50_000) {
      return Response.json({ error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
    }
    const body = await req.json() as InterviewRequestBody

    // Server-side auth + rate limiting
    const verifiedUser = await getAuthenticatedUser(req)
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    // Beta gate — requires sign-in; guests are blocked in beta mode
    if (APP_CONFIG.BETA_MODE) {
      if (!verifiedUser?.uid) {
        return Response.json({ error: 'Beta requires sign-in', code: 'AUTH_REQUIRED' }, { status: 401 })
      }
      const beta = await checkAndIncrementBetaCall(verifiedUser.uid, verifiedUser.email)
      if (!beta.allowed) return Response.json(beta.body, { status: beta.status })
    }

    // Practice mode
    if (body.mode === 'practice') {
      if (!body.question || !body.userAnswer || !body.targetPosition) {
        return buildErrorResponse('question, userAnswer, and targetPosition required for practice mode', 400)
      }
      const prompt = buildPracticeFeedbackPrompt(body.question, body.userAnswer, body.targetPosition)
      const { data, inputTokens, outputTokens } = await callClaudeJSON(prompt, 1024)
      return Response.json({
        success: true,
        data,
        usage: { input_tokens: inputTokens, output_tokens: outputTokens },
      })
    }

    // Generate mode — non-streaming so the server parses and validates the JSON
    // before returning. Streaming JSON client-side is unreliable: unescaped newlines
    // and other Claude quirks in star_example fields break JSON.parse.
    if (!body.position?.trim() || !body.company?.trim()) {
      return buildErrorResponse('position and company are required', 400)
    }

    const prompt = buildInterviewPrepPrompt(
      body.position,
      body.company,
      body.experienceSummary ?? ''
    )

    const { data, inputTokens, outputTokens } = await callClaudeJSON<InterviewPrep>(prompt, 8192)

    // Ensure questions_to_ask is always present even if Claude omits it
    if (!Array.isArray(data.questions_to_ask)) {
      data.questions_to_ask = []
    }

    return Response.json({
      success: true,
      data,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    })
  } catch (err) {
    return buildErrorResponse(err instanceof Error ? err.message : 'Interview prep generation failed')
  }
}
