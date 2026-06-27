// Server-side only. Pure heuristic functions — zero external dependencies.
import type { ParseFailure, ParsedResumeResult } from '@/types'

const PLATFORM_IMPACT: Record<ParseFailure['type'], string[]> = {
  column_merge:      ['Workday', 'Taleo', 'iCIMS'],
  missing_headers:   ['Taleo', 'iCIMS', 'Greenhouse'],
  date_fragmented:   ['Workday', 'Taleo'],
  bullets_stripped:  ['Workday', 'iCIMS', 'Lever'],
  encoding_artifact: ['Taleo', 'iCIMS', 'Greenhouse', 'Lever'],
  contact_garbled:   ['Workday', 'Taleo', 'iCIMS', 'Greenhouse', 'Lever'],
}

const KNOWN_SECTION_HEADERS = [
  'experience', 'education', 'skills', 'work', 'employment',
  'summary', 'objective', 'professional', 'projects',
] as const

// ── Heuristic: column_merge ───────────────────────────────────────────────────

function detectColumnMerge(lines: string[]): ParseFailure | null {
  // Year/date mid-line followed by a capitalized word — classic two-column merge
  const dateInlineRe = /\b(19|20)\d{2}\b.{5,40}[A-Z][a-z]{2,}/
  const affectedLines: number[] = []

  lines.forEach((line, i) => {
    // Pattern 1: inline date fragment with capitalized continuation
    if (dateInlineRe.test(line)) {
      affectedLines.push(i)
      return
    }
    // Pattern 2: unusually long line with high capital-letter ratio
    if (line.length > 60) {
      const letters = line.replace(/[^a-zA-Z]/g, '')
      if (letters.length > 0) {
        const capRatio = line.replace(/[^A-Z]/g, '').length / letters.length
        if (capRatio > 0.4) affectedLines.push(i)
      }
      // Also flag very long unstructured lines
      if (line.length > 120) affectedLines.push(i)
    }
  })

  // Deduplicate indices added by multiple checks
  const unique = [...new Set(affectedLines)]
  if (unique.length === 0) return null

  return {
    type: 'column_merge',
    severity: 'high',
    description:
      'Two-column layout detected — content from side-by-side columns has merged into single lines. ATS parsers read left-to-right and cannot reconstruct the original layout.',
    affectedLines: unique,
    affectedPlatforms: PLATFORM_IMPACT.column_merge,
  }
}

// ── Heuristic: section detection (shared by missing_headers + stats) ──────────

function detectSections(lines: string[]): string[] {
  const text = lines.join(' ').toLowerCase()
  return KNOWN_SECTION_HEADERS
    .filter((h) => text.includes(h))
    .map((h) => h.charAt(0).toUpperCase() + h.slice(1))
}

function detectMissingHeaders(detectedSections: string[]): ParseFailure | null {
  if (detectedSections.length >= 3) return null

  return {
    type: 'missing_headers',
    severity: 'high',
    description:
      "Standard section headers not detected. ATS systems use headers to categorize your experience, education, and skills — if they can't find them, your content may be miscategorized or ignored.",
    affectedLines: [],
    affectedPlatforms: PLATFORM_IMPACT.missing_headers,
  }
}

// ── Heuristic: date_fragmented ────────────────────────────────────────────────

function detectDateFragmented(lines: string[]): ParseFailure | null {
  const yearOnlyRe = /^\s*\d{4}\s*$/
  const monthYearRe =
    /^\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}\s*$/i

  const affectedLines = lines
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => yearOnlyRe.test(line) || monthYearRe.test(line))
    .map(({ i }) => i)

  if (affectedLines.length === 0) return null

  return {
    type: 'date_fragmented',
    severity: 'medium',
    description:
      'Date ranges appear fragmented — years or months are isolated on their own lines. ATS systems may fail to calculate your tenure or associate dates with the correct role.',
    affectedLines,
    affectedPlatforms: PLATFORM_IMPACT.date_fragmented,
  }
}

// ── Heuristic: bullets_stripped ───────────────────────────────────────────────

const BULLET_CHARS = ['•', '·', '-', '–', '*', '›', '▪']

function detectBulletsStripped(lines: string[]): ParseFailure | null {
  const text = lines.join(' ')
  const wordCount = text.trim().split(/\s+/).length
  if (wordCount <= 300) return null

  const bulletLineCount = lines.filter((line) =>
    BULLET_CHARS.some((marker) => line.trimStart().startsWith(marker))
  ).length

  if (bulletLineCount >= 3) return null

  return {
    type: 'bullets_stripped',
    severity: 'medium',
    description:
      'Bullet points appear to have been removed during parsing. Your accomplishments and responsibilities may be running together as unstructured paragraphs, making them harder for ATS systems to parse correctly.',
    affectedLines: [],
    affectedPlatforms: PLATFORM_IMPACT.bullets_stripped,
  }
}

// ── Heuristic: encoding_artifact ─────────────────────────────────────────────

const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
const MULTI_SPACE_MID_LINE_RE = /\S {3,}\S/

function detectEncodingArtifacts(lines: string[]): ParseFailure | null {
  const affectedLines = lines
    .map((line, i) => ({ line, i }))
    .filter(
      ({ line }) =>
        line.includes('�') ||
        MULTI_SPACE_MID_LINE_RE.test(line) ||
        CONTROL_CHAR_RE.test(line)
    )
    .map(({ i }) => i)

  if (affectedLines.length === 0) return null

  return {
    type: 'encoding_artifact',
    severity: 'low',
    description:
      'Encoding artifacts detected — special characters, symbols, or spacing that may render as garbage in ATS systems. Common causes: decorative fonts, special bullet styles, or non-standard characters.',
    affectedLines,
    affectedPlatforms: PLATFORM_IMPACT.encoding_artifact,
  }
}

// ── Heuristic: contact_garbled ────────────────────────────────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const PHONE_RE = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/
const LINKEDIN_RE = /linkedin\.com/i

function detectContactGarbled(lines: string[]): ParseFailure | null {
  const headerText = lines.slice(0, 10).join(' ')
  const detected = [
    EMAIL_RE.test(headerText),
    PHONE_RE.test(headerText),
    LINKEDIN_RE.test(headerText),
  ].filter(Boolean).length

  if (detected >= 2) return null

  return {
    type: 'contact_garbled',
    severity: 'high',
    description:
      'Contact information in the header area may not be parseable. If an ATS cannot extract your email or phone number, your application cannot be processed correctly.',
    affectedLines: Array.from({ length: Math.min(10, lines.length) }, (_, i) => i),
    affectedPlatforms: PLATFORM_IMPACT.contact_garbled,
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function analyzeResumeText(extractedText: string): ParsedResumeResult {
  const lines = extractedText.split('\n')
  const detectedSections = detectSections(lines)

  const candidates = [
    detectColumnMerge(lines),
    detectMissingHeaders(detectedSections),
    detectDateFragmented(lines),
    detectBulletsStripped(lines),
    detectEncodingArtifacts(lines),
    detectContactGarbled(lines),
  ]

  const failures = candidates.filter((f): f is ParseFailure => f !== null)

  return {
    extractedText,
    lines,
    failures,
    stats: {
      totalLines: lines.length,
      totalChars: extractedText.length,
      detectedSections,
    },
  }
}
