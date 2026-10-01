/**
 * Rewrites a PDF's document Info dictionary (Title / Author / Creator / Producer).
 *
 * Why: neither PDF engine we use lets us set this. Puppeteer/Chromium writes
 * Title "about:blank", Creator = the full HeadlessChrome user-agent string and
 * Producer "Skia/PDF mNNN"; jsPDF (html2pdf.js) hard-codes Producer "jsPDF x.y".
 * Rather than add a PDF dependency, we replace the Info object in place and
 * rebuild the classic cross-reference table with shifted offsets.
 *
 * Isomorphic (server + browser) and free of `@/` imports so it can be tested
 * directly with Node. Returns null when the file uses a structure we don't
 * rewrite (xref streams, incremental updates, encryption) — callers then keep
 * the original bytes. Callers pass already-sanitized title/author values.
 */

export interface PdfMetadata {
  title: string
  author?: string
}

export const PDF_PRODUCER = 'AURI'

// Bytes <-> "binary string" (one char per byte, codes 0–255). TextDecoder's
// "latin1" is really windows-1252 and would corrupt 0x80–0x9F, so do it by hand.
function bytesToBinary(bytes: Uint8Array): string {
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)))
  }
  return s
}

function binaryToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff
  return out
}

// ASCII-printable values go in a literal string; anything else (e.g. a Korean
// name) is written as UTF-16BE with a BOM in a hex string, per PDF 1.7 §7.9.2.2.
function pdfString(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value)) {
    return `(${value.replace(/[\\()]/g, (c) => `\\${c}`)})`
  }
  let hex = 'FEFF'
  for (let i = 0; i < value.length; i++) {
    hex += value.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase()
  }
  return `<${hex}>`
}

function pdfDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
}

interface XrefEntry {
  offset: number
  gen: number
  type: 'n' | 'f'
}

interface XrefSubsection {
  start: number
  entries: XrefEntry[]
}

function parseXrefTable(bin: string, xrefOffset: number): { sections: XrefSubsection[]; trailerIdx: number } | null {
  const trailerIdx = bin.indexOf('trailer', xrefOffset)
  if (trailerIdx === -1) return null
  const lines = bin.slice(xrefOffset + 4, trailerIdx).split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean)
  const sections: XrefSubsection[] = []
  let i = 0
  while (i < lines.length) {
    const head = /^(\d+) (\d+)$/.exec(lines[i])
    if (!head) return null
    const count = Number(head[2])
    const entries: XrefEntry[] = []
    for (let k = 1; k <= count; k++) {
      const m = /^(\d{10}) (\d{5}) ([nf])$/.exec(lines[i + k] ?? '')
      if (!m) return null
      entries.push({ offset: Number(m[1]), gen: Number(m[2]), type: m[3] as 'n' | 'f' })
    }
    sections.push({ start: Number(head[1]), entries })
    i += count + 1
  }
  return { sections, trailerIdx }
}

export function rewritePdfInfo(pdf: Uint8Array, meta: PdfMetadata, now: Date = new Date()): Uint8Array | null {
  const bin = bytesToBinary(pdf)

  const sx = bin.lastIndexOf('startxref')
  if (sx === -1) return null
  const sxMatch = /^startxref\s+(\d+)/.exec(bin.slice(sx, sx + 40))
  if (!sxMatch) return null
  const xrefOffset = Number(sxMatch[1])
  if (!bin.startsWith('xref', xrefOffset)) return null // xref stream — not supported

  const table = parseXrefTable(bin, xrefOffset)
  if (!table) return null
  const trailer = bin.slice(table.trailerIdx, sx)
  if (/\/Prev\b|\/Encrypt\b/.test(trailer)) return null
  const infoRef = /\/Info\s+(\d+)\s+(\d+)\s+R/.exec(trailer)
  if (!infoRef) return null
  const infoNum = Number(infoRef[1])
  const infoGen = Number(infoRef[2])

  let infoEntry: XrefEntry | undefined
  for (const s of table.sections) {
    const idx = infoNum - s.start
    if (idx >= 0 && idx < s.entries.length) infoEntry = s.entries[idx]
  }
  if (!infoEntry || infoEntry.type !== 'n') return null
  const objStart = infoEntry.offset
  if (!bin.startsWith(`${infoNum} ${infoGen} obj`, objStart) || objStart >= xrefOffset) return null
  const endIdx = bin.indexOf('endobj', objStart)
  if (endIdx === -1 || endIdx > xrefOffset) return null
  const objEnd = endIdx + 'endobj'.length

  const title = meta.title.trim() || 'Resume'
  const author = meta.author?.trim() ?? ''
  const date = pdfString(pdfDate(now))
  const dict = [
    `/Title ${pdfString(title)}`,
    author ? `/Author ${pdfString(author)}` : '',
    `/Creator ${pdfString(PDF_PRODUCER)}`,
    `/Producer ${pdfString(PDF_PRODUCER)}`,
    `/CreationDate ${date}`,
    `/ModDate ${date}`,
  ].filter(Boolean).join('\n')
  // Non-ASCII hex strings are pure ASCII, so the binary string stays byte-exact.
  const newObj = `${infoNum} ${infoGen} obj\n<<${dict}>>\nendobj`
  const delta = newObj.length - (objEnd - objStart)

  let xref = 'xref\n'
  for (const s of table.sections) {
    xref += `${s.start} ${s.entries.length}\n`
    for (const e of s.entries) {
      const off = e.type === 'n' && e.offset > objStart ? e.offset + delta : e.offset
      xref += `${String(off).padStart(10, '0')} ${String(e.gen).padStart(5, '0')} ${e.type} \n`
    }
  }

  const out =
    bin.slice(0, objStart) +
    newObj +
    bin.slice(objEnd, xrefOffset) +
    xref +
    trailer +
    `startxref\n${xrefOffset + delta}\n%%EOF\n`

  return binaryToBytes(out)
}
