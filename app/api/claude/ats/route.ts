import { NextRequest } from 'next/server'
import { callClaudeJSON, buildErrorResponse, MAX_TOKENS_ANALYSIS } from '@/lib/claude'
import { buildATSScorePrompt, buildATSSectionedScorePrompt } from '@/lib/prompts'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkAndIncrementFreeUsage } from '@/lib/freeTier'
import { adminDb } from '@/lib/firebaseAdmin'
import type { ATSScore, CareerProfile } from '@/types'

export const runtime = 'nodejs'

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

    // STRUCTURED PATH: Pro user with a Firestore profile → send labeled sections so
    // Claude can detect cross-section gaps (e.g. skill listed in Skills but never
    // demonstrated in Experience bullets). Falls through to flat-text on any failure.
    let scoringPrompt = ''
    let isStructuredPath = false

    if (verifiedUser?.isPro && adminDb) {
      try {
        const snap = await adminDb.doc(`users/${verifiedUser.uid}/profile/data`).get()
        if (snap.exists) {
          const profile = snap.data() as CareerProfile
          const firstParagraph = profile.generated?.resume_plain
            ?.split(/\n\n+/)[0]
            ?.trim()
          scoringPrompt = buildATSSectionedScorePrompt(
            {
              summary: firstParagraph || undefined,
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
            },
            body.jobDescription
          )
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
