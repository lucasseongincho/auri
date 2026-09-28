'use client'

import { useT } from '@/lib/i18n/client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Redo2, Undo2, X } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { stripAITags } from '@/lib/resumeHighlight'
import type { Education, Experience, Language, Leadership, PersonalInfo, Project, ResumeData } from '@/types'

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }
const SECTION_CARD = 'rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0 mb-4'
const SECTION_INNER = 'rounded-[10px]  bg-[#FFFFFF] p-5'
const SECTION_TITLE = 'text-xs font-bold uppercase tracking-widest text-[#1F5C4A] mb-4'
const INPUT_CLASS = 'w-full bg-[#F4F2EC] border border-lp-rule rounded-[4px] px-3 py-2 text-sm text-lp-ink placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F5C4A]/50 transition-colors resize-none'
const LABEL_CLASS = 'text-xs text-[#3C403E] mb-1 block'
const ADD_BTN = 'flex items-center gap-1.5 text-xs text-[#1F5C4A] hover:text-[#1F5C4A] transition-colors mt-2'
const DELETE_BTN = 'p-1 rounded-md text-[#5A5F5C] hover:text-[#B42318] hover:bg-[#B42318]/10 transition-all'

interface BulletRowProps {
  value: string
  onChange: (val: string) => void
  onDelete: () => void
  placeholder?: string
}

function BulletRow({ value, onChange, onDelete, placeholder }: BulletRowProps) {
  const t = useT()
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])

  return (
    <div className="flex gap-2 items-start">
      <span className="text-[#5A5F5C] mt-2.5 text-xs flex-shrink-0">·</span>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("Bullet point...")}
        className={`${INPUT_CLASS} flex-1`}
        style={{ overflow: 'hidden', minHeight: '36px' }}
      />
      <button onClick={onDelete} className={DELETE_BTN} aria-label={t("Delete bullet")}>
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function SkillInput({ onAdd }: { onAdd: (s: string) => void }) {
  const t = useT()
  const [val, setVal] = useState('')
  return (
    <input
      type="text"
      className={INPUT_CLASS}
      value={val}
      placeholder={t("Type a skill and press Enter...")}
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
  const t = useT()
  const { pushToHistory, undo, redo, canUndo, canRedo } = useCareerStore()

  useImperativeHandle(syncRef, () => ({ sync: () => {} }), [])

  // One-time migration: move proj.description → bullets[0] so it's editable in the form.
  // Runs once on mount; safe to re-run because description becomes '' after migration.
  const migrationDone = useRef(false)
  useEffect(() => {
    if (migrationDone.current) return
    migrationDone.current = true
    const hasDescriptions = (resumeData.projects ?? []).some((p) => p.description?.trim())
    if (!hasDescriptions) return
    onDataChange({
      ...resumeData,
      projects: (resumeData.projects ?? []).map((p) => {
        if (!p.description?.trim()) return p
        return { ...p, description: '', bullets: [p.description.trim(), ...(p.bullets ?? [])] }
      }),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        <div className="flex items-center gap-1 p-0 rounded-[4px] bg-[#FFFFFF] border border-lp-rule">
          <button
            onClick={handleUndo}
            disabled={!canUndo()}
            aria-label={t("Undo (Ctrl+Z)")}
            title={t("Undo (Ctrl+Z)")}
            className="p-1.5 rounded-md text-[#5A5F5C] hover:text-lp-ink hover:bg-lp-ink/5
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo()}
            aria-label={t("Redo (Ctrl+Y)")}
            title={t("Redo (Ctrl+Y)")}
            className="p-1.5 rounded-md text-[#5A5F5C] hover:text-lp-ink hover:bg-lp-ink/5
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-[#5A5F5C]">{t("Structured editor · Changes update the preview instantly")}</span>
      </div>

      {/* ── Summary ── */}
      <div className={SECTION_CARD}>
        <div className={SECTION_INNER}>
          <p className={SECTION_TITLE}>{t("Summary")}</p>
          <textarea
            className={INPUT_CLASS}
            rows={3}
            value={stripAITags(resumeData.summary ?? '')}
            onChange={(e) => onDataChange({ ...resumeData, summary: e.target.value })}
            placeholder={t("Professional summary...")}
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
                <p className={SECTION_TITLE}>{t("Experience {v0}", { v0: i + 1 })}</p>
                <button
                  onClick={() => {
                    pushToHistory(resumeData)
                    onDataChange({
                      ...resumeData,
                      experience: resumeData.experience.filter((_, idx) => idx !== i),
                    })
                  }}
                  className="text-xs text-[#B42318]/60 hover:text-[#B42318] transition-colors"
                >
                  {t("Remove position")}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={LABEL_CLASS}>{t("Job Title")}</label>
                  <input type="text" className={INPUT_CLASS} value={exp.title}
                    onChange={(e) => updateExp(i, { title: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>{t("Company")}</label>
                  <input type="text" className={INPUT_CLASS} value={exp.company}
                    onChange={(e) => updateExp(i, { company: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>{t("Start Date")}</label>
                  <input type="text" className={INPUT_CLASS} value={exp.start}
                    placeholder={t("Jan 2023")}
                    onChange={(e) => updateExp(i, { start: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>{t("End Date")}</label>
                  <input type="text" className={INPUT_CLASS} value={exp.end}
                    placeholder={t("Present")}
                    onChange={(e) => updateExp(i, { end: e.target.value })} />
                </div>
              </div>

              <label className={LABEL_CLASS}>{t("Bullets")}</label>
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
                <Plus className="w-3 h-3" />{' '}{t("Add bullet")}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        className={`${ADD_BTN} w-full justify-center py-3 rounded-[10px] border border-dashed border-lp-rule hover:border-[#1F5C4A]/40 mb-4`}
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
        <Plus className="w-3.5 h-3.5" />{' '}{t("Add Position")}
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
                <p className={SECTION_TITLE}>{t("Education {v0}", { v0: i + 1 })}</p>
                <button
                  onClick={() => {
                    pushToHistory(resumeData)
                    onDataChange({
                      ...resumeData,
                      education: resumeData.education.filter((_, idx) => idx !== i),
                    })
                  }}
                  className="text-xs text-[#B42318]/60 hover:text-[#B42318] transition-colors"
                >
                  {t("Remove")}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>{t("Institution")}</label>
                  <input type="text" className={INPUT_CLASS} value={edu.institution}
                    onChange={(e) => updateEdu(i, { institution: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>{t("Degree")}</label>
                  <input type="text" className={INPUT_CLASS} value={edu.degree}
                    onChange={(e) => updateEdu(i, { degree: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>{t("Field of Study")}</label>
                  <input type="text" className={INPUT_CLASS} value={edu.field}
                    onChange={(e) => updateEdu(i, { field: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>{t("Year")}</label>
                  <input type="text" className={INPUT_CLASS} value={edu.year}
                    placeholder="2025"
                    onChange={(e) => updateEdu(i, { year: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>{t("GPA (optional)")}</label>
                  <input type="text" className={INPUT_CLASS} value={edu.gpa ?? ''}
                    placeholder={t("3.8/4.0 — leave blank if below 3.5")}
                    onChange={(e) => updateEdu(i, { gpa: e.target.value })} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        className={`${ADD_BTN} w-full justify-center py-3 rounded-[10px] border border-dashed border-lp-rule hover:border-[#1F5C4A]/40 mb-4`}
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
        <Plus className="w-3.5 h-3.5" />{' '}{t("Add Education")}
      </button>

      {/* ── Skills ── */}
      <div className={SECTION_CARD}>
        <div className={SECTION_INNER}>
          <p className={SECTION_TITLE}>{t("Skills")}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(resumeData.skills ?? []).map((skill, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full
                bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-xs text-[#1F5C4A]">
                {skill}
                <button
                  onClick={() => {
                    pushToHistory(resumeData)
                    onDataChange({ ...resumeData, skills: resumeData.skills.filter((_, idx) => idx !== i) })
                  }}
                  className="hover:text-[#B42318] transition-colors"
                  aria-label={t("Remove skill {skill}", { skill })}
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
            <p className={SECTION_TITLE}>{t("Certifications")}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(resumeData.certifications ?? []).map((cert, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full
                  bg-[#8A5A00]/10 border border-[#8A5A00]/20 text-xs text-[#8A5A00]">
                  {cert}
                  <button
                    onClick={() => {
                      pushToHistory(resumeData)
                      onDataChange({
                        ...resumeData,
                        certifications: (resumeData.certifications ?? []).filter((_, idx) => idx !== i),
                      })
                    }}
                    className="hover:text-[#B42318] transition-colors"
                    aria-label={t("Remove certification {cert}", { cert })}
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
                    <p className={SECTION_TITLE}>{t("Project {v0}", { v0: i + 1 })}</p>
                    <button
                      onClick={() => {
                        pushToHistory(resumeData)
                        onDataChange({
                          ...resumeData,
                          projects: (resumeData.projects ?? []).filter((_, idx) => idx !== i),
                        })
                      }}
                      className="text-xs text-[#B42318]/60 hover:text-[#B42318] transition-colors"
                    >
                      {t("Remove project")}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={LABEL_CLASS}>{t("Project Name")}</label>
                      <input type="text" className={INPUT_CLASS} value={proj.name}
                        onChange={(e) => updateProj(i, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>{t("URL (optional)")}</label>
                      <input type="url" className={INPUT_CLASS} value={proj.url ?? ''}
                        placeholder="https://..."
                        onChange={(e) => updateProj(i, { url: e.target.value })} />
                    </div>
                  </div>
                  <label className={LABEL_CLASS}>{t("Bullets")}</label>
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
                    <Plus className="w-3 h-3" />{' '}{t("Add bullet")}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            className={`${ADD_BTN} w-full justify-center py-3 rounded-[10px] border border-dashed border-lp-rule hover:border-[#1F5C4A]/40 mb-4`}
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
            <Plus className="w-3.5 h-3.5" />{' '}{t("Add Project")}
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
                    <p className={SECTION_TITLE}>{t("Leadership {v0}", { v0: i + 1 })}</p>
                    <button
                      onClick={() => {
                        pushToHistory(resumeData)
                        onDataChange({
                          ...resumeData,
                          leadership: (resumeData.leadership ?? []).filter((_, idx) => idx !== i),
                        })
                      }}
                      className="text-xs text-[#B42318]/60 hover:text-[#B42318] transition-colors"
                    >
                      {t("Remove")}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={LABEL_CLASS}>{t("Role")}</label>
                      <input type="text" className={INPUT_CLASS} value={lead.role}
                        onChange={(e) => updateLead(i, { role: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>{t("Organization")}</label>
                      <input type="text" className={INPUT_CLASS} value={lead.organization}
                        onChange={(e) => updateLead(i, { organization: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>{t("Start Date")}</label>
                      <input type="text" className={INPUT_CLASS} value={lead.start}
                        onChange={(e) => updateLead(i, { start: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>{t("End Date")}</label>
                      <input type="text" className={INPUT_CLASS} value={lead.end}
                        onChange={(e) => updateLead(i, { end: e.target.value })} />
                    </div>
                  </div>
                  <label className={LABEL_CLASS}>{t("Bullets")}</label>
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
                    <Plus className="w-3 h-3" />{' '}{t("Add bullet")}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            className={`${ADD_BTN} w-full justify-center py-3 rounded-[10px] border border-dashed border-lp-rule hover:border-[#1F5C4A]/40 mb-4`}
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
            <Plus className="w-3.5 h-3.5" />{' '}{t("Add Leadership")}
          </button>
        </>
      )}

      {/* ── Languages ── */}
      {(resumeData.languages ?? []).length > 0 && (
        <div className={SECTION_CARD}>
          <div className={SECTION_INNER}>
            <p className={SECTION_TITLE}>{t("Languages")}</p>
            {(resumeData.languages ?? []).map((lang, i) => (
              <div key={lang.id} className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  className={`${INPUT_CLASS} flex-1`}
                  value={lang.name}
                  placeholder={t("Language name")}
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
                  className="bg-[#F4F2EC] border border-lp-rule rounded-[4px] px-2 py-2
                    text-sm text-lp-ink focus:outline-none focus:border-[#1F5C4A]/50
                    transition-colors flex-shrink-0"
                >
                  <option value="Native">{t("Native")}</option>
                  <option value="Fluent">{t("Fluent")}</option>
                  <option value="Intermediate">{t("Intermediate")}</option>
                  <option value="Basic">{t("Basic")}</option>
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
                  aria-label={t("Remove language {v0}", { v0: lang.name })}
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
              <Plus className="w-3 h-3" />{' '}{t("Add Language")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
