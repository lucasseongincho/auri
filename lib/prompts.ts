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

CRITICAL — AI ESTIMATE TAGGING RULES:
You must clearly distinguish between information the user actually provided and numbers/claims you are estimating.
For ANY number, percentage, metric, timeframe, or specific claim that the user DID NOT explicitly provide in their input — wrap it in an XML tag:
  <ai-estimate>47%</ai-estimate>
  <ai-estimate>8 engineers</ai-estimate>
  <ai-estimate>3 major product launches</ai-estimate>

Examples:
  User provided: "Managed social media accounts"
  You write: "Grew engagement by <ai-estimate>35%</ai-estimate> through strategic content planning"

  User provided: "Led a team"
  You write: "Led a team of <ai-estimate>8 engineers</ai-estimate> delivering <ai-estimate>3 major product launches</ai-estimate>"

  User provided: "Increased sales by 40%"
  You write: "Increased sales by 40%"  (no tag — user provided this number)

Rules for estimates:
→ Use conservative realistic industry averages
→ Never exaggerate or use unrealistic numbers
→ Base estimates on the role and industry context
→ It is better to underestimate than overestimate
→ If you truly cannot estimate realistically, use a range: <ai-estimate>15-20%</ai-estimate>
→ This tagging is NON-NEGOTIABLE. Every number you add must be tagged.
→ User-provided information must NEVER be tagged.

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

// ── ATS Fix (rewrite resume to improve score) ────────────────────────────────

/**
 * Why plain-text output: The improved resume is shown in an editable textarea
 * and copied as-is to clipboard — no JSON parsing needed, no formatting lost.
 *
 * Why strict "no false information" rule: Users will submit this text to employers.
 * Any invented facts are a liability. Constraint stated up front bounds generation.
 */
export function buildATSFixPrompt(
  resumeText: string,
  jobDescription: string,
  missingKeywords: string[],
  formattingIssues: string[],
  suggestions: string[]
): string {
  return `You are an ATS optimization expert and senior resume writer.

Rewrite this resume to score higher against the job description by naturally incorporating the missing keywords and fixing the issues found.

Original resume:
${resumeText}

Job description:
${jobDescription}

Missing keywords to add naturally:
${missingKeywords.length ? missingKeywords.join(', ') : 'None'}

Formatting issues to fix:
${formattingIssues.length ? formattingIssues.map((s) => `- ${s}`).join('\n') : 'None'}

Suggestions to implement:
${suggestions.length ? suggestions.map((s) => `- ${s}`).join('\n') : 'None'}

STRICT RULES:
- Add missing keywords naturally into existing bullet points — never force them awkwardly
- NEVER add false information, fake numbers, or achievements the person did not have
- Keep all facts, dates, companies, and titles exactly the same
- Only improve phrasing and keyword density
- Fix any formatting issues listed above
- Maintain the same resume structure and sections
- Return ONLY the improved resume text
- No explanations, no preamble, no commentary
- Just the clean improved resume text`
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
  return `You are a job search strategist.
I want to get a position as ${targetPosition}${sectorOrIndustry ? ` in ${sectorOrIndustry}` : ''} in ${cityOrRemote}.${companySizeOrType ? `\nFocus on ${companySizeOrType} companies.` : ''}

YOU MUST RESPOND WITH VALID JSON ONLY.
NO preamble. NO explanation. NO markdown. NO code blocks.
Your response must START with { and END with }

Return this exact JSON structure with EXACTLY 7 days and 3-5 actions per day:
{
  "overview": "One sentence summary of the strategy",
  "days": [
    {
      "day": 1,
      "theme": "Day theme title",
      "actions": [
        {
          "time": "Morning",
          "action": "Specific action to take",
          "resource": "Specific website URL or tool to use"
        }
      ]
    }
  ],
  "search_terms": ["exact search term 1", "exact search term 2", "exact search term 3"],
  "recommended_sites": [
    {
      "name": "Site name",
      "url": "https://...",
      "why": "Why this site for this specific role"
    }
  ]
}

Be specific and immediately executable. Include real URLs. No vague advice.`
}

// ── Feature 8 — Cover Letter Generator ───────────────────────────────────────

/**
 * Why "NOT I am applying for...": This is the single most common
 * cover letter mistake. Explicit negative instruction outperforms
 * "start with a hook" because it eliminates the most likely
 * failure mode directly.
 *
 * Why 3-6 flexible paragraphs: Mirrors how real cover letters are
 * written — the number of paragraphs depends on how much substantive
 * content the user's experience provides. Enables per-paragraph editing
 * in the UI and a professional letter layout.
 *
 * Why 280-300 words: Long enough to give a complete narrative,
 * short enough for a hiring manager to read in < 60 seconds.
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

WORD COUNT REQUIREMENT — THIS IS MANDATORY:
The paragraphs array MUST contain a MINIMUM of 280 words and a MAXIMUM of 300 words. Count every word before outputting. If your draft is under 280 words, expand it — add more specific detail, a concrete example, or a stronger argument. If your draft exceeds 300 words, trim it. Do NOT output a response under 280 words or over 300 words under any circumstances.

STRUCTURE REQUIREMENTS:
- Write 3 to 4 paragraphs total. The exact number should match the depth of the content needed to stay within 280-300 words.
- Paragraph 1 (opening): Begin with a powerful, memorable hook. NOT "I am applying for..." and NOT "I am writing to express my interest...". Hook the reader immediately with insight, a bold claim, or a specific result. This paragraph alone should be 55-65 words.
- Middle paragraphs (body): Connect specific experience to the company's exact needs. Be concrete — name technologies, metrics, or outcomes. These paragraphs together should be 155-175 words.
- Final paragraph (closing): A confident call to action. Express genuine enthusiasm. 45-55 words.
- Tone: human, direct, compelling. Not corporate. Not generic.

My experience:
${experienceSummary}

Job description:
${jobDescription || '(not provided — write for the role and company generally)'}

Return ONLY valid JSON with exactly these fields:
{
  "paragraphs": ["string", "string", ...],  // array of 3-6 paragraph strings, no salutation or sign-off
  "cover_letter": "string (full plain text: salutation + all paragraphs + sign-off, for copy/paste)",
  "word_count": number (count only the paragraphs, not salutation/sign-off),
  "opening_hook": "string (the first sentence of paragraph 1, for UI callout)"
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

YOU MUST RESPOND WITH VALID JSON ONLY.
NO preamble. NO explanation. NO markdown. NO code blocks. NO backticks.
START your response with { and END with }

Return this exact structure:
{
  "questions": [
    {
      "question": "string",
      "answer_framework": "string",
      "star_example": "Situation: ... Task: ... Action: ... Result: ..."
    }
  ],
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

// ── Feature 5 — Resume Rewriter (paste mode) ─────────────────────────────────

/**
 * Why separate from buildResumePrompt: The rewriter has NO structured
 * CareerProfile — it only has raw text + target. Mixing empty-profile JSON
 * into the prompt adds noise that can confuse Claude's rewrite logic.
 * Keeping it text-only keeps the prompt tight and the output predictable.
 *
 * Why extraSections + page-filling rules: Users store certifications,
 * languages, leadership, and volunteer data in their profile. The rewriter
 * should use these to fill whitespace on the page rather than padding bullets,
 * but only when those sections are toggled on by the user.
 */

interface ExtraSections {
  certifications?: unknown[] | null
  languages?: unknown[] | null
  leadership?: unknown[] | null
  volunteer?: unknown[] | null
  extras?: unknown[] | null
}

function serializeExtraSections(extra: ExtraSections): string {
  const parts: string[] = []
  if (extra.certifications?.length) {
    parts.push(`CERTIFICATIONS PROVIDED (include if page has space):\n${(extra.certifications as string[]).join('\n')}`)
  }
  if (extra.languages?.length) {
    const langs = extra.languages as Array<{ name: string; proficiency: string }>
    parts.push(`LANGUAGES PROVIDED (include if page has space):\n${langs.map((l) => `${l.name} (${l.proficiency})`).join('\n')}`)
  }
  if (extra.leadership?.length) {
    const items = extra.leadership as Array<{ role: string; organization: string; start: string; end: string; bullets?: string[] }>
    parts.push(`LEADERSHIP PROVIDED (include if page has space):\n${items.map((l) => `${l.role} at ${l.organization} (${l.start}–${l.end})`).join('\n')}`)
  }
  if (extra.volunteer?.length) {
    const items = extra.volunteer as Array<{ role: string; organization: string; description: string }>
    parts.push(`VOLUNTEER PROVIDED (include if page has space):\n${items.map((v) => `${v.role} at ${v.organization}: ${v.description}`).join('\n')}`)
  }
  return parts.join('\n\n')
}

export function buildRewriterPrompt(
  originalText: string,
  targetPosition: string,
  targetCompany: string,
  companyType: string,
  jobDescription: string,
  extraSections?: ExtraSections
): string {
  const hasExtras = extraSections && Object.values(extraSections).some((v) => v?.length)
  const extrasBlock = hasExtras ? `\n${serializeExtraSections(extraSections!)}\n` : ''

  return `Act as a senior recruiter who reviews 200 resumes a day.
Rewrite this resume for the position of ${targetPosition} at ${targetCompany}, a ${companyType}.
Replace every responsibility with a measurable achievement.
Eliminate everything generic.
Make the candidate's value impossible to ignore.
Optimize every bullet point for ATS keyword matching based on the job description provided.

CRITICAL — AI ESTIMATE TAGGING RULES:
You must clearly distinguish between information the user actually provided and numbers/claims you are estimating.
For ANY number, percentage, metric, timeframe, or specific claim that the user DID NOT explicitly provide in their input — wrap it in an XML tag:
  <ai-estimate>47%</ai-estimate>
  <ai-estimate>8 engineers</ai-estimate>
  <ai-estimate>3 major product launches</ai-estimate>

Examples:
  User provided: "Managed social media accounts"
  You write: "Grew engagement by <ai-estimate>35%</ai-estimate> through strategic content planning"

  User provided: "Led a team"
  You write: "Led a team of <ai-estimate>8 engineers</ai-estimate> delivering <ai-estimate>3 major product launches</ai-estimate>"

  User provided: "Increased sales by 40%"
  You write: "Increased sales by 40%"  (no tag — user provided this number)

Rules for estimates:
→ Use conservative realistic industry averages
→ Never exaggerate or use unrealistic numbers
→ Base estimates on the role and industry context
→ It is better to underestimate than overestimate
→ If you truly cannot estimate realistically, use a range: <ai-estimate>15-20%</ai-estimate>
→ This tagging is NON-NEGOTIABLE. Every number you add must be tagged.
→ User-provided information must NEVER be tagged.

ATS RULES YOU MUST ENFORCE:
- Action verbs at the start of every bullet point
- Quantify achievements with numbers/percentages wherever possible
- Use standard section headers only (Experience, Education, Skills)
- No tables, no columns in the output
- Keywords from the JD injected naturally, never stuffed

CRITICAL — THE REWRITTEN RESUME MUST FIT ON EXACTLY ONE A4 PAGE:

Core sections (always include):
- Header, Summary (2 sentences max, 45 words total max)
- Experience (max 3 most recent jobs, max 3 bullets each, each bullet under 120 characters)
- Education, Skills (max 12 items as a flat list)

Page filling rules — after core sections, if the page looks sparse:
${hasExtras ? extrasBlock : '- No extra sections provided — if still sparse, expand skill descriptions or add a brief projects section (max 2, max 2 bullets each)'}
- Only include extra sections if they help fill the page — never force them in if the page is already full
- If still sparse after extras → expand skill descriptions or add a brief projects section

One-page trimming rules — if content is too long:
- Trim bullets to 2 per job
- Shorten summary to 1 sentence
- Remove least relevant experience entry
- NEVER allow content to flow to a second page
- The final resume must look like a COMPLETE, full one-page professional resume

ORIGINAL RESUME TEXT:
${originalText}

TARGET JOB DESCRIPTION:
${jobDescription || '(not provided — optimize for the role and company type)'}

YOU MUST RESPOND WITH VALID JSON ONLY.
NO preamble. NO explanation. NO markdown. NO code blocks. NO backticks.
START your response with { and END with }

Return this exact JSON structure (include leadership/languages/volunteer only if you added them):
{
  "summary": "string",
  "experience": [{ "id": "string", "company": "string", "title": "string", "start": "string", "end": "string", "bullets": ["string"] }],
  "education": [{ "id": "string", "institution": "string", "degree": "string", "field": "string", "year": "string" }],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [{ "id": "string", "name": "string", "description": "string", "bullets": ["string"] }],
  "leadership": [{ "id": "string", "role": "string", "organization": "string", "start": "string", "end": "string", "bullets": ["string"] }],
  "languages": [{ "id": "string", "name": "string", "proficiency": "string" }],
  "volunteer": [{ "id": "string", "role": "string", "organization": "string", "date": "string", "description": "string" }]
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
