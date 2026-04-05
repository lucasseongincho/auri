'use client'

import { parseAIEstimates } from '@/lib/resumeHighlight'
import AIEstimateHighlight from './AIEstimateHighlight'

interface ResumeHighlightedTextProps {
  text: string
  /** Called when user verifies an estimate. Receives the estimate id and the new value. */
  onVerify?: (id: string, newValue: string) => void
}

/**
 * Renders a resume text string with <ai-estimate> tags converted into
 * interactive amber-highlighted elements. Text outside tags renders normally.
 */
export default function ResumeHighlightedText({
  text,
  onVerify,
}: ResumeHighlightedTextProps) {
  if (!text) return null
  const segments = parseAIEstimates(text)

  // Fast path: no estimates in this string
  if (segments.length === 1 && segments[0].type === 'text') {
    return <>{segments[0].content}</>
  }

  return (
    <>
      {segments.map((segment) => {
        if (segment.type === 'estimate') {
          return (
            <AIEstimateHighlight
              key={segment.id}
              value={segment.content}
              estimateId={segment.id}
              onVerify={onVerify}
            />
          )
        }
        return <span key={segment.id}>{segment.content}</span>
      })}
    </>
  )
}
