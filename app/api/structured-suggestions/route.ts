import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { getIdentifier, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { adminDb } from '@/lib/firebaseAdmin'
import { callClaudeJSON } from '@/lib/claude'
import { buildStructuredSuggestionsPrompt } from '@/lib/prompts'
import type {
  CareerProfile,
  SectionAnalysis,
  StructuredSuggestion,
  SuggestionTarget,
} from '@/types'

export const runtime = 'nodejs'

type RawSuggestion = Omit<StructuredSuggestion, 'id' | 'label' | 'original'>

function generateLabel(target: SuggestionTarget, profile: CareerProfile): string {
  if (target.section === 'summary') return 'Professional Summary'
  if (target.section === 'experience') {
    const exp = profile.experience.find((e) => e.id === target.entryId)
    const name = exp ? `${exp.title} at ${exp.company}` : 'Experience'
    return `${name} — Bullet ${target.bulletIndex + 1}`
  }
  if (target.section === 'experience_title') {
    const exp = profile.experience.find((e) => e.id === target.entryId)
    const name = exp ? `${exp.title} at ${exp.company}` : 'Experience'
    return `${name} — Job Title`
  }
  if (target.section === 'skills') {
    return target.action === 'add'
      ? `Skills — Add "${target.skill}"`
      : `Skills — Replace "${target.oldSkill}"`
  }
  if (target.section === 'projects') {
    const proj = profile.projects.find((p) => p.id === target.entryId)
    return `${proj?.name ?? 'Project'} — Bullet ${target.bulletIndex + 1}`
  }
  if (target.section === 'leadership') {
    const lead = profile.leadership?.find((l) => l.id === target.entryId)
    const name = lead ? `${lead.role} at ${lead.organization}` : 'Leadership'
    return `${name} — Bullet ${target.bulletIndex + 1}`
  }
  return 'Edit'
}

function lookupOriginal(
  target: SuggestionTarget,
  profile: CareerProfile,
  summaryText: string
): string {
  if (target.section === 'summary') return summaryText
  if (target.section === 'experience') {
    return profile.experience.find((e) => e.id === target.entryId)?.bullets[target.bulletIndex] ?? ''
  }
  if (target.section === 'experience_title') {
    return profile.experience.find((e) => e.id === target.entryId)?.title ?? ''
  }
  if (target.section === 'skills') {
    return target.action === 'add' ? '' : target.oldSkill
  }
  if (target.section === 'projects') {
    return profile.projects.find((p) => p.id === target.entryId)?.bullets[target.bulletIndex] ?? ''
  }
  if (target.section === 'leadership') {
    return profile.leadership?.find((l) => l.id === target.entryId)?.bullets[target.bulletIndex] ?? ''
  }
  return ''
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

    const snap = await adminDb.doc(`users/${verifiedUser.uid}/profile/data`).get()
    if (!snap.exists) {
      return Response.json(
        { error: 'No profile found — build your resume first' },
        { status: 404 }
      )
    }
    const profile = snap.data() as CareerProfile

    const summaryText =
      profile.generated?.resume_plain?.split(/\n\n+/)[0]?.trim() ?? ''

    const sections = {
      summary: summaryText || undefined,
      experience: profile.experience.map((exp) => ({
        id: exp.id,
        title: exp.title,
        company: exp.company,
        bullets: exp.bullets,
      })),
      skills: profile.skills,
      projects: profile.projects.map((proj) => ({
        id: proj.id,
        name: proj.name,
        bullets: proj.bullets,
      })),
      leadership: profile.leadership?.map((lead) => ({
        id: lead.id,
        role: lead.role,
        organization: lead.organization,
        bullets: lead.bullets,
      })),
    }

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
      label: generateLabel(raw.target, profile),
      original: lookupOriginal(raw.target, profile, summaryText),
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
