// Server-side only — this file must NEVER be imported from client components.
// All Anthropic API calls are routed through /app/api/claude/* routes.

import Anthropic from '@anthropic-ai/sdk'

// ANTHROPIC_API_KEY is server-side only per CLAUDE.md §11 security rule
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// The model is pinned per CLAUDE.md §7 — never change without updating spec
export const CLAUDE_MODEL = 'claude-sonnet-4-5'

// Standard max tokens for full resume generation
export const MAX_TOKENS_RESUME = 4096
// Shorter budget for bullet-level Easy Tune rewrites
export const MAX_TOKENS_ASSIST = 256
// ATS scoring + interview prep can be verbose
export const MAX_TOKENS_ANALYSIS = 2048

// ── Non-streaming call (for short responses like Easy Tune) ───────────────────

export async function callClaude(
  prompt: string,
  maxTokens: number = MAX_TOKENS_ANALYSIS
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  const text =
    response.content[0].type === 'text' ? response.content[0].text : ''

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}

// ── Streaming call — returns the Anthropic stream object ─────────────────────
// Caller is responsible for converting to a ReadableStream for the Response

export async function streamClaude(
  prompt: string,
  maxTokens: number = MAX_TOKENS_RESUME
) {
  return client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
}

// ── JSON parse helper ─────────────────────────────────────────────────────────
// Handles markdown fences, preamble text, trailing commas, and other common
// Claude formatting quirks that break a raw JSON.parse call.

export function safeParseJSON<T>(raw: string): T {
  // Step 1: Strip markdown code fences
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```json\n?/i, '')
      .replace(/^```\n?/, '')
      .replace(/```\s*$/, '')
      .trim()
  }

  // Step 2: Extract JSON between the outermost { } in case there is preamble text
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }

  // Step 3: Parse — on failure, fix trailing commas and retry once
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const fixed = cleaned.replace(/,(\s*[}\]])/g, '$1')
    return JSON.parse(fixed) as T
  }
}

// Alias kept for backwards-compatibility with existing route imports
export const parseClaudeJSON = safeParseJSON

// ── Standardized error shape per CLAUDE.md §7 ─────────────────────────────────

export function buildErrorResponse(message: string, status = 500) {
  return Response.json(
    { success: false, data: null, usage: { input_tokens: 0, output_tokens: 0 }, error: message },
    { status }
  )
}
