'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Redo2, Undo2, X } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { stripAITags } from '@/lib/resumeHighlight'
import type { Education, Experience, Language, Leadership, PersonalInfo, Project, ResumeData } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const SECTION_CARD = 'rounded-2xl border border-white/[0.08] bg-[#13131A] p-1 mb-4'
const SECTION_INNER = 'rounded-xl border border-white/[0.05] bg-[#1C1C26] p-5'
const SECTION_TITLE = 'text-xs font-bold uppercase tracking-widest text-[#6366F1] mb-4'
const INPUT_CLASS = 'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 transition-colors resize-none'
const LABEL_CLASS = 'text-xs text-[#A0A0B8] mb-1 block'
const ADD_BTN = 'flex items-center gap-1.5 text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors mt-2'
const DELETE_BTN = 'p-1 rounded-md text-[#60607A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all'

interface BulletRowProps {
  value: string
  onChange: (val: string) => void
  onDelete: () => void
  placeholder?: string
}

function BulletRow({ value, onChange, onDelete, placeholder }: BulletRowProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])

  return (
    <div className="flex gap-2 items-start">
      <span className="text-[#60607A] mt-2.5 text-xs flex-shrink-0">·</span>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Bullet point...'}
        className={`${INPUT_CLASS} flex-1`}
        style={{ overflow: 'hidden', minHeight: '36px' }}
      />
      <button onClick={onDelete} className={DELETE_BTN} aria-label="Delete bullet">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function SkillInput({ onAdd }: { onAdd: (s: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <input
      type="text"
      className={INPUT_CLASS}
      value={val}
      placeholder="Type a skill and press Enter..."
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ',') && val.trim()) {
          e.preventDefault()
          onAdd(val.trim().replace(/,$/, ''))
          setVal('')
        }
      }}
    />
  )
}

interface ResumeEditorProps {
  resumeData: ResumeData
  personal: PersonalInfo
  onDataChange: (updated: ResumeData) => void
  children?: React.ReactNode
  syncRef?: React.RefObject<{ sync: () => void } | null>
}

export default function ResumeEditor({ resumeData, onDataChange, syncRef }: ResumeEditorProps) {
  const { pushToHistory, undo, redo, canUndo, canRedo } = useCareerStore()

  useImperativeHandle(syncRef, () => ({ sync: () => {} }), [])

  const handleUndo = useCallback(() => {
    const prev = undo()
    if (prev) onDataChange(prev)
  }, [undo, onDataChange])

  const handleRedo = useCallback(() => {
    const next = redo()
    if (next) onDataChange(next)
  }, [redo, onDataChange])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

  const updateExp = useCallback((index: number, partial: Partial<Experience>) => {
    onDataChange({
      ...resumeData,
      experience: resumeData.experience.map((x, i) => i === index ? { ...x, ...partial } : x),
    })
  }, [resumeData, onDataChange])

  const updateEdu = useCallback((index: number, partial: Partial<Education>) => {
    onDataChange({
      ...resumeData,
      education: resumeData.education.map((x, i) => i === index ? { ...x, ...partial } : x),
    })
  }, [resumeData, onDataChange])

  const updateProj = useCallback((index: number, partial: Partial<Project>) => {
    onDataChange({
      ...resumeData,
      projects: (resumeData.projects ?? []).map((x, i) => i === index ? { ...x, ...partial } : x),
    })
  }, [resumeData, onDataChange])

  const updateLead = useCallback((index: number, partial: Partial<Leadership>) => {
    onDataChange({
      ...resumeData,
      leadership: (resumeData.leadership ?? []).map((x, i) => i === index ? { ...x, ...partial } : x),
    })
  }, [resumeData, onDataChange])

  return (
    <div className="p-4 overflow-y-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#13131A] border border-white/[0.08]">
          <button
            onClick={handleUndo}
            disabled={!canUndo()}
            aria-label="Undo (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md text-[#60607A] hover:text-white hover:bg-white/5
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo()}
            aria-label="Redo (Ctrl+Y)"
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-md text-[#60607A] hover:text-white hover:bg-white/5
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-[#60607A]">Structured editor · Changes update the preview instantly</span>
      </div>

      {/* ── Summary ── */}
      <div className={SECTION_CARD}>
        <div className={SECTION_INNER}>
          <p className={SECTION_TITLE}>Summary</p>
          <textarea
            className={INPUT_CLASS}
            rows={3}
            value={stripAITags(resumeData.summary ?? '')}
            onChange={(e) => onDataChange({ ...resumeData, summary: e.target.value })}
            placeholder="Professional summary..."
          />
        </div>
      </div>

      {/* ── Experience ── */}
      <AnimatePresence initial={false}>
        {resumeData.experience.map((exp, i) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            className={SECTION_CARD}
          >
            <div className={SECTION_INNER}>
              <div className="flex items-center justify-between mb-3">
                <p className={SECTION_TITLE}>Experience {i + 1}</p>
                <button
                  onClick={() => {
                    pushToHistory(resumeData)
                    onDataChange({
                      ...resumeData,
                      experience: resumeData.experience.filter((_, idx) => idx !== i),
                    })
                  }}
                  className="text-xs text-[#EF4444]/60 hover:text-[#EF4444] transition-colors"
                >
                  Remove position
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={LABEL_CLASS}>Job Title</label>
                  <input type="text" className={INPUT_CLASS} value={exp.title}
                    onChange={(e) => updateExp(i, { title: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Company</label>
                  <input type="text" className={INPUT_CLASS} value={exp.company}
                    onChange={(e) => updateExp(i, { company: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Start Date</label>
                  <input type="text" className={INPUT_CLASS} value={exp.start}
                    placeholder="Jan 2023"
                    onChange={(e) => updateExp(i, { start: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>End Date</label>
                  <input type="text" className={INPUT_CLASS} value={exp.end}
                    placeholder="Present"
                    onChange={(e) => updateExp(i, { end: e.target.value })} />
                </div>
              </div>

              <label className={LABEL_CLASS}>Bullets</label>
              <div className="space-y-2">
                {(exp.bullets ?? []).map((bullet, bi) => (
                  <BulletRow
                    key={bi}
                    value={stripAITags(bullet)}
                    onChange={(val) => updateExp(i, {
                      bullets: exp.bullets.map((b, bIdx) => bIdx === bi ? val : b),
                    })}
                    onDelete={() => {
                      pushToHistory(resumeData)
                      updateExp(i, { bullets: exp.bullets.filter((_, bIdx) => bIdx !== bi) })
                    }}
                  />
                ))}
              </div>
              <button
                className={ADD_BTN}
                onClick={() => updateExp(i, { bullets: [...exp.bullets, ''] })}
              >
                <Plus className="w-3 h-3" /> Add bullet
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        className={`${ADD_BTN} w-full justify-center py-3 rounded-xl border border-dashed border-white/[0.08] hover:border-[#6366F1]/40 mb-4`}
        onClick={() => {
          pushToHistory(resumeData)
          onDataChange({
            ...resumeData,
            experience: [
              ...resumeData.experience,
              { id: `exp_${Date.now()}`, company: '', title: '', start: '', end: 'Present', bullets: [''] },
            ],
          })
        }}
      >
        <Plus className="w-3.5 h-3.5" /> Add Position
      </button>

      {/* ── Education ── */}
      <AnimatePresence initial={false}>
        {resumeData.education.map((edu, i) => (
          <motion.div
            key={edu.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            className={SECTION_CARD}
          >
            <div className={SECTION_INNER}>
              <div className="flex items-center justify-between mb-3">
                <p className={SECTION_TITLE}>Education {i + 1}</p>
                <button
                  onClick={() => {
                    pushToHistory(resumeData)
                    onDataChange({
                      ...resumeData,
                      education: resumeData.education.filter((_, idx) => idx !== i),
                    })
                  }}
                  className="text-xs text-[#EF4444]/60 hover:text-[#EF4444] transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Institution</label>
                  <input type="text" className={INPUT_CLASS} value={edu.institution}
                    onChange={(e) => updateEdu(i, { institution: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Degree</label>
                  <input type="text" className={INPUT_CLASS} value={edu.degree}
                    onChange={(e) => updateEdu(i, { degree: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Field of Study</label>
                  <input type="text" className={INPUT_CLASS} value={edu.field}
                    onChange={(e) => updateEdu(i, { field: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Year</label>
                  <input type="text" className={INPUT_CLASS} value={edu.year}
                    placeholder="2025"
                    onChange={(e) => updateEdu(i, { year: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>GPA (optional)</label>
                  <input type="text" className={INPUT_CLASS} value={edu.gpa ?? ''}
                    placeholder="3.8/4.0 — leave blank if below 3.5"
                    onChange={(e) => updateEdu(i, { gpa: e.target.value })} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        className={`${ADD_BTN} w-full justify-center py-3 rounded-xl border border-dashed border-white/[0.08] hover:border-[#6366F1]/40 mb-4`}
        onClick={() => {
          pushToHistory(resumeData)
          onDataChange({
            ...resumeData,
            education: [
              ...resumeData.education,
              { id: `edu_${Date.now()}`, institution: '', degree: '', field: '', year: '' },
            ],
          })
        }}
      >
        <Plus className="w-3.5 h-3.5" /> Add Education
      </button>

      {/* ── Skills ── */}
      <div className={SECTION_CARD}>
        <div className={SECTION_INNER}>
          <p className={SECTION_TITLE}>Skills</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(resumeData.skills ?? []).map((skill, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full
                bg-[#6366F1]/10 border border-[#6366F1]/20 text-xs text-[#A5B4FC]">
                {skill}
                <button
                  onClick={() => {
                    pushToHistory(resumeData)
                    onDataChange({ ...resumeData, skills: resumeData.skills.filter((_, idx) => idx !== i) })
                  }}
                  className="hover:text-[#EF4444] transition-colors"
                  aria-label={`Remove skill ${skill}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
          <SkillInput onAdd={(skill) => {
            if (!resumeData.skills.includes(skill)) {
              onDataChange({ ...resumeData, skills: [...resumeData.skills, skill] })
            }
          }} />
        </div>
      </div>

      {/* ── Certifications ── */}
      {(resumeData.certifications ?? []).length > 0 && (
        <div className={SECTION_CARD}>
          <div className={SECTION_INNER}>
            <p className={SECTION_TITLE}>Certifications</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(resumeData.certifications ?? []).map((cert, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full
                  bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-xs text-[#FCD34D]">
                  {cert}
                  <button
                    onClick={() => {
                      pushToHistory(resumeData)
                      onDataChange({
                        ...resumeData,
                        certifications: (resumeData.certifications ?? []).filter((_, idx) => idx !== i),
                      })
                    }}
                    className="hover:text-[#EF4444] transition-colors"
                    aria-label={`Remove certification ${cert}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <SkillInput onAdd={(cert) => {
              const certs = resumeData.certifications ?? []
              if (!certs.includes(cert)) {
                onDataChange({ ...resumeData, certifications: [...certs, cert] })
              }
            }} />
          </div>
        </div>
      )}

      {/* ── Projects ── */}
      {(resumeData.projects ?? []).length > 0 && (
        <>
          <AnimatePresence initial={false}>
            {(resumeData.projects ?? []).map((proj, i) => (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={SPRING}
                className={SECTION_CARD}
              >
                <div className={SECTION_INNER}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={SECTION_TITLE}>Project {i + 1}</p>
                    <button
                      onClick={() => {
                        pushToHistory(resumeData)
                        onDataChange({
                          ...resumeData,
                          projects: (resumeData.projects ?? []).filter((_, idx) => idx !== i),
                        })
                      }}
                      className="text-xs text-[#EF4444]/60 hover:text-[#EF4444] transition-colors"
                    >
                      Remove project
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={LABEL_CLASS}>Project Name</label>
                      <input type="text" className={INPUT_CLASS} value={proj.name}
                        onChange={(e) => updateProj(i, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>URL (optional)</label>
                      <input type="url" className={INPUT_CLASS} value={proj.url ?? ''}
                        placeholder="https://..."
                        onChange={(e) => updateProj(i, { url: e.target.value })} />
                    </div>
                  </div>
                  <label className={LABEL_CLASS}>Bullets</label>
                  <div className="space-y-2">
                    {(proj.bullets ?? []).map((bullet, bi) => (
                      <BulletRow
                        key={bi}
                        value={stripAITags(bullet)}
                        onChange={(val) => updateProj(i, {
                          bullets: (proj.bullets ?? []).map((b, bIdx) => bIdx === bi ? val : b),
                        })}
                        onDelete={() => {
                          pushToHistory(resumeData)
                          updateProj(i, { bullets: (proj.bullets ?? []).filter((_, bIdx) => bIdx !== bi) })
                        }}
                      />
                    ))}
                  </div>
                  <button className={ADD_BTN}
                    onClick={() => updateProj(i, { bullets: [...(proj.bullets ?? []), ''] })}>
                    <Plus className="w-3 h-3" /> Add bullet
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            className={`${ADD_BTN} w-full justify-center py-3 rounded-xl border border-dashed border-white/[0.08] hover:border-[#6366F1]/40 mb-4`}
            onClick={() => {
              pushToHistory(resumeData)
              onDataChange({
                ...resumeData,
                projects: [
                  ...(resumeData.projects ?? []),
                  { id: `proj_${Date.now()}`, name: '', description: '', url: '', bullets: [''] },
                ],
              })
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </>
      )}

      {/* ── Leadership ── */}
      {(resumeData.leadership ?? []).length > 0 && (
        <>
          <AnimatePresence initial={false}>
            {(resumeData.leadership ?? []).map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={SPRING}
                className={SECTION_CARD}
              >
                <div className={SECTION_INNER}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={SECTION_TITLE}>Leadership {i + 1}</p>
                    <button
                      onClick={() => {
                        pushToHistory(resumeData)
                        onDataChange({
                          ...resumeData,
                          leadership: (resumeData.leadership ?? []).filter((_, idx) => idx !== i),
                        })
                      }}
                      className="text-xs text-[#EF4444]/60 hover:text-[#EF4444] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={LABEL_CLASS}>Role</label>
                      <input type="text" className={INPUT_CLASS} value={lead.role}
                        onChange={(e) => updateLead(i, { role: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Organization</label>
                      <input type="text" className={INPUT_CLASS} value={lead.organization}
                        onChange={(e) => updateLead(i, { organization: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Start Date</label>
                      <input type="text" className={INPUT_CLASS} value={lead.start}
                        onChange={(e) => updateLead(i, { start: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>End Date</label>
                      <input type="text" className={INPUT_CLASS} value={lead.end}
                        onChange={(e) => updateLead(i, { end: e.target.value })} />
                    </div>
                  </div>
                  <label className={LABEL_CLASS}>Bullets</label>
                  <div className="space-y-2">
                    {(lead.bullets ?? []).map((bullet, bi) => (
                      <BulletRow
                        key={bi}
                        value={stripAITags(bullet)}
                        onChange={(val) => updateLead(i, {
                          bullets: (lead.bullets ?? []).map((b, bIdx) => bIdx === bi ? val : b),
                        })}
                        onDelete={() => {
                          pushToHistory(resumeData)
                          updateLead(i, { bullets: (lead.bullets ?? []).filter((_, bIdx) => bIdx !== bi) })
                        }}
                      />
                    ))}
                  </div>
                  <button className={ADD_BTN}
                    onClick={() => updateLead(i, { bullets: [...(lead.bullets ?? []), ''] })}>
                    <Plus className="w-3 h-3" /> Add bullet
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            className={`${ADD_BTN} w-full justify-center py-3 rounded-xl border border-dashed border-white/[0.08] hover:border-[#6366F1]/40 mb-4`}
            onClick={() => {
              pushToHistory(resumeData)
              onDataChange({
                ...resumeData,
                leadership: [
                  ...(resumeData.leadership ?? []),
                  { id: `lead_${Date.now()}`, role: '', organization: '', start: '', end: '', bullets: [''] },
                ],
              })
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Leadership
          </button>
        </>
      )}

      {/* ── Languages ── */}
      {(resumeData.languages ?? []).length > 0 && (
        <div className={SECTION_CARD}>
          <div className={SECTION_INNER}>
            <p className={SECTION_TITLE}>Languages</p>
            {(resumeData.languages ?? []).map((lang, i) => (
              <div key={lang.id} className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  className={`${INPUT_CLASS} flex-1`}
                  value={lang.name}
                  placeholder="Language name"
                  onChange={(e) => onDataChange({
                    ...resumeData,
                    languages: (resumeData.languages ?? []).map((l, idx) =>
                      idx === i ? { ...l, name: e.target.value } : l
                    ),
                  })}
                />
                <select
                  value={lang.proficiency}
                  onChange={(e) => onDataChange({
                    ...resumeData,
                    languages: (resumeData.languages ?? []).map((l, idx) =>
                      idx === i
                        ? { ...l, proficiency: e.target.value as Language['proficiency'] }
                        : l
                    ),
                  })}
                  className="bg-[#0A0A0F] border border-white/[0.08] rounded-lg px-2 py-2
                    text-sm text-white focus:outline-none focus:border-[#6366F1]/50
                    transition-colors flex-shrink-0"
                >
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Basic">Basic</option>
                </select>
                <button
                  onClick={() => {
                    pushToHistory(resumeData)
                    onDataChange({
                      ...resumeData,
                      languages: (resumeData.languages ?? []).filter((_, idx) => idx !== i),
                    })
                  }}
                  className={DELETE_BTN}
                  aria-label={`Remove language ${lang.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              className={ADD_BTN}
              onClick={() => onDataChange({
                ...resumeData,
                languages: [
                  ...(resumeData.languages ?? []),
                  { id: `lang_${Date.now()}`, name: '', proficiency: 'Fluent' },
                ],
              })}
            >
              <Plus className="w-3 h-3" /> Add Language
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
