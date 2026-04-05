'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Undo2, Redo2, Loader2, CheckCircle } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { stripAITags } from '@/lib/resumeHighlight'
import type { ResumeData, PersonalInfo } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

interface ResumeEditorProps {
  resumeData: ResumeData
  personal: PersonalInfo
  onDataChange: (updated: ResumeData) => void
  children: React.ReactNode  // the rendered template passed as children
}

interface AIAssistState {
  isVisible: boolean
  isLoading: boolean
  fieldId: string
  position: { top: number; left: number }
  selectedText: string
}

export default function ResumeEditor({
  resumeData,
  personal: _personal,
  onDataChange,
  children,
}: ResumeEditorProps) {
  useAuth() // auth context — user available for future AI assist attribution
  const { pushToHistory, undo, redo, canUndo, canRedo, profile } = useCareerStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const [aiAssist, setAIAssist] = useState<AIAssistState>({
    isVisible: false,
    isLoading: false,
    fieldId: '',
    position: { top: 0, left: 0 },
    selectedText: '',
  })
  const [lastSaved, setLastSaved] = useState(false)

  // Keyboard shortcut handler for Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const prev = undo()
        if (prev) onDataChange(prev)
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        const next = redo()
        if (next) onDataChange(next)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, onDataChange])

  // Show AI Assist button when text is selected inside a bullet
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setAIAssist((s) => ({ ...s, isVisible: false }))
      return
    }

    const selectedText = selection.toString().trim()
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const editorRect = editorRef.current?.getBoundingClientRect()

    if (!editorRect) return

    // Only show if selection is inside the editor
    const anchorNode = selection.anchorNode
    if (!editorRef.current?.contains(anchorNode)) return

    setAIAssist({
      isVisible: true,
      isLoading: false,
      fieldId: '',
      position: {
        top: rect.top - editorRect.top - 48,
        left: rect.left - editorRect.left + rect.width / 2,
      },
      selectedText,
    })
  }, [])

  const handleAIAssist = useCallback(async () => {
    if (!aiAssist.selectedText || !profile?.target.position) return

    setAIAssist((s) => ({ ...s, isLoading: true }))

    try {
      const res = await fetch('/api/claude/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerProfile: profile,
          target: {
            position: profile.target.position,
            company: profile.target.company,
            companyType: profile.target.company_type,
            jobDescription: profile.target.job_description ?? '',
          },
          mode: 'assist',
          selectedText: aiAssist.selectedText,
        }),
      })

      const json = await res.json() as { success: boolean; data: { rewritten: string } }
      if (!json.success) throw new Error('AI Assist failed')

      // Replace the selected text in the DOM (contenteditable)
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(json.data.rewritten))
        selection.collapseToEnd()
      }

      // Sync the DOM changes back to ResumeData by reading the editor content
      syncDOMToData()
      setLastSaved(true)
      setTimeout(() => setLastSaved(false), 2000)
    } catch {
      // Silent fail — user can try again
    } finally {
      setAIAssist((s) => ({ ...s, isLoading: false, isVisible: false }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAssist.selectedText, profile])

  // Sync contenteditable DOM changes back to ResumeData state.
  // IMPORTANT: Easy Tune renders with renderText={stripAITags}, so the DOM only
  // contains plain text — no <ai-estimate> tags. We must compare each DOM value
  // against the stripped original to detect whether the user actually changed it.
  // If unchanged, we keep the original string (which may still have tags) so that
  // amber highlights survive for fields the user never touched.
  const syncDOMToData = useCallback(() => {
    if (!editorRef.current) return

    const updated: ResumeData = { ...resumeData }

    // Sync summary — only overwrite if user changed it
    const summaryEl = editorRef.current.querySelector('[data-ats-field="summary"] p')
    if (summaryEl) {
      const domText = (summaryEl as HTMLElement).innerText.trim()
      const origStripped = stripAITags(resumeData.summary ?? '').trim()
      if (domText !== origStripped) {
        // User edited this field — save plain text (tags intentionally removed)
        updated.summary = domText
      }
      // else: keep resumeData.summary with ai-estimate tags intact
    }

    // Sync experience bullets — compare by bullet index to preserve tags on unedited bullets
    const expEls = editorRef.current.querySelectorAll('[data-ats-field="experience"] article')
    expEls.forEach((articleEl, i) => {
      if (!updated.experience[i]) return
      const origBullets = resumeData.experience[i]?.bullets ?? []
      const bullets: string[] = []
      articleEl.querySelectorAll('li').forEach((li, bulletIndex) => {
        const domText = (li as HTMLElement).innerText.trim()
        if (!domText) return
        const origBullet = origBullets[bulletIndex]
        if (origBullet !== undefined && stripAITags(origBullet).trim() === domText) {
          // Unchanged — keep original bullet with ai-estimate tags
          bullets.push(origBullet)
        } else {
          // User edited this bullet — use plain DOM text
          bullets.push(domText)
        }
      })
      updated.experience[i] = { ...updated.experience[i], bullets }
    })

    // Sync skills — only update if changed (skills rarely have ai-estimate tags)
    const skillsEl = editorRef.current.querySelector('[data-ats-field="skills"] p')
    if (skillsEl) {
      const domText = (skillsEl as HTMLElement).innerText.trim()
      const origSkillsText = stripAITags((resumeData.skills ?? []).join(', ')).trim()
      if (domText !== origSkillsText) {
        updated.skills = domText.split(/[,·]/).map((s) => s.trim()).filter(Boolean)
      }
      // else: keep original skills unchanged
    }

    // Push to undo history before updating
    pushToHistory(updated)
    onDataChange(updated)
  }, [resumeData, pushToHistory, onDataChange])

  return (
    <div className="relative" ref={editorRef} onMouseUp={handleMouseUp}>
      {/* Undo / Redo toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#13131A] border border-white/[0.08]">
          <button
            onClick={() => { const prev = undo(); if (prev) onDataChange(prev) }}
            disabled={!canUndo()}
            aria-label="Undo last edit (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md text-[#60607A] hover:text-white hover:bg-white/5
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { const next = redo(); if (next) onDataChange(next) }}
            disabled={!canRedo()}
            aria-label="Redo last edit (Ctrl+Y)"
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-md text-[#60607A] hover:text-white hover:bg-white/5
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-[#60607A]">Click any text to edit · Select text for AI Assist</span>
        <AnimatePresence>
          {lastSaved && (
            <motion.div
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs text-[#22C55E] ml-auto"
            >
              <CheckCircle className="w-3 h-3" /> Saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Assist floating button */}
      <AnimatePresence>
        {aiAssist.isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={SPRING}
            style={{
              position: 'absolute',
              top: aiAssist.position.top,
              left: aiAssist.position.left,
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
          >
            <button
              onClick={handleAIAssist}
              disabled={aiAssist.isLoading}
              aria-label="Rewrite selected text with AI"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                text-white bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                shadow-lg shadow-[#6366F1]/40 hover:shadow-[#6366F1]/60
                hover:scale-[1.05] transition-all duration-200
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {aiAssist.isLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Sparkles className="w-3 h-3" />}
              {aiAssist.isLoading ? 'Rewriting...' : 'AI Rewrite'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenteditable wrapper — makes all text in the resume editable */}
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={syncDOMToData}
        className="outline-none"
        style={{ cursor: 'text' }}
        aria-label="Editable resume content"
      >
        {children}
      </div>
    </div>
  )
}
