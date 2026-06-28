import { NextRequest } from 'next/server'
import { callClaudeJSON, buildErrorResponse, MAX_TOKENS_ANALYSIS } from '@/lib/claude'
import { buildATSScorePrompt, buildATSSectionedScorePrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkAndIncrementFreeUsage } from '@/lib/freeTier'
import { adminDb } from '@/lib/firebaseAdmin'
import type { ATSScore, CareerProfile, ResumeData, SavedResume } from '@/types'

export const runtime = 'nodejs'

type ScoringSection = Parameters<typeof buildATSSectionedScorePrompt>[0]

function extractSectionsFromResumeData(data: ResumeData): ScoringSection {
  return {
    summary: data.summary || undefined,
    experience: data.experience.map((exp) => ({
      title: exp.title,
      company: exp.company,
      start: exp.start,
      end: exp.end,
      bullets: exp.bullets,
    })),
    skills: data.skills,
    projects: (data.projects ?? []).map((proj) => ({
      name: proj.name,
      bullets: proj.bullets,
    })),
    education: (data.education ?? []).map((edu) => ({
      degree: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`,
      institution: edu.institution,
      year: edu.year,
    })),
    leadership: (data.leadership ?? []).map((lead) => ({
      role: lead.role,
      organization: lead.organization,
      bullets: lead.bullets,
    })),
  }
}

function extractSectionsFromCareerProfile(profile: CareerProfile): ScoringSection {
  return {
    summary: profile.generated?.resume_plain?.split(/\n\n+/)[0]?.trim() || undefined,
    experience: profile.experience.map((exp) => ({
      title: exp.title,
      company: exp.company,
      start: exp.start,
      end: exp.end,
      bullets: exp.bullets,
    })),
    skills: profile.skills,
    projects: profile.projects.map((proj) => ({
      name: proj.name,
      bullets: proj.bullets,
    })),
    education: profile.education.map((edu) => ({
      degree: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`,
      institution: edu.institution,
      year: edu.year,
    })),
    leadership: profile.leadership?.map((lead) => ({
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
      return Response.json({ error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
    }
    const body = await req.json() as {
      resumePlainText?: string
      resumeText?: string
      jobDescription: string
      uid?: string
      isPro?: boolean
      resumeId?: string
      resumeData?: ResumeData
    }

    // Server-side auth + rate limiting (guests allowed — fall back to IP rate limit)
    const verifiedUser = await getAuthenticatedUser(req)
    const identifier = getIdentifier(req, verifiedUser?.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser?.isPro ?? false)
    if (!allowed) return rateLimitResponse(retryAfter)

    // Free tier monthly limit (authenticated non-pro users only)
    if (verifiedUser && !verifiedUser.isPro) {
      const freeTier = await checkAndIncrementFreeUsage(verifiedUser.uid)
      if (!freeTier.allowed) {
        return Response.json({
          success: false,
          error: 'FREE_TIER_LIMIT_REACHED',
          message: 'You have used all 3 free generations this month. Upgrade to Pro for unlimited access.',
          used: freeTier.used,
          limit: freeTier.limit,
        }, { status: 403 })
      }
    }

    if (!body.jobDescription) {
      return buildErrorResponse('jobDescription is required', 400)
    }

    // STRUCTURED PATH: Pro user → send labeled sections so Claude can detect cross-section
    // gaps. When resumeId is provided, read from the saved resume; otherwise fall back to
    // the career profile. Falls through to flat-text on any failure.
    let scoringPrompt = ''
    let isStructuredPath = false

    if (verifiedUser?.isPro && adminDb) {
      try {
        let sections: ScoringSection | null = null

        if (body.resumeData) {
          sections = extractSectionsFromResumeData(body.resumeData)
        } else if (body.resumeId) {
          const snap = await adminDb
            .doc(`users/${verifiedUser.uid}/resumes/${body.resumeId}`)
            .get()
          if (!snap.exists) {
            return Response.json({ error: 'Resume not found' }, { status: 404 })
          }
          const saved = snap.data() as Omit<SavedResume, 'id'>
          sections = extractSectionsFromResumeData(saved.resumeData)
        } else {
          const snap = await adminDb
            .doc(`users/${verifiedUser.uid}/profile/data`)
            .get()
          if (snap.exists) {
            sections = extractSectionsFromCareerProfile(snap.data() as CareerProfile)
          }
        }

        if (sections) {
          scoringPrompt = buildATSSectionedScorePrompt(sections, body.jobDescription)
          isStructuredPath = true
        }
      } catch {
        // fall through to flat-text path
      }
    }

    // FLAT-TEXT PATH: guests, free users, or structured path fallback
    if (!scoringPrompt) {
      const resumePlainText = body.resumePlainText ?? body.resumeText ?? ''
      if (!resumePlainText) {
        return buildErrorResponse('resumePlainText and jobDescription are required', 400)
      }
      scoringPrompt = buildATSScorePrompt(resumePlainText, body.jobDescription)
    }

    // Sectioned path returns 6 sections × (strengths + gaps + suggestions) arrays —
    // significantly more tokens than the flat-text schema. 4000 gives safe headroom.
    const scoringMaxTokens = isStructuredPath ? 4000 : MAX_TOKENS_ANALYSIS
    const { data, inputTokens, outputTokens } = await callClaudeJSON<ATSScore>(scoringPrompt, scoringMaxTokens)

    return Response.json({
      success: true,
      data,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    })
  } catch (err) {
    return buildErrorResponse(err instanceof Error ? err.message : 'ATS scoring failed')
  }
}
