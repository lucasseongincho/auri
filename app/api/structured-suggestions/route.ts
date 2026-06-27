import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { getIdentifier, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { adminDb } from '@/lib/firebaseAdmin'
import { callClaudeJSON } from '@/lib/claude'
import { buildStructuredSuggestionsPrompt } from '@/lib/prompts'
import type {
  CareerProfile,
  ResumeData,
  SavedResume,
  SectionAnalysis,
  StructuredSuggestion,
  SuggestionTarget,
} from '@/types'

export const runtime = 'nodejs'

type RawSuggestion = Omit<StructuredSuggestion, 'id' | 'label' | 'original'>

// Minimal shape needed by generateLabel / lookupOriginal — satisfied by both
// CareerProfile and ResumeData so either source can be used without casts.
type ResumeForSuggestions = {
  experience: CareerProfile['experience']
  skills: CareerProfile['skills']
  projects: CareerProfile['projects']
  leadership: CareerProfile['leadership']
}

function generateLabel(target: SuggestionTarget, resume: ResumeForSuggestions): string {
  if (target.section === 'summary') return 'Professional Summary'
  if (target.section === 'experience') {
    const exp = resume.experience.find((e) => e.id === target.entryId)
    const name = exp ? `${exp.title} at ${exp.company}` : 'Experience'
    return `${name} — Bullet ${target.bulletIndex + 1}`
  }
  if (target.section === 'experience_title') {
    const exp = resume.experience.find((e) => e.id === target.entryId)
    const name = exp ? `${exp.title} at ${exp.company}` : 'Experience'
    return `${name} — Job Title`
  }
  if (target.section === 'skills') {
    return target.action === 'add'
      ? `Skills — Add "${target.skill}"`
      : `Skills — Replace "${target.oldSkill}"`
  }
  if (target.section === 'projects') {
    const proj = resume.projects.find((p) => p.id === target.entryId)
    return `${proj?.name ?? 'Project'} — Bullet ${target.bulletIndex + 1}`
  }
  if (target.section === 'leadership') {
    const lead = resume.leadership?.find((l) => l.id === target.entryId)
    const name = lead ? `${lead.role} at ${lead.organization}` : 'Leadership'
    return `${name} — Bullet ${target.bulletIndex + 1}`
  }
  return 'Edit'
}

function lookupOriginal(
  target: SuggestionTarget,
  resume: ResumeForSuggestions,
  summaryText: string
): string {
  if (target.section === 'summary') return summaryText
  if (target.section === 'experience') {
    return resume.experience.find((e) => e.id === target.entryId)?.bullets[target.bulletIndex] ?? ''
  }
  if (target.section === 'experience_title') {
    return resume.experience.find((e) => e.id === target.entryId)?.title ?? ''
  }
  if (target.section === 'skills') {
    return target.action === 'add' ? '' : target.oldSkill
  }
  if (target.section === 'projects') {
    return resume.projects.find((p) => p.id === target.entryId)?.bullets[target.bulletIndex] ?? ''
  }
  if (target.section === 'leadership') {
    return resume.leadership?.find((l) => l.id === target.entryId)?.bullets[target.bulletIndex] ?? ''
  }
  return ''
}

function buildSections(summary: string | undefined, resume: ResumeForSuggestions) {
  return {
    summary: summary || undefined,
    experience: resume.experience.map((exp) => ({
      id: exp.id,
      title: exp.title,
      company: exp.company,
      bullets: exp.bullets,
    })),
    skills: resume.skills,
    projects: resume.projects.map((proj) => ({
      id: proj.id,
      name: proj.name,
      bullets: proj.bullets,
    })),
    leadership: resume.leadership?.map((lead) => ({
      id: lead.id,
      role: lead.role,
      organization: lead.organization,
      bullets: lead.bullets,
    })),
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') ?? '0')
    if (contentLength > 50_000) {
      return Response.json({ error: 'Request too large' }, { status: 413 })
    }

    const body = await req.json() as {
      jobDescription?: string
      missingKeywords?: string[]
      sectionAnalysis?: SectionAnalysis[]
      resumeId?: string
    }

    if (!body.jobDescription?.trim()) {
      return Response.json({ error: 'jobDescription is required' }, { status: 400 })
    }

    const verifiedUser = await getAuthenticatedUser(req)
    if (!verifiedUser) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!verifiedUser.isPro) {
      return Response.json({ error: 'Pro subscription required' }, { status: 403 })
    }

    const identifier = getIdentifier(req, verifiedUser.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser.isPro)
    if (!allowed) return rateLimitResponse(retryAfter)

    if (!adminDb) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 })
    }

    let resumeForSuggestions: ResumeForSuggestions
    let summaryText: string

    if (body.resumeId) {
      // Saved resume path — read from users/{uid}/resumes/{resumeId}
      const snap = await adminDb.doc(`users/${verifiedUser.uid}/resumes/${body.resumeId}`).get()
      if (!snap.exists) {
        return Response.json(
          { error: 'Saved resume not found — it may have been deleted' },
          { status: 404 }
        )
      }
      const savedResume = snap.data() as Omit<SavedResume, 'id'>
      const resumeData: ResumeData = savedResume.resumeData
      resumeForSuggestions = {
        experience: resumeData.experience,
        skills: resumeData.skills,
        projects: resumeData.projects,
        leadership: resumeData.leadership,
      }
      summaryText = resumeData.summary ?? ''
    } else {
      // Career profile path — read from users/{uid}/profile/data
      const snap = await adminDb.doc(`users/${verifiedUser.uid}/profile/data`).get()
      if (!snap.exists) {
        return Response.json(
          { error: 'No profile found — build your resume first' },
          { status: 404 }
        )
      }
      const profile = snap.data() as CareerProfile
      resumeForSuggestions = {
        experience: profile.experience,
        skills: profile.skills,
        projects: profile.projects,
        leadership: profile.leadership,
      }
      summaryText =
        profile.generated?.resume_plain?.split(/\n\n+/)[0]?.trim() ?? ''
    }

    const sections = buildSections(summaryText, resumeForSuggestions)

    const prompt = buildStructuredSuggestionsPrompt(
      sections,
      body.jobDescription,
      body.missingKeywords ?? [],
      body.sectionAnalysis ?? []
    )

    const { data } = await callClaudeJSON<RawSuggestion[]>(prompt, 2000)

    if (!Array.isArray(data)) {
      return Response.json(
        { success: false, error: 'Failed to generate suggestions' },
        { status: 500 }
      )
    }

    const suggestions: StructuredSuggestion[] = data.map((raw) => ({
      id: crypto.randomUUID(),
      target: raw.target,
      label: generateLabel(raw.target, resumeForSuggestions),
      original: lookupOriginal(raw.target, resumeForSuggestions, summaryText),
      suggested: raw.suggested,
      reason: raw.reason,
    }))

    return Response.json({ success: true, suggestions })
  } catch (err) {
    console.error('[structured-suggestions]', err)
    return Response.json(
      { success: false, error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
