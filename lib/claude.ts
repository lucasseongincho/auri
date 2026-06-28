// Server-side only — this file must NEVER be imported from client components.
// All Anthropic API calls are routed through /app/api/claude/* routes.

import Anthropic from '@anthropic-ai/sdk'

// ANTHROPIC_API_KEY is server-side only per CLAUDE.md §11 security rule
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set')
}

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
  maxTokens: number = MAX_TOKENS_RESUME,
  temperature = 1.0
) {
  return client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  })
}

// ── JSON parse helper ─────────────────────────────────────────────────────────
// Handles markdown fences, preamble text, smart quotes, trailing commas, and
// nested objects (bracket-depth extraction instead of lastIndexOf).

// Walk the JSON string character-by-character, tracking whether the cursor is
// inside a quoted string value. When inside a string, replace bare newlines /
// carriage-returns / tabs with their JSON escape sequences so JSON.parse
// accepts them. Proper escape sequences already in the text are left intact.
function sanitizeJSONControlChars(json: string): string {
  let result = ''
  let inString = false
  let i = 0
  while (i < json.length) {
    const ch = json[i]
    if (ch === '\\' && inString) {
      // Copy escape sequence verbatim and skip past it
      result += ch + (json[i + 1] ?? '')
      i += 2
      continue
    }
    if (ch === '"') {
      inString = !inString
      result += ch
    } else if (inString && ch === '\n') {
      result += '\\n'
    } else if (inString && ch === '\r') {
      // bare CR — skip (CRLF pairs: the \n above handles the line break)
    } else if (inString && ch === '\t') {
      result += '\\t'
    } else {
      result += ch
    }
    i++
  }
  return result
}

class JSONParseError extends Error {
  constructor(message: string, public readonly rawText: string) {
    super(message)
    this.name = 'JSONParseError'
  }
}

export function parseClaudeJSON<T>(raw: string): T {
  // Strip markdown fences
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/i, '')
      .replace(/```\s*$/, '')
      .trim()
  }

  // Use bracket-depth counting to extract the outermost JSON object or array
  const firstBrace = cleaned.indexOf('{')
  const firstBracket = cleaned.indexOf('[')
  const startChar =
    firstBrace !== -1
      ? firstBracket !== -1
        ? firstBrace < firstBracket ? '{' : '['
        : '{'
      : '['
  const endChar = startChar === '{' ? '}' : ']'
  const start = cleaned.indexOf(startChar)
  if (start !== -1) {
    let depth = 0
    let end = -1
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === startChar) depth++
      else if (cleaned[i] === endChar) {
        depth--
        if (depth === 0) { end = i; break }
      }
    }
    if (end !== -1) cleaned = cleaned.slice(start, end + 1)
  }

  // Repair common Claude quirks: smart quotes + trailing commas
  const preRepaired = cleaned
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/,(\s*[}\]])/g, '$1')

  // Escape literal control characters (newlines, tabs, CRs) that appear inside
  // JSON string values. Claude emits these unescaped in multi-line fields like
  // star_example, which makes the output structurally invalid JSON.
  const repaired = sanitizeJSONControlChars(preRepaired)

  try {
    return JSON.parse(repaired) as T
  } catch (err) {
    throw new JSONParseError(
      `Claude JSON parse failed: ${(err as Error).message}`,
      raw
    )
  }
}

// ── callClaudeJSON — non-streaming call that parses JSON with one retry ───────

export async function callClaudeJSON<T>(
  prompt: string,
  maxTokens: number = MAX_TOKENS_ANALYSIS,
  retries = 1
): Promise<{ data: T; inputTokens: number; outputTokens: number }> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { text, inputTokens, outputTokens } = await callClaude(prompt, maxTokens)
    try {
      const data = parseClaudeJSON<T>(text)
      return { data, inputTokens, outputTokens }
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }
  throw lastError
}

// ── Standardized error shape per CLAUDE.md §7 ─────────────────────────────────

export function buildErrorResponse(message: string, status = 500) {
  return Response.json(
    { success: false, data: null, usage: { input_tokens: 0, output_tokens: 0 }, error: message },
    { status }
  )
}
