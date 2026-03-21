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
  linkedin_rewrite: LinkedInRewrite | Record<string, never>
  job_strategy: JobStrategy | Record<string, never>
  interview_prep: InterviewPrep | Record<string, never>
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
}

// ============================================================
// Feature-specific response types
// ============================================================

export interface ATSScore {
  score: number // 0-100
  matched_keywords: string[]
  missing_keywords: string[]
  formatting_issues: string[]
  suggestions: string[]
  strength_areas: string[]
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
  templateId: TemplateId
  createdAt?: string
  updatedAt?: string
}

// Saved resume version stored in Firestore: users/{uid}/resumes/{id}
export interface SavedResume {
  id: string
  name: string           // user-given name or auto-generated
  targetPosition: string
  targetCompany: string
  templateId: TemplateId
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
}

export interface CoverLetter {
  cover_letter: string  // full plain text for copy/paste
  word_count: number
  opening_hook: string  // first sentence highlight for UI callout
  opening: string       // paragraph 1 — the hook
  body: string          // paragraph 2 — experience + value match
  closing: string       // paragraph 3 — call to action
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

// ============================================================
// Template types
// ============================================================

export type TemplateId =
  | 'classic-pro'
  | 'modern-edge'
  | 'executive-dark'
  | 'creative-pulse'
  | 'minimal-seoul'

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  'classic-pro': 'Classic Pro',
  'modern-edge': 'Modern Edge',
  'executive-dark': 'Executive Dark',
  'creative-pulse': 'Creative Pulse',
  'minimal-seoul': 'Minimal Seoul',
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

// Saved interview prep session: users/{uid}/interview-prep/{prepId}
export interface SavedInterviewPrep {
  id: string
  position: string
  company: string
  prep: InterviewPrep
  createdAt: string
}

// ============================================================
// Auth types
// ============================================================

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isGuest: boolean
}
