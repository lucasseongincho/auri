'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  FolderOpen,
  Target,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Save,
  CheckCircle,
  X,
  FileText,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Star,
  Heart,
  Languages,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useAuth } from '@/hooks/useAuth'
import { useAIStream } from '@/hooks/useAIStream'
import { saveResume } from '@/lib/firestore'
import ResumePreview from '@/components/resume/ResumePreview'
import ResumeEditor from '@/components/resume/ResumeEditor'
import ATSScorePanel from '@/components/resume/ATSScorePanel'
import ClassicPro from '@/components/resume/templates/ClassicPro'
import ModernEdge from '@/components/resume/templates/ModernEdge'
import MinimalSeoul from '@/components/resume/templates/MinimalSeoul'
import ExecutiveDark from '@/components/resume/templates/ExecutiveDark'
import CreativePulse from '@/components/resume/templates/CreativePulse'
import type {
  Experience,
  Education,
  Leadership,
  Volunteer,
  Language,
  Project,
  ResumeData,
  TemplateId,
  ATSScore,
} from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Experience', icon: Briefcase },
  { id: 3, label: 'Education', icon: GraduationCap },
  { id: 4, label: 'Skills', icon: Wrench },
  { id: 5, label: 'Certifications', icon: Award },
  { id: 6, label: 'Projects', icon: FolderOpen },
  { id: 7, label: 'Extra', icon: Star },
  { id: 8, label: 'Target Job', icon: Target },
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
  'w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-[#60607A] focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all'
const LABEL_CLASS = 'block text-xs font-medium text-[#A0A0B8] mb-1.5'
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
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-[#EF4444] flex items-center gap-1">
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
  const { profile, updateProfile } = useCareerStore()
  const personal = profile?.personal ?? {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    website: '',
  }

  const update = (key: keyof typeof personal, value: string) => {
    updateProfile({ personal: { ...personal, [key]: value } })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="Jane Smith"
            value={personal.name}
            onChange={(e) => update('name', e.target.value)}
            aria-label="Full name"
          />
        </Field>
        <Field label="Email Address" required error={errors.email}>
          <input
            type="email"
            className={INPUT_CLASS}
            placeholder="jane@example.com"
            value={personal.email}
            onChange={(e) => update('email', e.target.value)}
            aria-label="Email address"
          />
        </Field>
        <Field label="Phone Number">
          <input
            type="tel"
            className={INPUT_CLASS}
            placeholder="+1 (555) 000-0000"
            value={personal.phone}
            onChange={(e) => update('phone', e.target.value)}
            aria-label="Phone number"
          />
        </Field>
        <Field label="Location">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="New York, NY"
            value={personal.location}
            onChange={(e) => update('location', e.target.value)}
            aria-label="Location"
          />
        </Field>
        <Field label="LinkedIn URL">
          <input
            type="url"
            className={INPUT_CLASS}
            placeholder="https://linkedin.com/in/janesmith"
            value={personal.linkedin_url}
            onChange={(e) => update('linkedin_url', e.target.value)}
            aria-label="LinkedIn URL"
          />
        </Field>
        <Field label="Website / Portfolio">
          <input
            type="url"
            className={INPUT_CLASS}
            placeholder="https://janesmith.dev"
            value={personal.website}
            onChange={(e) => update('website', e.target.value)}
            aria-label="Website or portfolio URL"
          />
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
        <p className="text-xs text-[#EF4444] flex items-center gap-1">
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
            className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
          >
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wide">
                  Position {idx + 1}
                </span>
                <button
                  onClick={() => removeExperience(exp.id)}
                  aria-label={`Remove experience ${idx + 1}`}
                  className="p-1.5 rounded-lg text-[#60607A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Job Title">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="Software Engineer"
                    value={exp.title}
                    onChange={(e) => updateExp(exp.id, 'title', e.target.value)}
                    aria-label={`Job title for position ${idx + 1}`}
                  />
                </Field>
                <Field label="Company">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="Acme Corp"
                    value={exp.company}
                    onChange={(e) => updateExp(exp.id, 'company', e.target.value)}
                    aria-label={`Company name for position ${idx + 1}`}
                  />
                </Field>
                <Field label="Start Date">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="Jan 2022"
                    value={exp.start}
                    onChange={(e) => updateExp(exp.id, 'start', e.target.value)}
                    aria-label={`Start date for position ${idx + 1}`}
                  />
                </Field>
                <Field label="End Date">
                  <div className="space-y-2">
                    <input
                      type="text"
                      className={INPUT_CLASS}
                      placeholder="Dec 2023"
                      value={exp.end === 'Present' ? '' : exp.end}
                      disabled={exp.end === 'Present'}
                      onChange={(e) => updateExp(exp.id, 'end', e.target.value)}
                      aria-label={`End date for position ${idx + 1}`}
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.end === 'Present'}
                        onChange={(e) =>
                          updateExp(exp.id, 'end', e.target.checked ? 'Present' : '')
                        }
                        className="w-3.5 h-3.5 rounded accent-[#6366F1]"
                        aria-label={`Currently working here for position ${idx + 1}`}
                      />
                      <span className="text-xs text-[#A0A0B8]">Currently working here</span>
                    </label>
                  </div>
                </Field>
              </div>

              <Field label="Achievements / Bullets (one per line — AI will rewrite these)">
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder={`Led a team of 5 engineers\nIncreased system performance by 40%\nBuilt payment integration`}
                  value={exp.bullets.join('\n')}
                  onChange={(e) => updateBullets(exp.id, e.target.value)}
                  aria-label={`Achievements for position ${idx + 1}`}
                />
              </Field>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        onClick={addExperience}
        aria-label="Add another experience entry"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
          border border-dashed border-white/[0.12] text-[#A0A0B8] text-sm
          hover:border-[#6366F1]/40 hover:text-[#6366F1] hover:bg-[#6366F1]/5
          transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        Add Experience
      </button>
    </div>
  )
}

// ─── Step 3: Education ────────────────────────────────────────────────────────

function StepEducation() {
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

  const updateEdu = (id: string, key: keyof Education, value: string) => {
    updateProfile({
      education: educations.map((e) =>
        e.id === id ? { ...e, [key]: value } : e
      ),
    })
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {educations.map((edu, idx) => (
          <motion.div
            key={edu.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
          >
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wide">
                  Education {idx + 1}
                </span>
                <button
                  onClick={() => removeEducation(edu.id)}
                  aria-label={`Remove education ${idx + 1}`}
                  className="p-1.5 rounded-lg text-[#60607A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Institution">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="MIT"
                    value={edu.institution}
                    onChange={(e) => updateEdu(edu.id, 'institution', e.target.value)}
                    aria-label={`Institution for education ${idx + 1}`}
                  />
                </Field>
                <Field label="Degree">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="Bachelor of Science"
                    value={edu.degree}
                    onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)}
                    aria-label={`Degree for education ${idx + 1}`}
                  />
                </Field>
                <Field label="Field of Study">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="Computer Science"
                    value={edu.field}
                    onChange={(e) => updateEdu(edu.id, 'field', e.target.value)}
                    aria-label={`Field of study for education ${idx + 1}`}
                  />
                </Field>
                <Field label="Graduation Year">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="2021"
                    value={edu.year}
                    onChange={(e) => updateEdu(edu.id, 'year', e.target.value)}
                    aria-label={`Graduation year for education ${idx + 1}`}
                  />
                </Field>
                <Field label="GPA (optional — omit if below 3.5)">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="3.8/4.0"
                    value={edu.gpa ?? ''}
                    onChange={(e) => updateEdu(edu.id, 'gpa', e.target.value)}
                    aria-label={`GPA for education ${idx + 1}`}
                  />
                </Field>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        onClick={addEducation}
        aria-label="Add another education entry"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
          border border-dashed border-white/[0.12] text-[#A0A0B8] text-sm
          hover:border-[#6366F1]/40 hover:text-[#6366F1] hover:bg-[#6366F1]/5
          transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        Add Education
      </button>
    </div>
  )
}

// ─── Step 4: Skills ───────────────────────────────────────────────────────────

function StepSkills() {
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
      <Field label="Add Skills (press Enter or comma to add)">
        <div className="flex gap-2">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="e.g. React, TypeScript, Node.js"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Add a skill"
          />
          <button
            onClick={() => addSkill(input)}
            aria-label="Add skill"
            className="px-4 py-3 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/30
              text-[#6366F1] text-sm font-medium hover:bg-[#6366F1]/30 transition-all
              flex-shrink-0"
          >
            Add
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
                  bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#818CF8] text-xs font-medium"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  aria-label={`Remove skill ${skill}`}
                  className="w-4 h-4 rounded-full flex items-center justify-center
                    hover:bg-[#6366F1]/30 transition-all"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-[#60607A] text-center py-4">
          No skills added yet. Type above and press Enter.
        </p>
      )}
    </div>
  )
}

// ─── Step 5: Certifications ───────────────────────────────────────────────────

function StepCertifications() {
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
      <Field label="Add Certification (press Enter to add)">
        <div className="flex gap-2">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="e.g. AWS Certified Developer"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Add a certification"
          />
          <button
            onClick={() => addCert(input)}
            aria-label="Add certification"
            className="px-4 py-3 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/30
              text-[#6366F1] text-sm font-medium hover:bg-[#6366F1]/30 transition-all
              flex-shrink-0"
          >
            Add
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
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl
                  bg-[#0A0A0F] border border-white/[0.08]"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
                  <span className="text-sm text-white">{cert}</span>
                </div>
                <button
                  onClick={() => removeCert(cert)}
                  aria-label={`Remove certification ${cert}`}
                  className="p-1 rounded-lg text-[#60607A] hover:text-[#EF4444]
                    hover:bg-[#EF4444]/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-[#60607A] text-center py-4">
          No certifications added yet — this section is optional.
        </p>
      )}
    </div>
  )
}

// ─── Step 6: Projects ─────────────────────────────────────────────────────────

function StepProjects() {
  const { profile, updateProfile } = useCareerStore()
  const projects: Project[] = profile?.projects ?? []

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
            className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
          >
            <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wide">
                  Project {idx + 1}
                </span>
                <button
                  onClick={() => removeProject(proj.id)}
                  aria-label={`Remove project ${idx + 1}`}
                  className="p-1.5 rounded-lg text-[#60607A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Project Name">
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="My SaaS App"
                    value={proj.name}
                    onChange={(e) => updateProj(proj.id, 'name', e.target.value)}
                    aria-label={`Project name for project ${idx + 1}`}
                  />
                </Field>
                <Field label="URL (optional)">
                  <input
                    type="url"
                    className={INPUT_CLASS}
                    placeholder="https://myapp.com"
                    value={proj.url ?? ''}
                    onChange={(e) => updateProj(proj.id, 'url', e.target.value)}
                    aria-label={`Project URL for project ${idx + 1}`}
                  />
                </Field>
              </div>
              <Field label="Short Description">
                <input
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="A SaaS platform for..."
                  value={proj.description}
                  onChange={(e) => updateProj(proj.id, 'description', e.target.value)}
                  aria-label={`Description for project ${idx + 1}`}
                />
              </Field>
              <Field label="Key Points / Bullets (one per line)">
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={3}
                  placeholder={`Built with React and Node.js\nGrew to 1,000+ users in 3 months`}
                  value={proj.bullets.join('\n')}
                  onChange={(e) => updateBullets(proj.id, e.target.value)}
                  aria-label={`Bullets for project ${idx + 1}`}
                />
              </Field>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        onClick={addProject}
        aria-label="Add another project"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
          border border-dashed border-white/[0.12] text-[#A0A0B8] text-sm
          hover:border-[#6366F1]/40 hover:text-[#6366F1] hover:bg-[#6366F1]/5
          transition-all duration-200"
      >
        <Plus className="w-4 h-4" />
        Add Project
      </button>
    </div>
  )
}

// ─── Step 7: Leadership / Volunteer / Languages ───────────────────────────────

const PROFICIENCY_LEVELS: Language['proficiency'][] = ['Native', 'Fluent', 'Intermediate', 'Basic']

function StepAdditional() {
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
      <p className="text-xs text-[#A0A0B8]">
        All sections below are optional. They appear on the resume only if you add data.
      </p>

      {/* Leadership */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-[#6366F1]" />
          <span className="text-sm font-semibold text-white">Leadership Experience</span>
        </div>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {leadershipList.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={SPRING}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wide">Leadership {idx + 1}</span>
                    <button onClick={() => removeLeadership(item.id)} aria-label={`Remove leadership ${idx + 1}`}
                      className="p-1.5 rounded-lg text-[#60607A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Role"><input type="text" className={INPUT_CLASS} placeholder="President" value={item.role}
                      onChange={(e) => updateLeadership(item.id, 'role', e.target.value)} aria-label="Leadership role" /></Field>
                    <Field label="Organization"><input type="text" className={INPUT_CLASS} placeholder="Student Government"
                      value={item.organization} onChange={(e) => updateLeadership(item.id, 'organization', e.target.value)} aria-label="Organization" /></Field>
                    <Field label="Start Date"><input type="text" className={INPUT_CLASS} placeholder="Sep 2022"
                      value={item.start} onChange={(e) => updateLeadership(item.id, 'start', e.target.value)} aria-label="Start date" /></Field>
                    <Field label="End Date"><input type="text" className={INPUT_CLASS} placeholder="May 2023 or Present"
                      value={item.end} onChange={(e) => updateLeadership(item.id, 'end', e.target.value)} aria-label="End date" /></Field>
                  </div>
                  <Field label="Key Achievements (one per line)">
                    <textarea className={TEXTAREA_CLASS} rows={3}
                      placeholder={`Led team of 12 to increase fundraising by 40%\nImplemented new onboarding reducing member drop-off by 25%`}
                      value={item.bullets.join('\n')}
                      onChange={(e) => updateLeadershipBullets(item.id, e.target.value)} aria-label="Leadership achievements" />
                  </Field>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addLeadership} aria-label="Add leadership experience"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.12]
              text-[#A0A0B8] text-sm hover:border-[#6366F1]/40 hover:text-[#6366F1] hover:bg-[#6366F1]/5 transition-all">
            <Plus className="w-4 h-4" /> Add Leadership
          </button>
        </div>
      </div>

      {/* Volunteer */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-[#EC4899]" />
          <span className="text-sm font-semibold text-white">Volunteer Work</span>
        </div>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {volunteerList.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={SPRING}
                className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#EC4899] uppercase tracking-wide">Volunteer {idx + 1}</span>
                    <button onClick={() => removeVolunteer(item.id)} aria-label={`Remove volunteer ${idx + 1}`}
                      className="p-1.5 rounded-lg text-[#60607A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Role"><input type="text" className={INPUT_CLASS} placeholder="Tutor" value={item.role}
                      onChange={(e) => updateVolunteer(item.id, 'role', e.target.value)} aria-label="Volunteer role" /></Field>
                    <Field label="Organization"><input type="text" className={INPUT_CLASS} placeholder="Local Food Bank"
                      value={item.organization} onChange={(e) => updateVolunteer(item.id, 'organization', e.target.value)} aria-label="Organization" /></Field>
                    <Field label="Date / Period"><input type="text" className={INPUT_CLASS} placeholder="2022–Present"
                      value={item.date} onChange={(e) => updateVolunteer(item.id, 'date', e.target.value)} aria-label="Date" /></Field>
                  </div>
                  <Field label="One-line Description">
                    <input type="text" className={INPUT_CLASS}
                      placeholder="Provided weekly math tutoring to 8 underprivileged students"
                      value={item.description} onChange={(e) => updateVolunteer(item.id, 'description', e.target.value)} aria-label="Description" />
                  </Field>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addVolunteer} aria-label="Add volunteer work"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.12]
              text-[#A0A0B8] text-sm hover:border-[#EC4899]/40 hover:text-[#EC4899] hover:bg-[#EC4899]/5 transition-all">
            <Plus className="w-4 h-4" /> Add Volunteer
          </button>
        </div>
      </div>

      {/* Languages */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Languages className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-sm font-semibold text-white">Languages</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {languageList.map((lang) => (
              <motion.div key={lang.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={SPRING}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/[0.08]">
                <input type="text" className="flex-1 bg-transparent text-sm text-white placeholder-[#60607A] outline-none"
                  placeholder="Language (e.g. Spanish)" value={lang.name}
                  onChange={(e) => updateLanguage(lang.id, 'name', e.target.value)} aria-label="Language name" />
                <select
                  className="bg-[#1C1C26] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-[#A0A0B8] outline-none"
                  value={lang.proficiency}
                  onChange={(e) => updateLanguage(lang.id, 'proficiency', e.target.value)}
                  aria-label="Proficiency level"
                >
                  {PROFICIENCY_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <button onClick={() => removeLanguage(lang.id)} aria-label={`Remove language ${lang.name}`}
                  className="p-1 rounded-lg text-[#60607A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button onClick={addLanguage} aria-label="Add language"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.12]
              text-[#A0A0B8] text-sm hover:border-[#F59E0B]/40 hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all">
            <Plus className="w-4 h-4" /> Add Language
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
      <div className="p-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20">
        <p className="text-xs text-[#818CF8]">
          Claude will tailor your entire resume to this specific role and job description.
          The more detail you provide, the stronger the keyword match.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Target Position" required error={errors.position}>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="Senior Software Engineer"
            value={target.position}
            onChange={(e) => update('position', e.target.value)}
            aria-label="Target position"
          />
        </Field>
        <Field label="Target Company" required error={errors.company}>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="Google"
            value={target.company}
            onChange={(e) => update('company', e.target.value)}
            aria-label="Target company"
          />
        </Field>
        <Field label="Company Type">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="e.g. SaaS startup, Enterprise, Non-profit"
            value={target.company_type}
            onChange={(e) => update('company_type', e.target.value)}
            aria-label="Company type"
          />
        </Field>
        <Field label="Industry">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="e.g. Fintech, Healthcare, EdTech"
            value={target.industry}
            onChange={(e) => update('industry', e.target.value)}
            aria-label="Industry"
          />
        </Field>
        <Field label="City / Remote">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="San Francisco, CA or Remote"
            value={target.city}
            onChange={(e) => update('city', e.target.value)}
            aria-label="City or remote"
          />
        </Field>
      </div>

      <Field label="Job Description" required error={errors.job_description}>
        <textarea
          className={TEXTAREA_CLASS}
          rows={8}
          placeholder="Paste the full job description here. Claude uses it to match keywords and rewrite your resume for maximum ATS compatibility..."
          value={target.job_description ?? ''}
          onChange={(e) => update('job_description', e.target.value)}
          aria-label="Job description"
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
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#13131A] p-1"
      >
        <div className="rounded-xl border border-white/[0.05] bg-[#1C1C26] p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
            flex items-center justify-center mx-auto mb-4">
            <Save className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-heading text-lg font-bold text-white mb-2">Save Your Resume</h3>
          <p className="text-sm text-[#A0A0B8] mb-6">
            Create a free account to save your resume, access it anywhere, and unlock all AI features.
          </p>
          <div className="space-y-2">
            <a
              href="/login"
              className="block w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
                text-white font-semibold text-sm shadow-lg shadow-[#6366F1]/25
                hover:shadow-[#6366F1]/50 hover:scale-[1.02] transition-all text-center"
            >
              Sign Up Free
            </a>
            <button
              onClick={onClose}
              className="block w-full px-6 py-3 rounded-xl border border-white/[0.08]
                text-[#A0A0B8] text-sm hover:text-white hover:bg-white/5 transition-all"
            >
              Continue as Guest
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
      className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl
        border shadow-xl max-w-sm
        ${type === 'success'
          ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
          : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
        }`}
    >
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />
      }
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="p-0.5 ml-1 rounded opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function ResumePage() {
  const {
    profile,
    currentResume,
    selectedTemplate,
    atsScore,
    setResume,
    setATSScore,
    setSelectedTemplate,
    syncToFirestore,
  } = useCareerStore()

  const { user, isAuthenticated, isGuest } = useAuth()
  const { isStreaming, streamedText, stream, reset: resetStream } = useAIStream()

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
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isATSLoading, setIsATSLoading] = useState(false)
  const [isFixingATS, setIsFixingATS] = useState(false)
  const [editedResume, setEditedResume] = useState<ResumeData | null>(null)

  // The active resume data — prefer locally edited version
  const activeResume = editedResume ?? currentResume

  // Sync Firestore when profile changes and user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      syncToFirestore(user.uid)
    }
  }, [profile, isAuthenticated, user?.uid, syncToFirestore])

  // Auto-run ATS scoring when resume generation completes
  useEffect(() => {
    if (!currentResume || isStreaming || !profile?.target.job_description) return
    const plainText = currentResume.plain ?? buildPlainText(currentResume, profile.personal)
    if (plainText) runATSScore(plainText, profile.target.job_description)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentResume?.id, isStreaming])

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep = useCallback(
    (step: number): boolean => {
      if (step === 1) {
        const errors: ValidationErrors['step1'] = {}
        if (!profile?.personal.name?.trim()) errors.name = 'Full name is required'
        if (!profile?.personal.email?.trim()) errors.email = 'Email address is required'
        setValidationErrors((prev) => ({ ...prev, step1: errors }))
        return Object.keys(errors).length === 0
      }
      if (step === 2) {
        const errors: ValidationErrors['step2'] = {}
        if (!profile?.experience?.length) {
          errors.experience = 'Add at least one work experience entry'
        }
        setValidationErrors((prev) => ({ ...prev, step2: errors }))
        return Object.keys(errors).length === 0
      }
      if (step === 8) {
        const errors: ValidationErrors['step8'] = {}
        if (!profile?.target.position?.trim()) errors.position = 'Target position is required'
        if (!profile?.target.company?.trim()) errors.company = 'Target company is required'
        if (!profile?.target.job_description?.trim())
          errors.job_description = 'Job description is required for ATS optimization'
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
    async (plainText: string, jobDescription: string) => {
      if (!plainText || !jobDescription) return
      setIsATSLoading(true)
      try {
        const res = await fetch('/api/claude/ats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumePlainText: plainText,
            jobDescription,
          }),
        })
        const json = (await res.json()) as { success: boolean; data: ATSScore }
        if (json.success) {
          setATSScore(json.data)
        }
      } catch {
        // Non-blocking — ATS score failure shouldn't break resume flow
      } finally {
        setIsATSLoading(false)
      }
    },
    [setATSScore]
  )

  // ── Fix All ATS Issues ───────────────────────────────────────────────────────

  const handleFixAll = useCallback(async () => {
    if (!profile || !activeResume) return
    setIsFixingATS(true)
    try {
      const fullText = await stream('/api/claude/resume', {
        careerProfile: profile,
        target: {
          position: profile.target.position,
          company: profile.target.company,
          companyType: profile.target.company_type,
          jobDescription: profile.target.job_description ?? '',
        },
        mode: 'rewrite',
      })
      if (fullText) {
        const cleaned = fullText.replace(/```json\n?|```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned) as ResumeData
        const updated: ResumeData = {
          ...activeResume,
          ...parsed,
          templateId: selectedTemplate,
          updatedAt: new Date().toISOString(),
        }
        setResume(updated)
        setEditedResume(updated)
        if (updated.plain && profile.target.job_description) {
          await runATSScore(updated.plain, profile.target.job_description)
        }
      }
    } catch {
      setToast({ message: 'Failed to fix ATS issues. Please try again.', type: 'error' })
    } finally {
      setIsFixingATS(false)
    }
  }, [profile, activeResume, selectedTemplate, stream, setResume, runATSScore])

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
          certifications: parsed.certifications ?? profile.certifications,
          projects: parsed.projects ?? profile.projects,
          // User-controlled sections — capped to prevent single-page overflow
          leadership: (profile.leadership ?? []).slice(0, 2),
          volunteer: (profile.volunteer ?? []).slice(0, 1),
          languages: (profile.languages ?? []).slice(0, 4),
          html: parsed.html,
          // Build plain text for ATS scoring from the structured data
          plain: buildPlainText(
            { ...parsed, templateId: selectedTemplate },
            profile.personal
          ),
          templateId: selectedTemplate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setResume(resume)
        setEditedResume(resume)
        setIsEditing(false) // start in preview mode; user clicks Edit to enter inline editing
      } catch {
        setGenerateError('Failed to parse AI response. Please try again.')
      }
    }
  }, [profile, selectedTemplate, validateStep, stream, resetStream, setResume])

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
        profile?.target.position && profile?.target.company
          ? `${profile.target.position} at ${profile.target.company}`
          : `Resume ${new Date().toLocaleDateString()}`

      await saveResume(user.uid, {
        name: resumeName,
        targetPosition: profile?.target.position ?? '',
        targetCompany: profile?.target.company ?? '',
        templateId: selectedTemplate,
        atsScore: atsScore?.score,
        resumeData: activeResume,
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
      })
      setToast({ message: 'Resume saved successfully!', type: 'success' })
    } catch {
      setToast({ message: 'Failed to save resume. Please try again.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }, [activeResume, isAuthenticated, user?.uid, profile, selectedTemplate, atsScore])

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

  // ── Template renderer for ResumeEditor children ──────────────────────────────

  const renderTemplate = (data: ResumeData) => {
    const personal = profile?.personal ?? {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin_url: '',
      website: '',
    }
    switch (selectedTemplate) {
      case 'modern-edge':    return <ModernEdge data={data} personal={personal} isEditing />
      case 'minimal-seoul':  return <MinimalSeoul data={data} personal={personal} isEditing />
      case 'executive-dark': return <ExecutiveDark data={data} personal={personal} isEditing />
      case 'creative-pulse': return <CreativePulse data={data} personal={personal} isEditing />
      default:               return <ClassicPro data={data} personal={personal} isEditing />
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
        className="flex-shrink-0 flex items-center justify-between gap-4 mb-4 px-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5]
            flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-white leading-tight">
              Resume Builder
            </h1>
            <p className="text-xs text-[#60607A] hidden sm:block">
              AI-powered · ATS-optimized · Tailored to your target role
            </p>
          </div>
        </div>

        {/* My Resumes link — desktop */}
        <Link
          href="/dashboard/resume/saved"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
            border border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5
            transition-all duration-200"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          My Resumes
        </Link>

        {/* Mobile: Toggle form / preview */}
        <div className="flex md:hidden items-center gap-1 p-1 rounded-xl
          bg-[#13131A] border border-white/[0.08]">
          <button
            onClick={() => setMobileView('form')}
            aria-label="Show form"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${mobileView === 'form'
                ? 'bg-[#6366F1] text-white'
                : 'text-[#60607A] hover:text-[#A0A0B8]'
              }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Form
          </button>
          <button
            onClick={() => setMobileView('preview')}
            aria-label="Show preview"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${mobileView === 'preview'
                ? 'bg-[#6366F1] text-white'
                : 'text-[#60607A] hover:text-[#A0A0B8]'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
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
          <div className="flex-shrink-0 mb-4">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {STEPS.map((step, _idx) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isDone = currentStep > step.id
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    aria-label={`Go to step ${step.id}: ${step.label}`}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                      flex-shrink-0 transition-all duration-200
                      ${isActive
                        ? 'bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/20'
                        : isDone
                          ? 'text-[#22C55E] hover:bg-[#22C55E]/10'
                          : 'text-[#60607A] hover:text-[#A0A0B8] hover:bg-white/5'
                      }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.id}</span>
                  </button>
                )
              })}
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
                initial={false}
                animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
          </div>

          {/* Step card */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
            <div className="flex-1 min-h-0 rounded-xl border border-white/[0.05] bg-[#1C1C26]
              flex flex-col overflow-hidden">

              {/* Step header */}
              <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = STEPS[currentStep - 1].icon
                    return (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20
                        border border-[#6366F1]/30 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-[#6366F1]" />
                      </div>
                    )
                  })()}
                  <h2 className="font-heading text-sm font-semibold text-white">
                    Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
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
              <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-white/[0.05]">
                {/* Generate error */}
                <AnimatePresence>
                  {generateError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 flex items-start gap-2 p-3 rounded-xl
                        bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {generateError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    aria-label="Go to previous step"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium
                      border border-white/[0.08] text-[#A0A0B8]
                      hover:text-white hover:bg-white/5 hover:border-white/[0.15]
                      disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="flex items-center gap-2">
                    {isLastStep ? (
                      <button
                        onClick={handleGenerate}
                        disabled={isStreaming}
                        aria-label="Generate resume with AI"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                          bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                          shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                          hover:scale-[1.02] transition-all duration-200
                          disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isStreaming ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Resume
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        aria-label="Go to next step"
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold
                          bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                          shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                          hover:scale-[1.02] transition-all duration-200"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Generate shortcut hint on last step */}
                {isLastStep && activeResume && (
                  <p className="text-xs text-[#60607A] text-center mt-2">
                    Resume generated — edit inline in the preview or regenerate
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
          {/* Save button row — shown when resume exists */}
          <AnimatePresence>
            {activeResume && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="flex-shrink-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  {isGuest && (
                    <span className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20
                      px-2.5 py-1 rounded-full">
                      Guest mode — sign up to save
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  aria-label="Save resume"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white
                    shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/50
                    hover:scale-[1.02] transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Resume'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resume Preview / Editor */}
          <div className="flex-shrink-0">
            {isEditing && activeResume ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#13131A] p-1">
                <div className="rounded-xl border border-white/[0.05] bg-white overflow-auto"
                  style={{ minHeight: '600px' }}>
                  <ResumeEditor
                    resumeData={activeResume}
                    personal={personal}
                    onDataChange={(updated) => setEditedResume(updated)}
                  >
                    {renderTemplate(activeResume)}
                  </ResumeEditor>
                </div>
              </div>
            ) : (
              <ResumePreview
                data={activeResume}
                personal={personal}
                isStreaming={isStreaming}
                streamText={streamedText}
                onTemplateChange={(id: TemplateId) => {
                  setSelectedTemplate(id)
                  if (activeResume) {
                    const updated = { ...activeResume, templateId: id }
                    setResume(updated)
                    setEditedResume(updated)
                  }
                }}
              />
            )}
          </div>

          {/* Toggle edit mode button — shown after generation */}
          <AnimatePresence>
            {activeResume && !isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-shrink-0 flex justify-center"
              >
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  aria-label={isEditing ? 'Exit editing mode' : 'Enter Easy Tune editing mode'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium
                    border transition-all duration-200
                    ${isEditing
                      ? 'border-[#22C55E]/30 text-[#22C55E] bg-[#22C55E]/5 hover:bg-[#22C55E]/10'
                      : 'border-white/[0.08] text-[#A0A0B8] hover:text-white hover:bg-white/5'
                    }`}
                >
                  {isEditing ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Done Editing
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Easy Tune — Edit Inline
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Run ATS Score button — shown when resume exists but no score yet */}
          <AnimatePresence>
            {activeResume && !isStreaming && !atsScore && !isATSLoading && (
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
                    const plainText = activeResume.plain ?? buildPlainText(activeResume, profile?.personal ?? {})
                    runATSScore(plainText, jd)
                  }}
                  disabled={!profile?.target.job_description}
                  aria-label="Run ATS compatibility score"
                  title={!profile?.target.job_description ? 'Add a job description in Step 8 to run ATS scoring' : undefined}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium
                    border border-[#6366F1]/30 text-[#818CF8] bg-[#6366F1]/5
                    hover:bg-[#6366F1]/10 hover:border-[#6366F1]/50
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200"
                >
                  <Target className="w-4 h-4" />
                  {profile?.target.job_description ? 'Run ATS Score' : 'Add a job description to run ATS Score'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ATS Score Panel */}
          <AnimatePresence>
            {(atsScore || isATSLoading) && (
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
                  onFixAll={handleFixAll}
                  isFixing={isFixingATS}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state — no resume yet */}
          {!activeResume && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.15 }}
              className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center
                rounded-2xl border border-dashed border-white/[0.08]"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/10
                border border-[#6366F1]/20 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-[#6366F1]/60" />
              </div>
              <p className="text-sm font-medium text-[#A0A0B8] mb-1">
                Your resume will appear here
              </p>
              <p className="text-xs text-[#60607A] max-w-xs">
                Complete the form steps and click <strong className="text-[#6366F1]">Generate Resume</strong> on
                step 7 to create your AI-tailored resume.
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
