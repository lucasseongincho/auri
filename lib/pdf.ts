import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'

// Metric-compatible resume fonts (SIL OFL), inlined as data: URIs so the
// server-side Chromium never needs network access — /api/pdf blocks all
// outbound requests. Cached per page session.
const RESUME_FONTS = [
  { family: 'Tinos', weight: 400, file: 'Tinos-Regular.woff2' },
  { family: 'Tinos', weight: 700, file: 'Tinos-Bold.woff2' },
  { family: 'Arimo', weight: 400, file: 'Arimo-Regular.woff2' },
  { family: 'Arimo', weight: 700, file: 'Arimo-Bold.woff2' },
] as const

let embeddedFontsCss: Promise<string> | null = null

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)))
  }
  return btoa(binary)
}

function getEmbeddedFontsCss(): Promise<string> {
  embeddedFontsCss ??= Promise.all(
    RESUME_FONTS.map(async ({ family, weight, file }) => {
      const res = await fetch(`/fonts/${file}`)
      if (!res.ok) throw new Error(`Font ${file} failed to load (${res.status})`)
      const b64 = bufferToBase64(await res.arrayBuffer())
      return `@font-face {
  font-family: '${family}';
  font-weight: ${weight};
  font-style: normal;
  src: url('data:font/woff2;base64,${b64}') format('woff2');
  font-display: block;
}`
    })
  ).then((rules) => rules.join('\n'))
  // Don't cache a failure — let the next export retry.
  embeddedFontsCss.catch(() => { embeddedFontsCss = null })
  return embeddedFontsCss
}

/**
 * Extract the full self-contained HTML of the resume preview element so
 * the server-side Puppeteer route can render it identically to the browser.
 *
 * Why clone + inline stylesheets: Puppeteer won't have access to Next.js's
 * runtime CSS-in-JS or the dev server, so we embed every rule as a <style>
 * block. The app's own @font-face rules are dropped: their relative URLs
 * can't resolve from about:blank (they never loaded) and they add ~390 KB.
 */
export async function getResumeHTML(element: HTMLElement): Promise<string> {
  const clone = element.cloneNode(true) as HTMLElement

  clone.classList.remove('printing')
  clone.querySelectorAll('button, [data-no-print]').forEach((el) => el.remove())

  const styleSheets = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .filter((rule) => !rule.cssText.startsWith('@font-face'))
          .map((rule) => rule.cssText)
          .join('\n')
      } catch {
        // Cross-origin sheet we can't read. /api/pdf blocks network access,
        // so an @import would never load — skip it.
        return ''
      }
    })
    .join('\n')

  // Embed metric-compatible web fonts so Puppeteer renders identical character
  // widths regardless of which fonts are installed on the host OS (Linux on
  // Vercel has no Times New Roman or Arial — without this, silent font
  // substitution changes text metrics and pushes content to a second page).
  // Tinos ≡ Times New Roman metrics, Arimo ≡ Arial metrics (SIL OFL licence).
  const embeddedFonts = await getEmbeddedFontsCss()

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${embeddedFonts}
    ${styleSheets}
    body { margin: 0; padding: 0; background: white; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`
}

/**
 * POST rendered HTML to /api/pdf with the user's Firebase ID token.
 * The route requires sign-in and is rate limited (429 + Retry-After).
 */
export async function requestPdf(
  html: string,
  options: { filename: string; title?: string; author?: string }
): Promise<Response> {
  const current = auth.currentUser
  const idToken = current ? await getIdToken(current) : undefined
  return fetch('/api/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ html, ...options }),
  })
}
