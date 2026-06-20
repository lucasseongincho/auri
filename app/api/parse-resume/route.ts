import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { analyzeResumeText } from '@/lib/ats/parser'

export const runtime = 'nodejs'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  try {
    const verifiedUser = await getAuthenticatedUser(req)
    if (!verifiedUser) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!verifiedUser.isPro) {
      return Response.json({ error: 'Pro subscription required' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('resume') as File | null

    if (!file || file.size === 0) {
      return Response.json({ error: 'No PDF file provided' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json(
        { error: 'File exceeds 5 MB limit — please use a smaller PDF.' },
        { status: 413 }
      )
    }
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return Response.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Import internal lib file directly — bypasses the debug-mode check in pdf-parse's
    // index.js that reads a test PDF file at runtime, causing ENOENT in Vercel deploys.
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
    const parsed = await pdfParse(buffer)
    const extractedText: string = parsed.text

    const result = analyzeResumeText(extractedText)

    return Response.json({ success: true, data: result })
  } catch (err) {
    console.error('[parse-resume]', err)
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Parsing failed' },
      { status: 500 }
    )
  }
}
