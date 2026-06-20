import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

export const maxDuration = 30

// chromium-min does not bundle the binary — it is fetched at request time from a
// remote URL. CHROMIUM_REMOTE_EXEC_PATH can be set in Vercel env vars to override
// the default (e.g. when a new chromium version is released without a code change).
// For local development, set CHROMIUM_EXECUTABLE_PATH to your local Chrome path.
const CHROMIUM_REMOTE_URL =
  process.env.CHROMIUM_REMOTE_EXEC_PATH ??
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.tar'

export async function POST(req: Request) {
  try {
    const { html, filename = 'resume.pdf' } = await req.json() as {
      html: string
      filename: string
    }

    if (!html) {
      return Response.json({ success: false, error: 'No HTML provided' }, { status: 400 })
    }

    const executablePath = process.env.VERCEL
      ? await chromium.executablePath(CHROMIUM_REMOTE_URL)
      : (process.env.CHROMIUM_EXECUTABLE_PATH ?? await chromium.executablePath())

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()

    // Set content and wait for fonts/images to load
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate PDF — US Letter size, no margins (resume templates handle their own padding)
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    await browser.close()

    const pdfBuffer = Buffer.from(pdf)

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[pdf] Puppeteer render failed:', message)
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
