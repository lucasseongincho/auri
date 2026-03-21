import { NextRequest } from 'next/server'
import { streamClaude, callClaude, buildErrorResponse, parseClaudeJSON } from '@/lib/claude'
import { buildInterviewPrepPrompt, buildPracticeFeedbackPrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'

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
    const body = await req.json() as InterviewRequestBody

    // Server-side auth + rate limiting
    const verifiedUser = await getAuthenticatedUser(req)
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    // Practice mode — short non-streaming response
    if (body.mode === 'practice') {
      if (!body.question || !body.userAnswer || !body.targetPosition) {
        return buildErrorResponse('question, userAnswer, and targetPosition required for practice mode', 400)
      }
      const prompt = buildPracticeFeedbackPrompt(body.question, body.userAnswer, body.targetPosition)
      const { text, inputTokens, outputTokens } = await callClaude(prompt, 1024)
      const data = parseClaudeJSON(text)
      return Response.json({
        success: true,
        data,
        usage: { input_tokens: inputTokens, output_tokens: outputTokens },
      })
    }

    // Generate mode — streaming
    if (!body.position?.trim() || !body.company?.trim()) {
      return buildErrorResponse('position and company are required', 400)
    }

    const prompt = buildInterviewPrepPrompt(
      body.position,
      body.company,
      body.experienceSummary ?? ''
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
    return buildErrorResponse(err instanceof Error ? err.message : 'Interview prep generation failed')
  }
}
