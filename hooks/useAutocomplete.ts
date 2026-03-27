'use client'

import { useEffect, useState } from 'react'

export function useAutocomplete(list: string[]) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const filtered =
    query.length >= 2
      ? list.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
      : []

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      setQuery(filtered[selectedIndex])
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    setIsOpen(filtered.length > 0)
    setSelectedIndex(-1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return { query, setQuery, filtered, isOpen, setIsOpen, selectedIndex, handleKeyDown }
}
