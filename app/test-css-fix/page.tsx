"use client"

import { useEffect, useRef } from 'react'

export default function TestCSSFixPage() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Inject CSS fix directly
    const style = document.createElement('style')
    style.innerHTML = `
      /* Force Google Autocomplete to show */
      .pac-container {
        z-index: 2147483647 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        background: white !important;
        border: 2px solid #1a73e8 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
        overflow: visible !important;
        max-height: 400px !important;
      }
      
      .pac-item {
        padding: 10px 15px !important;
        cursor: pointer !important;
        border-bottom: 1px solid #e0e0e0 !important;
        font-size: 14px !important;
        color: #333 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      .pac-item:hover {
        background-color: #f5f5f5 !important;
      }
      
      .pac-item-selected {
        background-color: #e3f2fd !important;
      }
      
      /* Debug: Make pac-container visible for testing */
      .pac-container.test-visible {
        display: block !important;
        position: fixed !important;
        top: 200px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        min-width: 300px !important;
        background: yellow !important;
        border: 3px solid red !important;
      }
    `
    document.head.appendChild(style)

    // Initialize autocomplete
    const initAutocomplete = () => {
      if (!window.google?.maps?.places || !inputRef.current) return

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'se' }
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        console.log('Place selected:', place?.formatted_address)
      })

      // Debug: Monitor pac-container
      setTimeout(() => {
        const checkPacContainer = setInterval(() => {
          const pacContainers = document.querySelectorAll('.pac-container')
          if (pacContainers.length > 0) {
            console.log('Found pac-container!')
            pacContainers.forEach((container, i) => {
              const el = container as HTMLElement
              console.log(`Container ${i}:`, {
                display: window.getComputedStyle(el).display,
                visibility: window.getComputedStyle(el).visibility,
                zIndex: window.getComputedStyle(el).zIndex,
                position: window.getComputedStyle(el).position,
                top: el.style.top,
                left: el.style.left
              })
            })
          }
        }, 500)

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkPacContainer), 10000)
      }, 1000)
    }

    if (window.google?.maps?.places) {
      initAutocomplete()
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogle)
          initAutocomplete()
        }
      }, 500)
    }

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const forceShowPacContainer = () => {
    const pacContainers = document.querySelectorAll('.pac-container')
    pacContainers.forEach(container => {
      const el = container as HTMLElement
      el.classList.add('test-visible')
      el.innerHTML = `
        <div class="pac-item">
          <span class="pac-icon"></span>
          <span>Test Address 1 - Kungsgatan 1, Stockholm</span>
        </div>
        <div class="pac-item">
          <span class="pac-icon"></span>
          <span>Test Address 2 - Drottninggatan 50, Stockholm</span>
        </div>
      `
    })
    console.log(`Forced ${pacContainers.length} pac-containers to show`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">🔧 CSS Fix Test for Google Autocomplete</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Address Input</h2>
          <input
            ref={inputRef}
            type="text"
            placeholder="Start typing: Kungsgatan..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Debug Actions</h2>
          <button
            onClick={forceShowPacContainer}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-4"
          >
            Force Show PAC Container
          </button>
          
          <button
            onClick={() => {
              const containers = document.querySelectorAll('.pac-container')
              console.log(`Found ${containers.length} pac-containers`)
              containers.forEach((c, i) => {
                console.log(`Container ${i}:`, c)
              })
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Log PAC Containers
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Type slowly in the input field</li>
            <li>Check browser console (F12) for logs</li>
            <li>If no dropdown appears, click "Force Show PAC Container"</li>
            <li>Open Elements tab and search for "pac-container"</li>
          </ol>
        </div>
      </div>
    </div>
  )
}