'use client'

import { useEffect, useRef, useState } from 'react'

const LOCATIONS = [
  // US Cities
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
  'San Francisco, CA', 'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Denver, CO', 'Atlanta, GA',
  'Miami, FL', 'Dallas, TX', 'Washington, DC',
  'Portland, OR', 'Nashville, TN', 'Phoenix, AZ',
  'San Diego, CA', 'Minneapolis, MN', 'Detroit, MI',
  // Remote options
  'Remote', 'Remote (US Only)', 'Remote (Worldwide)',
  'Hybrid - New York, NY', 'Hybrid - San Francisco, CA',
  'Hybrid - Chicago, IL', 'Hybrid - Austin, TX',
  // International
  'London, UK', 'Toronto, Canada', 'Vancouver, Canada',
  'Sydney, Australia', 'Singapore', 'Tokyo, Japan',
  'Berlin, Germany', 'Amsterdam, Netherlands',
  'Paris, France', 'Dubai, UAE', 'Seoul, South Korea',
]

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'San Francisco, CA or Remote',
  className = '',
  'aria-label': ariaLabel,
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered =
    value.length >= 2
      ? LOCATIONS.filter((l) =>
          l.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 6)
      : []

  const showDropdown = open && filtered.length > 0

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

  function highlightMatch(loc: string) {
    const idx = loc.toLowerCase().indexOf(value.toLowerCase())
    if (idx === -1) return <span>{loc}</span>
    return (
      <>
        {loc.slice(0, idx)}
        <span className="text-[#818CF8] font-semibold">{loc.slice(idx, idx + value.length)}</span>
        {loc.slice(idx + value.length)}
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
          {filtered.map((loc, i) => (
            <button
              key={loc}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(loc)
                setOpen(false)
                setHighlighted(-1)
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full text-left px-4 text-sm text-[#E8E8F0] transition-colors ${
                i === highlighted ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
              }`}
              style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              {highlightMatch(loc)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
