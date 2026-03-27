'use client'

import { useEffect, useRef, useState } from 'react'

const JOB_TITLES = [
  // Tech
  'Software Engineer', 'Senior Software Engineer', 'Full Stack Engineer',
  'Frontend Engineer', 'Backend Engineer', 'DevOps Engineer',
  'Data Scientist', 'Data Analyst', 'Data Engineer',
  'Machine Learning Engineer', 'AI Engineer',
  'Product Manager', 'Senior Product Manager',
  'UX Designer', 'UI Designer', 'Product Designer',
  'Engineering Manager', 'CTO', 'VP of Engineering',
  'QA Engineer', 'Security Engineer',
  'Cloud Architect', 'Solutions Architect',
  // Marketing
  'Marketing Manager', 'Growth Marketing Manager',
  'Digital Marketing Manager', 'Content Marketing Manager',
  'SEO Manager', 'Social Media Manager',
  'Brand Manager', 'Product Marketing Manager',
  'CMO', 'VP of Marketing', 'Marketing Director',
  'Performance Marketing Manager',
  'Email Marketing Manager', 'Growth Hacker',
  // Finance
  'Financial Analyst', 'Investment Analyst',
  'Portfolio Manager', 'Risk Analyst',
  'Quantitative Analyst', 'CFO', 'Controller',
  'Accountant', 'CPA', 'Financial Advisor',
  // Business
  'Business Analyst', 'Strategy Analyst',
  'Management Consultant', 'Operations Manager',
  'Project Manager', 'Program Manager',
  'Chief of Staff', 'CEO', 'COO',
  'Business Development Manager',
  'Account Manager', 'Sales Manager',
  'Customer Success Manager',
  // HR
  'HR Manager', 'Recruiter', 'Talent Acquisition',
  'People Operations Manager', 'CHRO',
  // Other
  'Graphic Designer', 'Creative Director',
  'Copywriter', 'Content Writer',
  'Research Analyst', 'Policy Analyst',
  'Supply Chain Manager', 'Logistics Manager',
]

interface JobTitleAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export default function JobTitleAutocomplete({
  value,
  onChange,
  placeholder = 'Senior Software Engineer',
  className = '',
  'aria-label': ariaLabel,
}: JobTitleAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered =
    value.length >= 2
      ? JOB_TITLES.filter((t) =>
          t.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 6)
      : []

  const showDropdown = open && filtered.length > 0

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      onChange(filtered[highlighted])
      setOpen(false)
      setHighlighted(-1)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  function highlightMatch(title: string) {
    const idx = title.toLowerCase().indexOf(value.toLowerCase())
    if (idx === -1) return <span>{title}</span>
    return (
      <>
        {title.slice(0, idx)}
        <span className="text-[#818CF8] font-semibold">{title.slice(idx, idx + value.length)}</span>
        {title.slice(idx + value.length)}
      </>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        style={{ fontSize: '16px' }}
        autoComplete="off"
      />
      {showDropdown && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl border border-white/[0.12] bg-[#1C1C26] shadow-xl overflow-hidden"
          style={{ maxHeight: 240, overflowY: 'auto' }}
          role="listbox"
        >
          {filtered.map((title, i) => (
            <button
              key={title}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(title)
                setOpen(false)
                setHighlighted(-1)
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-4 text-sm text-[#E8E8F0] transition-colors ${
                i === highlighted ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
              }`}
              style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              {highlightMatch(title)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
