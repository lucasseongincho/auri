'use client'

import { useEffect, useRef } from 'react'
import { useAutocomplete } from '@/hooks/useAutocomplete'

const COMPANIES = [
  // Big Tech
  'Google', 'Meta', 'Apple', 'Amazon', 'Microsoft',
  'Netflix', 'Salesforce', 'Adobe', 'Oracle', 'IBM',
  'Intel', 'Nvidia', 'Uber', 'Airbnb', 'Lyft',
  'Twitter / X', 'LinkedIn', 'Spotify', 'Stripe',
  'Square', 'PayPal', 'Shopify', 'Zoom', 'Slack',
  'Dropbox', 'Atlassian', 'HubSpot', 'Twilio',
  'Snowflake', 'Databricks', 'OpenAI', 'Anthropic',
  // Finance
  'Goldman Sachs', 'JP Morgan', 'Morgan Stanley',
  'BlackRock', 'Citadel', 'Two Sigma', 'AQR Capital',
  'Bridgewater', 'Point72', 'Renaissance Technologies',
  'Bank of America', 'Wells Fargo', 'Citi', 'HSBC',
  'Deutsche Bank', 'Barclays',
  // Consulting
  'McKinsey', 'Boston Consulting Group', 'Bain',
  'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture',
  'Oliver Wyman', 'Booz Allen Hamilton',
  // Healthcare
  'Johnson & Johnson', 'Pfizer', 'UnitedHealth',
  'CVS Health', 'Anthem', 'Cigna', 'Abbott',
  // Retail & Consumer
  'Walmart', 'Target', 'Costco', 'Nike', 'Adidas',
  'Starbucks', "McDonald's", 'Coca-Cola', 'PepsiCo',
  // Media & Entertainment
  'Disney', 'Warner Bros', 'NBCUniversal', 'HBO',
  // Other Major
  'Tesla', 'SpaceX', 'Boeing', 'Lockheed Martin',
  'ExxonMobil', 'Chevron', 'General Electric',
  '3M', 'Procter & Gamble', 'Unilever',
]

interface CompanyAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export default function CompanyAutocomplete({
  value,
  onChange,
  placeholder = 'Acme Corp',
  className = '',
  'aria-label': ariaLabel,
}: CompanyAutocompleteProps) {
  const { query, setQuery, filtered, isOpen, setIsOpen, selectedIndex, handleKeyDown } =
    useAutocomplete(COMPANIES)
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

  function highlightMatch(text: string) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1 || query.length < 2) return <span>{text}</span>
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-[#818CF8] font-semibold">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
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
          {filtered.map((company, i) => (
            <button
              key={company}
              role="option"
              aria-selected={i === selectedIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                setQuery(company)
                onChange(company)
                setIsOpen(false)
              }}
              onMouseEnter={() => {}}
              className={`w-full text-left px-4 text-sm text-[#E8E8F0] transition-colors ${
                i === selectedIndex ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
              }`}
              style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              {highlightMatch(company)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
