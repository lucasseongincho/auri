import type { CareerProfile, TargetJob } from '@/types'

// ============================================================
// PROMPTS — All AI prompts centralized here per CLAUDE.md §15
//
// Design philosophy applied to every prompt:
//   1. ROLE PRIMING: Open with a high-authority persona so Claude
//      adopts the right lens (recruiter, ATS system, etc.) before
//      reasoning about the content.
//   2. EXPLICIT OUTPUT CONTRACT: Always specify the exact JSON
//      shape to avoid hallucinated field names and parsing errors.
//   3. CONSTRAINT-FIRST: Hard constraints (word limits, ATS rules)
//      are stated before the task so they bound generation, not
//      patch it afterward.
//   4. CONTEXT INJECTION: Dynamic values use named placeholders
//      to make substitution explicit and auditable.
// ============================================================

// ── Feature 1 & 5 — Resume Builder / Rewriter ────────────────────────────────

/**
 * Why senior-recruiter persona: Recruiters scan for value, not
 * responsibility lists. This framing pushes Claude toward
 * achievement-oriented rewrites without us having to enumerate
 * every ATS rule in the prompt.
 *
 * Why "200 resumes a day": Anchors Claude in a scarcity mindset —
 * it must make each bullet instantly scannable.
 *
 * Why JSON output: Structured response enables live preview
 * rendering without a second parse step.
 */
export function buildResumePrompt(
  profile: CareerProfile,
  target: TargetJob,
  originalResumeText?: string
): string {
  const profileJson = JSON.stringify(
    {
      personal: profile.personal,
      experience: profile.experience,
      education: profile.education,
      skills: profile.skills,
      certifications: profile.certifications,
      projects: profile.projects,
    },
    null,
    2
  )

  return `Act as a senior recruiter who reviews 200 resumes a day.
Rewrite this resume for the position of ${target.position} at ${target.company}, a ${target.company_type}.
Replace every responsibility with a measurable achievement.
Eliminate everything generic.
Make the candidate's value impossible to ignore.
Optimize every bullet point for ATS keyword matching based on this job description: ${target.job_description ?? '(not provided)'}.

ATS RULES YOU MUST ENFORCE:
- Action verbs at the start of every bullet point
- Quantify achievements with numbers/percentages wherever possible
- Use standard section headers only (Experience, Education, Skills)
- No tables, no columns in the output
- Keywords from the JD injected naturally, never stuffed

ONE-PAGE CONSTRAINT (CRITICAL — do NOT exceed these limits):
- summary: exactly 2 sentences, max 45 words total
- experience bullets: MAXIMUM 4 bullets per job entry, no exceptions
- experience entries: include at most 3 most recent jobs
- skills: MAXIMUM 12 items as a flat list
- certifications: max 3 items
- projects: max 2 projects, max 2 bullets each
- Every bullet must be one line (under 120 characters). The entire resume MUST fit on one A4 page.

${originalResumeText ? `ORIGINAL RESUME TEXT:\n${originalResumeText}\n` : ''}
CAREER PROFILE (structured):
${profileJson}

Return ONLY valid JSON with this exact shape:
{
  "summary": "string",
  "experience": [{ "id": "string", "company": "string", "title": "string", "start": "string", "end": "string", "bullets": ["string"] }],
  "education": [{ "id": "string", "institution": "string", "degree": "string", "field": "string", "year": "string" }],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [{ "id": "string", "name": "string", "description": "string", "bullets": ["string"] }]
}`
}

// ── Feature 2 — ATS Score & Optimizer ────────────────────────────────────────

/**
 * Why "ATS system AND recruiter combined": Two-perspective scoring —
 * machine parsing (keyword density, structure) + human judgment
 * (clarity, impact) — gives a more actionable score than either alone.
 *
 * Why score 0-100: Maps cleanly to a progress bar UI and gives users
 * an intuitive benchmark (70+ = good, 85+ = excellent).
 */
export function buildATSScorePrompt(
  resumePlainText: string,
  jobDescription: string
): string {
  return `You are an ATS system and senior recruiter combined.
Analyze this resume against this job description with expert precision.

Scoring criteria:
- Keyword match (40%): exact and semantic matches to JD terms
- Achievement orientation (25%): measurable results vs responsibility lists
- Formatting compliance (20%): ATS-parseable structure, no tables/columns
- Readability (15%): clarity, action verbs, conciseness

Job Description:
${jobDescription}

Resume Text:
${resumePlainText}

Return ONLY valid JSON:
{
  "score": number,
  "matched_keywords": ["string"],
  "missing_keywords": ["string"],
  "formatting_issues": ["string"],
  "suggestions": ["string"],
  "strength_areas": ["string"]
}`
}

// ── Feature 3 — Easy Tune (per-bullet AI Assist) ─────────────────────────────

/**
 * Why "under 20 words": Resume bullets must be ultra-scannable.
 * The hard limit prevents Claude from padding the rewrite.
 *
 * Why include target_role: Ensures keyword alignment even on
 * micro-edits — without it Claude rewrites generically.
 */
export function buildEasyTunePrompt(
  bulletText: string,
  targetPosition: string
): string {
  return `Rewrite this single resume bullet point to be more impactful, measurable, and ATS-friendly.
Target role: ${targetPosition}. Keep it under 20 words. Start with a strong action verb.
Original: ${bulletText}

Return ONLY valid JSON:
{ "rewritten": "string" }`
}

// ── Feature 6 — LinkedIn Profile Rewriter ────────────────────────────────────

/**
 * Why optimize for "LinkedIn's search algorithm": LinkedIn uses
 * keyword frequency in headline + about for recruiter search ranking.
 * Explicit instruction to Claude makes it inject role-specific terms
 * naturally rather than focusing purely on narrative quality.
 */
export function buildLinkedInPrompt(
  pastedProfile: string,
  targetPosition: string,
  sectorOrIndustry: string
): string {
  return `Rewrite my LinkedIn title, 'About' section, and 3 main experiences to position me in recruiter searches for ${targetPosition} in ${sectorOrIndustry}.
Make every word carry weight. Optimize for LinkedIn's search algorithm AND human recruiter appeal.
The headline must be under 220 characters. The About section must be 3-5 short paragraphs.

Current profile:
${pastedProfile}

Return ONLY valid JSON:
{
  "headline": "string",
  "about": "string",
  "experiences": [{ "title": "string", "company": "string", "description": "string" }]
}`
}

// ── Feature 7 — 7-Day Job Search Strategy ────────────────────────────────────

/**
 * Why day-by-day JSON structure: Enables the checklist UI to render
 * progress per day and persist completed actions to Firestore
 * without any post-processing of the AI response.
 *
 * Why include specific URLs: Generic "search on LinkedIn" advice
 * has zero marginal value. URLs + exact search terms = immediately
 * executable actions, which is the product's core value prop.
 */
export function buildJobStrategyPrompt(
  targetPosition: string,
  sectorOrIndustry: string,
  cityOrRemote: string,
  companySizeOrType: string
): string {
  return `I want to get a position as ${targetPosition} in ${sectorOrIndustry} in ${cityOrRemote}.
Create a 7-day approach plan, focused on ${companySizeOrType}, which includes:
- Specific job sites where vacancies can be found (with full URLs)
- Exact search terms to use on each site
- A daily list of actions that can be executed immediately
- Networking targets and outreach templates

Be specific, actionable, and realistic for a 7-day sprint. No vague advice.

Respond with ONLY the raw JSON object below — no markdown, no code fences, no explanation, no preamble:
{"days":[{"day":1,"theme":"string","actions":[{"time":"string","action":"string","resource":"string"}]}]}`
}

// ── Feature 8 — Cover Letter Generator ───────────────────────────────────────

/**
 * Why "NOT I am applying for...": This is the single most common
 * cover letter mistake. Explicit negative instruction outperforms
 * "start with a hook" because it eliminates the most likely
 * failure mode directly.
 *
 * Why 3 structured paragraphs: Gives the UI the ability to render a
 * proper formal letter with semantic sections rather than a single
 * text blob — enables per-paragraph editing and a professional layout.
 *
 * Why 150-200 words per body: Long enough to be substantive, short
 * enough for a hiring manager to read in < 45 seconds. The range
 * (not a hard cap) allows Claude to fill a proper letter page.
 *
 * Why return opening_hook separately: Lets the UI highlight the
 * first sentence distinctively so users can quickly judge impact.
 */
export function buildCoverLetterPrompt(
  position: string,
  company: string,
  jobDescription: string,
  experienceSummary: string,
  hiringManagerName?: string,
  cityState?: string
): string {
  const salutation = hiringManagerName
    ? `Dear ${hiringManagerName},`
    : 'Dear Hiring Manager,'

  return `Write a professional cover letter for the position of ${position} at ${company}.
${cityState ? `The applicant is based in ${cityState}.` : ''}
${hiringManagerName ? `Address it to ${hiringManagerName}.` : ''}

STRUCTURE REQUIREMENTS:
- Paragraph 1 (opening): Begin with a powerful, memorable hook. NOT "I am applying for..." and NOT "I am writing to express my interest...". Hook the reader immediately with insight, a bold claim, or a specific result.
- Paragraph 2 (body): Connect specific experience to the company's exact needs. Be concrete — name technologies, metrics, or outcomes.
- Paragraph 3 (closing): A confident call to action. Express genuine enthusiasm. Keep it brief.
- Total body text: 150-200 words across the 3 paragraphs. Be substantive but tight.
- Tone: human, direct, compelling. Not corporate. Not generic.

My experience:
${experienceSummary}

Job description:
${jobDescription || '(not provided — write for the role and company generally)'}

Return ONLY valid JSON with exactly these fields:
{
  "opening": "string (paragraph 1 text only, no salutation)",
  "body": "string (paragraph 2 text only)",
  "closing": "string (paragraph 3 text only)",
  "cover_letter": "string (full plain text: salutation + all 3 paragraphs + sign-off, for copy/paste)",
  "word_count": number (count only the 3 paragraphs, not salutation/sign-off),
  "opening_hook": "string (the first sentence of opening, for UI callout)"
}

Salutation to use: ${salutation}`
}

// ── Feature 9 — Interview Preparation System ─────────────────────────────────

/**
 * Why STAR method: Industry standard that hiring managers recognize
 * and rate highly. Providing the framework (not just the answer)
 * gives users a scaffold they can personalize — more useful than
 * a canned answer they can't adapt under pressure.
 *
 * Why 3 questions to ask: Signals strategic thinking to interviewers.
 * Asking good questions is consistently cited as a differentiator
 * in hiring manager surveys.
 */
export function buildInterviewPrepPrompt(
  position: string,
  company: string,
  experienceSummary: string
): string {
  return `I have an interview for the position of ${position} at ${company}.
Give me:
1. The 8 most likely interview questions for this specific role and company culture
2. A solid STAR-method answer structure for each question using my experience
3. 3 intelligent questions I should ask that demonstrate strategic thinking and deep research into ${company}

My experience:
${experienceSummary}

Return ONLY valid JSON:
{
  "questions": [{
    "question": "string",
    "answer_framework": "string",
    "star_example": "string"
  }],
  "questions_to_ask": ["string"]
}`
}

// ── Practice Mode scoring (Feature 9) ────────────────────────────────────────

/**
 * Why score on 3 dimensions separately: Gives actionable feedback
 * rather than a single score. Users know exactly what to improve.
 */
export function buildPracticeFeedbackPrompt(
  question: string,
  userAnswer: string,
  targetPosition: string
): string {
  return `You are a senior interviewer evaluating a candidate for ${targetPosition}.
Score this interview answer on three dimensions (1-10 each) and give specific improvement advice.

Question: ${question}
Candidate's answer: ${userAnswer}

Return ONLY valid JSON:
{
  "scores": { "structure": number, "specificity": number, "impact": number },
  "overall": number,
  "strengths": ["string"],
  "improvements": ["string"],
  "improved_answer": "string"
}`
}

// ── Feature 5 — Resume Rewriter (paste/upload mode) ──────────────────────────

/**
 * Why separate from buildResumePrompt: The rewriter has NO structured
 * CareerProfile — it only has raw text + target. Mixing empty-profile JSON
 * into the prompt adds noise that can confuse Claude's rewrite logic.
 * Keeping it text-only keeps the prompt tight and the output predictable.
 */
export function buildRewriterPrompt(
  originalText: string,
  targetPosition: string,
  targetCompany: string,
  companyType: string,
  jobDescription: string
): string {
  return `Act as a senior recruiter who reviews 200 resumes a day.
Rewrite this resume for the position of ${targetPosition} at ${targetCompany}, a ${companyType}.
Replace every responsibility with a measurable achievement.
Eliminate everything generic.
Make the candidate's value impossible to ignore.
Optimize every bullet point for ATS keyword matching based on the job description provided.

ATS RULES YOU MUST ENFORCE:
- Action verbs at the start of every bullet point
- Quantify achievements with numbers/percentages wherever possible
- Use standard section headers only (Experience, Education, Skills)
- No tables, no columns in the output
- Keywords from the JD injected naturally, never stuffed

ONE-PAGE CONSTRAINT (CRITICAL — do NOT exceed these limits):
- summary: exactly 2 sentences, max 45 words total
- experience bullets: MAXIMUM 4 bullets per job entry, no exceptions
- experience entries: include at most 3 most recent jobs
- skills: MAXIMUM 12 items as a flat list
- certifications: max 3 items
- projects: max 2 projects, max 2 bullets each
- Every bullet must be one line (under 120 characters). The entire resume MUST fit on one A4 page.

ORIGINAL RESUME TEXT:
${originalText}

TARGET JOB DESCRIPTION:
${jobDescription || '(not provided — optimize for the role and company type)'}

Return ONLY valid JSON with this exact shape:
{
  "summary": "string",
  "experience": [{ "id": "string", "company": "string", "title": "string", "start": "string", "end": "string", "bullets": ["string"] }],
  "education": [{ "id": "string", "institution": "string", "degree": "string", "field": "string", "year": "string" }],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [{ "id": "string", "name": "string", "description": "string", "bullets": ["string"] }]
}`
}

// ── Experience summary helper (used by Cover Letter + Interview Prep) ─────────

export function buildExperienceSummary(profile: CareerProfile): string {
  const lines: string[] = []

  profile.experience.forEach((exp) => {
    lines.push(`${exp.title} at ${exp.company} (${exp.start}–${exp.end})`)
    exp.bullets.forEach((b) => lines.push(`  • ${b}`))
  })

  if (profile.skills.length > 0) {
    lines.push(`\nKey skills: ${profile.skills.join(', ')}`)
  }

  return lines.join('\n')
}
