'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Undo2, Redo2, CheckCircle } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { stripAITags } from '@/lib/resumeHighlight'
import type { ResumeData, PersonalInfo, Language } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

interface ResumeEditorProps {
  resumeData: ResumeData
  personal: PersonalInfo
  onDataChange: (updated: ResumeData) => void
  children: React.ReactNode  // the rendered template passed as children
  syncRef?: React.RefObject<{ sync: () => void } | null>
}

export default function ResumeEditor({
  resumeData,
  personal: _personal,
  onDataChange,
  children,
  syncRef,
}: ResumeEditorProps) {
  useAuth()
  const { pushToHistory, undo, redo, canUndo, canRedo } = useCareerStore()
  const editorRef = useRef<HTMLDivElement>(null)
  // Incrementing this key forces the contenteditable to unmount+remount,
  // which is the only way to make React re-render its DOM after undo/redo
  // (suppressContentEditableWarning prevents normal reconciliation).
  const [ceKey, setCEKey] = useState(0)
  const [lastSaved, setLastSaved] = useState(false)

  // Mark structural elements (section headers, contact header) as non-editable.
  // Re-runs on ceKey change because remounting the contenteditable resets the DOM.
  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current
      .querySelectorAll('[data-ats-field="header"], .section-header, .main-section-header')
      .forEach((el) => {
        el.setAttribute('contenteditable', 'false')
        ;(el as HTMLElement).style.cursor = 'default'
      })
  }, [ceKey])

  const handleUndo = useCallback(() => {
    const prev = undo()
    if (prev) { onDataChange(prev); setCEKey((k) => k + 1) }
  }, [undo, onDataChange])

  const handleRedo = useCallback(() => {
    const next = redo()
    if (next) { onDataChange(next); setCEKey((k) => k + 1) }
  }, [redo, onDataChange])

  // Keyboard shortcut handler for Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

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

    // Sync experience title + bullets
    const expEls = editorRef.current.querySelectorAll('[data-ats-field="experience"] article')
    expEls.forEach((articleEl, i) => {
      if (!updated.experience[i]) return
      let exp = { ...updated.experience[i] }

      const titleEl = articleEl.querySelector('.job-title')
      if (titleEl) {
        const domText = (titleEl as HTMLElement).innerText.trim()
        if (domText !== (resumeData.experience[i]?.title ?? '')) exp = { ...exp, title: domText }
      }

      const origBullets = resumeData.experience[i]?.bullets ?? []
      const bullets: string[] = []
      articleEl.querySelectorAll('li').forEach((li, bulletIndex) => {
        const domText = (li as HTMLElement).innerText.trim()
        if (!domText) return
        const origBullet = origBullets[bulletIndex]
        if (origBullet !== undefined && stripAITags(origBullet).trim() === domText) {
          bullets.push(origBullet)
        } else {
          bullets.push(domText)
        }
      })
      exp = { ...exp, bullets }
      updated.experience[i] = exp
    })

    // Sync skills — only update if changed (skills rarely have ai-estimate tags)
    const skillsEl = editorRef.current.querySelector('[data-ats-field="skills"] p')
    if (skillsEl) {
      const domText = (skillsEl as HTMLElement).innerText.trim()
      // Use the same separator the template renders with (' · ') so unchanged skills compare equal
      const origSkillsText = stripAITags((resumeData.skills ?? []).join(' · ')).trim()
      if (domText !== origSkillsText) {
        updated.skills = domText.split(/[,·]/).map((s) => s.trim()).filter(Boolean)
      }
      // else: keep original skills unchanged
    }

    // Sync project descriptions and bullets
    const projEls = editorRef.current.querySelectorAll('[data-ats-field="projects"] article')
    if (projEls.length > 0) {
      const newProjects = [...(updated.projects ?? [])]
      projEls.forEach((articleEl, i) => {
        if (!newProjects[i]) return
        let proj = { ...newProjects[i] }

        // Sync project name (.job-title span)
        const nameEl = articleEl.querySelector('.job-title')
        if (nameEl) {
          const domText = (nameEl as HTMLElement).innerText.trim()
          if (domText !== (resumeData.projects?.[i]?.name ?? '')) proj = { ...proj, name: domText }
        }

        // Sync description paragraph (first <p> in the article)
        const descEl = articleEl.querySelector('p')
        if (descEl) {
          const domText = (descEl as HTMLElement).innerText.trim()
          const origStripped = stripAITags(resumeData.projects?.[i]?.description ?? '').trim()
          if (domText !== origStripped) proj = { ...proj, description: domText }
        }

        // Sync bullets
        const origBullets = resumeData.projects?.[i]?.bullets ?? []
        const bullets: string[] = []
        articleEl.querySelectorAll('li').forEach((li, bulletIndex) => {
          const domText = (li as HTMLElement).innerText.trim()
          if (!domText) return
          const origBullet = origBullets[bulletIndex]
          bullets.push(
            origBullet !== undefined && stripAITags(origBullet).trim() === domText
              ? origBullet
              : domText
          )
        })
        if (bullets.length > 0) proj = { ...proj, bullets }

        newProjects[i] = proj
      })
      updated.projects = newProjects
    }

    // Sync certifications — <p> in most templates, .contact-item divs in ModernEdge
    const certSection = editorRef.current.querySelector('[data-ats-field="certifications"]')
    if (certSection) {
      const certP = certSection.querySelector('p')
      if (certP) {
        const domText = (certP as HTMLElement).innerText.trim()
        const origText = (resumeData.certifications ?? []).join(' · ')
        if (domText !== origText) {
          updated.certifications = domText.split(/\s*[·,]\s*/).filter(Boolean)
        }
      } else {
        // ModernEdge: each cert is a separate .contact-item div
        const certItems = certSection.querySelectorAll('.contact-item')
        if (certItems.length > 0) {
          const certs = Array.from(certItems).map((el) => (el as HTMLElement).innerText.trim()).filter(Boolean)
          const origCerts = resumeData.certifications ?? []
          if (JSON.stringify(certs) !== JSON.stringify(origCerts)) {
            updated.certifications = certs
          }
        }
      }
    }

    // Sync languages -- rendered as "Name (Proficiency) · Name (Proficiency)"
    const langSection = editorRef.current.querySelector('[data-ats-field="languages"]')
    if (langSection) {
      const langP = langSection.querySelector('p')
      if (langP) {
        const domText = (langP as HTMLElement).innerText.trim()
        const origLangText = (resumeData.languages ?? []).map((l) => `${l.name} (${l.proficiency})`).join(' · ')
        if (domText !== origLangText) {
          const validProf = ['Native', 'Fluent', 'Intermediate', 'Basic']
          updated.languages = domText.split(/\s*·\s*/).filter(Boolean).map((part, i) => {
            const m = part.match(/^(.+?)\s*\((.+?)\)$/)
            const proficiency = m && validProf.includes(m[2].trim())
              ? m[2].trim() as Language['proficiency']
              : 'Fluent' as const
            return {
              id: resumeData.languages?.[i]?.id ?? `lang_${i}`,
              name: m ? m[1].trim() : part.trim(),
              proficiency,
            }
          })
        }
      }
    }

    // Push to undo history before updating
    pushToHistory(updated)
    onDataChange(updated)
  }, [resumeData, pushToHistory, onDataChange])

  useImperativeHandle(syncRef, () => ({ sync: syncDOMToData }), [syncDOMToData])

  return (
    <div className="relative" ref={editorRef} tabIndex={-1}>
      {/* Undo / Redo toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#13131A] border border-white/[0.08]">
          <button
            onClick={handleUndo}
            disabled={!canUndo()}
            aria-label="Undo last edit (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md text-[#60607A] hover:text-white hover:bg-white/5
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo()}
            aria-label="Redo last edit (Ctrl+Y)"
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-md text-[#60607A] hover:text-white hover:bg-white/5
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-[#60607A]">Click any text to edit · Ctrl+Z to undo</span>
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

      {/* Contenteditable wrapper — makes all text in the resume editable */}
      <div
        key={ceKey}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          // intentionally empty — contentEditable owns its DOM while typing.
          // syncDOMToData is called on blur when focus leaves the editor.
        }}
        onBlur={(e) => {
          if (editorRef.current?.contains(e.relatedTarget as Node)) return
          syncDOMToData()
        }}
        className="outline-none"
        style={{ cursor: 'text' }}
        aria-label="Editable resume content"
      >
        {children}
      </div>
    </div>
  )
}
