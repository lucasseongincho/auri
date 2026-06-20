// PDF generation helpers — client-side only via html2pdf.js
// No server-side Puppeteer needed for standard export.
// Puppeteer route (app/api/pdf/route.ts) reserved for high-fidelity
// server-side generation if needed in Phase 4.

export interface PDFOptions {
  filename?: string
  margin?: number
  imageQuality?: number
}

/**
 * Generate a PDF from an HTML element using html2pdf.js.
 * Called client-side only — html2pdf.js is a browser library.
 *
 * Why dynamic import: html2pdf.js uses browser APIs that break
 * SSR. Dynamic import ensures it only loads in the browser context.
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default

  // Measure actual rendered content height.
  // If it exceeds A4 (297mm = ~1122px at 96dpi), use a custom page height
  // that matches the content exactly — this guarantees exactly 1 PDF page
  // regardless of how much content the template contains.
  const PX_PER_MM = 3.7795
  const LETTER_WIDTH_MM = 215.9   // 8.5in
  const LETTER_HEIGHT_MM = 279.4  // 11in
  const contentHeightMm = element.scrollHeight / PX_PER_MM
  // html2pdf.js supports [width, height] arrays at runtime but @types/html2pdf.js
  // incorrectly declares format as string only — cast to bypass the type error.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageFormat: any =
    contentHeightMm <= LETTER_HEIGHT_MM ? 'letter' : [LETTER_WIDTH_MM, Math.ceil(contentHeightMm)]

  const config = {
    margin: options.margin ?? 0,
    filename: options.filename ?? 'resume.pdf',
    image: { type: 'jpeg' as const, quality: options.imageQuality ?? 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: pageFormat,
      orientation: 'portrait' as const,
    },
  }

  await html2pdf().set(config).from(element).save()
}

/**
 * Extract the full self-contained HTML of the resume preview element so
 * the server-side Puppeteer route can render it identically to the browser.
 *
 * Why clone + inline stylesheets: Puppeteer won't have access to Next.js's
 * runtime CSS-in-JS or the dev server, so we embed every rule as a <style>
 * block. Cross-origin sheets are included via @import so Puppeteer can
 * fetch them (e.g. Google Fonts).
 */
export function getResumeHTML(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement

  clone.classList.remove('printing')
  clone.querySelectorAll('button, [data-no-print]').forEach((el) => el.remove())

  const styleSheets = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n')
      } catch {
        return sheet.href ? `@import url('${sheet.href}');` : ''
      }
    })
    .join('\n')

  // Embed metric-compatible web fonts so Puppeteer renders identical character
  // widths regardless of which fonts are installed on the host OS (Linux on
  // Vercel has no Times New Roman or Arial — without this, silent font
  // substitution changes text metrics and pushes content to a second page).
  // Tinos ≡ Times New Roman metrics, Arimo ≡ Arial metrics (SIL OFL licence).
  const origin = window.location.origin
  const embeddedFonts = `
@font-face {
  font-family: 'Tinos';
  font-weight: 400;
  font-style: normal;
  src: url('${origin}/fonts/Tinos-Regular.woff2') format('woff2');
  font-display: block;
}
@font-face {
  font-family: 'Tinos';
  font-weight: 700;
  font-style: normal;
  src: url('${origin}/fonts/Tinos-Bold.woff2') format('woff2');
  font-display: block;
}
@font-face {
  font-family: 'Arimo';
  font-weight: 400;
  font-style: normal;
  src: url('${origin}/fonts/Arimo-Regular.woff2') format('woff2');
  font-display: block;
}
@font-face {
  font-family: 'Arimo';
  font-weight: 700;
  font-style: normal;
  src: url('${origin}/fonts/Arimo-Bold.woff2') format('woff2');
  font-display: block;
}`

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
 * Extract plain text from a resume HTML element using data-ats-field
 * attributes. Returns a clean string suitable for ATS copy-paste.
 *
 * Why data-ats-field: Decouples visual styling from semantic content.
 * The ATS parser ignores all CSS and reads only the tagged fields.
 */
export function extractPlainText(resumeElement: HTMLElement): string {
  const fields = resumeElement.querySelectorAll('[data-ats-field]')
  const lines: string[] = []

  fields.forEach((field) => {
    const text = (field as HTMLElement).innerText?.trim()
    if (text) lines.push(text)
  })

  return lines.join('\n\n')
}
