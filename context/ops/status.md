# Project Status & Roadmap

## What's Built (as of May 2026)

### Foundation
- [x] Next.js 14 App Router + Tailwind + Firebase + Zustand
- [x] Firebase Auth (Google OAuth via signInWithPopup + Email/Password)
- [x] Guest mode with localStorage + Firestore migration on sign-in
- [x] Career Profile data model + Firestore CRUD
- [x] Claude API wrapper + streaming + JSON parsing with repair/retry
- [x] Error boundaries on all dashboard routes (app/dashboard/error.tsx + per-feature)
- [x] Rate limiting (Upstash Redis — 10/min free, 60/min Pro)
- [x] Atomic beta call counter replaced with free tier enforcement

### Landing & Marketing
- [x] Landing page — fully mobile responsive
- [x] /blog with MDX support (13 posts)
- [x] Pricing page with monthly/annual toggle + animated price transition
- [x] No Templates section (removed)
- [x] All beta references removed — app is public

### Dashboard Shell
- [x] Expandable sidebar (72px collapsed / 240px expanded)
- [x] Mobile bottom tab bar with More drawer (slide-up, 3-column grid)
- [x] Pro-only crown icons on locked nav items
- [x] Unified Save button in header across all feature pages

### Resume Features
- [x] Resume Builder — structured form editor (NOT contentEditable)
- [x] ClassicPro template only (other templates removed)
- [x] Puppeteer PDF export (html2pdf.js fallback)
- [x] ATS Score panel
- [x] Resume Rewriter (saved resume list capped, scrollable)
- [x] My Resumes — saved list + detail page with inline editing
- [x] AI Assist / AI Rewrite removed from all editors

### Cover Letter
- [x] Cover Letter Generator + paragraph inline editor
- [x] My Cover Letters — saved list + detail page with inline editing
- [x] Guest localStorage support + Firestore migration
- [x] Role-aware experience summary (IT vs dev roles)
- [x] Updated prompt: direct hook, JD keywords, practical requirements

### Other Features
- [x] LinkedIn Profile Rewriter (Pro only)
- [x] 7-Day Job Strategy + save + My Strategies page with interactive checklist
- [x] Interview Prep + Practice Mode + saved sessions (Pro only)
- [x] ATS Optimizer (free)

### Monetization & Auth
- [x] Stripe — Free (3 gen/month) vs Pro ($19/mo or $190/yr)
- [x] Stripe in TEST MODE — live mode ready for Korea launch
- [x] Pro feature gating: LinkedIn, Strategy, Interview, Rewriter = Pro only
- [x] Free tier enforcement: atomic Firestore transaction per month
- [x] Admin bypass: lucas.seongin.cho@gmail.com always gets isPro
- [x] Gift Pro: set isPro: true in Firestore directly, or use scripts/gift-pro.ts
- [x] Stripe Customer Portal for subscription management
- [x] isPro never cached in localStorage (always from Firestore)
- [x] Webhook handles checkout.session.completed + subscription.deleted/updated

### Domain & Infrastructure
- [x] Custom domain: www.auri-resume.com (Namecheap → Vercel)
- [x] Firebase Authorized Domains updated
- [x] All hardcoded URLs updated to auri-resume.com
- [x] CLAUDE.md reorganized into lean core + context/ folder system

## Current Mode
- **Stripe: TEST MODE** — swap to live keys after Delaware C-Corp setup in Korea
- **Admin email:** lucas.seongin.cho@gmail.com (always Pro, no subscription needed)
- **To gift Pro to friends:** Firebase Console → users → their UID → profile/data → add isPro: true

## Removed / Changed from Original Spec
- Templates: removed all except ClassicPro (no template switcher)
- AI Assist / AI Rewrite: removed from all editors
- contentEditable: replaced with structured form editor
- Beta mode: fully removed, grandfathered users kept Pro via Firestore

## Parking Lot (Not Yet Built)
- [ ] Terms of Service + Privacy Policy pages
- [ ] Guest rate limiting by IP (unauthenticated users have no rate limit)
- [ ] Sentry error monitoring
- [ ] SEO meta tags pass
- [ ] Onboarding flow for new users
- [ ] Email notifications
- [ ] Analytics (Mixpanel or Posthog)
- [ ] Blog pagination (needed at 50+ posts)
- [ ] Job description URL auto-scraping
- [ ] regrandfather script for beta users (scripts/regrandfather-users.ts exists but not run)
