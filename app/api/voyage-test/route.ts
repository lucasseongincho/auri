// TEMPORARY — delete this route before launch.
// Used only during local development to verify the Voyage embedding client.
// URL: GET /api/voyage-test
// Note: Next.js App Router treats _-prefixed folders as private (non-routed),
// so this lives at /api/voyage-test rather than /api/_voyage-test.

import { NextRequest } from 'next/server'
import { embedTexts } from '@/lib/embeddings/voyage'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const vectors = await embedTexts(
      ['Software engineer with 5 years of experience', 'Senior frontend developer role'],
      'document'
    )

    return Response.json({
      ok: true,
      dims: vectors[0]?.length ?? 0,
      count: vectors.length,
    })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
