"use client"

import { useState, useRef, useEffect } from 'react'

const ADDRESSES = [
  "Kungsgatan 1, Stockholm",
  "Kungsgatan 10, Stockholm", 
  "Drottninggatan 1, Stockholm",
  "Drottninggatan 50, Stockholm",
  "Vasagatan 1, Stockholm",
  "Sveavägen 13, Stockholm"
]

export default function TestSimpleAutocompletePage() {
  const [value, setValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (value.length > 0) {
      const filtered = ADDRESSES.filter(addr => 
        addr.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
      setIsOpen(filtered.length > 0)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [value])

  return (
    <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        Simple Autocomplete Test
      </h1>
      
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Börja skriva 'Kung' eller 'Drott'..."
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '4px'
          }}
        />
        
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '2px solid #007bff',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            maxHeight: '200px',
            overflow: 'auto',
            zIndex: 1000
          }}>
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                onClick={() => {
                  setValue(suggestion)
                  setIsOpen(false)
                }}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  background: i % 2 === 0 ? '#f9f9f9' : 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#007bff'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = i % 2 === 0 ? '#f9f9f9' : 'white'
                  e.currentTarget.style.color = 'black'
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <strong>Current value:</strong> {value || '(empty)'}
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#fffbcc' }}>
        <strong>Instructions:</strong>
        <ul>
          <li>Type "Kung" or "Drott" to see suggestions</li>
          <li>Click on a suggestion to select it</li>
          <li>The dropdown should appear automatically</li>
        </ul>
      </div>
    </div>
  )
}