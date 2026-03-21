// Server-side PDF generation using Puppeteer — reserved for Phase 4 high-fidelity export.
// Standard export uses client-side html2pdf.js (lib/pdf.ts).
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  // Puppeteer integration will be implemented in Phase 4.
  // Client-side html2pdf.js handles all PDF generation for now.
  return Response.json(
    { success: false, error: 'Server-side PDF generation not yet implemented. Use client-side export.' },
    { status: 501 }
  )
}
