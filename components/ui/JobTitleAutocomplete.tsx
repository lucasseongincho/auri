'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Fuse from 'fuse.js'
import { JOB_TITLES } from '@/lib/data/jobTitles'

interface JobTitleAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  'aria-label'?: string
}

export default function JobTitleAutocomplete({
  value,
  onChange,
  placeholder = 'e.g. Software Engineer',
  label,
  required = false,
  className = '',
  'aria-label': ariaLabel,
}: JobTitleAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fuse = useMemo(() => new Fuse(JOB_TITLES, {
    threshold: 0.35,
    distance: 100,
    minMatchCharLength: 2,
  }), [])

  const filtered = useMemo(() => {
    if (value.length < 2) return []
    return fuse.search(value).map(r => r.item).slice(0, 6)
  }, [value, fuse])

  // Position the portal dropdown to match the input
  function updateDropdownPosition() {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }

  useEffect(() => {
    setIsOpen(filtered.length > 0)
    setSelectedIndex(-1)
    if (filtered.length > 0) updateDropdownPosition()
  }, [filtered])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return
    const handle = () => updateDropdownPosition()
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [isOpen])

  const handleSelect = (title: string) => {
    onChange(title)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => prev < filtered.length - 1 ? prev + 1 : prev)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const dropdown = isOpen && filtered.length > 0 && typeof document !== 'undefined'
    ? createPortal(
        <div
          style={{ ...dropdownStyle, maxHeight: 280, overflowY: 'auto' }}
          className="rounded-xl border border-white/[0.12] bg-[#1C1C26] shadow-xl shadow-black/30 overflow-hidden"
          role="listbox"
        >
          {filtered.map((title, index) => (
            <button
              key={title}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(title)
              }}
              className={`w-full text-left px-4 text-sm transition-colors flex items-center gap-2 ${
                index === selectedIndex
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-[#E8E8F0] hover:bg-white/[0.05]'
              }`}
              style={{ minHeight: '44px' }}
            >
              <span className="text-gray-500 text-xs">💼</span>
              {title}
            </button>
          ))}
        </div>,
        document.body
      )
    : null

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (filtered.length > 0) { updateDropdownPosition(); setIsOpen(true) } }}
        placeholder={placeholder}
        className={className}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        style={{ fontSize: '16px' }}
        autoComplete="off"
      />

      {dropdown}
    </div>
  )
}
