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

    // pdfjs-dist (used internally by pdf-parse) requires DOMMatrix which doesn't
    // exist in the Node.js serverless runtime — polyfill it before importing.
    if (typeof globalThis.DOMMatrix === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(globalThis as any).DOMMatrix = class DOMMatrix {
        // pdfjs only reads numeric properties off DOMMatrix; return 0 for all
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor() { return new Proxy(this, { get: (_t, _p) => 0 }) }
      }
    }

    // Dynamic import avoids issues with pdf-parse's test-file side-effect on import.
    // In some bundler configs the module exposes .default instead of being directly callable.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('pdf-parse')
    const pdfParse = (typeof mod === 'function' ? mod : mod.default) as (buf: Buffer) => Promise<{ text: string }>
    const parsed = await pdfParse(buffer)

    const text = parsed.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!text) {
      return Response.json(
        { success: false, error: 'Could not extract text from this PDF. Try pasting the text directly.' },
        { status: 422 }
      )
    }

    return Response.json({ success: true, text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF parsing failed'
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
