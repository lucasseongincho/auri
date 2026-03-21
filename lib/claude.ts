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

// ── JSON parse helper with single retry ───────────────────────────────────────
// Claude occasionally wraps JSON in markdown code fences — this strips them

export function parseClaudeJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  return JSON.parse(cleaned) as T
}

// ── Standardized error shape per CLAUDE.md §7 ─────────────────────────────────

export function buildErrorResponse(message: string, status = 500) {
  return Response.json(
    { success: false, data: null, usage: { input_tokens: 0, output_tokens: 0 }, error: message },
    { status }
  )
}
