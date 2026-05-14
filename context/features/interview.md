# Interview Prep Feature

## Feature 9 — Interview Preparation System
- Generates 8 likely questions with STAR frameworks + 3 questions to ask
- Pulls experience from Career Profile automatically
- Interactive flip-card Q&A deck
- Practice Mode: user types answer → Claude scores it
- Save button in page header (indigo color scheme)
- Prompts: see lib/prompts.ts → buildInterviewPrepPrompt(), buildPracticeFeedbackPrompt()

## JSON Parsing
- Uses bracket-depth matching (not lastIndexOf) to extract JSON from stream
- No auto-retry on parse failure — shows error directly to avoid double billing

## Saved Sessions
- Route: /dashboard/interview/saved
- Guest support: saves to localStorage via saveGuestInterviewPrep()

## Current Status
- [x] Built and deployed
- [x] Practice mode working
- [x] Save to study list in header
