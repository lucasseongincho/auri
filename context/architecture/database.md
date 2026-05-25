# Database & State

## Firestore Structure
users/{uid}/
  profile/data          — CareerProfile (experience, education, skills, target, generated)
  resumes/{resumeId}    — SavedResume (resumeData, personalInfo, templateId, createdAt)
  cover-letters/{id}    — SavedCoverLetter (company, position, paragraphs, wordCount)
  interview-prep/{id}   — SavedInterviewPrep (position, company, questions)
## Firestore Rules
- Users can only read/write their own users/{uid}/... documents
- All other paths denied
- Rules are live — do not change without testing in Rules Playground

## Guest Mode (localStorage)
Keys: auri_guest_resume, auri_guest_cover_letters, auri_guest_interview_preps
- All guest data migrates to Firestore on sign-in
- Migration functions: migrateGuestToFirestore(), migrateGuestCoverLettersToFirestore(),
  migrateGuestInterviewPrepsToFirestore()

## Zustand Store (careerStore.ts)
- Single global store for career data
- profile, currentResume, atsScore, isGenerating, activeFeature
- pushToHistory / undo / redo for resume edit history
- IMPORTANT: selectedTemplate was removed — ClassicPro is always used

## Firestore Helpers
All in lib/firestore.ts:
- getSavedResumes / getSavedCoverLetters / getSavedInterviewPreps
- updateSavedResume / updateCoverLetter
- IMPORTANT: Use serverTimestamp() for createdAt/updatedAt — not new Date()
