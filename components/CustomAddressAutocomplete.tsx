"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from './ui/input'

interface CustomAddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

// Svenska adresser för demo
const SWEDISH_ADDRESSES = [
  "Kungsgatan 1, 111 43 Stockholm",
  "Kungsgatan 10, 111 43 Stockholm", 
  "Kungsgatan 25, 111 56 Stockholm",
  "Kungsgatan 44, 111 35 Stockholm",
  "Drottninggatan 1, 111 51 Stockholm",
  "Drottninggatan 25, 111 51 Stockholm",
  "Drottninggatan 50, 111 21 Stockholm",
  "Drottninggatan 71, 111 36 Stockholm",
  "Vasagatan 1, 111 20 Stockholm",
  "Vasagatan 16, 111 20 Stockholm",
  "Sveavägen 13, 111 57 Stockholm",
  "Sveavägen 44, 111 34 Stockholm",
  "Götgatan 1, 116 21 Stockholm",
  "Götgatan 31, 116 21 Stockholm",
  "Birger Jarlsgatan 1, 111 45 Stockholm",
  "Birger Jarlsgatan 57, 113 56 Stockholm",
  "Storgatan 1, 114 55 Stockholm",
  "Hamngatan 1, 111 47 Stockholm",
  "Regeringsgatan 1, 111 53 Stockholm",
  "Biblioteksgatan 1, 111 46 Stockholm"
]

export default function CustomAddressAutocomplete({
  value,
  onChange,
  placeholder = "Skriv en adress...",
  className = "",
  id
}: CustomAddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input
  useEffect(() => {
    if (value.length > 1) {
      const filtered = SWEDISH_ADDRESSES.filter(address =>
        address.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
      setIsOpen(filtered.length > 0)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [value])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectAddress(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const selectAddress = (address: string) => {
    onChange(address)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  // Try to use Google Autocomplete if available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places && inputRef.current) {
      try {
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'se' },
          fields: ['formatted_address', 'geometry']
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place?.formatted_address) {
            onChange(place.formatted_address)
            setIsOpen(false)
          }
        })

        console.log('✅ Google Autocomplete initialized as fallback')
      } catch (error) {
        console.log('📍 Using custom autocomplete instead of Google')
      }
    }
  }, [onChange])

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length > 1 && suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[999999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 999999
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => selectAddress(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm">{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}