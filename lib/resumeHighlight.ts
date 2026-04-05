// ── AI Estimate Highlighting Utilities ───────────────────────────────────────
//
// Why: Claude adds estimated numbers (not from user input) into resume bullets.
// These must be tagged so users can verify them before submitting the resume.
// The XML tag approach embeds provenance directly in the string — no separate
// metadata structure needed — and survives JSON serialisation cleanly.

export interface ResumeSegment {
  type: 'text' | 'estimate'
  content: string
  id: string
}

/**
 * Parse a string containing <ai-estimate> tags into an array of segments.
 * Text segments are rendered as-is; estimate segments become amber highlights.
 */
export function parseAIEstimates(text: string): ResumeSegment[] {
  const segments: ResumeSegment[] = []
  const regex = /<ai-estimate>(.*?)<\/ai-estimate>/g
  let lastIndex = 0
  let match
  let estimateCount = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
        id: `text-${lastIndex}`,
      })
    }

    segments.push({
      type: 'estimate',
      content: match[1],
      id: `estimate-${estimateCount++}`,
    })

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
      id: `text-${lastIndex}`,
    })
  }

  return segments
}

/** Count how many ai-estimate tags are in a string. */
export function countEstimates(text: string): number {
  const matches = text.match(/<ai-estimate>.*?<\/ai-estimate>/g)
  return matches ? matches.length : 0
}

/** Strip <ai-estimate> tags, keeping their content. For plain-text export / ATS copy. */
export function stripAITags(text: string): string {
  return text.replace(/<ai-estimate>(.*?)<\/ai-estimate>/g, '$1')
}

/** Check whether any field in a resume data object still contains unverified tags. */
export function hasUnverifiedEstimates(resumeData: unknown): boolean {
  return JSON.stringify(resumeData).includes('<ai-estimate>')
}

/**
 * Count total ai-estimate occurrences across all string values in an object.
 * Used to populate the VerificationBanner total.
 */
export function countAllEstimates(resumeData: unknown): number {
  const json = JSON.stringify(resumeData)
  const matches = json.match(/<ai-estimate>.*?<\/ai-estimate>/g)
  return matches ? matches.length : 0
}

/**
 * Strip all ai-estimate tags from every string value in a ResumeData object.
 * Returns a new object — does not mutate the original.
 * Used before PDF export and Firestore save.
 */
export function stripAllAITags<T>(data: T): T {
  if (typeof data === 'string') return stripAITags(data) as unknown as T
  if (Array.isArray(data)) return data.map((item) => stripAllAITags(item)) as unknown as T
  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(data as object)) {
      result[key] = stripAllAITags((data as Record<string, unknown>)[key])
    }
    return result as T
  }
  return data
}
