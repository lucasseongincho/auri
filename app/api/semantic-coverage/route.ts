import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { getIdentifier, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { adminDb } from '@/lib/firebaseAdmin'
import { embedTexts } from '@/lib/embeddings/voyage'
import { getCachedEmbeddings, setCachedEmbeddings } from '@/lib/embeddings/cache'
import { parseJDRequirements, flattenResumeBullets, computeCoverage } from '@/lib/embeddings/matching'
import type { CareerProfile } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') ?? '0')
    if (contentLength > 50_000) {
      return Response.json({ error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
    }

    const body = (await req.json()) as { jobDescription: string }
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

    const snap = await adminDb.doc(`users/${verifiedUser.uid}/profile/data`).get()
    if (!snap.exists) {
      return Response.json(
        { error: 'No profile found — build your resume first' },
        { status: 404 }
      )
    }
    const profile = snap.data() as CareerProfile

    const jdRequirements = parseJDRequirements(body.jobDescription)
    const resumeBullets = flattenResumeBullets(profile)

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
