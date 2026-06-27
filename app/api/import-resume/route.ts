import { NextRequest } from 'next/server'
import { callClaudeJSON } from '@/lib/claude'
import { buildImportResumePrompt } from '@/lib/prompts'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'
import type { ResumeData } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') ?? '0')
    if (contentLength > 50_000) {
      return Response.json({ error: 'Request too large' }, { status: 413 })
    }

    const body = await req.json() as { resumeText?: string; jobDescription?: string }
    if (!body.resumeText?.trim()) {
      return Response.json({ error: 'resumeText is required' }, { status: 400 })
    }

    const verifiedUser = await getAuthenticatedUser(req)
    if (!verifiedUser) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const identifier = getIdentifier(req, verifiedUser.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser.isPro)
    if (!allowed) return rateLimitResponse(retryAfter)

    const prompt = buildImportResumePrompt(
      body.resumeText,
      body.jobDescription ?? ''
    )

    const { data } = await callClaudeJSON<ResumeData>(prompt, 3000)

    // Always assign fresh UUIDs — Claude returns placeholder "REPLACE_WITH_UUID" strings.
    const resumeData: ResumeData = {
      ...data,
      experience: (data.experience ?? []).map((exp) => ({ ...exp, id: crypto.randomUUID() })),
      education: (data.education ?? []).map((edu) => ({ ...edu, id: crypto.randomUUID() })),
      projects: (data.projects ?? []).map((proj) => ({ ...proj, id: crypto.randomUUID() })),
      leadership: (data.leadership ?? []).map((lead) => ({ ...lead, id: crypto.randomUUID() })),
      languages: (data.languages ?? []).map((lang) => ({ ...lang, id: crypto.randomUUID() })),
      skills: data.skills ?? [],
      certifications: data.certifications ?? [],
      templateId: 'classic-pro',
    }

    return Response.json({ success: true, resumeData })
  } catch (err) {
    console.error('[import-resume]', err)
    return Response.json(
      { success: false, error: 'Failed to parse resume structure' },
      { status: 500 }
    )
  }
}
