# Project Status & Roadmap

## What's Built (as of May 2026)
- [x] Next.js 14 App Router + Tailwind + Firebase + Zustand
- [x] Firebase Auth (Google OAuth + Email/Password)
- [x] Guest mode with localStorage + Firestore migration on sign-in
- [x] Career Profile data model + Firestore CRUD
- [x] Claude API wrapper + streaming + JSON parsing with repair/retry
- [x] Landing page (mobile responsive, no Templates section)
- [x] Dashboard shell (expandable sidebar + mobile bottom tab bar + More drawer)
- [x] Resume Builder — structured form editor + ClassicPro template + live preview
- [x] Resume structured form editor (replaced contentEditable)
- [x] Puppeteer PDF export (html2pdf.js fallback)
- [x] ATS Score panel
- [x] Resume Rewriter (saved resume list capped at 5-6 visible)
- [x] Cover Letter Generator + inline paragraph editor + saved letters
- [x] LinkedIn Profile Rewriter
- [x] 7-Day Job Strategy
- [x] Interview Prep + Practice Mode + saved sessions
- [x] /blog with MDX support
- [x] Stripe integration (test mode, beta bypass)
- [x] Rate limiting (Upstash Redis)
- [x] Beta guard with atomic call counter
- [x] Error boundaries on all dashboard routes
- [x] Mobile responsive (all pages)
- [x] Unified Save button in header across all feature pages

## Removed / Changed from Original Spec
- Templates: removed all except ClassicPro (no template switcher)
- AI Assist / AI Rewrite: removed from all editors
- contentEditable: replaced with structured form editor

## Parking Lot (Not Yet Built)
- [ ] Pricing tiers (Free vs Pro) — beta ends 2026-07-01
- [ ] Job description URL auto-scraping
- [ ] Email notifications
- [ ] Analytics (Mixpanel or Posthog)
- [ ] Team/referral features
- [ ] SEO meta tags pass
- [ ] Blog pagination (needed at 50+ posts)
