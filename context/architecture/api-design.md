# API Design

## Route Pattern
All Claude API calls: /app/api/claude/[feature]/route.ts
PDF export: /app/api/pdf/route.ts (Puppeteer + html2pdf.js fallback)

## Auth on Every Route
1. getAuthenticatedUser(req) — Firebase Admin token verification
2. checkRateLimit(identifier, isPro) — Upstash Redis + in-memory fallback
3. checkAndIncrementBetaCall(uid, email) — atomic Firestore transaction (prevents race condition)

## Beta Guard
- IMPORTANT: Use checkAndIncrementBetaCall (NOT the old 2-step check+increment)
- This is an atomic Firestore transaction that prevents double-billing
- See lib/betaGuard.ts

## Claude JSON Parsing
- Use callClaudeJSON<T>() for non-streaming routes — includes repair + 1 retry
- Use parseClaudeJSON<T>() directly only if you need manual control
- See lib/claude.ts

## Standard Request Shape
POST /api/claude/[feature]
{ careerProfile, target, mode: 'generate' | 'rewrite' | 'assist', uid, isPro }

## Standard Response Shape
{ success: boolean, data: object, usage: { input_tokens, output_tokens } }

## Model
IMPORTANT: Always use claude-sonnet-4-5. Never change without updating this file.

## Streaming
- Long-form generation uses streamClaude()
- Frontend uses stream() hook from hooks/useAIStream.ts
- Never wait for complete response before showing output

## Error Handling
- buildErrorResponse() for all error returns
- 529 overloaded: 1 automatic retry with 2s delay
- Payload limit: 50KB enforced on every route
