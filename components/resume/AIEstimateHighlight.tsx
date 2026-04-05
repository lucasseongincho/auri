'use client'

import { useState, useRef, useEffect } from 'react'

interface AIEstimateHighlightProps {
  value: string
  estimateId: string
  onVerify?: (id: string, newValue: string) => void
}

/**
 * Renders a single AI-estimated value with amber dashed underline.
 * Clicking enters inline edit mode; confirming marks it as verified (green).
 * The .printing CSS class (added by pdf.ts before html2pdf capture) resets
 * all visual treatment so estimates export as plain text in the PDF.
 */
export default function AIEstimateHighlight({
  value,
  estimateId,
  onVerify,
}: AIEstimateHighlightProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isVerified, setIsVerified] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleConfirm = () => {
    onVerify?.(estimateId, editValue)
    setIsVerified(true)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  // After verification, render as plain green text
  if (isVerified) {
    return (
      <span
        className="ai-estimate-verified text-green-600 font-medium print-plain"
        data-estimate-verified="true"
      >
        {editValue}
      </span>
    )
  }

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1 print-plain">
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="inline-block bg-amber-500/20 border border-amber-500 rounded
            px-1 py-0 text-amber-700 text-[0.85em] font-medium
            focus:outline-none focus:ring-1 focus:ring-amber-400"
          style={{ width: `${Math.max(editValue.length + 1, 4)}ch`, minWidth: '3rem' }}
          aria-label="Edit AI-estimated value"
        />
        <button
          onClick={handleConfirm}
          className="text-green-600 hover:text-green-700 text-xs font-bold leading-none"
          title="Confirm value"
          aria-label="Confirm edited value"
        >
          ✓
        </button>
        <button
          onClick={() => { setEditValue(value); setIsEditing(false) }}
          className="text-gray-400 hover:text-gray-600 text-xs leading-none"
          title="Cancel"
          aria-label="Cancel editing"
        >
          ✕
        </button>
      </span>
    )
  }

  return (
    <span className="relative group inline-block print-plain" data-estimate="true">
      <button
        onClick={() => setIsEditing(true)}
        className="ai-estimate-highlight-btn bg-amber-100 text-amber-800
          border-b-2 border-amber-400 border-dashed font-medium px-0.5 rounded-sm
          hover:bg-amber-200 hover:border-amber-500
          transition-all duration-150 cursor-pointer text-[0.85em]"
        title="AI estimated — click to verify and replace with your real number"
        aria-label={`AI estimated value: ${value}. Click to edit.`}
      >
        {value}
      </button>

      {/* Tooltip */}
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52
          px-3 py-2 bg-gray-900 border border-amber-500/30 rounded-lg
          text-xs text-gray-300 opacity-0 group-hover:opacity-100
          transition-opacity duration-200 pointer-events-none z-50
          text-center shadow-xl whitespace-normal"
        role="tooltip"
      >
        ⚠️ AI estimated
        <br />
        <span className="text-amber-300">Click to replace with your real number</span>
      </span>
    </span>
  )
}
