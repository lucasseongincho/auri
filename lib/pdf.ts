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
