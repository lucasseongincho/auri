# Other Features

## Feature 6 — LinkedIn Profile Rewriter
- Rewrites headline, About, top 3 experience entries
- LinkedIn-style card preview with copy buttons per section
- Prompts: see lib/prompts.ts → buildLinkedInPrompt()
- Route: /dashboard/linkedin

## Feature 7 — 7-Day Job Search Strategy
- Day-by-day plan with interactive checklist
- Progress saved to Firestore
- Prompts: see lib/prompts.ts → buildStrategyPrompt()
- Route: /dashboard/strategy

## Feature 10 — Career Profile (Interconnection Hub)
- Central data store connecting all features
- Firestore path: users/{uid}/profile/data
- Guest mode: localStorage with migration on sign-in
- CareerProfileDrawer: global sidebar accessible from all dashboard pages
- Cross-feature flow: Resume Builder → Career Profile → available in all other features

## Current Status
- [x] All features built and deployed
- [x] Career Profile drawer working
- [x] Cross-feature data flow working
