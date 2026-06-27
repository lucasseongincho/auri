// ============================================================
// Core domain types — derived from CLAUDE.md data models
// ============================================================

export interface PersonalInfo {
  name: string
  email: string
  phone: string
  location: string
  linkedin_url: string
  website: string
  github?: string
  portfolioLabel?: string
}

export interface Experience {
  id: string
  company: string
  title: string
  start: string
  end: string | 'Present'
  bullets: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  additionalMajors?: string[]
  minors?: string[]
  year: string
  gpa?: string  // e.g. "3.8/4.0" — omit if below 3.5
}

export interface Leadership {
  id: string
  role: string
  organization: string
  start: string
  end: string
  bullets: string[]
}

export interface Volunteer {
  id: string
  role: string
  organization: string
  date: string
  description: string
}

export interface Language {
  id: string
  name: string
  proficiency: 'Native' | 'Fluent' | 'Intermediate' | 'Basic'
}

export interface Project {
  id: string
  name: string
  description: string
  url?: string
  bullets: string[]
}

export interface TargetJob {
  position: string
  company: string
  company_type: string
  industry: string
  city: string
  job_description?: string
}

// Generated outputs — stored alongside profile
export interface GeneratedData {
  resume_html: string
  resume_plain: string
  ats_score: ATSScore | null
  cover_letter: string
  linkedin_rewrite: LinkedInRewrite | Record<string, unknown>
  job_strategy: (JobStrategy & { completed?: Record<string, boolean> }) | Record<string, unknown>
  interview_prep: InterviewPrep | Record<string, unknown>
}

export interface CareerProfile {
  personal: PersonalInfo
  experience: Experience[]
  education: Education[]
  skills: string[]
  certifications: string[]
  projects: Project[]
  leadership?: Leadership[]
  volunteer?: Volunteer[]
  languages?: Language[]
  target: TargetJob
  generated: GeneratedData
  updatedAt?: string
  /** Set to true after the user dismisses the AI-estimate disclaimer modal for the first time. */
  hasSeenEstimateDisclaimer?: boolean
/** Loaded from Firestore server side — never persisted to localStorage. */
  isPro?: boolean
  stripeCustomerId?: string
}

// ============================================================
// Feature-specific response types
// ============================================================

export interface ATSDimensionScores {
  keyword: number      // 0-40  (40% weight)
  achievement: number  // 0-25  (25% weight)
  formatting: number   // 0-20  (20% weight)
  readability: number  // 0-15  (15% weight)
}

export interface SectionAnalysis {
  section: 'summary' | 'experience' | 'skills' | 'projects' | 'education' | 'leadership'
  score: number           // 0–100, Claude's assessment of this section vs the JD
  label: string           // human-readable: "Work Experience", "Skills", etc.
  strengths: string[]     // 1–3 specific strengths in this section
  gaps: string[]          // 1–3 specific gaps relative to the JD
  suggestions: string[]   // 1–3 targeted fixes for this section only
}

export interface ATSScore {
  score: number // 0-100
  dimension_scores?: ATSDimensionScores
  matched_keywords: string[]
  missing_keywords: string[]
  formatting_issues: string[]
  suggestions: string[]
  strength_areas: string[]
  section_analysis?: SectionAnalysis[]  // present only when structured path is used (Pro + uid)
}

export interface ATSOutcome {
  id: string
  createdAt: string                         // ISO timestamp of the analysis
  jobDescription: string                    // JD text used (truncated to 2000 chars)
  score: number                             // composite ATS score 0–100
  sectionScores?: Record<string, number>    // section label → score from section_analysis
  outcome: 'interview' | 'rejected' | 'no_response' | 'pending'
  feedbackDelayDays?: number                // days between analysis and feedback recorded
}

export interface RequirementCoverage {
  requirement: string
  bestMatch: string | null
  score: number            // 0–1 dot product of L2-normalized vectors
  status: 'strong' | 'partial' | 'missing'
  // thresholds: >0.75 = strong, 0.5–0.75 = partial, <0.5 = missing
}

export interface ParseFailure {
  type: 'column_merge' | 'missing_headers' | 'date_fragmented' |
        'bullets_stripped' | 'encoding_artifact' | 'contact_garbled'
  severity: 'high' | 'medium' | 'low'
  description: string
  affectedLines: number[]
  affectedPlatforms: string[]
}

export interface ParsedResumeResult {
  extractedText: string
  lines: string[]
  failures: ParseFailure[]
  stats: {
    totalLines: number
    totalChars: number
    detectedSections: string[]
  }
}

export interface ResumeData {
  id?: string
  summary: string
  experience: Experience[]
  education: Education[]
  skills: string[]
  certifications: string[]
  projects: Project[]
  leadership?: Leadership[]
  volunteer?: Volunteer[]
  languages?: Language[]
  html?: string
  plain?: string
  templateId: string
  createdAt?: string
  updatedAt?: string
}

// Saved resume version stored in Firestore: users/{uid}/resumes/{id}
export interface SavedResume {
  id: string
  name: string           // user-given name or auto-generated
  targetPosition: string
  targetCompany: string
  templateId: string
  atsScore?: number
  resumeData: ResumeData
  personalInfo: PersonalInfo
  createdAt: string
  updatedAt: string
}

// Edit history entry for undo/redo in Easy Tune
export interface EditHistoryEntry {
  resumeData: ResumeData
  timestamp: number
}

export interface LinkedInRewrite {
  headline: string
  about: string
  experiences: Array<{
    title: string
    company: string
    description: string
  }>
}

export interface JobStrategyAction {
  time: string
  action: string
  resource: string
  completed?: boolean
}

export interface JobStrategyDay {
  day: number
  theme: string
  actions: JobStrategyAction[]
}

export interface JobStrategy {
  days: JobStrategyDay[]
  overview?: string
  search_terms?: string[]
  recommended_sites?: { name: string; url: string; why: string }[]
}

export interface CoverLetter {
  cover_letter: string   // full plain text for copy/paste
  word_count: number
  opening_hook: string   // first sentence highlight for UI callout
  paragraphs: string[]   // 3–6 paragraphs: opening hook → body → closing
}

export interface InterviewQuestion {
  question: string
  answer_framework: string
  star_example: string
  userAnswer?: string
  feedback?: string
}

export interface InterviewPrep {
  questions: InterviewQuestion[]
  questions_to_ask: string[]
}

export const TEMPLATE_LABELS: Record<string, string> = {
  'classic-pro': 'Classic Pro',
}

// ============================================================
// Feature routing types
// ============================================================

export type FeatureId =
  | 'dashboard'
  | 'resume'
  | 'rewriter'
  | 'ats'
  | 'linkedin'
  | 'strategy'
  | 'cover-letter'
  | 'interview'
  | 'settings'

// ============================================================
// API types — standardized request/response shapes (Section 7)
// ============================================================

export type APIMode = 'generate' | 'rewrite' | 'assist'

export interface ClaudeAPIRequest {
  careerProfile: CareerProfile
  target: {
    position: string
    company: string
    companyType: string
    jobDescription: string
  }
  mode: APIMode
}

export interface ClaudeAPIResponse<T = unknown> {
  success: boolean
  data: T
  usage: {
    input_tokens: number
    output_tokens: number
  }
  error?: string
}

// Saved job strategy: users/{uid}/strategies/{id}
export interface SavedStrategy {
  id: string
  position: string
  industry: string
  city: string
  strategy: JobStrategy
  completed: Record<string, boolean>
  createdAt: string
}

// Saved interview prep session: users/{uid}/interview-prep/{prepId}
export interface SavedInterviewPrep {
  id: string
  position: string
  company: string
  prep: InterviewPrep
  createdAt: string
}

// Saved cover letter: users/{uid}/cover-letters/{id}
export interface SavedCoverLetter {
  id: string
  company: string
  position: string
  content: string         // full plain text
  paragraphs: string[]    // editable paragraph array
  wordCount: number
  openingHook?: string
  signerName?: string     // name shown after "Sincerely,"
  createdAt: string
  updatedAt: string
}

// ============================================================
// Auth types
// ============================================================

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}
