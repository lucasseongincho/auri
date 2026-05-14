# Code Conventions & Operations

## Code Rules
IMPORTANT: TypeScript everywhere — no `any` types
IMPORTANT: ANTHROPIC_API_KEY server-side only — never in NEXT_PUBLIC_ variables
IMPORTANT: All Claude calls go through /api/claude/* routes — never from client
- Functional components only, no class components
- PascalCase components, camelCase functions, SCREAMING_SNAKE constants
- Absolute imports with @/ alias
- Comment the "why" not the "what"

## Git
- Commit format: feat: / fix: / chore: / refactor:
- Push to main after every completed task

## Error Handling
- Error boundaries: app/dashboard/error.tsx + per-feature error.tsx files
- app/not-found.tsx for 404s
- All API errors use buildErrorResponse() from lib/claude.ts

## Performance Rules
- Streaming responses: always stream, never wait for complete response
- Skeleton loaders on every AI-awaiting content area
- No full-page reloads — Next.js client-side routing only
- Rate limiting: 10 calls/min free tier, 60/min Pro (lib/rateLimit.ts)

## Beta Mode
- Currently BETA_MODE = true in lib/config.ts
- Beta ends: 2026-07-01
- Weekly call limit: 12 per user
- See lib/config.ts for full beta → paid transition checklist

## Environment Variables
NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET,
MESSAGING_SENDER_ID, APP_ID
ANTHROPIC_API_KEY (server only)
NEXT_PUBLIC_APP_URL=https://auri-beta.vercel.app
STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
