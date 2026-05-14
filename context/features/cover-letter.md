# Cover Letter Feature

## Feature 8 — Cover Letter Generator
- Pulls experience from Career Profile automatically
- Generates 280–300 word cover letter starting with a powerful hook
- Word count progress bar in the result panel
- Paragraph-level inline editing (EditableParagraph component)
- Save button in page header (amber/F59E0B color scheme)
- Prompts: see lib/prompts.ts → buildCoverLetterPrompt()

## Saved Cover Letters
- Route: /dashboard/cover-letter/saved — lists all saved letters
- Route: /dashboard/cover-letter/[id] — detail page with inline editing
- Guest support: saves to localStorage, migrates to Firestore on sign-in
- Edit mode: paragraph editing with add/delete rows, Save button in header
- No AI Rewrite feature — was removed

## Color Scheme
- Cover letter feature uses amber accent: #F59E0B / #D97706
- All cover letter UI elements use amber, not indigo

## Current Status
- [x] Generator built and deployed
- [x] Saved letters with inline editing
- [x] Guest localStorage support
- [x] AI Rewrite removed
