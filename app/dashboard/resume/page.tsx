'use client'

import { useT } from '@/lib/i18n/client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, CheckCircle, X, Eye, EyeOff, AlertCircle, Heart, Languages, Zap } from 'lucide-react'
import { IconAiMark, IconCerts, IconEducation, IconExperience, IconExtra, IconLoading, IconMyResumes, IconPersonal, IconProjects, IconResumeBuilder, IconSkills, IconTargetJob } from '@/components/icons'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { useLetterScale } from '@/hooks/useLetterScale'
import { saveResume } from '@/lib/firestore'
import { stripAllAITags } from '@/lib/resumeHighlight'
import ResumePreview from '@/components/resume/ResumePreview'
import ResumeEditor from '@/components/resume/ResumeEditor'
import ATSScorePanel from '@/components/resume/ATSScorePanel'
import SectionAnalysisPanel from '@/components/resume/SectionAnalysisPanel'
import RequirementCoveragePanel from '@/components/resume/RequirementCoveragePanel'
import type {
  Experience,
  Education,
  Leadership,
  Volunteer,
  Language,
  Project,
  ResumeData,
  ATSScore,
  RequirementCoverage,
} from '@/types'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import CompanyAutocomplete from '@/components/ui/CompanyAutocomplete'

// ─── Constants ───────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const STEPS = [
  { id: 1, label: 'Personal', icon: IconPersonal },
  { id: 2, label: 'Experience', icon: IconExperience },
  { id: 3, label: 'Education', icon: IconEducation },
  { id: 4, label: 'Skills', icon: IconSkills },
  { id: 5, label: 'Certifications', icon: IconCerts },
  { id: 6, label: 'Projects', icon: IconProjects },
  { id: 7, label: 'Extra', icon: IconExtra },
  { id: 8, label: 'Target Job', icon: IconTargetJob },
] as const

// ─── Plain-text builder (used for ATS scoring) ────────────────────────────────

function buildPlainText(
  data: ResumeData,
  personal: { name?: string; email?: string; phone?: string; location?: string }
): string {
  const lines: string[] = []
  if (personal.name) lines.push(personal.name)
  const contact = [personal.email, personal.phone, personal.location].filter(Boolean).join(' | ')
  if (contact) lines.push(contact)
  if (data.summary) lines.push('', 'SUMMARY', data.summary)
  if (data.experience?.length) {
    lines.push('', 'EXPERIENCE')
    for (const exp of data.experience) {
      lines.push(`${exp.title} at ${exp.company} (${exp.start} – ${exp.end})`)
      for (const b of (exp.bullets ?? [])) lines.push(`• ${b}`)
    }
  }
  if (data.education?.length) {
    lines.push('', 'EDUCATION')
    for (const edu of data.education)
      lines.push(`${edu.degree} in ${edu.field}, ${edu.institution} (${edu.year})`)
  }
  if (data.skills?.length) lines.push('', 'SKILLS', data.skills.join(', '))
  if (data.certifications?.length) lines.push('', 'CERTIFICATIONS', data.certifications.join(', '))
  if (data.projects?.length) {
    lines.push('', 'PROJECTS')
    for (const p of data.projects) {
      lines.push(p.name)
      for (const b of (p.bullets ?? [])) lines.push(`• ${b}`)
    }
  }
  return lines.join('\n').trim()
}

// ─── ID generator (nanoid-style) ──────────────────────────────────────────────

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ─── Input component (shared style) ──────────────────────────────────────────

const INPUT_CLASS =
  'w-full bg-[#F4F2EC] border border-lp-rule rounded-[4px] px-4 py-3 text-lp-ink text-sm placeholder-[#5A5F5C] focus:outline-none focus:border-[#1F5C4A]/50 focus:ring-1 focus:ring-[#1F5C4A]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#3C403E] mb-1.5'
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

function Field({ label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required && <span className="text-[#B42318] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-[#B42318] flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Step 1: Personal Info ────────────────────────────────────────────────────

interface Step1Errors {
  name?: string
  email?: string
}

function StepPersonal({
  errors,
}: {
  errors: Step1Errors
}) {
  const t = useT()
  const { profile, updateProfile } = useCareerStore()
  const personal = profile?.personal ?? {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    website: '',
    github: '',
    portfolioLabel: '',
  }

  const update = (key: keyof typeof personal, value: string) => {
    updateProfile({ personal: { ...personal, [key]: value } })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("Full Name")} required error={errors.name}>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder={t("Jane Smith")}
            value={personal.name}
            onChange={(e) => update('name', e.target.value)}
            aria-label={t("Full name")}
          />
        </Field>
        <Field label={t("Email Address")} required error={errors.email}>
          <input
            type="email"
            className={INPUT_CLASS}
            placeholder={t("jane@example.com")}
            value={personal.email}
            onChange={(e) => update('email', e.target.value)}
            aria-label={t("Email address")}
          />
        </Field>
        <Field label={t("Phone Number")}>
          <input
            type="tel"
            className={INPUT_CLASS}
            placeholder="+1 (555) 000-0000"
            value={personal.phone}
            onChange={(e) => update('phone', e.target.value)}
            aria-label={t("Phone number")}
          />
        </Field>
        <Field label={t("Location")}>
          <LocationAutocomplete value={personal.location} onChange={(v) => update('location', v)} placeholder={t("New York, NY")} className={INPUT_CLASS} aria-label={t("Location")} />
        </Field>
        <Field label={t("LinkedIn URL")}>
          <input
            type="url"
            className={INPUT_CLASS}
            placeholder="https://linkedin.com/in/janesmith"
            value={personal.linkedin_url}
            onChange={(e) => update('linkedin_url', e.target.value)}
            aria-label={t("LinkedIn URL")}
          />
        </Field>
        <Field label={t("GitHub URL")}>
          <input
            type="url"
            className={INPUT_CLASS}
            placeholder="https://github.com/username"
            value={personal.github ?? ''}
            onChange={(e) => update('github', e.target.value)}
            aria-label={t("GitHub URL")}
          />
        </Field>
        <Field label={t("Website / Portfolio URL")}>
          <input
            type="url"
            className={INPUT_CLASS}
            placeholder="https://janesmith.dev"
            value={personal.website}
            onChange={(e) => update('website', e.target.value)}
            aria-label={t("Website or portfolio URL")}
          />
        </Field>
        <Field label={t("Portfolio Link Label")}>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder={t("Portfolio")}
            value={personal.portfolioLabel ?? ''}
            onChange={(e) => update('portfolioLabel', e.target.value)}
            aria-label={t("Portfolio link label")}
          />
          <p className="mt-1.5 text-[11px] text-[#5A5F5C]">
            {t("This is what people will see as the link text (default: \"Portfolio\")")}
          </p>
        </Field>
      </div>
    </div>
  )
}

// ─── Step 2: Work Experience ──────────────────────────────────────────────────

interface Step2Errors {
  experience?: string
}

function StepExperience({ errors }: { errors: Step2Errors }) {
  const t = useT()
  const { profile, updateProfile } = useCareerStore()
  const experiences: Experience[] = profile?.experience ?? []

  const addExperience = () => {
    const blank: Experience = {
      id: genId(),
      company: '',
      title: '',
      start: '',
      end: '',
      bullets: [''],
    }
    updateProfile({ experience: [...experiences, blank] })
  }

  const removeExperience = (id: string) => {
    updateProfile({ experience: experiences.filter((e) => e.id !== id) })
  }

  const updateExp = (id: string, key: keyof Experience, value: string | string[]) => {
    updateProfile({
      experience: experiences.map((e) =>
        e.id === id ? { ...e, [key]: value } : e
      ),
    })
  }

  const updateBullets = (id: string, raw: string) => {
    const bullets = raw.split('\n').map((b) => b.trim()).filter(Boolean)
    updateExp(id, 'bullets', bullets.length > 0 ? bullets : [''])
  }

  return (
    <div className="space-y-4">
      {errors.experience && (
        <p className="text-xs text-[#B42318] flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {errors.experience}
        </p>
      )}

      <AnimatePresence initial={false}>
        {experiences.map((exp, idx) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
          >
            <div className="rounded-[10px]  bg-[#FFFFFF] p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#1F5C4A] uppercase tracking-wide">
                  {t("Position {v0}", { v0: idx + 1 })}
                </span>
                <button
                  onClick={() => removeExperience(exp.id)}
                  aria-label={t("Remove experience {v0}", { v0: idx + 1 })}
                  className="p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-[#B42318] hover:bg-[#B42318]/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t("Job Title")}>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder={t("Software Engineer")}
                    value={exp.title}
                    onChange={(e) => updateExp(exp.id, 'title', e.target.value)}
                    aria-label={t("Job title for position {v0}", { v0: idx + 1 })}
                  />
                </Field>
                <Field label={t("Company")}>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder={t("Acme Corp")}
                    value={exp.company}
                    onChange={(e) => updateExp(exp.id, 'company', e.target.value)}
                    aria-label={t("Company name for position {v0}", { v0: idx + 1 })}
                  />
                </Field>
                <Field label={t("Start Date")}>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder={t("Jan 2022")}
                    value={exp.start}
                    onChange={(e) => updateExp(exp.id, 'start', e.target.value)}
                    aria-label={t("Start date for position {v0}", { v0: idx + 1 })}
                  />
                </Field>
                <Field label={t("End Date")}>
                  <div className="space-y-2">
                    <input
                      type="text"
                      className={INPUT_CLASS}
                      placeholder={t("Dec 2023")}
                      value={exp.end === 'Present' ? '' : exp.end}
                      disabled={exp.end === 'Present'}
                      onChange={(e) => updateExp(exp.id, 'end', e.target.value)}
                      aria-label={t("End date for position {v0}", { v0: idx + 1 })}
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.end === 'Present'}
                        onChange={(e) =>
                          updateExp(exp.id, 'end', e.target.checked ? 'Present' : '')
                        }
                        className="w-3.5 h-3.5 rounded accent-[#1F5C4A]"
                        aria-label={t("Currently working here for position {v0}", { v0: idx + 1 })}
                      />
                      <span className="text-xs text-[#3C403E]">{t("Currently working here")}</span>
                    </label>
                  </div>
                </Field>
              </div>

              <Field label={t("Achievements / Bullets (one per line — AI will rewrite these)")}>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder={t("Led a team of 5 engineers\nIncreased system performance by 40%\nBuilt payment integration")}
                  value={exp.bullets.join('\n')}
                  onChange={(e) => updateBullets(exp.id, e.target.value)}
                  aria-label={t("Achievements for position {v0}", { v0: idx + 1 })}
                />
              </Field>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        onClick={addExperience}
        aria-label={t("Add another experience entry")}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px]
          border border-dashed border-lp-rule text-[#3C403E] text-sm
          hover:border-[#1F5C4A]/40 hover:text-[#1F5C4A] hover:bg-[#1F5C4A]/5
          transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        {t("Add Experience")}
      </button>
    </div>
  )
}

// ─── Step 3: Education ────────────────────────────────────────────────────────

function EducationCard({
  edu,
  idx,
  onUpdate,
  onRemove,
}: {
  edu: Education
  idx: number
  onUpdate: (patch: Partial<Education>) => void
  onRemove: () => void
}) {
  const t = useT()
  const [majorInput, setMajorInput] = useState('')
  const [minorInput, setMinorInput] = useState('')

  const addMajor = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    const existing = edu.additionalMajors ?? []
    if (!existing.includes(trimmed)) {
      onUpdate({ additionalMajors: [...existing, trimmed] })
    }
    setMajorInput('')
  }

  const removeMajor = (major: string) => {
    onUpdate({ additionalMajors: (edu.additionalMajors ?? []).filter((m) => m !== major) })
  }

  const addMinor = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    const existing = edu.minors ?? []
    if (!existing.includes(trimmed)) {
      onUpdate({ minors: [...existing, trimmed] })
    }
    setMinorInput('')
  }

  const removeMinor = (minor: string) => {
    onUpdate({ minors: (edu.minors ?? []).filter((m) => m !== minor) })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={SPRING}
      className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
    >
      <div className="rounded-[10px]  bg-[#FFFFFF] p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-[#1F5C4A] uppercase tracking-wide">
            {t("Education {v0}", { v0: idx + 1 })}
          </span>
          <button
            onClick={onRemove}
            aria-label={t("Remove education {v0}", { v0: idx + 1 })}
            className="p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-[#B42318] hover:bg-[#B42318]/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("Institution")}>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder={t("MIT")}
              value={edu.institution}
              onChange={(e) => onUpdate({ institution: e.target.value })}
              aria-label={t("Institution for education {v0}", { v0: idx + 1 })}
            />
          </Field>
          <Field label={t("Degree")}>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder={t("Bachelor of Science")}
              value={edu.degree}
              onChange={(e) => onUpdate({ degree: e.target.value })}
              aria-label={t("Degree for education {v0}", { v0: idx + 1 })}
            />
          </Field>
          <Field label={t("Primary Major / Field of Study")}>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder={t("Computer Science")}
              value={edu.field}
              onChange={(e) => onUpdate({ field: e.target.value })}
              aria-label={t("Field of study for education {v0}", { v0: idx + 1 })}
            />
          </Field>
          <Field label={t("Graduation Year")}>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder="2021"
              value={edu.year}
              onChange={(e) => onUpdate({ year: e.target.value })}
              aria-label={t("Graduation year for education {v0}", { v0: idx + 1 })}
            />
          </Field>
          <Field label={t("GPA (optional — omit if below 3.5)")}>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder="3.8/4.0"
              value={edu.gpa ?? ''}
              onChange={(e) => onUpdate({ gpa: e.target.value })}
              aria-label={t("GPA for education {v0}", { v0: idx + 1 })}
            />
          </Field>
        </div>

        <Field label={t("Additional Major(s) — press Enter or comma to add")}>
          <div className="flex gap-2">
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder={t("e.g. Mathematics")}
              value={majorInput}
              onChange={(e) => setMajorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addMajor(majorInput)
                }
              }}
              aria-label={t("Additional major for education {v0}", { v0: idx + 1 })}
            />
            <button
              onClick={() => addMajor(majorInput)}
              aria-label={t("Add additional major")}
              className="px-4 py-3 rounded-[4px] bg-[#1F5C4A]/20 border border-[#1F5C4A]/30
                text-[#1F5C4A] text-sm font-medium hover:bg-[#1F5C4A]/30 transition-all flex-shrink-0"
            >
              {t("Add")}
            </button>
          </div>
          {(edu.additionalMajors?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <AnimatePresence initial={false}>
                {(edu.additionalMajors ?? []).map((major) => (
                  <motion.span
                    key={major}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full
                      bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A] text-xs font-medium"
                  >
                    {major}
                    <button
                      onClick={() => removeMajor(major)}
                      aria-label={t("Remove major {major}", { major })}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#1F5C4A]/30 transition-all"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Field>

        <Field label={t("Minor(s) — press Enter or comma to add")}>
          <div className="flex gap-2">
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder={t("e.g. Statistics")}
              value={minorInput}
              onChange={(e) => setMinorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addMinor(minorInput)
                }
              }}
              aria-label={t("Minor for education {v0}", { v0: idx + 1 })}
            />
            <button
              onClick={() => addMinor(minorInput)}
              aria-label={t("Add minor")}
              className="px-4 py-3 rounded-[4px] bg-[#1F5C4A]/20 border border-[#1F5C4A]/30
                text-[#1F5C4A] text-sm font-medium hover:bg-[#1F5C4A]/30 transition-all flex-shrink-0"
            >
              {t("Add")}
            </button>
          </div>
          {(edu.minors?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <AnimatePresence initial={false}>
                {(edu.minors ?? []).map((minor) => (
                  <motion.span
                    key={minor}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full
                      bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A] text-xs font-medium"
                  >
                    {minor}
                    <button
                      onClick={() => removeMinor(minor)}
                      aria-label={t("Remove minor {minor}", { minor })}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#1F5C4A]/30 transition-all"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Field>
      </div>
    </motion.div>
  )
}

function StepEducation() {
  const t = useT()
  const { profile, updateProfile } = useCareerStore()
  const educations: Education[] = profile?.education ?? []

  const addEducation = () => {
    const blank: Education = {
      id: genId(),
      institution: '',
      degree: '',
      field: '',
      year: '',
    }
    updateProfile({ education: [...educations, blank] })
  }

  const removeEducation = (id: string) => {
    updateProfile({ education: educations.filter((e) => e.id !== id) })
  }

  const updateEdu = (id: string, patch: Partial<Education>) => {
    updateProfile({
      education: educations.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    })
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {educations.map((edu, idx) => (
          <EducationCard
            key={edu.id}
            edu={edu}
            idx={idx}
            onUpdate={(patch) => updateEdu(edu.id, patch)}
            onRemove={() => removeEducation(edu.id)}
          />
        ))}
      </AnimatePresence>

      <button
        onClick={addEducation}
        aria-label={t("Add another education entry")}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px]
          border border-dashed border-lp-rule text-[#3C403E] text-sm
          hover:border-[#1F5C4A]/40 hover:text-[#1F5C4A] hover:bg-[#1F5C4A]/5
          transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        {t("Add Education")}
      </button>
    </div>
  )
}

// ─── Step 4: Skills ───────────────────────────────────────────────────────────

function StepSkills() {
  const t = useT()
  const { profile, updateProfile } = useCareerStore()
  const skills: string[] = profile?.skills ?? []
  const [input, setInput] = useState('')

  const addSkill = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    // Accept comma-separated batch input
    const newSkills = trimmed
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !skills.includes(s))
    if (newSkills.length) {
      updateProfile({ skills: [...skills, ...newSkills] })
    }
    setInput('')
  }

  const removeSkill = (skill: string) => {
    updateProfile({ skills: skills.filter((s) => s !== skill) })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(input)
    }
  }

  return (
    <div className="space-y-4">
      <Field label={t("Add Skills (press Enter or comma to add)")}>
        <div className="flex gap-2">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder={t("e.g. React, TypeScript, Node.js")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t("Add a skill")}
          />
          <button
            onClick={() => addSkill(input)}
            aria-label={t("Add skill")}
            className="px-4 py-3 rounded-[4px] bg-[#1F5C4A]/20 border border-[#1F5C4A]/30
              text-[#1F5C4A] text-sm font-medium hover:bg-[#1F5C4A]/30 transition-all
              flex-shrink-0"
          >
            {t("Add")}
          </button>
        </div>
      </Field>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {skills.map((skill) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={SPRING}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full
                  bg-[#1F5C4A]/10 border border-[#1F5C4A]/20 text-[#1F5C4A] text-xs font-medium"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  aria-label={t("Remove skill {skill}", { skill })}
                  className="w-4 h-4 rounded-full flex items-center justify-center
                    hover:bg-[#1F5C4A]/30 transition-all"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-[#5A5F5C] text-center py-4">
          {t("No skills added yet. Type above and press Enter.")}
        </p>
      )}
    </div>
  )
}

// ─── Step 5: Certifications ───────────────────────────────────────────────────

function StepCertifications() {
  const t = useT()
  const { profile, updateProfile } = useCareerStore()
  const certifications: string[] = profile?.certifications ?? []
  const [input, setInput] = useState('')

  const addCert = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed || certifications.includes(trimmed)) return
    updateProfile({ certifications: [...certifications, trimmed] })
    setInput('')
  }

  const removeCert = (cert: string) => {
    updateProfile({ certifications: certifications.filter((c) => c !== cert) })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCert(input)
    }
  }

  return (
    <div className="space-y-4">
      <Field label={t("Add Certification (press Enter to add)")}>
        <div className="flex gap-2">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder={t("e.g. AWS Certified Developer")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t("Add a certification")}
          />
          <button
            onClick={() => addCert(input)}
            aria-label={t("Add certification")}
            className="px-4 py-3 rounded-[4px] bg-[#1F5C4A]/20 border border-[#1F5C4A]/30
              text-[#1F5C4A] text-sm font-medium hover:bg-[#1F5C4A]/30 transition-all
              flex-shrink-0"
          >
            {t("Add")}
          </button>
        </div>
      </Field>

      {certifications.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {certifications.map((cert) => (
              <motion.div
                key={cert}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={SPRING}
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-[4px]
                  bg-[#F4F2EC] border border-lp-rule"
              >
                <div className="flex items-center gap-2">
                  <IconCerts className="w-3.5 h-3.5 text-[#8A5A00] flex-shrink-0" />
                  <span className="text-sm text-lp-ink">{cert}</span>
                </div>
                <button
                  onClick={() => removeCert(cert)}
                  aria-label={t("Remove certification {cert}", { cert })}
                  className="p-1 rounded-[4px] text-[#5A5F5C] hover:text-[#B42318]
                    hover:bg-[#B42318]/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-[#5A5F5C] text-center py-4">
          {t("No certifications added yet — this section is optional.")}
        </p>
      )}
    </div>
  )
}

// ─── Step 6: Projects ─────────────────────────────────────────────────────────

function StepProjects() {
  const t = useT()
  const { profile, updateProfile } = useCareerStore()
  const projects: Project[] = profile?.projects ?? []

  // Migrate any existing description → first bullet, matching ResumeEditor behavior
  const migrationDone = useRef(false)
  useEffect(() => {
    if (migrationDone.current) return
    migrationDone.current = true
    const hasDescriptions = projects.some((p) => p.description?.trim())
    if (!hasDescriptions) return
    updateProfile({
      projects: projects.map((p) => {
        if (!p.description?.trim()) return p
        return { ...p, description: '', bullets: [p.description.trim(), ...(p.bullets ?? [])] }
      }),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addProject = () => {
    const blank: Project = {
      id: genId(),
      name: '',
      description: '',
      url: '',
      bullets: [''],
    }
    updateProfile({ projects: [...projects, blank] })
  }

  const removeProject = (id: string) => {
    updateProfile({ projects: projects.filter((p) => p.id !== id) })
  }

  const updateProj = (id: string, key: keyof Project, value: string | string[]) => {
    updateProfile({
      projects: projects.map((p) =>
        p.id === id ? { ...p, [key]: value } : p
      ),
    })
  }

  const updateBullets = (id: string, raw: string) => {
    const bullets = raw.split('\n').map((b) => b.trim()).filter(Boolean)
    updateProj(id, 'bullets', bullets.length > 0 ? bullets : [''])
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {projects.map((proj, idx) => (
          <motion.div
            key={proj.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
          >
            <div className="rounded-[10px]  bg-[#FFFFFF] p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#1F5C4A] uppercase tracking-wide">
                  {t("Project {v0}", { v0: idx + 1 })}
                </span>
                <button
                  onClick={() => removeProject(proj.id)}
                  aria-label={t("Remove project {v0}", { v0: idx + 1 })}
                  className="p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-[#B42318] hover:bg-[#B42318]/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t("Project Name")}>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder={t("My SaaS App")}
                    value={proj.name}
                    onChange={(e) => updateProj(proj.id, 'name', e.target.value)}
                    aria-label={t("Project name for project {v0}", { v0: idx + 1 })}
                  />
                </Field>
                <Field label={t("URL (optional)")}>
                  <input
                    type="url"
                    className={INPUT_CLASS}
                    placeholder="https://myapp.com"
                    value={proj.url ?? ''}
                    onChange={(e) => updateProj(proj.id, 'url', e.target.value)}
                    aria-label={t("Project URL for project {v0}", { v0: idx + 1 })}
                  />
                </Field>
              </div>
              <Field label={t("Key Points / Bullets (one per line)")}>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={3}
                  placeholder={t("Built with React and Node.js\nGrew to 1,000+ users in 3 months")}
                  value={proj.bullets.join('\n')}
                  onChange={(e) => updateBullets(proj.id, e.target.value)}
                  aria-label={t("Bullets for project {v0}", { v0: idx + 1 })}
                />
              </Field>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        onClick={addProject}
        aria-label={t("Add another project")}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px]
          border border-dashed border-lp-rule text-[#3C403E] text-sm
          hover:border-[#1F5C4A]/40 hover:text-[#1F5C4A] hover:bg-[#1F5C4A]/5
          transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        {t("Add Project")}
      </button>
    </div>
  )
}

// ─── Step 7: Leadership / Volunteer / Languages ───────────────────────────────

const PROFICIENCY_LEVELS: Language['proficiency'][] = ['Native', 'Fluent', 'Intermediate', 'Basic']

function StepAdditional() {
  const t = useT()
  const { profile, updateProfile } = useCareerStore()
  const leadershipList: Leadership[] = profile?.leadership ?? []
  const volunteerList: Volunteer[] = profile?.volunteer ?? []
  const languageList: Language[] = profile?.languages ?? []

  // ── Leadership ──
  const addLeadership = () =>
    updateProfile({ leadership: [...leadershipList, { id: genId(), role: '', organization: '', start: '', end: '', bullets: [''] }] })
  const removeLeadership = (id: string) =>
    updateProfile({ leadership: leadershipList.filter((l) => l.id !== id) })
  const updateLeadership = (id: string, key: keyof Leadership, value: string | string[]) =>
    updateProfile({ leadership: leadershipList.map((l) => l.id === id ? { ...l, [key]: value } : l) })
  const updateLeadershipBullets = (id: string, raw: string) => {
    const bullets = raw.split('\n').map((b) => b.trim()).filter(Boolean)
    updateLeadership(id, 'bullets', bullets.length ? bullets : [''])
  }

  // ── Volunteer ──
  const addVolunteer = () =>
    updateProfile({ volunteer: [...volunteerList, { id: genId(), role: '', organization: '', date: '', description: '' }] })
  const removeVolunteer = (id: string) =>
    updateProfile({ volunteer: volunteerList.filter((v) => v.id !== id) })
  const updateVolunteer = (id: string, key: keyof Volunteer, value: string) =>
    updateProfile({ volunteer: volunteerList.map((v) => v.id === id ? { ...v, [key]: value } : v) })

  // ── Languages ──
  const addLanguage = () =>
    updateProfile({ languages: [...languageList, { id: genId(), name: '', proficiency: 'Fluent' }] })
  const removeLanguage = (id: string) =>
    updateProfile({ languages: languageList.filter((l) => l.id !== id) })
  const updateLanguage = (id: string, key: keyof Language, value: string) =>
    updateProfile({ languages: languageList.map((l) => l.id === id ? { ...l, [key]: value } : l) })

  return (
    <div className="space-y-6">
      <p className="text-xs text-[#3C403E]">
        {t("All sections below are optional. They appear on the resume only if you add data.")}
      </p>

      {/* Leadership */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <IconExtra className="w-4 h-4 text-[#1F5C4A]" />
          <span className="text-sm font-semibold text-lp-ink">{t("Leadership Experience")}</span>
        </div>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {leadershipList.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={SPRING}
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                <div className="rounded-[10px]  bg-[#FFFFFF] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1F5C4A] uppercase tracking-wide">{t("Leadership {v0}", { v0: idx + 1 })}</span>
                    <button onClick={() => removeLeadership(item.id)} aria-label={t("Remove leadership {v0}", { v0: idx + 1 })}
                      className="p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-[#B42318] hover:bg-[#B42318]/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={t("Role")}><input type="text" className={INPUT_CLASS} placeholder={t("President")} value={item.role}
                      onChange={(e) => updateLeadership(item.id, 'role', e.target.value)} aria-label={t("Leadership role")} /></Field>
                    <Field label={t("Organization")}><input type="text" className={INPUT_CLASS} placeholder={t("Student Government")}
                      value={item.organization} onChange={(e) => updateLeadership(item.id, 'organization', e.target.value)} aria-label={t("Organization")} /></Field>
                    <Field label={t("Start Date")}><input type="text" className={INPUT_CLASS} placeholder={t("Sep 2022")}
                      value={item.start} onChange={(e) => updateLeadership(item.id, 'start', e.target.value)} aria-label={t("Start date")} /></Field>
                    <Field label={t("End Date")}><input type="text" className={INPUT_CLASS} placeholder={t("May 2023 or Present")}
                      value={item.end} onChange={(e) => updateLeadership(item.id, 'end', e.target.value)} aria-label={t("End date")} /></Field>
                  </div>
                  <Field label={t("Key Achievements (one per line)")}>
                    <textarea className={TEXTAREA_CLASS} rows={3}
                      placeholder={t("Led team of 12 to increase fundraising by 40%\nImplemented new onboarding reducing member drop-off by 25%")}
                      value={item.bullets.join('\n')}
                      onChange={(e) => updateLeadershipBullets(item.id, e.target.value)} aria-label={t("Leadership achievements")} />
                  </Field>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addLeadership} aria-label={t("Add leadership experience")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] border border-dashed border-lp-rule
              text-[#3C403E] text-sm hover:border-[#1F5C4A]/40 hover:text-[#1F5C4A] hover:bg-[#1F5C4A]/5 transition-all">
            <Plus className="w-4 h-4" />{' '}{t("Add Leadership")}
          </button>
        </div>
      </div>

      {/* Volunteer */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-[#1F5C4A]" />
          <span className="text-sm font-semibold text-lp-ink">{t("Volunteer Work")}</span>
        </div>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {volunteerList.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={SPRING}
                className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                <div className="rounded-[10px]  bg-[#FFFFFF] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1F5C4A] uppercase tracking-wide">{t("Volunteer {v0}", { v0: idx + 1 })}</span>
                    <button onClick={() => removeVolunteer(item.id)} aria-label={t("Remove volunteer {v0}", { v0: idx + 1 })}
                      className="p-1.5 rounded-[4px] text-[#5A5F5C] hover:text-[#B42318] hover:bg-[#B42318]/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={t("Role")}><input type="text" className={INPUT_CLASS} placeholder={t("Tutor")} value={item.role}
                      onChange={(e) => updateVolunteer(item.id, 'role', e.target.value)} aria-label={t("Volunteer role")} /></Field>
                    <Field label={t("Organization")}><input type="text" className={INPUT_CLASS} placeholder={t("Local Food Bank")}
                      value={item.organization} onChange={(e) => updateVolunteer(item.id, 'organization', e.target.value)} aria-label={t("Organization")} /></Field>
                    <Field label={t("Date / Period")}><input type="text" className={INPUT_CLASS} placeholder={t("2022–Present")}
                      value={item.date} onChange={(e) => updateVolunteer(item.id, 'date', e.target.value)} aria-label={t("Date")} /></Field>
                  </div>
                  <Field label={t("One-line Description")}>
                    <input type="text" className={INPUT_CLASS}
                      placeholder={t("Provided weekly math tutoring to 8 underprivileged students")}
                      value={item.description} onChange={(e) => updateVolunteer(item.id, 'description', e.target.value)} aria-label={t("Description")} />
                  </Field>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addVolunteer} aria-label={t("Add volunteer work")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] border border-dashed border-lp-rule
              text-[#3C403E] text-sm hover:border-[#1F5C4A]/40 hover:text-[#1F5C4A] hover:bg-[#1F5C4A]/5 transition-all">
            <Plus className="w-4 h-4" />{' '}{t("Add Volunteer")}
          </button>
        </div>
      </div>

      {/* Languages */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Languages className="w-4 h-4 text-[#8A5A00]" />
          <span className="text-sm font-semibold text-lp-ink">{t("Languages")}</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {languageList.map((lang) => (
              <motion.div key={lang.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={SPRING}
                className="flex items-center gap-3 px-4 py-2.5 rounded-[4px] bg-[#F4F2EC] border border-lp-rule">
                <input type="text" className="flex-1 bg-transparent text-sm text-lp-ink placeholder-[#5A5F5C] outline-none"
                  placeholder={t("Language (e.g. Spanish)")} value={lang.name}
                  onChange={(e) => updateLanguage(lang.id, 'name', e.target.value)} aria-label={t("Language name")} />
                <select
                  className="bg-[#FFFFFF] border border-lp-rule rounded-[4px] px-2 py-1 text-xs text-[#3C403E] outline-none"
                  value={lang.proficiency}
                  onChange={(e) => updateLanguage(lang.id, 'proficiency', e.target.value)}
                  aria-label={t("Proficiency level")}
                >
                  {PROFICIENCY_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <button onClick={() => removeLanguage(lang.id)} aria-label={t("Remove language {v0}", { v0: lang.name })}
                  className="p-1 rounded-[4px] text-[#5A5F5C] hover:text-[#B42318] hover:bg-[#B42318]/10 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addLanguage} aria-label={t("Add language")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] border border-dashed border-lp-rule
              text-[#3C403E] text-sm hover:border-[#8A5A00]/40 hover:text-[#8A5A00] hover:bg-[#8A5A00]/5 transition-all">
            <Plus className="w-4 h-4" />{' '}{t("Add Language")}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 8: Target Job ───────────────────────────────────────────────────────

interface Step8Errors {
  position?: string
  company?: string
  job_description?: string
}

function StepTargetJob({ errors }: { errors: Step8Errors }) {
  const t = useT()
  const { profile, updateProfile } = useCareerStore()
  const target = profile?.target ?? {
    position: '',
    company: '',
    company_type: '',
    industry: '',
    city: '',
    job_description: '',
  }

  const update = (key: keyof typeof target, value: string) => {
    updateProfile({ target: { ...target, [key]: value } })
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20">
        <p className="text-xs text-[#1F5C4A]">
          {t("AURI will tailor your entire resume to this specific role and job description. The more detail you provide, the stronger the keyword match.")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("Target Position")} required error={errors.position}>
          <input type="text" value={target.position} onChange={(e) => update('position', e.target.value)} placeholder={t("Senior Software Engineer")} className={INPUT_CLASS} aria-label={t("Target position")} style={{ fontSize: '16px' }} />
        </Field>
        <Field label={t("Target Company")} required error={errors.company}>
          <CompanyAutocomplete value={target.company} onChange={(v) => update('company', v)} placeholder={t("Google")} className={INPUT_CLASS} aria-label={t("Target company")} />
        </Field>
        <Field label={t("Company Type")}>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder={t("e.g. SaaS startup, Enterprise, Non-profit")}
            value={target.company_type}
            onChange={(e) => update('company_type', e.target.value)}
            aria-label={t("Company type")}
          />
        </Field>
        <Field label={t("Industry")}>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder={t("e.g. Fintech, Healthcare, EdTech")}
            value={target.industry}
            onChange={(e) => update('industry', e.target.value)}
            aria-label={t("Industry")}
          />
        </Field>
        <Field label={t("City / Remote")}>
          <LocationAutocomplete value={target.city} onChange={(v) => update('city', v)} placeholder={t("San Francisco, CA or Remote")} className={INPUT_CLASS} aria-label={t("City or remote")} />
        </Field>
      </div>

      <Field label={t("Job Description")} required error={errors.job_description}>
        <textarea
          className={TEXTAREA_CLASS}
          rows={8}
          placeholder={t("Paste the full job description here. Claude uses it to match keywords and rewrite your resume for maximum ATS compatibility...")}
          value={target.job_description ?? ''}
          onChange={(e) => update('job_description', e.target.value)}
          aria-label={t("Job description")}
        />
      </Field>
    </div>
  )
}

// ─── Step Content Map ─────────────────────────────────────────────────────────

type ValidationErrors = {
  step1: { name?: string; email?: string }
  step2: { experience?: string }
  step8: { position?: string; company?: string; job_description?: string }
}

// ─── Sign-up Prompt Modal ─────────────────────────────────────────────────────

interface SignUpModalProps {
  onClose: () => void
}

function SignUpModal({ onClose }: SignUpModalProps) {
  const t = useT()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={SPRING}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0"
      >
        <div className="rounded-[10px]  bg-[#FFFFFF] p-6 text-center">
          <div className="w-12 h-12 rounded-[10px] bg-[#1F5C4A]/10
            flex items-center justify-center mx-auto mb-4">
            <Save className="w-6 h-6 text-lp-ink" />
          </div>
          <h3 className="font-heading text-lg font-bold text-lp-ink mb-2">{t("Save Your Resume")}</h3>
          <p className="text-sm text-[#3C403E] mb-6">
            {t("Create a free account to save your resume, access it anywhere, and unlock all AI features.")}
          </p>
          <div className="space-y-2">
            <a
              href="/login"
              className="block w-full px-6 py-3 rounded-[4px] bg-[#1F5C4A]
                text-white font-semibold text-sm
                  transition-all text-center"
            >
              {t("Sign Up Free")}
            </a>
            <button
              onClick={onClose}
              className="block w-full px-6 py-3 rounded-[4px] border border-lp-rule
                text-[#3C403E] text-sm hover:text-lp-ink hover:bg-lp-ink/5 transition-all"
            >
              {t("Continue as Guest")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Toast Notification ───────────────────────────────────────────────────────

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

function Toast({ message, type, onDismiss }: ToastProps) {
  const t = useT()
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 32, scale: 0.95 }}
      transition={SPRING}
      className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-[4px]
        border max-w-sm
        ${type === 'success'
          ? 'bg-[#1F7A4D]/10 border-[#1F7A4D]/30 text-[#1F7A4D]'
          : 'bg-[#B42318]/10 border-[#B42318]/30 text-[#B42318]'
        }`}
    >
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />
      }
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onDismiss}
        aria-label={t("Dismiss notification")}
        className="p-0.5 ml-1 rounded opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

function ResumePageContent() {
  const t = useT()
  const {
    profile,
    currentResume,
    atsScore,
    setResume,
    setATSScore,
    syncToFirestore,
    updateProfile,
  } = useCareerStore()

  const { user, isAuthenticated } = useAuth()
  const { isStreaming, streamedText, stream, reset: resetStream } = useAIStream()

  // ── Shared letter-size scale — drives both view and edit modes identically ───
  const { containerRef: editContainerRef, scale: editScale } = useLetterScale(8)
  const editorSyncRef = useRef<{ sync: () => void }>(null)

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1)
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form')
  const [isEditing, setIsEditing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    step1: {},
    step2: {},
    step8: {},
  })
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isATSLoading, setIsATSLoading] = useState(false)
  const [coverage, setCoverage] = useState<RequirementCoverage[] | null>(null)
  const [isCoverageLoading, setIsCoverageLoading] = useState(false)
  const [editedResume, setEditedResume] = useState<ResumeData | null>(null)
  // Gate right-side display — false until a resume is generated in this session.
  // Prevents the previous session's persisted resume and ATS score from appearing on load.
  const [hasSessionResume, setHasSessionResume] = useState(false)

  // The active resume data — prefer locally edited version
  const activeResume = editedResume ?? currentResume
  // Display resume — null until this session produces one
  const displayResume = hasSessionResume ? activeResume : null

  // Sync Firestore when profile changes and user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      syncToFirestore(user.uid)
    }
  }, [profile, isAuthenticated, user?.uid, syncToFirestore])

  const searchParams = useSearchParams()

  // Only show the resume immediately if the user navigated here from the ATS page
  // (?from=ats). Without this guard, currentResume (persisted in Zustand/localStorage)
  // would cause the previous session's resume to appear on every fresh visit.
  useEffect(() => {
    const fromATS = searchParams.get('from') === 'ats'
    if (fromATS && currentResume && !hasSessionResume) {
      setHasSessionResume(true)
    }
  }, [searchParams])

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep = useCallback(
    (step: number): boolean => {
      if (step === 1) {
        const errors: ValidationErrors['step1'] = {}
        if (!profile?.personal.name?.trim()) errors.name = t("Full name is required")
        if (!profile?.personal.email?.trim()) errors.email = t("Email address is required")
        setValidationErrors((prev) => ({ ...prev, step1: errors }))
        return Object.keys(errors).length === 0
      }
      if (step === 2) {
        const errors: ValidationErrors['step2'] = {}
        if (!profile?.experience?.length) {
          errors.experience = t("Add at least one work experience entry")
        }
        setValidationErrors((prev) => ({ ...prev, step2: errors }))
        return Object.keys(errors).length === 0
      }
      if (step === 8) {
        const errors: ValidationErrors['step8'] = {}
        if (!profile?.target.position?.trim()) errors.position = t("Target position is required")
        if (!profile?.target.company?.trim()) errors.company = t("Target company is required")
        if (!profile?.target.job_description?.trim())
          errors.job_description = t("Job description is required for ATS optimization")
        setValidationErrors((prev) => ({ ...prev, step8: errors }))
        return Object.keys(errors).length === 0
      }
      return true
    },
    [profile]
  )

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  const handleStepClick = (stepId: number) => {
    // Allow jumping forward only if current step validates (or jumping back freely)
    if (stepId < currentStep) {
      setCurrentStep(stepId)
      return
    }
    // Validate all steps up to (but not including) the target
    let valid = true
    for (let s = currentStep; s < stepId; s++) {
      if (!validateStep(s)) { valid = false; break }
    }
    if (valid) setCurrentStep(stepId)
  }

  // ── ATS Scoring ─────────────────────────────────────────────────────────────

  const runATSScore = useCallback(
    async (plainText: string, jobDescription: string, resume: ResumeData | null) => {
      if (!plainText || !jobDescription) return
      setIsATSLoading(true)
      setIsCoverageLoading(true)
      setCoverage(null)

      const bullets: string[] = []
      if (resume) {
        for (const exp of resume.experience ?? []) {
          for (const b of exp.bullets ?? []) {
            const t = b.trim()
            if (t.length >= 10) bullets.push(t)
          }
        }
        for (const skill of resume.skills ?? []) {
          const t = skill.trim()
          if (t.length >= 10) bullets.push(t)
        }
        for (const proj of resume.projects ?? []) {
          for (const b of proj.bullets ?? []) {
            const t = b.trim()
            if (t.length >= 10) bullets.push(t)
          }
        }
        for (const lead of resume.leadership ?? []) {
          for (const b of lead.bullets ?? []) {
            const t = b.trim()
            if (t.length >= 10) bullets.push(t)
          }
        }
        for (const lang of resume.languages ?? []) {
          const name = lang.name?.trim()
          const proficiency = lang.proficiency?.trim()
          if (name && proficiency) {
            bullets.push(`${name} language proficiency: ${proficiency}`)
          }
        }
      }

      try {
        let idToken: string | undefined
        if (auth.currentUser) {
          try { idToken = await getIdToken(auth.currentUser) } catch { /* guest */ }
        }
        const authHeaders: Record<string, string> = idToken ? { Authorization: `Bearer ${idToken}` } : {}

        const [atsResult, coverageResult] = await Promise.allSettled([
          fetch('/api/claude/ats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ resumePlainText: plainText, resumeData: resume, jobDescription }),
          }).then(r => r.json() as Promise<{ success: boolean; data: ATSScore }>),
          idToken && bullets.length > 0
            ? fetch('/api/semantic-coverage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ jobDescription, bullets }),
              }).then(r => r.json() as Promise<{ success: boolean; data: RequirementCoverage[] }>)
            : Promise.resolve(null),
        ])

        if (atsResult.status === 'fulfilled' && atsResult.value.success) {
          setATSScore(atsResult.value.data)
        }
        if (coverageResult.status === 'fulfilled' && coverageResult.value?.success) {
          setCoverage(coverageResult.value.data)
        }
      } catch {
        // Non-blocking — ATS score failure shouldn't break resume flow
      } finally {
        setIsATSLoading(false)
        setIsCoverageLoading(false)
      }
    },
    [setATSScore]
  )

  // ── Generate Resume ──────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!validateStep(7)) return
    if (!profile) return

    setGenerateError(null)
    resetStream()
    setIsEditing(false)
    setEditedResume(null)

    // Switch mobile view to preview immediately
    setMobileView('preview')

    const fullText = await stream(
      '/api/claude/resume',
      {
        careerProfile: profile,
        target: {
          position: profile.target.position,
          company: profile.target.company,
          companyType: profile.target.company_type,
          jobDescription: profile.target.job_description ?? '',
        },
        mode: 'generate',
      },
      {
        onError: (err) => {
          setGenerateError(err)
        },
      }
    )

    if (fullText) {
      try {
        const cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned) as Omit<ResumeData, 'templateId'>
        const resume: ResumeData = {
          id: genId(),
          summary: parsed.summary ?? '',
          experience: parsed.experience ?? profile.experience,
          education: parsed.education ?? profile.education,
          skills: parsed.skills ?? profile.skills,
          // Guard: only keep certifications/projects the user actually provided.
          // If profile has none, ignore whatever the AI returned to prevent hallucination.
          certifications: profile.certifications.length > 0
            ? (parsed.certifications ?? profile.certifications).slice(0, profile.certifications.length)
            : [],
          projects: profile.projects.length > 0
            ? (parsed.projects ?? profile.projects).slice(0, profile.projects.length)
            : [],
          // User-controlled sections — capped to prevent single-page overflow
          leadership: (profile.leadership ?? []).slice(0, 2),
          volunteer: (profile.volunteer ?? []).slice(0, 1),
          languages: (profile.languages ?? []).slice(0, 4),
          html: parsed.html,
          // Build plain text for ATS scoring from the structured data
          plain: buildPlainText(
            { ...parsed, templateId: 'classic-pro' },
            profile.personal
          ),
          templateId: 'classic-pro',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setResume(resume)
        setEditedResume(resume)
        setHasSessionResume(true)
        setIsEditing(false) // start in preview mode; user clicks Edit to enter inline editing
        setATSScore(null)
      } catch {
        setGenerateError(t("Failed to parse AI response. Please try again."))
      }
    }
  }, [profile, validateStep, stream, resetStream, setResume, setATSScore])

  // ── Save Resume ──────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!activeResume) return

    if (!isAuthenticated) {
      setShowSignUpModal(true)
      return
    }

    if (!user?.uid) return
    setIsSaving(true)

    try {
      const resumeName =
        profile?.target.company && profile?.target.position
          ? `${profile.target.company} — ${profile.target.position}`
          : `My Resume — ${new Date().toLocaleDateString()}`

      const savePayload = {
        name: resumeName,
        targetPosition: profile?.target.position ?? '',
        targetCompany: profile?.target.company ?? '',
        templateId: 'classic-pro' as const,
        atsScore: atsScore?.score,
        resumeData: stripAllAITags(activeResume),
        personalInfo: profile?.personal ?? {
          name: '',
          email: '',
          phone: '',
          location: '',
          linkedin_url: '',
          website: '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Explicitly verify serializability before hitting Firestore.
      // Non-serializable values (circular refs, React elements) would cause setDoc
      // to silently hang or throw a cryptic error — this surfaces it immediately.
      JSON.stringify(savePayload)

      await saveResume(user.uid, savePayload)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      setToast({ message: t("Resume saved successfully!"), type: 'success' })
    } catch (error) {
      console.error('Save resume error:', error)
      setToast({ message: t("Failed to save resume. Please try again."), type: 'error' })
    } finally {
      // Always reset — whether save succeeded, failed, or threw synchronously.
      setIsSaving(false)
    }
  }, [activeResume, isAuthenticated, user?.uid, profile, atsScore])

  // ── Render step content ──────────────────────────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <StepPersonal errors={validationErrors.step1} />
      case 2:
        return <StepExperience errors={validationErrors.step2} />
      case 3:
        return <StepEducation />
      case 4:
        return <StepSkills />
      case 5:
        return <StepCertifications />
      case 6:
        return <StepProjects />
      case 7:
        return <StepAdditional />
      case 8:
        return <StepTargetJob errors={validationErrors.step8} />
      default:
        return null
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const personal = profile?.personal ?? {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    website: '',
  }

  const isLastStep = currentStep === STEPS.length

  return (
    <div className="h-full flex flex-col pb-20 md:pb-0">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="flex-shrink-0 flex items-center justify-between gap-2 mb-4 px-1 min-w-0"
      >
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <div className="w-9 h-9 rounded-[10px] bg-[#1F5C4A]/10
            flex items-center justify-center flex-shrink-0">
            <IconResumeBuilder className="w-5 h-5 text-lp-ink" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-lp-ink leading-tight truncate">
              {t("Resume Builder")}
            </h1>
            <p className="text-xs text-[#5A5F5C] hidden sm:block">
              {t("AI-powered · ATS-optimized · Tailored to your target role")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save — only show when a resume exists */}
          {displayResume && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              aria-label={t("Save resume")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold
                bg-[#1F5C4A] text-white
                 transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving
                ? <IconLoading className="w-3.5 h-3.5 animate-spin" />
                : saveSuccess
                ? <CheckCircle className="w-3.5 h-3.5" />
                : <Save className="w-3.5 h-3.5" />
              }
              {isSaving ? t("Saving…") : saveSuccess ? t("Saved!") : t("Save")}
            </button>
          )}
          <Link
            href="/dashboard/resume/saved"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium
              border border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5
              transition-all duration-200"
          >
            <IconMyResumes className="w-3.5 h-3.5" />
            {t("My Resumes")}
          </Link>
        </div>

        {/* Mobile: Toggle form / preview */}
        <div className="flex md:hidden items-center gap-1 p-0 rounded-[10px]
          bg-[#FFFFFF] border border-lp-rule">
          <button
            onClick={() => setMobileView('form')}
            aria-label={t("Show form")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-all
              ${mobileView === 'form'
                ? 'bg-[#1F5C4A] text-white'
                : 'text-[#5A5F5C] hover:text-[#3C403E]'
              }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            {t("Form")}
          </button>
          <button
            onClick={() => setMobileView('preview')}
            aria-label={t("Show preview")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-all
              ${mobileView === 'preview'
                ? 'bg-[#1F5C4A] text-white'
                : 'text-[#5A5F5C] hover:text-[#3C403E]'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {t("Preview")}
          </button>
        </div>
      </motion.div>

      {/* ── Main Split Layout ── */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

        {/* ── LEFT: Wizard Form Panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className={`
            flex flex-col min-h-0 overflow-hidden
            w-full md:w-[45%] lg:w-[40%] flex-shrink-0
            ${mobileView === 'preview' ? 'hidden md:flex' : 'flex'}
          `}
        >
          {/* Step indicator */}
          <div className="flex-shrink-0 mb-4 overflow-hidden">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {STEPS.map((step, _idx) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isDone = currentStep > step.id
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    aria-label={t('Go to step {v0}: {v1}', { v0: step.id, v1: t(step.label) })}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-medium
                      flex-shrink-0 transition-all duration-200
                      ${isActive
                        ? 'bg-[#1F5C4A] text-white '
                        : isDone
                          ? 'text-[#1F7A4D] hover:bg-[#1F7A4D]/10'
                          : 'text-[#5A5F5C] hover:text-[#3C403E] hover:bg-lp-ink/5'
                      }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span className="hidden sm:inline">{t(step.label)}</span>
                    <span className="sm:hidden">{step.id}</span>
                  </button>
                )
              })}
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-0.5 rounded-full bg-lp-ink/6 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#1F5C4A] "
                initial={false}
                animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
          </div>

          {/* Step card */}
          <div className="flex-1 min-h-0 flex flex-col rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
            <div className="flex-1 min-h-0 rounded-[10px]  bg-[#FFFFFF]
              flex flex-col overflow-hidden">

              {/* Step header */}
              <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-lp-hairline">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = STEPS[currentStep - 1].icon
                    return (
                      <div className="w-7 h-7 rounded-[4px] bg-[#1F5C4A]/20
                        border border-[#1F5C4A]/30 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-[#1F5C4A]" />
                      </div>
                    )
                  })()}
                  <h2 className="font-heading text-sm font-semibold text-lp-ink">
                    {t("Step {v0} of {v1} — {v2}", { v0: currentStep, v1: STEPS.length, v2: t(STEPS[currentStep - 1].label) })}
                  </h2>
                </div>
              </div>

              {/* Step content — scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={SPRING}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation footer */}
              <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-lp-hairline">
                {/* Generate error */}
                <AnimatePresence>
                  {generateError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3"
                    >
                      {generateError === 'FREE_TIER_LIMIT_REACHED' ? (
                        <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[#1F5C4A]/10 border border-[#1F5C4A]/20">
                          <Zap className="w-3.5 h-3.5 text-[#1F5C4A] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-lp-ink">{t("Monthly limit reached")}</p>
                            <p className="text-xs text-[#3C403E]">{t("You've used all 3 free generations this month.")}</p>
                          </div>
                          <Link href="/pricing" className="flex-shrink-0 text-xs font-semibold text-[#1F5C4A] hover:text-lp-ink transition-colors">
                            {t("Upgrade →")}
                          </Link>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 p-3 rounded-[10px] bg-[#B42318]/10 border border-[#B42318]/20 text-[#B42318] text-xs">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          {generateError}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    aria-label={t("Go to previous step")}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] text-sm font-medium
                      border border-lp-rule text-[#3C403E]
                      hover:text-lp-ink hover:bg-lp-ink/5 hover:border-lp-rule
                      disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("Back")}
                  </button>

                  <div className="flex items-center gap-2">
                    {isLastStep ? (
                      <button
                        onClick={handleGenerate}
                        disabled={isStreaming}
                        aria-label={t("Generate resume with AI")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-sm font-semibold
                          bg-[#1F5C4A] text-white
                           transition-all duration-200
                          disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isStreaming ? (
                          <>
                            <IconLoading className="w-4 h-4 animate-spin" />
                            {t("Generating...")}
                          </>
                        ) : (
                          <>
                            <IconAiMark className="w-4 h-4" />
                            {t("Generate Resume")}
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        aria-label={t("Go to next step")}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-[4px] text-sm font-semibold
                          bg-[#1F5C4A] text-white
                           transition-all duration-200"
                      >
                        {t("Next")}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Generate shortcut hint on last step */}
                {isLastStep && displayResume && (
                  <p className="text-xs text-[#5A5F5C] text-center mt-2">
                    {t("Resume generated — edit inline in the preview or regenerate")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: Preview + ATS Panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className={`
            flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto
            ${mobileView === 'form' ? 'hidden md:flex' : 'flex'}
          `}
        >
          {/* Resume Preview / Editor — ref on shared wrapper so both modes use the same scale */}
          <div ref={editContainerRef} className="flex-shrink-0 overflow-x-hidden">
            {isEditing && displayResume ? (
              <div className="rounded-[10px] border border-lp-rule bg-[#FFFFFF] p-0">
                <div
                  className="rounded-[10px]  bg-[#F4F2EC] overflow-x-hidden overflow-y-auto"
                  style={{ minHeight: '600px' }}>
                  <ResumeEditor
                    resumeData={displayResume}
                    personal={personal}
                    onDataChange={(updated) => setEditedResume(updated)}
                    syncRef={editorSyncRef}
                  />
                </div>
              </div>
            ) : (
              <ResumePreview
                data={displayResume}
                personal={personal}
                isStreaming={isStreaming}
                streamText={streamedText}
                forcedScale={editScale}
              />
            )}
          </div>

          {/* Toggle edit mode button — shown after generation */}
          <AnimatePresence>
            {displayResume && !isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-shrink-0 flex justify-center"
              >
                <button
                  onClick={() => {
                    if (isEditing) {
                      editorSyncRef.current?.sync()
                      setIsEditing(false)
                    } else {
                      setIsEditing(true)
                    }
                  }}
                  aria-label={isEditing ? t("Exit editing mode") : t("Enter Easy Tune editing mode")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-medium
                    border transition-all duration-200
                    ${isEditing
                      ? 'border-[#1F7A4D]/30 text-[#1F7A4D] bg-[#1F7A4D]/5 hover:bg-[#1F7A4D]/10'
                      : 'border-lp-rule text-[#3C403E] hover:text-lp-ink hover:bg-lp-ink/5'
                    }`}
                >
                  {isEditing ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t("Done Editing")}
                    </>
                  ) : (
                    <>
                      <IconAiMark className="w-3.5 h-3.5" />
                      {t("Easy Tune — Edit Inline")}
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Run ATS Score button — shown when resume exists but no score yet */}
          <AnimatePresence>
            {displayResume && !isStreaming && !atsScore && !isATSLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="flex-shrink-0"
              >
                <button
                  onClick={() => {
                    const jd = profile?.target.job_description
                    if (!jd) return
                    const plainText = displayResume.plain ?? buildPlainText(displayResume, profile?.personal ?? {})
                    runATSScore(plainText, jd, displayResume)
                  }}
                  disabled={!profile?.target.job_description}
                  aria-label={t("Run ATS compatibility score")}
                  title={!profile?.target.job_description ? t("Add a job description in Step 8 to run ATS scoring") : undefined}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-medium
                    border border-[#1F5C4A]/30 text-[#1F5C4A] bg-[#1F5C4A]/5
                    hover:bg-[#1F5C4A]/10 hover:border-[#1F5C4A]/50
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200"
                >
                  <IconTargetJob className="w-4 h-4" />
                  {profile?.target.job_description ? t("Run ATS Score") : t("Add a job description to run ATS Score")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ATS Score Panel */}
          <AnimatePresence>
            {hasSessionResume && (atsScore || isATSLoading) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="flex-shrink-0"
              >
                <ATSScorePanel
                  score={atsScore}
                  isLoading={isATSLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section Analysis Panel (Pro) */}
          {hasSessionResume && profile?.isPro && (
            <SectionAnalysisPanel
              sections={atsScore?.section_analysis ?? null}
              isLoading={isATSLoading}
            />
          )}

          {/* Requirement Coverage Panel */}
          {(isCoverageLoading || coverage) && (
            <RequirementCoveragePanel
              coverage={coverage}
              isLoading={isCoverageLoading}
            />
          )}

          {/* Empty state — no resume yet in this session */}
          {!displayResume && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.15 }}
              className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center
                rounded-[10px] border border-dashed border-lp-rule"
            >
              <div className="w-14 h-14 rounded-[10px] bg-[#1F5C4A]/10
                border border-[#1F5C4A]/20 flex items-center justify-center mb-4">
                <IconResumeBuilder className="w-7 h-7 text-[#1F5C4A]/60" />
              </div>
              <p className="text-sm font-medium text-[#3C403E] mb-1">
                {t("Your resume will appear here")}
              </p>
              <p className="text-xs text-[#5A5F5C] max-w-xs">
                {t("Complete the form steps and click")}{' '}<strong className="text-[#1F5C4A]">{t("Generate Resume")}</strong>{' '}{t("on step 8 to create your AI-tailored resume.")}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Modals & Toasts ── */}
      <AnimatePresence>
        {showSignUpModal && (
          <SignUpModal onClose={() => setShowSignUpModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}

export default function ResumePage() {
  return (
    <Suspense fallback={null}>
      <ResumePageContent />
    </Suspense>
  )
}
