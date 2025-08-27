"use client"

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

export default function DebugAutocompletePage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string[]>([])
  const [address, setAddress] = useState('')
  
  const addStatus = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setStatus(prev => [...prev, `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    // Check initial state
    addStatus('Page loaded, checking Google Maps...')
    
    const checkInterval = setInterval(() => {
      if (window.google?.maps?.places) {
        addStatus('✅ Google Maps Places API is loaded!')
        clearInterval(checkInterval)
        initializeAutocomplete()
      }
    }, 500)

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!window.google?.maps?.places) {
        addStatus('❌ Google Maps failed to load after 10 seconds')
        clearInterval(checkInterval)
      }
    }, 10000)

    return () => clearInterval(checkInterval)
  }, [])

  const initializeAutocomplete = () => {
    if (!inputRef.current) {
      addStatus('❌ Input ref not ready')
      return
    }

    try {
      addStatus('🔧 Initializing autocomplete...')
      
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'se' },
        fields: ['formatted_address', 'geometry', 'address_components']
      })

      addStatus('✅ Autocomplete instance created')

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place?.formatted_address) {
          addStatus(`📍 Address selected: ${place.formatted_address}`)
          setAddress(place.formatted_address)
        }
      })

      // Add input listener to detect typing
      inputRef.current.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        addStatus(`⌨️ Typing: "${target.value}"`)
      })

      // Force show pac-container for debugging
      setTimeout(() => {
        const pacContainers = document.querySelectorAll('.pac-container')
        addStatus(`🔍 Found ${pacContainers.length} pac-container elements`)
        
        pacContainers.forEach((container, index) => {
          const htmlContainer = container as HTMLElement
          addStatus(`pac-container ${index}: display=${htmlContainer.style.display}, visibility=${htmlContainer.style.visibility}`)
        })
      }, 1000)

    } catch (error) {
      addStatus(`❌ Error: ${error}`)
    }
  }

  const testPacContainer = () => {
    // Create a test pac-container to see if CSS is working
    const testDiv = document.createElement('div')
    testDiv.className = 'pac-container'
    testDiv.innerHTML = `
      <div class="pac-item">
        <span class="pac-icon"></span>
        <span class="pac-item-query">Test Address 1</span>
      </div>
      <div class="pac-item">
        <span class="pac-icon"></span>
        <span class="pac-item-query">Test Address 2</span>
      </div>
    `
    testDiv.style.position = 'fixed'
    testDiv.style.top = '200px'
    testDiv.style.left = '50%'
    testDiv.style.transform = 'translateX(-50%)'
    testDiv.style.width = '300px'
    
    document.body.appendChild(testDiv)
    addStatus('🧪 Created test pac-container')
    
    setTimeout(() => {
      document.body.removeChild(testDiv)
      addStatus('🧹 Removed test pac-container')
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">🔍 Google Autocomplete Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Input</h2>
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Start typing an address (e.g., 'Kungsgatan')..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-600 mt-2">
            Type slowly and watch the console. Autocomplete should appear below the input.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
            <button
              onClick={testPacContainer}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test PAC Container CSS
            </button>
          </div>
        </div>

        <div className="bg-gray-900 text-green-400 p-6 rounded-lg shadow font-mono text-sm">
          <h2 className="text-lg font-semibold mb-4">Status Log</h2>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {status.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Tips:</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Open browser DevTools (F12)</li>
            <li>Check Console for errors</li>
            <li>Inspect Elements to find .pac-container</li>
            <li>Check Network tab for Places API calls</li>
            <li>Look for CSP (Content Security Policy) errors</li>
          </ul>
        </div>
      </div>
    </div>
  )
}