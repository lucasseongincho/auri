// Verifies lib/pdfMetadata.ts against real Chromium (Puppeteer) and jsPDF output.
// Run with: node --test scripts/test-pdf-metadata.ts
// Set PDF_OUT_DIR to keep the generated before/after PDFs for inspection.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'
import { jsPDF } from 'jspdf'
import { rewritePdfInfo } from '../lib/pdfMetadata.ts'

const LEAK = /Skia|Chrom|Mozilla|AppleWebKit|jsPDF|about:blank|Claude|Anthropic/i

function latin1(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return s
}

function readPdfInfo(pdf: Uint8Array): Record<string, string> {
  const bin = latin1(pdf)
  const ref = /\/Info\s+(\d+)\s+(\d+)\s+R/.exec(bin.slice(bin.lastIndexOf('trailer')))
  if (!ref) return {}
  const start = bin.lastIndexOf(`\n${ref[1]} ${ref[2]} obj`)
  const body = bin.slice(start, bin.indexOf('endobj', start))
  const result: Record<string, string> = {}
  const re = /\/(\w+)\s*(\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f]*>)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const raw = m[2]
    if (raw.startsWith('(')) {
      result[m[1]] = raw.slice(1, -1).replace(/\\(.)/g, '$1')
    } else {
      const hex = raw.slice(5, -1) // skip "<FEFF"
      let s = ''
      for (let i = 0; i < hex.length; i += 4) s += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16))
      result[m[1]] = s
    }
  }
  return result
}

// Every xref offset must point at "N G obj" and startxref at "xref".
function assertXrefValid(pdf: Uint8Array): void {
  const bin = latin1(pdf)
  const sx = Number(/startxref\s+(\d+)/.exec(bin.slice(bin.lastIndexOf('startxref')))?.[1])
  assert.ok(bin.startsWith('xref', sx), 'startxref points at xref')
  const body = bin.slice(sx + 4, bin.indexOf('trailer', sx)).trim().split(/\s*\n\s*/)
  let i = 0
  while (i < body.length) {
    const [start, count] = body[i].split(' ').map(Number)
    for (let k = 0; k < count; k++) {
      const [off, gen, type] = body[i + 1 + k].split(' ')
      if (type === 'n') {
        assert.ok(bin.startsWith(`${start + k} ${Number(gen)} obj`, Number(off)), `object ${start + k} offset`)
      }
    }
    i += count + 1
  }
}

function save(name: string, bytes: Uint8Array): void {
  const dir = process.env.PDF_OUT_DIR
  if (dir) fs.writeFileSync(path.join(dir, name), bytes)
}

test('Chromium PDF: metadata replaced, generator strings gone, xref intact', async () => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent('<html><body><h1>조성인 Jane Doe</h1><p>Senior Engineer</p></body></html>')
  const before = new Uint8Array(await page.pdf({ format: 'Letter' }))
  await browser.close()

  console.log('Chromium BEFORE:', readPdfInfo(before))
  save('chromium-before.pdf', before)

  const after = rewritePdfInfo(before, { title: 'Resume - 조성인 (Jane) Doe', author: '조성인 (Jane) Doe' })
  assert.ok(after, 'rewrite supported')
  save('chromium-after.pdf', after)
  const info = readPdfInfo(after)
  console.log('Chromium AFTER:', info)

  assert.equal(info.Title, 'Resume - 조성인 (Jane) Doe')
  assert.equal(info.Author, '조성인 (Jane) Doe')
  assert.equal(info.Creator, 'AURI')
  assert.equal(info.Producer, 'AURI')
  assert.doesNotMatch(latin1(after), LEAK)
  assertXrefValid(after)
})

test('jsPDF output: Producer no longer says jsPDF', () => {
  const doc = new jsPDF()
  doc.text('Interview prep', 10, 10)
  const before = new Uint8Array(doc.output('arraybuffer'))
  console.log('jsPDF BEFORE:', readPdfInfo(before))

  const after = rewritePdfInfo(before, { title: 'Interview Prep - Acme' })
  assert.ok(after, 'rewrite supported')
  const info = readPdfInfo(after)
  console.log('jsPDF AFTER:', info)
  assert.equal(info.Producer, 'AURI')
  assert.equal(info.Author, undefined)
  assert.doesNotMatch(latin1(after), LEAK)
  assertXrefValid(after)
})

test('unsupported structure returns null instead of corrupting', () => {
  assert.equal(rewritePdfInfo(new TextEncoder().encode('not a pdf'), { title: 'x' }), null)
})
