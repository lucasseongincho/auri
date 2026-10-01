import type { Browser } from 'puppeteer-core'
import { cleanText } from '@/lib/sanitize/invisibleChars'
import { rewritePdfInfo } from '@/lib/pdfMetadata'

export const maxDuration = 30

// Remote URL for @sparticuz/chromium-min binary — only fetched in production.
// Override via CHROMIUM_REMOTE_EXEC_PATH env var if a newer release is needed
// without a code change.
const CHROMIUM_REMOTE_URL =
  process.env.CHROMIUM_REMOTE_EXEC_PATH ??
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar'

// True on Vercel and in `next start` (post-build preview). False during `next dev`.
const IS_PRODUCTION = !!process.env.VERCEL || process.env.NODE_ENV === 'production'

// Launch Puppeteer with the correct Chromium source for the current environment:
// - Production (Vercel): @sparticuz/chromium-min fetches a remote binary at
//   request time — avoids bundling a 170 MB binary into the lambda.
// - Local dev: full `puppeteer` package (devDependency) uses its own bundled
//   Chromium — no remote fetch, works offline.
// Explicitly typed as puppeteer-core's Browser so all downstream page.* calls
// are validated against the production type definitions.
async function launchBrowser(): Promise<Browser> {
  if (IS_PRODUCTION) {
    const chromium = (await import('@sparticuz/chromium-min')).default
    const { launch } = await import('puppeteer-core')
    const executablePath = await chromium.executablePath(CHROMIUM_REMOTE_URL)
    return launch({ args: chromium.args, executablePath, headless: true })
  }
  // puppeteer@25 ships its own Browser class based on a newer puppeteer-core;
  // it is structurally identical at runtime. Cast through unknown to satisfy the
  // puppeteer-core@24 Browser type used by the rest of this function.
  const { launch } = await import('puppeteer')
  return launch({ headless: true }) as unknown as Browser
}

export async function POST(req: Request) {
  try {
    const { html: rawHtml, filename = 'resume.pdf', title, author } = await req.json() as {
      html: string
      filename: string
      title?: string
      author?: string
    }

    if (!rawHtml) {
      return Response.json({ success: false, error: 'No HTML provided' }, { status: 400 })
    }

    // Last line of defense: strip invisible/watermark characters from the
    // document right before Chromium renders it into the PDF text layer.
    const html = cleanText(rawHtml)

    const browser = await launchBrowser()
    const page = await browser.newPage()

    // Match the Letter-page content width exactly so there is no re-layout
    // between setContent (default 800px viewport) and the 8.5in PDF page.
    // deviceScaleFactor: 2 gives retina-quality text rendering.
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 })

    // Set content and wait for fonts/images (including @font-face fetches) to load
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate PDF — US Letter size, no margins (resume templates handle their own padding).
    // preferCSSPageSize: true honours any @page rules in the template CSS.
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    await browser.close()

    // Chromium writes Title "about:blank", Creator = the HeadlessChrome
    // user-agent and Producer "Skia/PDF". Replace with our own metadata; if the
    // file layout is one we don't rewrite, ship the original rather than fail.
    const rewritten = rewritePdfInfo(pdf, {
      title: cleanText(title ?? '') || filename.replace(/\.pdf$/i, ''),
      author: author ? cleanText(author) : undefined,
    })
    if (!rewritten) console.warn('[pdf] Metadata rewrite skipped: unsupported PDF structure')
    const pdfBuffer = Buffer.from(rewritten ?? pdf)

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
