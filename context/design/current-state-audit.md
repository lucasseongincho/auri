# AURI Design System — Current-State Audit
> Read-only inventory as of 2026-07-01. No recommendations; facts only.
> Intended as standalone input for redesign tooling.

---

## 1. TAILWIND CONFIG

**File:** `tailwind.config.ts`

### Color palette — all defined as raw hex strings

| Token | Hex | Role |
|---|---|---|
| `background` | `#0A0A0F` | Page background |
| `brand.DEFAULT` | `#6366F1` | Primary accent |
| `brand.light` | `#818CF8` | Hover / active states |
| `brand.dark` | `#4F46E5` | Gradient end variant |
| `surface.DEFAULT` | `#13131A` | Card outer / sidebar |
| `surface.elevated` | `#1C1C26` | Card inner / inputs |
| `text-primary` | `#F8F8FF` | Primary text |
| `text-secondary` | `#A0A0B8` | Body / subtext |
| `text-muted` | `#60607A` | Inactive / hint text |
| `success` | `#22C55E` | Green states |
| `warning` | `#F59E0B` | Amber states |
| `error` | `#EF4444` | Red states |

No CSS variable references inside `tailwind.config.ts` — all values are raw hex.

### Font families

```ts
fontFamily: {
  heading: ['Inter', 'sans-serif'],
  body: ['DM Sans', 'sans-serif'],
}
```

### Custom animations

| Name | Description |
|---|---|
| `float` | 6 s ease-in-out Y-axis oscillation (hero mockup) |
| `glow-pulse` | 3 s box-shadow pulse on brand color |
| `fade-in` | 0.5 s opacity 0→1 |
| `slide-up` | 0.5 s opacity + Y translate |
| `skeleton-shimmer` | 1.5 s moving gradient (defined in `@layer components`) |

### Background images (custom gradients)

| Token | Value |
|---|---|
| `brand-gradient` | `linear-gradient(135deg, #6366F1, #8B5CF6)` |
| `hero-gradient` | `radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)` |

### Box shadows

| Token | Value |
|---|---|
| `glow` | `0 0 30px rgba(99,102,241,0.3)` |
| `glow-lg` | `0 0 60px rgba(99,102,241,0.4)` |

### Plugins
- `@tailwindcss/typography` (used on blog/content pages)

### Content paths
`./pages/**`, `./components/**`, `./app/**` — `.{js,ts,jsx,tsx,mdx}`

---

## 2. GLOBAL CSS / DESIGN TOKENS

**File:** `app/globals.css`

### CSS custom properties — defined in `:root`

```css
:root {
  --background:       #0A0A0F;
  --surface:          #13131A;
  --surface-elevated: #1C1C26;
  --border:           rgba(255, 255, 255, 0.08);
  --border-strong:    rgba(255, 255, 255, 0.15);
  --accent-primary:   #6366F1;
  --accent-secondary: #8B5CF6;
  --accent-glow:      rgba(99, 102, 241, 0.3);
  --text-primary:     #F8F8FF;
  --text-secondary:   #A0A0B8;
  --text-muted:       #60607A;
  --success:          #22C55E;
  --warning:          #F59E0B;
  --error:            #EF4444;
}
```

Note: these variables mirror the Tailwind config values exactly. In practice, components use the raw Tailwind classes (e.g. `bg-[#13131A]`) far more often than `var(--surface)` directly — the CSS variables are defined but not consistently consumed.

### Dark mode

**Implementation:** class-based. `app/layout.tsx` sets `<html lang="en" className="dark">` unconditionally. There are no `:root.dark {}` or `@media (prefers-color-scheme: dark)` override blocks anywhere — the app is **dark-only**; all background and surface colors are dark by default with no light-mode fallback.

### Global component classes (`@layer components`)

| Class | Description |
|---|---|
| `.card-outer` | `rounded-2xl`, `border`, `p-1`, `bg: var(--surface)`, `border-color: var(--border)` |
| `.card-inner` | `rounded-xl`, `p-6`, `border: 1px solid rgba(255,255,255,0.05)`, `bg: var(--surface-elevated)` |
| `.btn-primary` | `px-6 py-3 rounded-xl`, gradient `#6366F1→#8B5CF6`, `shadow-lg`, hover scale 1.02 |
| `.btn-secondary` | `px-6 py-3 rounded-xl`, `border: var(--border-strong)`, ghost style |
| `.glass` | `backdrop-blur-xl`, `bg: rgba(255,255,255,0.05)`, `border: rgba(255,255,255,0.1)` |
| `.text-gradient` | `bg-clip-text text-transparent`, gradient `#6366F1→#8B5CF6→#A78BFA` |
| `.skeleton` | `rounded-lg animate-pulse`, 1.5 s shimmer gradient |

### Scrollbar
Custom dark styling: 8px width, `rgba(255,255,255,0.2)` thumb, `rgba(255,255,255,0.05)` track. Firefox via `scrollbar-width: thin`.

### Focus ring
`outline: 2px solid var(--accent-primary)` with `outline-offset: 2px`.

### Print / PDF styles
`.no-print { display: none !important }` and `#resume-content { width: 8.5in; min-height: 11in }`.

---

## 3. TYPOGRAPHY

### Fonts loaded

**Web fonts via `@import` in `globals.css`:**
- **Inter** — weights 300, 400, 500, 600, 700, 800, 900 (Google Fonts)
- **DM Sans** — weights 300, 400, 500, 600, 700 (Google Fonts)

**Local `@font-face` (from `/public/fonts/`, `.woff2`):**
- **Tinos** — weights 400, 700 (metrically compatible with Times New Roman; used only in resume PDF templates)
- **Arimo** — weights 400, 700 (metrically compatible with Arial; used only in resume PDF templates)

### Usage assignment

| Font | Applied to | How set |
|---|---|---|
| Inter | `h1`–`h6`, `.font-heading` | `globals.css` base + Tailwind `font-heading` utility |
| DM Sans | `body`, general text, `.font-body` | `globals.css` base + Tailwind `font-body` utility |
| Tinos | Resume template body text (ClassicPro) | Inline `style` on template components |
| Arimo | Resume template alternate text | Inline `style` on template components |

### Typographic scale (reconstructed from component classes — no centralized scale file)

| Usage | Tailwind class | Approximate size |
|---|---|---|
| Landing hero H1 | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` | 30–60px |
| Section headings | `text-2xl sm:text-3xl md:text-4xl` | 24–36px |
| Dashboard H1 | `text-3xl` | 30px |
| Card headings | `text-xl` | 20px |
| Feature card labels | `text-base` (default) | 16px |
| Body copy | `text-sm` to `text-lg` | 14–18px |
| Label / eyebrow | `text-xs uppercase tracking-widest` | 12px |
| Micro / hint | `text-[10px]`, `text-[11px]` | 10–11px |

Font weights in use: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` / `font-bold text-6xl` (landing hero, 800+ effectively).

Line heights: `leading-[1.1]` (hero H1), `leading-relaxed` (body copy), `leading-snug` (social proof).

---

## 4. LOGO & BRAND ASSETS

### Files in `public/`

| File | Format | Size / Dims | Notes |
|---|---|---|---|
| `public/favicon.svg` | SVG | 32×32 viewBox | Rounded square (`rx="8"`), `#6366F1→#8B5CF6` gradient fill, ✦ sparkle character in white at 18px system-ui font |
| `public/fonts/Tinos-Regular.woff2` | WOFF2 | — | Resume template only |
| `public/fonts/Tinos-Bold.woff2` | WOFF2 | — | Resume template only |
| `public/fonts/Arimo-Regular.woff2` | WOFF2 | — | Resume template only |
| `public/fonts/Arimo-Bold.woff2` | WOFF2 | — | Resume template only |
| `public/llms.txt` | Text | — | LLM crawler instructions |
| `public/llms-full.txt` | Text | — | LLM crawler instructions |

OG / Twitter images are generated dynamically by `app/opengraph-image.tsx` and `app/twitter-image.tsx` (Next.js file-based metadata images).

### Logo in the UI

There is **no standalone SVG logo component file** and no static logo image asset. All logo appearances are inline JSX:

```tsx
// Pattern used in navbar, sidebar, mobile header
<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
  <Sparkles className="w-4 h-4 text-white" />
</div>
<span className="font-heading font-bold text-white text-lg">AURI</span>
```

Sizes vary by context: `w-6 h-6` (footer) → `w-7 h-7` (mobile header) → `w-8 h-8` (landing nav) → `w-9 h-9` (sidebar). The Lucide `Sparkles` icon is used as the logo mark in all contexts.

---

## 5. CORE UI COMPONENTS

### Button components

**No dedicated Button React component file exists.** Buttons are written inline in each page/component. Two global CSS classes provide the primary variant system:

| Class | File | Description |
|---|---|---|
| `.btn-primary` | `globals.css` | Gradient indigo–purple CTA, rounded-xl, shadow-lg, hover scale |
| `.btn-secondary` | `globals.css` | Ghost/outline, muted text, no fill |

In practice, most buttons are written with inline Tailwind classes rather than consuming `.btn-primary`/`.btn-secondary` directly, using the same visual pattern duplicated per component.

### Card / container components

**No dedicated Card React component.** The double-bezel architecture is applied via:
- Global CSS: `.card-outer` + `.card-inner` (sometimes referenced)
- More often: inline classes replicating the same pattern, e.g.:
  ```tsx
  <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
    <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
      {/* content */}
    </div>
  </div>
  ```

### Sidebar / nav components

| File | Description |
|---|---|
| `app/dashboard/DashboardClient.tsx` | Full dashboard shell: desktop collapsing sidebar (72px→240px on hover), top breadcrumb header, mobile bottom tab bar (4 primary items), "More" bottom-sheet drawer (3-col grid). All in one file. |

Desktop sidebar details:
- `bg-[#13131A]`, `border-r border-white/[0.06]`
- Collapsed: 72px, icon only; Expanded: 240px, icon + label
- Active state: `bg-[#6366F1]/20 text-white` with `#6366F1` active indicator bar
- Inactive: `text-[#60607A]`, hover `text-[#A0A0B8] bg-white/[0.04]`
- Pro items marked with `Crown` icon in amber when user is not Pro
- Bottom section: sync indicator, Settings link, user avatar + name

### Score / progress-bar / ring components

| File | Description |
|---|---|
| `components/resume/ATSScorePanel.tsx` | Animated SVG ring meter (`ScoreMeter`), dimension breakdown progress bars (`DimensionBar`, 4 dims), keyword chip lists (matched/missing), formatting issues list, suggestions list |
| `app/dashboard/page.tsx` (inline) | Profile completeness horizontal bar: `h-2 rounded-full`, gradient `#6366F1→#8B5CF6`, Framer Motion width animation |
| `app/page.tsx` (inline) | Landing demo ATS ring: SVG with `linearGradient` `#6366F1→#22C55E`, animated `strokeDashoffset` |

Score color thresholds (ATSScorePanel):
- ≥ 85 → `#22C55E` (green / "Excellent")
- 70–84 → `#F59E0B` (amber / "Good")
- < 70 → `#EF4444` (red / "Needs Work")

### Landing page section components

All landing page sections live inline in `app/page.tsx` — no extracted section component files. Helper components defined locally in the same file:

| Local component | Description |
|---|---|
| `MagneticButton` | Mouse-tracking magnetic hover effect wrapping a `motion.div` |
| `FadeInSection` | Scroll-triggered `useInView` fade-in + slide-up wrapper |
| `useCounter` | Hook for animated number counting |

---

## 6. LANDING PAGE STRUCTURE

**Single file:** `app/page.tsx` — all sections inline, no imported section components.

| Section | Content |
|---|---|
| **Glass Navbar** | Fixed floating pill; glassmorphism (`backdrop-blur-xl bg-white/5`); gradient logo mark; nav links (Features, How It Works, Pricing, Blog); Sign In + Get Started CTA |
| **Hero** | Two-column layout; headline with gradient text span; two MagneticButton CTAs (Start for Free, Upload Existing Resume); social proof avatars row; floating resume mockup card (right column, desktop only) with animated ATS badge |
| **Social Proof Mini** | Full-width divider lines; centered "landed interviews at Amazon" copy with gradient text |
| **Statistics Row** | 3 double-bezel stat cards: "8 AI-powered tools", "ATS-optimized output", "Powered by Claude AI" |
| **Features Grid** | 7 feature cards in 1/2/4-col responsive grid; each card has colored gradient icon background, label, description, hover "Try it →" reveal |
| **How It Works** | 3-step horizontal layout (01/02/03); numbered boxes with gradient text; thin connecting line behind steps on desktop |
| **ATS Section** | Animated SVG ring (score animates to 87 on scroll); 4 checklist items; double-bezel card wrapper |
| **Pricing** | Monthly/Annual toggle; 3-column card grid (Free, Pro at $19/mo, Pro Annual at $15.83/mo); Pro card has `#6366F1` border; Pro Annual has `#22C55E` border; each card has feature checklist |
| **Final CTA** | Full-width gradient-bordered card; large headline; single CTA button; "No credit card" subtext |
| **Footer** | Logo mark + wordmark; copyright; Privacy, Terms, Contact links |

---

## 7. DASHBOARD STRUCTURE

### Layout files

| File | Role |
|---|---|
| `app/dashboard/layout.tsx` | Thin server wrapper; sets `robots: noindex`; renders `<DashboardClient>` |
| `app/dashboard/DashboardClient.tsx` | Full authenticated shell: sidebar, header, main content area, mobile nav, profile drawer, feedback button |

### Layout pattern

**Desktop:**
- Fixed left sidebar (`bg-[#13131A]`), collapsing icon-only (72px) ↔ expanded (240px) on hover
- Top header bar (`bg-[#0A0A0F]/80 backdrop-blur-xl`, breadcrumb label, user profile button)
- Scrollable main content: `flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto`
- Main content area offset: `md:ml-[72px]`

**Mobile:**
- No sidebar
- Top header shows logo + user profile button
- Fixed bottom tab bar (`bg-[#13131A]/95 backdrop-blur-xl`): Dashboard, Resume, My Resumes, Cover Letter, More
- "More" expands to a bottom-sheet drawer with a 3-col icon grid for remaining items

**Theme:** Dark only — `bg-[#0A0A0F]` root, `bg-[#13131A]` sidebar/drawers. No light mode.

### Dashboard pages

| Route | File | Description |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Home: upgrade banner, time-of-day greeting, profile completeness bar, last ATS score snapshot, 6-item quick action grid |
| `/dashboard/resume` | `app/dashboard/resume/page.tsx` | Multi-step resume builder: 7-tab form wizard (Personal, Experience, Education, Skills, etc.), AI generate button, split-pane preview, ATS/section analysis panels |
| `/dashboard/resume/saved` | `app/dashboard/resume/saved/page.tsx` | Saved resumes list |
| `/dashboard/resume/[id]` | `app/dashboard/resume/[id]/page.tsx` | Individual saved resume view/edit |
| `/dashboard/ats` | `app/dashboard/ats/page.tsx` | ATS optimizer: paste job description + resume or upload PDF; runs ATS score, requirement coverage, section analysis, structured suggestions |
| `/dashboard/cover-letter` | `app/dashboard/cover-letter/page.tsx` | Cover letter generator |
| `/dashboard/cover-letter/saved` | `app/dashboard/cover-letter/saved/page.tsx` | Saved cover letters list |
| `/dashboard/cover-letter/[id]` | `app/dashboard/cover-letter/[id]/page.tsx` | Individual cover letter view |
| `/dashboard/interview` | `app/dashboard/interview/page.tsx` | Interview prep (Pro) |
| `/dashboard/interview/saved` | `app/dashboard/interview/saved/page.tsx` | Saved interview sets |
| `/dashboard/interview/saved/[id]` | `app/dashboard/interview/saved/[id]/page.tsx` | Individual interview set (flip cards) |
| `/dashboard/linkedin` | `app/dashboard/linkedin/page.tsx` | LinkedIn rewriter (Pro) |
| `/dashboard/strategy` | `app/dashboard/strategy/page.tsx` | 7-day job strategy generator (Pro) |
| `/dashboard/strategy/saved` | `app/dashboard/strategy/saved/page.tsx` | Saved strategies list |
| `/dashboard/strategy/saved/[id]` | `app/dashboard/strategy/saved/[id]/page.tsx` | Individual strategy view |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Account settings |

Each feature area has a `layout.tsx` file (minimal, passes children through with no additional UI).

### Pro gating
`components/shared/ProGate.tsx` — wraps Pro-only page content. When user is not Pro, renders a centered lock card with upgrade CTA. Applied to Interview, LinkedIn, and Strategy sections.

### Shared dashboard components

| File | Description |
|---|---|
| `components/shared/CareerProfileDrawer.tsx` | Right-side slide-in drawer; shows career profile sections (Target Role, Personal, Experience, Education, Skills); triggered from sidebar user button and header avatar |
| `components/shared/FeedbackModal.tsx` | Floating feedback button (bottom-right) opens modal with rating + text input |
| `components/shared/AILoadingState.tsx` | AI generation loading skeleton/spinner state |
| `components/shared/ProGate.tsx` | Paywall gate component for Pro-only features |

---

## 8. COLOR USAGE SCAN

Scan of `app/**` and `components/**` for hardcoded hex values. Ranked by frequency of occurrence.

| Rank | Hex | Name/Role | Occurrence contexts |
|---|---|---|---|
| 1 | `#6366F1` | Brand indigo — primary | CTA buttons, active nav bg, icon gradient starts, borders, ring strokes, focus colors. By far the most used hex in the codebase. |
| 2 | `#13131A` | Surface | Card outer backgrounds, sidebar, all drawers/modals |
| 3 | `#1C1C26` | Surface elevated | Card inner backgrounds, input fields, dropdowns |
| 4 | `#60607A` | Text muted | Inactive nav icons/labels, secondary descriptions, hint text |
| 5 | `#A0A0B8` | Text secondary | Body copy, form labels, chip text |
| 6 | `#8B5CF6` | Brand violet | Gradient end on buttons/icons, secondary accent |
| 7 | `#22C55E` | Success green | ATS score ≥85, matched keywords, checkmarks, Pro Annual plan color |
| 8 | `#EF4444` | Error red | Missing keywords, remove/delete buttons, formatting issues |
| 9 | `#F59E0B` | Warning amber | ATS score 70–84, Pro crown badge, formatting warnings |
| 10 | `#818CF8` | Brand indigo light | Active nav icon color, hover text states |
| 11 | `#0A0A0F` | Page background | Root background, some section backgrounds, some inputs |
| 12 | `#F8F8FF` | Text primary | Used in some components as raw hex instead of Tailwind token |
| 13 | `#A78BFA` | Brand violet light | Text-gradient accents, avatar placeholder colors |
| 14 | `#4F46E5` | Brand indigo dark | Icon gradient ends (Resume Builder, etc.) |
| 15 | `#E8E8F0` | Light warm gray | Appears only in `CompanyAutocomplete` and `LocationAutocomplete` — an active/selected item background in dropdown lists (the only light-palette color in the codebase) |

**Additional colors observed (lower frequency):**

| Hex | Role |
|---|---|
| `#06B6D4` | Cyan — Formatting Compliance bar in ATSScorePanel dimension breakdown |
| `#10B981` | Teal — Readability bar in ATSScorePanel dimension breakdown |
| `#1a1a1a` | Near-black — Resume template (ClassicPro) body text color |
| `#A5B4FC` | Indigo-200 — AI highlight color in ResumeEditor bullet text |
| `#FCD34D` | Yellow-300 — AI tag label in ResumeEditor |
| `#16A34A` | Dark green — Pro Annual plan gradient end, "Save 17%" badge |
| `#D97706` | Dark amber — Cover letter feature icon gradient end |
| `#DC2626` | Dark red — Interview prep feature icon gradient end |
| `#0EA5E9` | Sky blue — LinkedIn feature icon gradient start |

**Pattern note:** Hardcoded hex values are used directly in inline Tailwind `bg-[#...]`/`text-[#...]`/`border-[#...]` classes throughout — the defined CSS variables and Tailwind config tokens are frequently bypassed in favor of inline hex literals. Nearly all color usage is dark-palette.
