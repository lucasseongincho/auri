import { NextRequest } from 'next/server'
import { streamClaude, callClaude, buildErrorResponse, parseClaudeJSON, MAX_TOKENS_RESUME, MAX_TOKENS_ASSIST } from '@/lib/claude'
import { buildResumePrompt, buildEasyTunePrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkBetaLimits, incrementBetaCall } from '@/lib/betaGuard'
import { APP_CONFIG } from '@/lib/config'
import type { CareerProfile, TargetJob, APIMode } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ResumeRequestBody {
  careerProfile: CareerProfile
  target: {
    position: string
    company: string
    companyType: string
    jobDescription: string
  }
  mode: APIMode
  selectedText?: string  // for 'assist' mode
  uid?: string
  isPro?: boolean
}

async function attemptStream(prompt: string, retryCount = 0): Promise<ReadableStream<Uint8Array>> {
  try {
    const claudeStream = await streamClaude(prompt, MAX_TOKENS_RESUME)

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
    // Retry once on 529 (Claude overloaded) per CLAUDE.md §7
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
    const body = await req.json() as ResumeRequestBody
    const { careerProfile, target, mode, selectedText } = body

    // Server-side auth + rate limiting
    const verifiedUser = await getAuthenticatedUser(req)
    if (!verifiedUser) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    // Beta gate
    if (APP_CONFIG.BETA_MODE && verifiedUser?.uid) {
      const beta = await checkBetaLimits(verifiedUser.uid, verifiedUser.email)
      if (!beta.allowed) return Response.json(beta.body, { status: beta.status })
    }

    // Easy Tune (assist mode) — short non-streaming response
    if (mode === 'assist') {
      if (!selectedText || !target.position) {
        return buildErrorResponse('selectedText and target.position required for assist mode', 400)
      }
      const prompt = buildEasyTunePrompt(selectedText, target.position)
      const { text, inputTokens, outputTokens } = await callClaude(prompt, MAX_TOKENS_ASSIST)
      const data = parseClaudeJSON<{ rewritten: string }>(text)
      if (APP_CONFIG.BETA_MODE && verifiedUser?.uid) await incrementBetaCall(verifiedUser.uid)
      return Response.json({
        success: true,
        data,
        usage: { input_tokens: inputTokens, output_tokens: outputTokens },
      })
    }

    // Generate / Rewrite — streaming response
    if (!careerProfile || !target.position) {
      return buildErrorResponse('careerProfile and target.position are required', 400)
    }

    const targetJob: TargetJob = {
      position: target.position,
      company: target.company,
      company_type: target.companyType,
      industry: '',
      city: '',
      job_description: target.jobDescription,
    }

    const prompt = buildResumePrompt(careerProfile, targetJob)
    if (APP_CONFIG.BETA_MODE && verifiedUser?.uid) await incrementBetaCall(verifiedUser.uid)
    const stream = await attemptStream(prompt)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resume generation failed'
    return buildErrorResponse(message)
  }
}
