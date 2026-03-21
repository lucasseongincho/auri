import { NextRequest } from 'next/server'
import { callClaude, buildErrorResponse, parseClaudeJSON, MAX_TOKENS_ANALYSIS } from '@/lib/claude'
import { buildATSScorePrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import type { ATSScore } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      resumePlainText: string
      jobDescription: string
      uid?: string
      isPro?: boolean
    }

    // Server-side auth + rate limiting
    const verifiedUser = await getAuthenticatedUser(req)
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    if (!body.resumePlainText || !body.jobDescription) {
      return buildErrorResponse('resumePlainText and jobDescription are required', 400)
    }

    const prompt = buildATSScorePrompt(body.resumePlainText, body.jobDescription)
    const { text, inputTokens, outputTokens } = await callClaude(prompt, MAX_TOKENS_ANALYSIS)
    const data = parseClaudeJSON<ATSScore>(text)

    return Response.json({
      success: true,
      data,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    })
  } catch (err) {
    return buildErrorResponse(err instanceof Error ? err.message : 'ATS scoring failed')
  }
}
