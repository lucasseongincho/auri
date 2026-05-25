# AURI — Claude Code Rules

> AI-powered career toolkit. Read this file first. For detailed specs, use the routing table below.

## Project
- **Product:** AURI — ATS-optimized career toolkit
- **Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Firebase Auth + Firestore,
  Anthropic Claude API (claude-sonnet-4-5), Zustand, Upstash Redis, Stripe, Vercel
- **URL:** https://auri-beta.vercel.app
- **GitHub:** https://github.com/lucasseongincho/auri

## Must NOT Do
IMPORTANT: Never use `any` TypeScript types
IMPORTANT: Never put ANTHROPIC_API_KEY in client-side code or NEXT_PUBLIC_ variables
IMPORTANT: Never call Claude API directly from client — always use /api/claude/* routes
IMPORTANT: Never use contentEditable for resume editing — use the structured form editor
IMPORTANT: Always use claude-sonnet-4-5 — never change the model
IMPORTANT: Never push broken builds — run npm run build before every commit

## Core Conventions
- TypeScript everywhere, functional components only
- Absolute imports with @/ alias
- Commit format: feat: / fix: / chore: / refactor:
- Push to main after every completed task
- Double-bezel card pattern for all UI cards (see context/design/design-system.md)
- SPRING = { type: 'spring', stiffness: 300, damping: 30 } for all animations

## Routing Table
Read the relevant context file before starting any task in that domain:

| Task Domain | Context File |
|---|---|
| Resume features (builder, editor, ATS, rewriter, templates) | context/features/resume.md |
| Cover letter feature | context/features/cover-letter.md |
| Interview prep feature | context/features/interview.md |
| LinkedIn, Strategy, Career Profile | context/features/other-features.md |
| API routes, Claude integration, auth, rate limiting | context/architecture/api-design.md |
| Firestore, Zustand, localStorage, data models | context/architecture/database.md |
| UI components, colors, animations, mobile layout | context/design/design-system.md |
| Code conventions, env vars, beta mode, error handling | context/ops/conventions.md |
| What's built, what's not, parking lot | context/ops/status.md |

- Domain-specific task → read the relevant context file first
- Unsure which applies → proceed with core rules above

---

## gstack

Use /browse skill from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

Available skills:
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark,
/browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy,
/retro, /investigate, /document-release, /codex, /cso, /careful, /freeze, /guard,
/unfreeze, /gstack-upgrade

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
