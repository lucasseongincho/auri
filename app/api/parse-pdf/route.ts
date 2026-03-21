import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return Response.json({ success: false, error: 'File must be a PDF' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ success: false, error: 'File must be under 5 MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // pdf-parse v1.1.1 — stable, exports a plain function
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>
    const parsed = await pdfParse(buffer)

    const text = parsed.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!text) {
      return Response.json(
        {
          success: false,
          error: 'No text found in this PDF. It may be image-based or exported from a design tool. Please paste your resume text directly instead.',
        },
        { status: 422 }
      )
    }

    return Response.json({ success: true, text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF parsing failed'
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
