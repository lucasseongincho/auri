# CLAUDE.md — AI Resume Generator ("AURI")

> This file is the single source of truth for all AI-assisted development on this project.
> Read this file completely before writing any code, creating any component, or making any architectural decision.

---

## 1. PROJECT OVERVIEW

**Product Name:** AURI (working title — can be changed)
**Purpose:** An AI-powered, ATS-optimized career toolkit that helps job seekers generate tailored resumes, rewrite LinkedIn profiles, craft cover letters, prepare for interviews, build job-search strategies, and more — all powered by Claude AI (claude-sonnet-4-5).
**Primary User:** English-speaking job seekers at any career stage.
**Core Philosophy:** Every feature feeds every other feature. The app is one interconnected career operating system, not a collection of isolated tools.

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| AI Engine | Anthropic Claude API (`claude-sonnet-4-5`) |
| Auth | Firebase Auth (Google OAuth + Email/Password) |
| Database | Firebase Firestore |
| File Storage: None — PDFs generated client-side via html2pdf.js on demand|
| Hosting/Deploy | Vercel (Firebase for auth/db) — App URL: https://auri-beta.vercel.app |
| Resume Output | HTML → PDF (via Puppeteer on API route or `react-to-print` client-side) |
| Styling System | Supanova Design System (see Section 9) |

---

## 3. RESUME OUTPUT FORMAT DECISION

**Format: HTML rendered to PDF — NOT .docx**

Rationale:
- **ATS Compatibility**: Clean semantic HTML with proper `<h1>`/`<h2>`/`<p>` hierarchy is parsed correctly by all major ATS systems (Workday, Greenhouse, Lever, iCIMS).
- **Visual Excellence**: Full CSS control over typography, spacing, color, and layout. Can render beautifully for human reviewers without sacrificing ATS structure.
- **Easy Tune**: Users edit a live HTML preview in the browser before generating the PDF — no round-trip to a server needed for edits.
- **Export**: A single API route using Puppeteer (headless Chrome) converts the final HTML to a pixel-perfect PDF for download.
- **Implementation**: Two resume layers — (1) a styled visual HTML template for display/PDF export, (2) a clean plain-text version auto-generated alongside it for copy-paste into ATS portals.

---

## 4. FEATURE SPECIFICATIONS

All 10 features are interconnected. Data entered in one feature (e.g., experience in the Resume Builder) is automatically available in all other features (Cover Letter, Interview Prep, etc.) via a shared **Career Profile** context stored in Firestore (for logged-in users) or localStorage (for guests).

---

### Feature 1 — Smart Resume Builder (Core)

**What it does:** Collects user's raw experience and generates a fully formatted, ATS-optimized resume tailored to a specific job posting.

**User Flow:**
1. User fills in a structured form: Personal Info → Work Experience → Education → Skills → Certifications → Projects
2. User inputs: Target Company Name, Target Role/Position, Job Description (paste or URL)
3. Claude analyzes the JD and rewrites the resume using the Feature 5 prompt (see below)
4. Live preview renders on the right panel
5. User can Easy Tune (Feature 3) or download PDF

**AI Prompt (internal — not shown to user):**
```
Act as a senior recruiter who reviews 200 resumes a day.
Rewrite this resume for the position of [target_position] at [target_company], a [type_of_company].
Replace every responsibility with a measurable achievement.
Eliminate everything generic.
Make the candidate's value impossible to ignore.
Optimize every bullet point for ATS keyword matching based on this job description: [job_description].
Return the result as structured JSON with fields: summary, experience (array), education (array), skills (array), certifications (array).
```

**ATS Rules enforced by Claude:**
- No tables, no columns in the plain-text version
- Keywords from JD injected naturally (not stuffed)
- Action verbs at the start of every bullet
- Quantified achievements wherever possible
- Standard section headers (Experience, Education, Skills — not creative names)
- No headers/footers in the ATS plain-text export

---

### Feature 2 — ATS Score & Optimizer

**What it does:** Analyzes the generated (or uploaded) resume against a job description and gives a real-time ATS match score with specific improvement suggestions.

**User Flow:**
1. After resume is generated, an ATS Score panel appears (0–100%)
2. Shows: keyword match %, missing keywords, formatting flags, readability score
3. One-click "Fix All" re-runs Claude to patch the issues
4. Score updates live

**AI Prompt (internal):**
```
You are an ATS system and senior recruiter combined.
Analyze this resume against this job description.
Return JSON: { score: number (0-100), matched_keywords: [], missing_keywords: [], formatting_issues: [], suggestions: [], strength_areas: [] }
Job Description: [job_description]
Resume Text: [resume_plain_text]
```

---

### Feature 3 — Easy Tune (Inline Editor)

**What it does:** Lets users manually edit any section of the generated resume directly in the preview, without rebuilding from scratch.

**Implementation:**
- Resume preview renders in `contenteditable` sections
- Each section (Summary, each job bullet, Skills, etc.) is individually editable on click
- Changes sync to app state in real time
- "AI Assist" button on each field: user highlights a bullet → clicks "Rewrite this" → Claude rewrites just that sentence
- "Undo" / "Redo" history tracked per session
- All edits persist to Firestore (logged-in) or localStorage (guest)

**AI Assist Prompt (per-field):**
```
Rewrite this single resume bullet point to be more impactful, measurable, and ATS-friendly.
Target role: [target_position]. Keep it under 20 words. 
Original: [selected_text]
```

---

### Feature 4 — Resume Templates

**What it does:** Offers multiple premium, visually stunning resume templates that still pass ATS.

**Templates (minimum 5 at launch):**
1. **Classic Pro** — Clean, black & white, timeless. Maximum ATS safety.
2. **Modern Edge** — Sidebar layout, accent color strip, geometric elements.
3. **Executive Dark** — Dark header, premium typography, for senior roles.
4. **Creative Pulse** — Subtle grid texture, bold name treatment, for design/marketing roles.
5. **Minimal Seoul** — Ultra-minimal, heavy whitespace, inspired by Korean design aesthetics.

**Rules:**
- All templates share the same underlying HTML structure — only CSS classes change
- Templates are switchable without losing content
- ATS-safe: the PDF export always includes a hidden plain-text layer parseable by ATS
- User can customize: accent color, font family (from a curated set of 4), font size

---

### Feature 5 — Resume Rewriter

**What it does:** Takes an existing resume (pasted text or uploaded PDF) and completely rewrites it for a new target role.

**User Flow:**
1. User pastes existing resume text OR uploads PDF (extracted server-side)
2. User enters: Target Position, Type of Company, Target Company Name
3. Claude rewrites using the senior recruiter prompt
4. Side-by-side before/after view
5. User accepts, rejects, or Easy Tunes individual sections

**AI Prompt (shown in simplified form to user, full prompt sent to API):**
```
Act as a senior recruiter who reviews 200 resumes a day.
Rewrite my resume for the position of [target_position] in [type_of_company].
Replace every responsibility with a measurable achievement.
Eliminate everything generic.
Make my value impossible to ignore.
Original resume: [original_resume_text]
Target job description: [job_description]
Return as structured JSON.
```

---

### Feature 6 — LinkedIn Profile Rewriter

**What it does:** Rewrites the user's LinkedIn headline, About section, and top 3 experience entries to attract recruiters for a specific role.

**User Flow:**
1. User pastes their current LinkedIn profile (headline + about + 3 experiences)
2. User enters: Target Position, Sector/Industry
3. Claude rewrites all sections
4. Output shown in a LinkedIn-style card preview
5. Copy buttons for each section (Headline / About / Experience 1-2-3)
6. "Apply to Resume" button: pulls rewritten experience into the resume builder

**AI Prompt (internal):**
```
Rewrite my LinkedIn title, 'About' section, and 3 main experiences to position me in recruiter searches for [target_position] in [sector_or_industry].
Make every word carry weight. Optimize for LinkedIn's search algorithm and human recruiter appeal.
Current profile: [pasted_profile]
Return JSON: { headline: string, about: string, experiences: [{ title, company, description }] }
```

---

### Feature 7 — 7-Day Job Search Strategy

**What it does:** Generates a personalized, immediately executable 7-day job search action plan for a specific role, industry, and location.

**User Flow:**
1. User enters: Target Position/Role, Sector or Industry, City (or "Remote"), Company Size/Type preference
2. Claude generates a day-by-day plan
3. Plan displayed as an interactive checklist (checkboxes per action)
4. Progress saved to Firestore
5. "Add to Calendar" button (Google Calendar integration via OAuth if available)

**AI Prompt (internal):**
```
I want to get a position as [target_position] in [sector_or_industry] in [city_or_remote].
Create a 7-day approach plan, focused on [company_size_or_type], which includes:
- Specific job sites where vacancies can be found (with URLs)
- Exact search terms to use on each site
- A daily list of actions that can be executed immediately
- Networking targets and outreach templates
Be specific, actionable, and realistic for a 7-day sprint.
Return as JSON: { days: [{ day: number, theme: string, actions: [{ time: string, action: string, resource: string }] }] }
```

---

### Feature 8 — Cover Letter Generator

**What it does:** Generates a compelling, 280-300-word cover letter that starts with a powerful idea (not "I am applying for...") and connects the user's experience to the company's exact needs.

**User Flow:**
1. Pulls data from Career Profile (experience auto-populated if resume exists)
2. User enters: Position, Company Name, Job Description
3. Claude generates cover letter
4. Displayed with word count indicator (must be 280-300 words — shown as a colored progress bar)
5. Easy Tune inline editing
6. Download as PDF or copy as plain text

**AI Prompt (internal):**
```
Write a cover letter for the position of [position] at [company].
Begin with a powerful, memorable idea — NOT "I am applying for...".
Connect my specific experience to the company's exact needs and build genuine trust.
Keep the text between 280 and 300 words — never shorter than 280, never longer than 300. Be human, direct, and compelling.
My experience: [experience_summary]
Job description: [job_description]
Return JSON: { cover_letter: string, word_count: number, opening_hook: string }
```

---

### Feature 9 — Interview Preparation System

**What it does:** Generates the 8 most likely interview questions with structured answer frameworks, plus 3 strategic questions for the user to ask the interviewer.

**User Flow:**
1. Pulls data from Career Profile
2. User enters: Position, Company Name (company is researched for context)
3. Claude generates questions + answer structures + user questions
4. Displayed as an interactive Q&A card deck (flip cards: question front, answer framework back)
5. "Practice Mode": user types their answer → Claude scores it and gives feedback
6. "Save to Study List" for review

**AI Prompt (internal):**
```
I have an interview for the position of [position] at [company].
Give me:
1. The 8 most likely interview questions for this specific role and company
2. A solid STAR-method answer structure for each question using my experience
3. 3 intelligent questions I should ask that demonstrate strategic thinking and deep research
My experience: [experience_summary]
Return JSON: { questions: [{ question: string, answer_framework: string, star_example: string }], questions_to_ask: [string] }
```

---

### Feature 10 — Career Profile (Interconnection Hub)

**What it does:** The central data store that connects all features. Once a user enters their experience anywhere, it's available everywhere.

**Data Model (Firestore: `users/{uid}/profile`):**
```json
{
  "personal": { "name", "email", "phone", "location", "linkedin_url", "website" },
  "experience": [{ "company", "title", "start", "end", "bullets": [] }],
  "education": [{ "institution", "degree", "field", "year" }],
  "skills": [],
  "certifications": [],
  "projects": [],
  "target": {
    "position": "",
    "company": "",
    "company_type": "",
    "industry": "",
    "city": ""
  },
  "generated": {
    "resume_html": "",
    "resume_plain": "",
    "ats_score": null,
    "cover_letter": "",
    "linkedin_rewrite": {},
    "job_strategy": {},
    "interview_prep": {}
  }
}
```

**Cross-feature data flow:**
- Resume Builder → populates Career Profile → available in Cover Letter, Interview Prep, LinkedIn Rewriter, Strategy
- LinkedIn Rewriter → "Apply to Resume" pushes rewritten experience back to Resume Builder
- Job Strategy → target role/company syncs to Interview Prep and Cover Letter
- ATS Score → flags feed back into Resume Rewriter suggestions

---

## 5. AUTHENTICATION

**Provider:** Firebase Auth
**Methods:** Google OAuth + Email/Password
**Guest Mode:** Full feature access without auth, data stored in localStorage. Prompted to save (sign up) when generating a PDF download.

**Auth Flow:**
- Landing page: CTA → "Get Started Free" → Guest mode (no friction)
- Sign-up prompt triggered at: PDF download, saving a resume, accessing history
- Post-auth: localStorage data migrated to Firestore automatically

**Firestore Security Rules:**
- Users can only read/write their own `users/{uid}` documents
- No public read access to any user data

---

## 6. FILE STRUCTURE

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell with sidebar nav
│   │   ├── page.tsx                # Dashboard home / Career Profile
│   │   ├── resume/
│   │   │   ├── page.tsx            # Resume Builder (Features 1, 3, 4)
│   │   │   └── [id]/page.tsx       # Saved resume editor
│   │   ├── rewriter/page.tsx       # Resume Rewriter (Feature 5)
│   │   ├── ats/page.tsx            # ATS Optimizer (Feature 2)
│   │   ├── linkedin/page.tsx       # LinkedIn Rewriter (Feature 6)
│   │   ├── strategy/page.tsx       # 7-Day Strategy (Feature 7)
│   │   ├── cover-letter/page.tsx   # Cover Letter (Feature 8)
│   │   └── interview/page.tsx      # Interview Prep (Feature 9)
│   ├── api/
│   │   ├── claude/
│   │   │   ├── resume/route.ts     # Resume generation endpoint
│   │   │   ├── ats/route.ts        # ATS scoring endpoint
│   │   │   ├── linkedin/route.ts   # LinkedIn rewrite endpoint
│   │   │   ├── strategy/route.ts   # Job strategy endpoint
│   │   │   ├── cover-letter/route.ts
│   │   │   └── interview/route.ts
│   │   └── pdf/route.ts            # HTML → PDF conversion (Puppeteer)
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Landing page
├── components/
│   ├── ui/                         # Base design system components
│   ├── resume/
│   │   ├── ResumePreview.tsx       # Live HTML preview
│   │   ├── ResumeEditor.tsx        # Easy Tune inline editor
│   │   ├── ATSScorePanel.tsx
│   │   └── templates/              # 5 HTML template files
│   ├── features/
│   │   ├── LinkedInCard.tsx
│   │   ├── StrategyChecklist.tsx
│   │   ├── InterviewDeck.tsx
│   │   └── CoverLetterEditor.tsx
│   └── shared/
│       ├── CareerProfileDrawer.tsx  # Global profile sidebar
│       └── AILoadingState.tsx       # Streaming response indicator
├── lib/
│   ├── firebase.ts                  # Firebase init
│   ├── firestore.ts                 # Firestore helpers
│   ├── claude.ts                    # Anthropic API client wrapper
│   ├── prompts.ts                   # All AI prompts centralized here
│   └── pdf.ts                       # PDF generation helpers
├── hooks/
│   ├── useCareerProfile.ts          # Global career data hook
│   ├── useAuth.ts
│   └── useAIStream.ts               # Claude streaming hook
├── store/
│   └── careerStore.ts               # Zustand store for global state
├── types/
│   └── index.ts                     # All TypeScript interfaces
└── claude.md                        # This file
```

---

## 7. API DESIGN

All Claude API calls go through `/app/api/claude/[feature]/route.ts`.

**Standard request shape:**
```typescript
POST /api/claude/resume
{
  "careerProfile": CareerProfile,
  "target": { position: string, company: string, companyType: string, jobDescription: string },
  "mode": "generate" | "rewrite" | "assist"
}
```

**Standard response shape:**
```typescript
{
  "success": boolean,
  "data": object,        // Feature-specific structured data
  "usage": { input_tokens: number, output_tokens: number }
}
```

**Streaming:** Use Claude's streaming API for all long-form generation. Frontend uses `useAIStream` hook to show progressive output.

**Model:** Always use `claude-sonnet-4-5`. Never change the model without updating this file.

**Error handling:** All API routes return standardized error shapes. Client shows user-friendly messages. Retry logic: 1 automatic retry on 529 (overloaded), surface error to user on second failure.

---

## 8. STATE MANAGEMENT

**Tool:** Zustand
**Store:** `careerStore.ts` — single global store

**State shape:**
```typescript
{
  profile: CareerProfile | null,
  currentResume: ResumeData | null,
  selectedTemplate: TemplateId,
  atsScore: ATSScore | null,
  isGenerating: boolean,
  activeFeature: FeatureId,
  
  // Actions
  updateProfile: (partial: Partial<CareerProfile>) => void,
  setResume: (resume: ResumeData) => void,
  syncToFirestore: () => Promise<void>,
  loadFromFirestore: (uid: string) => Promise<void>,
}
```

**Persistence:**
- Logged-in users: auto-sync to Firestore on every significant update (debounced 2s)
- Guest users: persist to localStorage
- On sign-in: merge localStorage → Firestore

---

## 9. UX & DESIGN SYSTEM (Supanova Design Skill)

**Source:** [uxjoseph/supanova-design-skill](https://github.com/uxjoseph/supanova-design-skill)
**Adapted for:** Next.js + Tailwind CSS (not standalone HTML)

### Design Settings
```
DESIGN_VARIANCE: 7        (Asymmetric, overlapping, modern — not rigid grid)
MOTION_INTENSITY: 6       (Smooth fade-ins, spring transitions, hover magnetic effects)
VISUAL_DENSITY: 5         (Balanced — dashboard-style data density)
LANDING_PURPOSE: saas     (SaaS product introduction + conversion)
```

### Core Design Principles
- **Double-Bezel Card Architecture**: All cards have two nested borders — outer container with subtle border, inner content area with glass-morphism effect
- **Spring-Based Animations**: All transitions use spring physics (not linear/ease). Use `framer-motion` with `type: "spring"`, `stiffness: 300`, `damping: 30`
- **Floating Glass Navigation**: Top navbar uses `backdrop-blur-xl bg-white/10 border border-white/20` with drop shadow
- **Premium Typography**: Use `Inter` (headings) + `DM Sans` (body). Both from Google Fonts. Font stack must be explicitly set.
- **Magnetic Hover Effects**: CTAs and icon buttons have subtle magnetic pull on hover (JS mouse tracking)

### Color System (Dark Mode First)
```css
--background: #0A0A0F          /* Deep near-black */
--surface: #13131A             /* Card backgrounds */
--surface-elevated: #1C1C26    /* Elevated panels */
--border: rgba(255,255,255,0.08)
--border-strong: rgba(255,255,255,0.15)
--accent-primary: #6366F1      /* Indigo — main brand */
--accent-secondary: #8B5CF6    /* Violet — gradient partner */
--accent-glow: rgba(99,102,241,0.3)
--text-primary: #F8F8FF
--text-secondary: #A0A0B8
--text-muted: #60607A
--success: #22C55E
--warning: #F59E0B
--error: #EF4444
```

### Tailwind Config Additions
```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      brand: { DEFAULT: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
      surface: { DEFAULT: '#13131A', elevated: '#1C1C26' },
    },
    fontFamily: {
      heading: ['Inter', 'sans-serif'],
      body: ['DM Sans', 'sans-serif'],
    },
    animation: {
      'float': 'float 6s ease-in-out infinite',
      'glow-pulse': 'glowPulse 3s ease-in-out infinite',
    }
  }
}
```

### Component Patterns
```tsx
// Standard Card (Double-Bezel)
<div className="rounded-2xl border border-white/8 bg-surface p-1">
  <div className="rounded-xl border border-white/5 bg-surface-elevated p-6">
    {children}
  </div>
</div>

// Primary CTA Button
<button className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-brand to-violet-500 
  text-white font-semibold tracking-tight shadow-lg shadow-brand/25
  hover:shadow-brand/50 hover:scale-[1.02] transition-all duration-200">
  {label}
</button>

// Glass Navbar
<nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50
  rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
  shadow-xl shadow-black/20 px-6 py-4">
```

### Dashboard Layout
- **Left Sidebar** (72px collapsed / 240px expanded): Feature navigation with icons
- **Main Content Area**: Full-width content with internal max-width
- **Right Panel** (optional, context-sensitive): ATS Score, Career Profile snapshot, AI suggestions
- Sidebar items: Dashboard → Resume Builder → Resume Rewriter → ATS Optimizer → LinkedIn → Strategy → Cover Letter → Interview Prep → Settings

### Landing Page Sections (in order)
1. **Hero** — Bold headline, animated gradient background, Resume upload CTA + "Start from scratch" CTA. Show a live animated resume preview floating/tilted.
2. **Social Proof** — "Join X,000 job seekers" + 3 testimonial cards
3. **Features Grid** — 3×3 bento grid showcasing all 9 features with micro-animations
4. **How It Works** — 3-step horizontal flow (Input → AI Magic → Get Hired)
5. **ATS Section** — Animated ATS score meter, explain why ATS matters
6. **Templates Preview** — Horizontal scrolling showcase of 5 templates
7. **Pricing** — Free tier vs Pro tier (define tiers later)
8. **Final CTA** — Full-width gradient section with email capture

---

## 10. RESUME HTML TEMPLATES

All templates use the same semantic HTML structure. CSS classes change per template. Templates must:
- Use standard HTML tags only (`<section>`, `<h1>`–`<h3>`, `<ul>`, `<li>`, `<p>`)
- Have a `@media print` stylesheet for PDF generation
- Include `data-ats-field` attributes on every field for the ATS parser
- Export a `.getPlainText()` method that strips all styling for ATS copy-paste

**Base Template Structure:**
```html
<div class="resume-wrapper template-[name]">
  <header data-ats-field="header">
    <h1 data-ats-field="name">{name}</h1>
    <div class="contact-line">{email} · {phone} · {location}</div>
    <div class="links">{linkedin} · {website}</div>
  </header>
  <section data-ats-field="summary"><h2>Summary</h2><p>{summary}</p></section>
  <section data-ats-field="experience">
    <h2>Experience</h2>
    {experience.map(job => (
      <article>
        <h3>{job.title}</h3><span>{job.company}</span><span>{job.dates}</span>
        <ul>{job.bullets.map(b => <li>{b}</li>)}</ul>
      </article>
    ))}
  </section>
  <section data-ats-field="education"><h2>Education</h2>...</section>
  <section data-ats-field="skills"><h2>Skills</h2>...</section>
</div>
```

---

## 11. ENVIRONMENT VARIABLES

```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

ANTHROPIC_API_KEY=               # Server-side only, never expose to client
NEXT_PUBLIC_APP_URL=https://auri-beta.vercel.app

STRIPE_WEBHOOK_SECRET=               # Add after first Vercel deploy (from Stripe dashboard webhook endpoint)
```

**Security rule:** `ANTHROPIC_API_KEY` must NEVER be in any client-side code or `NEXT_PUBLIC_` variable. All Claude API calls go through server-side API routes only.

---

## 12. PERFORMANCE & UX RULES

- **Streaming responses**: All AI generations stream token-by-token to the UI. Never wait for complete response before showing output.
- **Skeleton loaders**: Every content area that awaits AI output shows a skeleton matching the expected layout.
- **Optimistic UI**: Form submissions update UI immediately; revert on error.
- **No full-page reloads**: All navigation uses Next.js client-side routing.
- **Mobile responsive**: Dashboard collapses sidebar to bottom tab bar on mobile. Resume preview switches to single-column on mobile.
- **Accessibility**: All interactive elements have `aria-label`. Color contrast meets WCAG AA. Keyboard navigable.
- **Rate limiting**: Implement per-user rate limiting on API routes (10 AI calls/minute for free tier, 60/minute for Pro).

---

## 13. THINGS NOT YET DECIDED (Parking Lot)

- Pricing tiers (Free vs Pro limits — e.g., free = 3 resume generations/month, Pro = unlimited)
- Job description URL auto-scraping (Puppeteer to scrape job boards — LinkedIn, Indeed — may have ToS issues)
- Resume upload parsing method for Feature 5 (PDF text extraction — recommend `pdf-parse` npm package)
- Email notifications (e.g., "Your interview is tomorrow — here's your prep sheet")
- Team/referral features
- Analytics (Mixpanel or Posthog for feature usage tracking)

---

## 14. DEVELOPMENT PHASES

### Phase 1 — Foundation (Sprint 1–2)
- [ ] Next.js project setup with Tailwind, Firebase, Zustand
- [ ] Firebase Auth (Google + Email/Password)
- [ ] Career Profile data model + Firestore CRUD
- [ ] Claude API wrapper + all prompt templates in `lib/prompts.ts`
- [ ] Landing page (Supanova design system)
- [ ] Dashboard shell (sidebar + routing)

### Phase 2 — Core Features (Sprint 3–5)
- [ ] Resume Builder (Feature 1) — form + AI generation + live preview
- [ ] 3 resume templates (Classic Pro, Modern Edge, Minimal Seoul)
- [ ] Easy Tune editor (Feature 3)
- [ ] ATS Score panel (Feature 2)
- [ ] PDF export (Puppeteer API route)

### Phase 3 — Expansion Features (Sprint 6–8)
- [ ] Resume Rewriter (Feature 5)
- [ ] Cover Letter Generator (Feature 8)
- [ ] LinkedIn Profile Rewriter (Feature 6)
- [ ] 7-Day Job Strategy (Feature 7)
- [ ] Interview Prep System (Feature 9)

### Phase 4 — Polish & Launch (Sprint 9–10)
- [ ] 2 remaining templates (Executive Dark, Creative Pulse)
- [ ] Mobile responsiveness pass
- [ ] Rate limiting + error handling
- [ ] Pricing page + Stripe integration (if monetizing)
- [ ] SEO + meta tags
- [ ] Launch

---

## 15. CODE CONVENTIONS

- **Language**: TypeScript everywhere. No `any` types.
- **Components**: Functional components only. No class components.
- **Naming**: PascalCase for components, camelCase for functions/variables, SCREAMING_SNAKE for constants.
- **Imports**: Absolute imports using `@/` path alias (configured in `tsconfig.json`).
- **API calls**: Always use the `/api/claude/*` routes — never call Anthropic directly from client components.
- **Comments**: Comment the "why", not the "what". Prompts in `lib/prompts.ts` must have a comment explaining the reasoning behind each prompt engineering decision.
- **Git**: Feature branches off `main`. Commit messages: `feat:`, `fix:`, `chore:`, `refactor:`.

---

*Last updated: Initial spec — [Date]*
*Maintained by: [Your Name/Team]*

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