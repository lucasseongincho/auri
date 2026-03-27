'use client'

import { useEffect, useRef } from 'react'
import { useAutocomplete } from '@/hooks/useAutocomplete'

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
  const { query, setQuery, filtered, isOpen, setIsOpen, selectedIndex, handleKeyDown } =
    useAutocomplete(LOCATIONS)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value → internal query
  useEffect(() => {
    setQuery(value)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [setIsOpen])

  function highlightMatch(loc: string) {
    const idx = loc.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1 || query.length < 2) return <span>{loc}</span>
    return (
      <>
        {loc.slice(0, idx)}
        <span className="text-[#818CF8] font-semibold">{loc.slice(idx, idx + query.length)}</span>
        {loc.slice(idx + query.length)}
      </>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setIsOpen(true) }}
        onFocus={() => { if (filtered.length > 0) setIsOpen(true) }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        style={{ fontSize: '16px' }}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl border border-white/[0.12] bg-[#1C1C26] shadow-xl overflow-hidden"
          style={{ maxHeight: 240, overflowY: 'auto' }}
          role="listbox"
        >
          {filtered.map((loc, i) => (
            <button
              key={loc}
              role="option"
              aria-selected={i === selectedIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                setQuery(loc)
                onChange(loc)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 text-sm text-[#E8E8F0] transition-colors ${
                i === selectedIndex ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
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
