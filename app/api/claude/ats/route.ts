import { NextRequest } from 'next/server'
import { callClaude, buildErrorResponse, parseClaudeJSON, MAX_TOKENS_ANALYSIS } from '@/lib/claude'
import { buildATSScorePrompt, buildATSFixPrompt } from '@/lib/prompts'
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
      mode?: 'score' | 'fix'
      resumePlainText?: string
      resumeText?: string
      jobDescription: string
      uid?: string
      isPro?: boolean
      missingKeywords?: string[]
      formattingIssues?: string[]
      suggestions?: string[]
    }

    // Server-side auth + rate limiting (guests allowed — fall back to IP rate limit)
    const verifiedUser = await getAuthenticatedUser(req)
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    // Beta gate — requires sign-in; guests are blocked in beta mode
    if (APP_CONFIG.BETA_MODE) {
      if (!verifiedUser?.uid) {
        return Response.json({ error: 'Beta requires sign-in', code: 'AUTH_REQUIRED' }, { status: 401 })
      }
      const beta = await checkBetaLimits(verifiedUser.uid, verifiedUser.email)
      if (!beta.allowed) return Response.json(beta.body, { status: beta.status })
    }

    const mode = body.mode ?? 'score'

    // ── Fix mode: rewrite resume to incorporate missing keywords / fix issues ──
    if (mode === 'fix') {
      const resumeText = body.resumeText ?? body.resumePlainText ?? ''
      if (!resumeText || !body.jobDescription) {
        return buildErrorResponse('resumeText and jobDescription are required', 400)
      }

      const prompt = buildATSFixPrompt(
        resumeText,
        body.jobDescription,
        body.missingKeywords ?? [],
        body.formattingIssues ?? [],
        body.suggestions ?? []
      )
      // Plain text output — higher token limit to allow full resume
      const { text, inputTokens, outputTokens } = await callClaude(prompt, MAX_TOKENS_ANALYSIS)
      if (APP_CONFIG.BETA_MODE && verifiedUser?.uid) await incrementBetaCall(verifiedUser.uid)

      return Response.json({
        success: true,
        improvedResume: text.trim(),
        usage: { input_tokens: inputTokens, output_tokens: outputTokens },
      })
    }

    // ── Score mode (default) ──────────────────────────────────────────────────
    const resumePlainText = body.resumePlainText ?? body.resumeText ?? ''
    if (!resumePlainText || !body.jobDescription) {
      return buildErrorResponse('resumePlainText and jobDescription are required', 400)
    }

    const prompt = buildATSScorePrompt(resumePlainText, body.jobDescription)
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
