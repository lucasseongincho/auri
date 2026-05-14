# Design System

## Color Palette (Dark Mode First)
background:       #0A0A0F
surface:          #13131A  (card backgrounds)
surface-elevated: #1C1C26  (elevated panels)
border:           rgba(255,255,255,0.08)
border-strong:    rgba(255,255,255,0.15)
accent-primary:   #6366F1  (indigo — main brand)
accent-secondary: #8B5CF6  (violet — gradient partner)
text-primary:     #F8F8FF
text-secondary:   #A0A0B8
text-muted:       #60607A
success:          #22C55E
warning:          #F59E0B  (also cover letter feature color)
error:            #EF4444

## Feature Color Coding
- Resume / general features: indigo #6366F1
- Cover letter feature: amber #F59E0B
- Interview prep: indigo #6366F1

## Typography
- Headings: Inter (font-heading class)
- Body: DM Sans (font-body class)

## Double-Bezel Card Pattern (use everywhere)
<div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
  <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6">
    {children}
  </div>
</div>

## Animation
- SPRING = { type: 'spring', stiffness: 300, damping: 30 }
- Use framer-motion with SPRING for all transitions
- Never use linear or ease — always spring physics

## Primary CTA Button
<button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
  text-white font-semibold shadow-lg shadow-[#6366F1]/25
  hover:shadow-[#6366F1]/50 hover:scale-[1.02] transition-all duration-200">

## Mobile Layout
- Bottom tab bar: 4 primary items + More drawer (slide-up, 3-column grid)
- Main content: overflow-x-hidden, p-4 md:p-6, pb-24 md:pb-0
- Resume preview: MobileResumeCard on mobile (md:hidden), paper preview on desktop (hidden md:block)
- All feature pages: form/preview toggle on mobile
