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
  // Major US cities
  'New York, NY', 'Los Angeles, CA',
  'Chicago, IL', 'San Francisco, CA',
  'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Denver, CO',
  'Atlanta, GA', 'Miami, FL',
  'Dallas, TX', 'Washington, DC',
  'Portland, OR', 'Nashville, TN',
  'Phoenix, AZ', 'San Diego, CA',
  'Minneapolis, MN', 'Detroit, MI',
  'Philadelphia, PA', 'Houston, TX',
  // Tech hubs & suburbs
  'Palo Alto, CA', 'Menlo Park, CA',
  'Mountain View, CA', 'Sunnyvale, CA',
  'San Jose, CA', 'Bellevue, WA',
  'Redmond, WA', 'Kirkland, WA',
  'Melville, NY', 'Hoboken, NJ',
  'Jersey City, NJ', 'Stamford, CT',
  'Cambridge, MA', 'Somerville, MA',
  'Brooklyn, NY', 'Queens, NY',
  'Reston, VA', 'McLean, VA',
  'Bethesda, MD',
  // International
  'London, UK', 'Toronto, Canada',
  'Vancouver, Canada', 'Montreal, Canada',
  'Sydney, Australia', 'Melbourne, Australia',
  'Singapore', 'Tokyo, Japan',
  'Seoul, South Korea', 'Berlin, Germany',
  'Amsterdam, Netherlands', 'Paris, France',
  'Dublin, Ireland', 'Zurich, Switzerland',
  'Dubai, UAE', 'Tel Aviv, Israel',
]

// Bootstrap the Google Maps loader once per session.
// setOptions() from @googlemaps/js-api-loader installs google.maps.importLibrary
// globally; repeated calls after the first are silently ignored by the library.
let mapsBootstrapped = false
function ensureMapsBootstrapped() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim()
  console.log('[LocationAutocomplete] API key present:', !!apiKey)
  if (!apiKey) {
    console.error('[LocationAutocomplete] MISSING: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY')
    return false
  }
  console.log('[LocationAutocomplete] API key prefix:', apiKey.substring(0, 10))
  if (!mapsBootstrapped) {
    setOptions({ key: apiKey, v: 'weekly' })
    mapsBootstrapped = true
    console.log('[LocationAutocomplete] Maps bootstrapped via setOptions')
  }
  return true
}

// Format a suggestion's main + secondary text into "City, State" or "City, Country"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatSuggestion(suggestion: any): string {
  const place = suggestion.placePrediction
  const mainText: string = place?.mainText?.text ?? ''
  const secondaryText: string = place?.secondaryText?.text ?? ''

  if (!mainText) return ''

  if (secondaryText.includes('USA') || secondaryText.includes('United States')) {
    // secondaryText is e.g. "Suffolk County, NY, USA" or "New York, NY, USA"
    // We want the state abbreviation — typically the second-to-last comma-part
    const parts = secondaryText.split(', ')
    // Find the 2-letter state abbreviation (part before "USA" / "United States")
    const stateIndex = parts.findIndex((p) => p === 'USA' || p === 'United States')
    const state = stateIndex > 0 ? parts[stateIndex - 1] : parts[0]
    return `${mainText}, ${state}`
  }

  // International: last comma-segment is the country
  const country = secondaryText.split(', ').pop() ?? secondaryText
  return country ? `${mainText}, ${country}` : mainText
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

  // Position dropdown using input's bounding rect so it escapes overflow parents
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

    // Show fallback list immediately — don't wait for Places API
    const fallback = [...remoteMatches, ...cityMatches].slice(0, 7)
    setSuggestions(fallback)
    if (fallback.length > 0) {
      updateDropdownPosition()
      setIsOpen(true)
    }

    // Attempt to upgrade with live Places results
    if (!ensureMapsBootstrapped()) return

    try {
      // importLibrary from @googlemaps/js-api-loader delegates to
      // google.maps.importLibrary which was installed by setOptions above.
      // This loads the new Places (New) library which includes AutocompleteSuggestion.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const placesLib = await importLibrary('places') as any
      const { AutocompleteSuggestion } = placesLib

      console.log('[LocationAutocomplete] AutocompleteSuggestion available:', !!AutocompleteSuggestion)

      if (!AutocompleteSuggestion) {
        console.warn('[LocationAutocomplete] AutocompleteSuggestion not found in library')
        return
      }

      const { suggestions: apiSuggestions } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedPrimaryTypes: [
            'locality',
            'sublocality',
            'administrative_area_level_3',
            'postal_town',
          ],
        })

      console.log('[LocationAutocomplete] Places results:', apiSuggestions?.length ?? 0)

      const cityResults: string[] = (apiSuggestions ?? [])
        .slice(0, 6)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((s: any) => formatSuggestion(s))
        .filter(Boolean)

      const combined = [...remoteMatches, ...cityResults].slice(0, 7)
      setSuggestions(combined)
      if (combined.length > 0) {
        updateDropdownPosition()
        setIsOpen(true)
      }
    } catch (error) {
      console.error('[LocationAutocomplete] AutocompleteSuggestion error:', error)
      // Fallback list is already displayed — nothing more to do
    }
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
