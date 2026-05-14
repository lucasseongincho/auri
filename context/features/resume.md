# Resume Features

## Feature 1 — Resume Builder
- 8-step structured form: Personal → Experience → Education → Skills →
  Certifications → Projects → Leadership → Target Job
- AI generates ATS-optimized resume tailored to a specific job posting
- Live ClassicPro template preview on the right panel
- Structured form editor (NOT contentEditable) — see components/resume/ResumeEditor.tsx
- PDF export via Puppeteer API route (/api/pdf) with html2pdf.js fallback
- Prompts: see lib/prompts.ts → buildResumePrompt()

## Feature 2 — ATS Score & Optimizer
- Analyzes resume against job description, returns 0–100 score
- Shows matched/missing keywords, formatting flags, suggestions
- Prompts: see lib/prompts.ts → buildATSPrompt()

## Feature 3 — Resume Editor (Easy Tune)
- Structured form editor — each field is a controlled React input
- Bullet points: individual auto-grow textareas with add/delete buttons
- Skills/Certifications: tag pills (type + Enter to add, × to remove)
- Languages: rows with text input + proficiency dropdown (Native/Fluent/Intermediate/Basic)
- Optional sections (Projects, Languages, Certifications, Leadership) only render if data exists
- Undo/Redo via Zustand history (pushToHistory, undo, redo)
- Lives in: components/resume/ResumeEditor.tsx

## Feature 4 — Resume Templates
- ONLY ClassicPro template — others were removed
- Template lives in: components/resume/templates/ClassicPro.tsx
- No template switcher UI anywhere in the app

## Feature 5 — Resume Rewriter
- User selects from saved AURI resumes OR pastes text
- Saved resume list: max-height capped, scrollable, shows ~5-6 items
- Side-by-side before/after view after rewrite
- Prompts: see lib/prompts.ts → buildRewriterPrompt()

## Current Status
- [x] All resume features built and deployed
- [x] Structured form editor (replaced contentEditable)
- [x] Puppeteer PDF export implemented
- [x] ClassicPro only (other templates removed)
