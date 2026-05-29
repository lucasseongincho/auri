# AURI

> `AI-powered career toolkit for US job seekers`

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=flat-square&logo=firebase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

---

## Overview

AURI is an AI-powered career toolkit built for US job seekers aged 22–35 who are tired of sending out résumés and hearing nothing back. It combines ATS optimization, resume rewriting, cover letter generation, LinkedIn tuning, and interview prep into a single, coherent workflow — so job seekers stop guessing and start executing.

Most career tools give you a score. AURI gives you a system. Every tool is designed to work together: your resume informs your cover letter, your job strategy shapes how you tune each application, and your interview prep is grounded in the same role you applied for. The result is a tighter, faster job search loop from first draft to offer.

Beta users have already landed interviews at Amazon and leading tech companies worldwide. AURI is live and actively used at [auri-resume.com](https://www.auri-resume.com).

---

## Features

| Tool | What it does |
|---|---|
| **Smart Resume Builder** | Build a structured, ATS-ready resume from scratch using guided input and AI assistance. |
| **ATS Score & Optimizer** | Analyze your resume against a job description and get a match score with targeted fixes. |
| **Easy Tune Editor** | Make fast, targeted edits to an existing resume without rebuilding from scratch. |
| **Resume Rewriter** | Rewrite weak bullet points and sections using Claude to be more impactful and specific. |
| **LinkedIn Rewriter** | Rewrite your LinkedIn headline, summary, and experience to match your target role. |
| **7-Day Job Strategy** | Generate a personalized, day-by-day action plan for your job search based on your goals. |
| **Cover Letter Generator** | Write a tailored cover letter that mirrors your resume and speaks to a specific job posting. |
| **Interview Prep** | Generate role-specific behavioral and technical questions with AI-coached sample answers. |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Full-stack React framework; handles routing, server components, and API routes |
| **TypeScript** | Type-safe development across the entire codebase |
| **Tailwind CSS** | Utility-first styling with a consistent design system |
| **Firebase** (Auth + Firestore) | User authentication and real-time document storage |
| **Anthropic Claude API** | Powers all AI features — resume rewriting, ATS analysis, strategy generation, and more |
| **Stripe** | Subscription billing and payment processing |
| **Vercel** | Hosting, edge deployment, and CI/CD |
| **Resend** | Transactional email delivery |

---

## Architecture Overview

```
app/                   Next.js App Router — pages, layouts, and API routes
├── (auth)/            Auth flows: sign-in, sign-up, onboarding
├── api/               Server-side API routes (claude/, pdf/, stripe/)
├── blog/              MDX-powered blog with SEO metadata
├── dashboard/         All eight career tools (resume, ats, rewriter, linkedin,
│                      strategy, cover-letter, interview, settings)
└── pricing/           Pricing page

components/            Reusable UI components
├── resume/            Resume-specific components (builder, editor, preview)
├── shared/            Cross-feature components (nav, modals, layout shells)
└── ui/                Base design system components (buttons, cards, inputs)

lib/                   Utilities and service helpers
│                      Firebase client + admin, Firestore helpers, Claude client,
│                      auth context, Stripe helpers, rate limiting, PDF generation

content/blog/          MDX blog posts for SEO and organic growth

store/                 Zustand global state (careerStore.ts)

hooks/                 Custom React hooks
types/                 Shared TypeScript type definitions
scripts/               One-off utility and migration scripts
```

All Claude calls are server-side only, routed through `app/api/claude/`. The client never holds API keys.

---

## Roadmap

| In Progress | Planned |
|---|---|
| Lemon Squeezy integration (replacing Stripe) | Job application tracker |
| Mobile optimization | Institutional and team plans |
| Blog SEO expansion | API access for developers |

---

## Live

**[auri-resume.com](https://www.auri-resume.com)**
