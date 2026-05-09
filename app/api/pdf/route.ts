// @ts-ignore — @sparticuz/chromium ships its own types; suppress the missing declaration warning
import Chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export const maxDuration = 30 // Vercel max for hobby plan

export async function POST(req: Request) {
  try {
    const { html, filename = 'resume.pdf' } = await req.json() as {
      html: string
      filename: string
    }

    if (!html) {
      return Response.json({ success: false, error: 'No HTML provided' }, { status: 400 })
    }

    const browser = await puppeteer.launch({
      // @ts-ignore — Chromium.args is a static getter on the class
      args: Chromium.args,
      // @ts-ignore — Chromium.executablePath is a static async method
      executablePath: await Chromium.executablePath(),
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
    console.error('PDF generation error:', err)
    return Response.json(
      { success: false, error: 'PDF generation failed' },
      { status: 500 }
    )
  }
}
