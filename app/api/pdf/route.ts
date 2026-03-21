// Server-side PDF generation using Puppeteer — reserved for Phase 4 high-fidelity export.
// Standard export uses client-side html2pdf.js (lib/pdf.ts).
export async function POST(_req: Request) {
  // Puppeteer integration will be implemented in Phase 4.
  // Client-side html2pdf.js handles all PDF generation for now.
  return Response.json(
    { success: false, error: 'Server-side PDF generation not yet implemented. Use client-side export.' },
    { status: 501 }
  )
}
