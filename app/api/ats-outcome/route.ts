import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { getIdentifier, checkRateLimit, rateLimitResponse } from '@/lib/rateLimit'
import { adminDb } from '@/lib/firebaseAdmin'
import type { ATSOutcome } from '@/types'

export const runtime = 'nodejs'

const VALID_OUTCOMES = ['interview', 'rejected', 'no_response', 'pending'] as const

function isValidOutcome(v: string): v is ATSOutcome['outcome'] {
  return (VALID_OUTCOMES as readonly string[]).includes(v)
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') ?? '0')
    if (contentLength > 10_000) {
      return Response.json({ error: 'Request too large' }, { status: 413 })
    }

    const body = await req.json() as {
      outcomeId?: string
      jobDescription?: string
      score?: number
      sectionScores?: Record<string, number>
      outcome?: string
      createdAt?: string
    }

    if (!body.jobDescription || typeof body.score !== 'number' || !body.outcome || !body.createdAt) {
      return Response.json(
        { error: 'jobDescription, score, outcome, and createdAt are required' },
        { status: 400 }
      )
    }
    if (!isValidOutcome(body.outcome)) {
      return Response.json({ error: 'Invalid outcome value' }, { status: 400 })
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

    const outcome: ATSOutcome['outcome'] = body.outcome
    const analysisTime = new Date(body.createdAt).getTime()
    const feedbackDelayDays = isNaN(analysisTime)
      ? 0
      : Math.floor((Date.now() - analysisTime) / (1000 * 60 * 60 * 24))

    // UPDATE existing record — user changed their outcome selection
    if (body.outcomeId) {
      const ref = adminDb.doc(`users/${verifiedUser.uid}/ats-outcomes/${body.outcomeId}`)
      await ref.update({ outcome, feedbackDelayDays })
      return Response.json({ success: true, outcomeId: body.outcomeId })
    }

    // CREATE new record
    const col = adminDb.collection(`users/${verifiedUser.uid}/ats-outcomes`)
    const newRef = col.doc()

    const docData: Omit<ATSOutcome, 'id'> = {
      createdAt: body.createdAt,
      jobDescription: body.jobDescription.slice(0, 2000),
      score: body.score,
      outcome,
      feedbackDelayDays,
    }
    if (body.sectionScores) {
      docData.sectionScores = body.sectionScores
    }

    await newRef.set(docData)
    return Response.json({ success: true, outcomeId: newRef.id })
  } catch (err) {
    console.error('[ats-outcome]', err)
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save outcome' },
      { status: 500 }
    )
  }
}
