import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { getIdentifier, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { adminDb } from '@/lib/firebaseAdmin'
import { embedTexts } from '@/lib/embeddings/voyage'
import { getCachedEmbeddings, setCachedEmbeddings } from '@/lib/embeddings/cache'
import { parseJDRequirements, flattenResumeBullets, computeCoverage } from '@/lib/embeddings/matching'
import type { CareerProfile, ResumeData, SavedResume } from '@/types'

export const runtime = 'nodejs'

function flattenResumeDataBullets(data: ResumeData): string[] {
  const bullets: string[] = []

  for (const exp of data.experience ?? []) {
    for (const b of exp.bullets ?? []) {
      const t = b.trim()
      if (t.length >= 10) bullets.push(t)
    }
  }

  for (const skill of data.skills ?? []) {
    const t = skill.trim()
    if (t.length >= 10) bullets.push(t)
  }

  for (const proj of data.projects ?? []) {
    const desc = proj.description?.trim()
    if (desc && desc.length >= 10) bullets.push(desc)
    for (const b of proj.bullets ?? []) {
      const t = b.trim()
      if (t.length >= 10) bullets.push(t)
    }
  }

  for (const lead of data.leadership ?? []) {
    for (const b of lead.bullets ?? []) {
      const t = b.trim()
      if (t.length >= 10) bullets.push(t)
    }
  }

  for (const lang of data.languages ?? []) {
    const name = lang.name?.trim()
    const proficiency = lang.proficiency?.trim()
    if (name && proficiency) {
      bullets.push(`${name} language proficiency: ${proficiency}`)
    }
  }

  return bullets
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') ?? '0')
    if (contentLength > 50_000) {
      return Response.json({ error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
    }

    const body = (await req.json()) as { jobDescription: string; resumeId?: string }
    if (!body.jobDescription?.trim()) {
      return Response.json({ error: 'jobDescription is required' }, { status: 400 })
    }

    const verifiedUser = await getAuthenticatedUser(req)
    if (!verifiedUser) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const identifier = getIdentifier(req, verifiedUser.uid)
    const { allowed, retryAfter } = await checkRateLimit(identifier, verifiedUser.isPro)
    if (!allowed) return rateLimitResponse(retryAfter)

    if (!adminDb) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 })
    }

    let resumeBullets: string[]

    if (body.resumeId) {
      const snap = await adminDb
        .doc(`users/${verifiedUser.uid}/resumes/${body.resumeId}`)
        .get()
      if (!snap.exists) {
        return Response.json(
          { error: 'Saved resume not found — it may have been deleted' },
          { status: 404 }
        )
      }
      const savedResume = snap.data() as Omit<SavedResume, 'id'>
      resumeBullets = flattenResumeDataBullets(savedResume.resumeData)
    } else {
      const snap = await adminDb.doc(`users/${verifiedUser.uid}/profile/data`).get()
      if (!snap.exists) {
        return Response.json(
          { error: 'No profile found — build your resume first' },
          { status: 404 }
        )
      }
      resumeBullets = flattenResumeBullets(snap.data() as CareerProfile)
    }

    const jdRequirements = parseJDRequirements(body.jobDescription)

    if (jdRequirements.length === 0 || resumeBullets.length === 0) {
      return Response.json({ success: true, data: [] })
    }

    // JD vectors — check cache first
    let jdVectors = await getCachedEmbeddings(jdRequirements, 'query')
    const jdCacheHit = jdVectors !== null
    if (!jdVectors) {
      jdVectors = await embedTexts(jdRequirements, 'query')
      await setCachedEmbeddings(jdRequirements, 'query', jdVectors)
    }

    // Resume vectors — check cache first
    let resumeVectors = await getCachedEmbeddings(resumeBullets, 'document')
    const resumeCacheHit = resumeVectors !== null
    if (!resumeVectors) {
      resumeVectors = await embedTexts(resumeBullets, 'document')
      await setCachedEmbeddings(resumeBullets, 'document', resumeVectors)
    }

    console.log(
      `[semantic-coverage] jd=${jdCacheHit ? 'hit' : 'miss'} resume=${resumeCacheHit ? 'hit' : 'miss'} reqs=${jdRequirements.length} bullets=${resumeBullets.length}`
    )

    const coverage = computeCoverage(jdRequirements, jdVectors, resumeBullets, resumeVectors)

    return Response.json({ success: true, data: coverage })
  } catch (err) {
    console.error('[semantic-coverage]', err)
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Semantic analysis failed' },
      { status: 500 }
    )
  }
}
