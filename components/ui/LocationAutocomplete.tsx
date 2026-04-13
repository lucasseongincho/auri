'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const ALWAYS_SHOW = [
  'Remote',
  'Remote (US Only)',
  'Remote (Worldwide)',
  'Hybrid',
]

const FALLBACK_CITIES = [
  'New York, NY', 'Los Angeles, CA',
  'Chicago, IL', 'San Francisco, CA',
  'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Denver, CO',
  'Atlanta, GA', 'Miami, FL',
  'Dallas, TX', 'Washington, DC',
  'Portland, OR', 'Nashville, TN',
  'Phoenix, AZ', 'San Diego, CA',
  'Minneapolis, MN', 'Detroit, MI',
  'London, UK', 'Toronto, Canada',
  'Vancouver, Canada', 'Sydney, Australia',
  'Singapore', 'Tokyo, Japan',
  'Seoul, South Korea', 'Berlin, Germany',
  'Amsterdam, Netherlands', 'Paris, France',
  'Dubai, UAE',
]

// Singleton: Places library is loaded at most once
let placesLibPromise: Promise<google.maps.PlacesLibrary | null> | null = null

// TODO SECURITY: Ensure NEXT_PUBLIC_GOOGLE_PLACES_API_KEY has HTTP referrer
// restrictions set in GCP Console → APIs & Services → Credentials:
//   https://console.cloud.google.com
//   Allowed referrers: https://auri-beta.vercel.app/*
//                      http://localhost:*
function getPlacesLib(): Promise<google.maps.PlacesLibrary | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim()
  if (!apiKey) return Promise.resolve(null)

  if (!placesLibPromise) {
    setOptions({ key: apiKey, v: 'weekly' })
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    placesLibPromise = Promise.race([
      importLibrary('places').then((lib) => lib as google.maps.PlacesLibrary),
      timeout,
    ]).catch(() => null)
  }

  return placesLibPromise
}

function formatPrediction(prediction: google.maps.places.AutocompletePrediction): string {
  const terms = prediction.terms
  if (terms.length >= 2) {
    const lastTerm = terms[terms.length - 1].value
    if (lastTerm === 'USA' || lastTerm === 'United States') {
      // US locations: "City, State" (use first two terms)
      if (terms.length >= 3) {
        return `${terms[0].value}, ${terms[1].value}`
      }
      return terms[0].value
    }
    // International: "City, Country"
    return `${terms[0].value}, ${lastTerm}`
  }
  // Fallback: strip USA suffix from description
  return prediction.description
    .replace(', USA', '')
    .replace(', United States', '')
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
  'aria-label'?: string
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'City or Remote',
  className = '',
  label,
  required = false,
  'aria-label': ariaLabel,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Position dropdown using input's bounding rect so it escapes overflow:hidden parents
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

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
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

  async function getSuggestions(input: string) {
    if (input.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const remoteMatches = ALWAYS_SHOW.filter((opt) =>
      opt.toLowerCase().includes(input.toLowerCase())
    )

    const cityMatches = FALLBACK_CITIES.filter((city) =>
      city.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5)

    // Show fallback immediately — don't wait for Places API
    const fallback = [...remoteMatches, ...cityMatches].slice(0, 7)
    setSuggestions(fallback)
    if (fallback.length > 0) {
      updateDropdownPosition()
      setIsOpen(true)
    }

    // Upgrade with Google Places results if available
    const lib = await getPlacesLib().catch(() => null)
    const service = lib ? new lib.AutocompleteService() : null
    if (!service) return

    service.getPlacePredictions(
      { input, types: ['geocode'] },
      (predictions, status) => {
        const cityResults =
          status === google.maps.places.PlacesServiceStatus.OK && predictions
            ? predictions.slice(0, 6).map(formatPrediction)
            : []

        if (cityResults.length === 0) return
        const combined = [...remoteMatches, ...cityResults].slice(0, 7)
        setSuggestions(combined)
        updateDropdownPosition()
        setIsOpen(true)
      }
    )
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    onChange(newValue)
    getSuggestions(newValue)
    setSelectedIndex(-1)
  }

  function handleSelect(suggestion: string) {
    onChange(suggestion)
    setSuggestions([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const dropdown = isOpen && suggestions.length > 0 && typeof document !== 'undefined'
    ? createPortal(
        <div
          style={{ ...dropdownStyle, maxHeight: 280, overflowY: 'auto' }}
          className="rounded-xl border border-white/[0.12] bg-[#1C1C26] shadow-xl shadow-black/30 overflow-hidden"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(suggestion)
              }}
              className={`w-full text-left px-4 text-sm transition-colors flex items-center gap-2 ${
                index === selectedIndex
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-[#E8E8F0] hover:bg-white/[0.05]'
              } ${ALWAYS_SHOW.includes(suggestion) ? 'text-indigo-300' : ''}`}
              style={{ minHeight: '44px' }}
            >
              <span>{ALWAYS_SHOW.includes(suggestion) ? '🌐' : '📍'}</span>
              {suggestion}
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
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && getSuggestions(value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        className={className}
        style={{ fontSize: '16px' }}
        autoComplete="off"
      />

      {dropdown}
    </div>
  )
}
