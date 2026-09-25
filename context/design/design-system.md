# Design System

Light, paper-and-ink system shared by the landing page and the app.
Tokens live in tailwind.config.ts (`lp-*`, plus `background`, `brand`,
`surface`, `text-*`). One brand color, neutrals, one highlight.

## Color Palette
background (paper):  #F4F2EC   bg-lp-paper / bg-background
surface (card):      #FFFFFF   bg-white / bg-surface
sheet (sunk panel):  #FAF9F5   bg-lp-sheet;  #E9E6DD bg-lp-sunk
border:              #D9D5CC   border-lp-rule;  hairline #E6E2D9
text-primary (ink):  #1B1D1C   text-lp-ink
text-secondary:      #3C403E   text-lp-body
text-muted:          #5A5F5C   text-lp-muted  (4.5:1+ on paper and white)
brand (pine):        #1F5C4A   hover #15443A, tint #EEF3F0
highlight:           #F2D45C   ONLY for matched keywords (<mark>)
success:             #1F7A4D
warning:             #8A5A00   (warnings, Pro crown)
error:               #B42318

All features use pine. No per-feature colors, no gradients, no glass,
no glow shadows.

## Typography
- Headings: Newsreader (font-heading / font-lp-serif), weight 500–600
- Body: IBM Plex Sans (font-body / font-lp-sans)
- Numbers, labels: IBM Plex Mono (font-lp-mono)
- Self-hosted via @fontsource, imported in app/layout.tsx

## Radius, depth
- Controls (buttons, inputs, chips): 4px  rounded-[4px] / rounded-lp-control
- Panels, cards: 10px  rounded-[10px] / rounded-lp-panel
- Pills, avatars, progress bars: rounded-full
- One border per card. No double bezel. Shadow only for things that float
  (popovers, the hero sample): shadow-lp-lift

## Card
<div className="rounded-[10px] border border-lp-rule bg-white p-6">
  {children}
</div>

## Primary / secondary button
<button className="min-h-[44px] px-6 rounded-[4px] bg-[#1F5C4A] text-white font-medium hover:bg-[#15443A]">
<button className="min-h-[44px] px-6 rounded-[4px] border border-[#1F5C4A] text-[#1F5C4A]">

## Animation
- Only when it explains state (loading, panels opening). No decorative motion.
- framer-motion: SPRING = { type: 'spring', stiffness: 300, damping: 30 }
- MotionConfig reducedMotion="user" is set in app/providers.tsx; globals.css
  also disables CSS animation under prefers-reduced-motion.

## Accessibility
- Inline links are underlined, not color-only.
- Touch targets >= 44px on mobile.
- Focus ring: 2px pine outline (globals.css :focus-visible).

## Mobile Layout
- Bottom tab bar: 4 primary items + More drawer (slide-up, 3-column grid)
- Main content: overflow-x-hidden, p-4 md:p-6, pb-24 md:pb-0
- Resume preview: MobileResumeCard on mobile (md:hidden), paper preview on desktop (hidden md:block)
- All feature pages: form/preview toggle on mobile

## Icons
- Custom set in `components/icons` (generated from `design/icons/*.svg` by
  `python3 scripts/build-icons.py`). Import as `IconDashboard`, `IconMatched`, …
- Feature, brand, status and resume-step icons are custom. Generic controls
  (close, chevrons, trash, copy, download, search…) stay lucide-react.
- Nav items use `*Active` (filled) variants for the current page.
- `IconMatched` has a `.auri-highlight` shape filled with #F2D45C via globals.css.
- `IconLoading` is static; add `animate-spin`.
- No emoji in the UI. No third-party logos as nav icons.
