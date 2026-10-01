import type { Browser } from 'puppeteer-core'
import { cleanText } from '@/lib/sanitize/invisibleChars'
import { rewritePdfInfo } from '@/lib/pdfMetadata'
import { isPdfRequestAllowed } from '@/lib/pdfNetworkPolicy'
import { getAuthenticatedUser } from '@/lib/verifyAuth'
import { checkRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rateLimit'

export const maxDuration = 30

// Inlined fonts (~105 KB base64) + app CSS (~70 KB once lib/pdf.ts drops the
// unusable @font-face rules) + document fit well under this.
const MAX_BODY_BYTES = 1_000_000
const RENDER_TIMEOUT_MS = 15_000

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
  const contentLength = parseInt(req.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
  }

  let browser: Browser | null = null
  try {
    // Sign-in required: the dashboard (the only place export exists) already
    // redirects logged-out users, so guests never reach this route legitimately.
    const verifiedUser = await getAuthenticatedUser(req)
    if (!verifiedUser) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Separate "pdf:" bucket so exports don't eat into AI-route quota. Always the
    // free-tier limit (10/min) — rendering is expensive regardless of plan.
    const { allowed, retryAfter } = await checkRateLimit(`pdf:${getIdentifier(req, verifiedUser.uid)}`, false)
    if (!allowed) return rateLimitResponse(retryAfter)

    // content-length can be absent or wrong, so measure what we actually read.
    const rawBody = await req.text()
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return Response.json({ error: 'Request too large', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
    }
    const { html: rawHtml, filename: rawFilename, title, author } = JSON.parse(rawBody) as {
      html?: string
      filename?: string
      title?: string
      author?: string
    }

    if (!rawHtml || typeof rawHtml !== 'string') {
      return Response.json({ success: false, error: 'No HTML provided' }, { status: 400 })
    }

    // Keep the filename header-safe (no quotes, CR/LF or path characters).
    const filename = (rawFilename ?? 'resume.pdf').replace(/[^\w.\-]+/g, '-').slice(0, 120) || 'resume.pdf'

    // Last line of defense: strip invisible/watermark characters from the
    // document right before Chromium renders it into the PDF text layer.
    const html = cleanText(rawHtml)

    browser = await launchBrowser()
    const page = await browser.newPage()
    page.setDefaultTimeout(RENDER_TIMEOUT_MS)
    page.setDefaultNavigationTimeout(RENDER_TIMEOUT_MS)

    // The HTML is a static DOM snapshot — no script needs to run. Disabling JS
    // also shuts off WebSocket/fetch paths that request interception can't see.
    await page.setJavaScriptEnabled(false)

    // SSRF guard: abort every request except data:/about:blank (and the empty
    // host allowlist in lib/pdfNetworkPolicy.ts).
    const blockedHosts = new Set<string>()
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (request.isInterceptResolutionHandled()) return
      const url = request.url()
      if (isPdfRequestAllowed(url)) {
        void request.continue()
      } else {
        blockedHosts.add(url.split('/')[2] ?? url.slice(0, 40))
        void request.abort('blockedbyclient')
      }
    })

    // Match the Letter-page content width exactly so there is no re-layout
    // between setContent (default 800px viewport) and the 8.5in PDF page.
    // deviceScaleFactor: 2 gives retina-quality text rendering.
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 })

    // Wait for the inlined data: fonts to decode before printing
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: RENDER_TIMEOUT_MS })

    // Generate PDF — US Letter size, no margins (resume templates handle their own padding).
    // preferCSSPageSize: true honours any @page rules in the template CSS.
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      timeout: RENDER_TIMEOUT_MS,
    })
    if (blockedHosts.size > 0) {
      console.warn(`[pdf] uid=${verifiedUser.uid} blocked requests to: ${Array.from(blockedHosts).join(', ')}`)
    }

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
  } finally {
    if (browser) await browser.close().catch(() => { /* already gone */ })
  }
}
