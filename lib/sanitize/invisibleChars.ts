/**
 * Invisible-character sanitizer.
 *
 * Ported from "Layer A" of watermarks-remover by Guillaume Meyer
 * (https://github.com/guillaumemeyer/watermarks-remover), MIT licensed.
 * Rewritten as dependency-free TypeScript for AURI, with AURI-specific rules:
 * ZWJ/ZWNJ are only stripped between Latin characters so Korean (and other
 * non-Latin) names and emoji sequences are never corrupted, and valid emoji
 * tag sequences (e.g. the England flag) are kept intact.
 *
 * This file is isomorphic (server + client) and must stay free of `@/` imports
 * so scripts/test-sanitize.ts can run it directly with Node's type stripping.
 *
 * NOTICE — upstream license (applies to the ported portions):
 *
 *   MIT License
 *
 *   Copyright (c) 2026 Guillaume Meyer and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

export interface SanitizeReport {
  zeroWidth: number
  bidi: number
  tagChars: number
  softHyphen: number
  exoticSpaces: number
  noncharacters: number
  reservedIgnorable: number
}

export function emptyReport(): SanitizeReport {
  return {
    zeroWidth: 0,
    bidi: 0,
    tagChars: 0,
    softHyphen: 0,
    exoticSpaces: 0,
    noncharacters: 0,
    reservedIgnorable: 0,
  }
}

export function mergeReports(a: SanitizeReport, b: SanitizeReport): SanitizeReport {
  return {
    zeroWidth: a.zeroWidth + b.zeroWidth,
    bidi: a.bidi + b.bidi,
    tagChars: a.tagChars + b.tagChars,
    softHyphen: a.softHyphen + b.softHyphen,
    exoticSpaces: a.exoticSpaces + b.exoticSpaces,
    noncharacters: a.noncharacters + b.noncharacters,
    reservedIgnorable: a.reservedIgnorable + b.reservedIgnorable,
  }
}

export function reportTotal(r: SanitizeReport): number {
  return (
    r.zeroWidth + r.bidi + r.tagChars + r.softHyphen +
    r.exoticSpaces + r.noncharacters + r.reservedIgnorable
  )
}

const ZWNJ = 0x200c
const ZWJ = 0x200d
const WAVING_BLACK_FLAG = 0x1f3f4
const CANCEL_TAG = 0xe007f

type Category = Exclude<keyof SanitizeReport, 'exoticSpaces'>

function removalCategory(cp: number): Category | null {
  if (cp === 0x200b || cp === 0x2060 || cp === 0xfeff) return 'zeroWidth'
  if (cp === 0x00ad) return 'softHyphen'
  if (cp === 0x180f || cp === 0x3164 || cp === 0xffa0) return 'reservedIgnorable'
  if (
    cp === 0x200e || cp === 0x200f ||
    (cp >= 0x202a && cp <= 0x202e) ||
    (cp >= 0x2066 && cp <= 0x2069)
  ) return 'bidi'
  if (cp >= 0xe0000 && cp <= 0xe007f) return 'tagChars'
  if ((cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe) return 'noncharacters'
  return null
}

function isExoticSpace(cp: number): boolean {
  return (
    cp === 0x00a0 ||
    (cp >= 0x2000 && cp <= 0x200a) ||
    cp === 0x202f || cp === 0x205f || cp === 0x3000
  )
}

function isJoiner(cp: number): boolean {
  return cp === ZWJ || cp === ZWNJ
}

// "Latin" for joiner purposes: ASCII, Latin-1, Latin Extended A/B, IPA,
// Latin Extended Additional. A missing neighbour (string edge) counts as Latin
// so a stray joiner at the start/end of plain English text is removed.
function isLatinOrEdge(cp: number | null): boolean {
  if (cp === null) return true
  return cp <= 0x02af || (cp >= 0x1e00 && cp <= 0x1eff)
}

// Marks tag characters that belong to a valid emoji tag sequence
// (U+1F3F4, one or more U+E0020–E007E, terminated by U+E007F) so they are kept.
function protectedTagIndexes(cps: number[]): Set<number> {
  const keep = new Set<number>()
  for (let i = 0; i < cps.length; i++) {
    if (cps[i] !== WAVING_BLACK_FLAG) continue
    let j = i + 1
    while (j < cps.length && cps[j] >= 0xe0020 && cps[j] <= 0xe007e) j++
    if (j > i + 1 && cps[j] === CANCEL_TAG) {
      for (let k = i + 1; k <= j; k++) keep.add(k)
      i = j
    }
  }
  return keep
}

/**
 * Core pass. `leftContext` is the last code point already emitted before this
 * text (used by the streaming sanitizer so joiner decisions see across chunks).
 */
function sanitizeWithContext(
  input: string,
  leftContext: number | null
): { text: string; report: SanitizeReport } {
  const report = emptyReport()
  const cps = Array.from(input, (ch) => ch.codePointAt(0) ?? 0)
  const keepTags = protectedTagIndexes(cps)

  // Phase 1 — remove/normalise everything except joiners, so joiner decisions
  // in phase 2 see the final neighbours (keeps the function idempotent).
  const mid: number[] = []
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i]
    if (keepTags.has(i)) { mid.push(cp); continue }
    const cat = removalCategory(cp)
    if (cat) { report[cat]++; continue }
    if (isExoticSpace(cp)) { report.exoticSpaces++; mid.push(0x20); continue }
    mid.push(cp)
  }

  // Phase 2 — ZWJ/ZWNJ: strip only when the nearest non-joiner neighbours on
  // both sides are Latin. Anything next to Hangul, other scripts or emoji stays.
  let out = ''
  for (let i = 0; i < mid.length; i++) {
    const cp = mid[i]
    if (isJoiner(cp)) {
      let l = i - 1
      while (l >= 0 && isJoiner(mid[l])) l--
      let r = i + 1
      while (r < mid.length && isJoiner(mid[r])) r++
      const left = l >= 0 ? mid[l] : leftContext
      const right = r < mid.length ? mid[r] : null
      if (isLatinOrEdge(left) && isLatinOrEdge(right)) {
        report.zeroWidth++
        continue
      }
    }
    out += String.fromCodePoint(cp)
  }

  return { text: out, report }
}

export function sanitizeText(input: string): { text: string; report: SanitizeReport } {
  return sanitizeWithContext(input, null)
}

/** Convenience for call sites that only need the cleaned string. */
export function cleanText(input: string): string {
  return sanitizeWithContext(input, null).text
}

// Code points whose fate depends on what comes after them; a streaming chunk
// that ends in one of these is held back until more text (or the end) arrives.
function isPending(cp: number): boolean {
  return (
    isJoiner(cp) ||
    cp === WAVING_BLACK_FLAG ||
    (cp >= 0xd800 && cp <= 0xdbff) || // dangling high surrogate
    removalCategory(cp) !== null
  )
}

/**
 * Streaming sanitizer for token-by-token output. Produces exactly the same
 * text as sanitizeText() on the concatenated input, regardless of how the
 * input is split into chunks.
 */
export function createStreamSanitizer(): {
  push: (chunk: string) => string
  flush: () => string
  report: () => SanitizeReport
} {
  let buffer = ''
  let lastEmitted: number | null = null
  let total = emptyReport()

  function emit(segment: string): string {
    if (!segment) return ''
    const { text, report } = sanitizeWithContext(segment, lastEmitted)
    total = mergeReports(total, report)
    const tail = Array.from(text).pop()
    if (tail !== undefined) lastEmitted = tail.codePointAt(0) ?? null
    return text
  }

  return {
    push(chunk: string): string {
      buffer += chunk
      const cps = Array.from(buffer)
      let cut = cps.length
      while (cut > 0 && isPending(cps[cut - 1].codePointAt(0) ?? 0)) cut--
      const ready = cps.slice(0, cut).join('')
      buffer = cps.slice(cut).join('')
      return emit(ready)
    },
    flush(): string {
      const rest = buffer
      buffer = ''
      return emit(rest)
    },
    report: () => total,
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Recursively sanitizes every string inside arrays and plain objects.
 * Returns a sanitized copy; non-plain objects (Date, class instances) are
 * passed through untouched.
 */
export function sanitizeDeep<T>(value: T): { value: T; report: SanitizeReport } {
  let report = emptyReport()

  function walk(v: unknown): unknown {
    if (typeof v === 'string') {
      const r = sanitizeText(v)
      report = mergeReports(report, r.report)
      return r.text
    }
    if (Array.isArray(v)) return v.map(walk)
    if (isPlainObject(v)) {
      const out: Record<string, unknown> = {}
      for (const [k, child] of Object.entries(v)) out[k] = walk(child)
      return out
    }
    return v
  }

  return { value: walk(value) as T, report }
}
