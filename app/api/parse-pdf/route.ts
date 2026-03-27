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

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt')
    const isDoc = file.name.endsWith('.doc') || file.name.endsWith('.docx')

    if (!validTypes.includes(file.type) && !isPdf && !isTxt && !isDoc) {
      return Response.json(
        { success: false, error: 'Please upload a PDF, Word (.doc, .docx), or text file' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let extractedText = ''

    if (isPdf) {
      // Use lib path directly — avoids the ENOENT test-runner bug in Next.js
      // (require('pdf-parse') triggers its test suite; the lib path does not)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string; numpages: number }>
      const parsed = await pdfParse(buffer)
      extractedText = parsed.text

      console.log('PDF parsed successfully:', {
        pages: parsed.numpages,
        textLength: extractedText.length,
      })
    } else if (isTxt) {
      extractedText = buffer.toString('utf-8')
    } else {
      // .doc / .docx — best-effort ASCII extraction
      extractedText = buffer
        .toString('utf-8')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\f/g, '\n')
      .trim()

    if (!extractedText || extractedText.length < 50) {
      return Response.json(
        {
          success: false,
          error:
            'No text found in this file. It may be a scanned PDF or image-based document. Please paste your resume text in the Paste Text tab instead.',
        },
        { status: 422 }
      )
    }

    return Response.json({
      success: true,
      text: extractedText,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      charCount: extractedText.length,
    })
  } catch (err) {
    console.error('PDF parse error:', err)
    const message = err instanceof Error ? err.message : 'File parsing failed'
    return Response.json(
      {
        success: false,
        error: `${message}. Please try again or paste your resume text instead.`,
      },
      { status: 500 }
    )
  }
}
