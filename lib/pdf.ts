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
  const A4_HEIGHT_MM = 297
  const contentHeightMm = element.scrollHeight / PX_PER_MM
  // html2pdf.js supports [width, height] arrays at runtime but @types/html2pdf.js
  // incorrectly declares format as string only — cast to bypass the type error.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageFormat: any =
    contentHeightMm <= A4_HEIGHT_MM ? 'a4' : [210, Math.ceil(contentHeightMm)]

  const config = {
    margin: options.margin ?? 0,
    filename: options.filename ?? 'resume.pdf',
    image: { type: 'jpeg', quality: options.imageQuality ?? 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: pageFormat,
      orientation: 'portrait',
    },
  }

  await html2pdf().set(config).from(element).save()
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
