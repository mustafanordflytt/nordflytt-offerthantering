"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

interface AddressInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function AddressInputWithGoogleFallback({
  id,
  value,
  onChange,
  placeholder = "Skriv en adress...",
  className = ""
}: AddressInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [googleStatus, setGoogleStatus] = useState<'checking' | 'ready' | 'failed'>('checking')
  const [placeElement, setPlaceElement] = useState<any>(null)

  // Check Google Maps availability
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 30

    const checkGoogle = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places?.PlaceAutocompleteElement) {
        console.log('✅ Google Places PlaceAutocompleteElement is ready for', id)
        setGoogleStatus('ready')
      } else if (attempts < maxAttempts) {
        attempts++
        console.log(`⏳ Waiting for Google Places PlaceAutocompleteElement for ${id}... (${attempts}/${maxAttempts})`)
        setTimeout(checkGoogle, 300)
      } else {
        console.error(`❌ Google Places PlaceAutocompleteElement failed to load for ${id}`)
        setGoogleStatus('failed')
      }
    }

    checkGoogle()
  }, [id])

  // Force Google input visibility for all inputs on page
  useEffect(() => {
    const forceGoogleInputVisibility = () => {
      // Find all Google autocomplete elements
      const googleInputs = document.querySelectorAll('gmp-place-autocomplete input, gmp-place-autocomplete');
      
      googleInputs.forEach(input => {
        if (input instanceof HTMLElement && input.style) {
          input.style.setProperty('color', '#000000', 'important');
          input.style.setProperty('background-color', '#ffffff', 'important');
          input.style.setProperty('-webkit-text-fill-color', '#000000', 'important');
          input.style.setProperty('caret-color', '#000000', 'important');
          input.style.setProperty('opacity', '1', 'important');
        }
      });
    };

    // Force dropdown styling
    const forceDropdownStyling = () => {
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer instanceof HTMLElement) {
        // Force white background on container
        pacContainer.style.setProperty('background-color', '#ffffff', 'important');
        pacContainer.style.setProperty('background', '#ffffff', 'important');
        pacContainer.classList.add('google-dropdown-fix');
        
        // Force all pac-items to have white background
        const pacItems = pacContainer.querySelectorAll('.pac-item');
        pacItems.forEach(item => {
          if (item instanceof HTMLElement) {
            item.style.setProperty('background-color', '#ffffff', 'important');
            item.style.setProperty('background', '#ffffff', 'important');
            item.style.setProperty('color', '#000000', 'important');
          }
        });
      }
    };

    // Apply immediately and on interval
    forceGoogleInputVisibility();
    forceDropdownStyling();
    const interval = setInterval(() => {
      forceGoogleInputVisibility();
      forceDropdownStyling();
    }, 100);

    // Observer for when Google element is added
    const observer = new MutationObserver(() => {
      forceGoogleInputVisibility();
      forceDropdownStyling();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Global event listener for dropdown appearance
    const handleDOMNodeInserted = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target.classList && target.classList.contains('pac-container')) {
        forceDropdownStyling();
      }
    };

    document.addEventListener('DOMNodeInserted', handleDOMNodeInserted);

    return () => {
      clearInterval(interval);
      observer.disconnect();
      document.removeEventListener('DOMNodeInserted', handleDOMNodeInserted);
    };
  }, []);

  // Initialize NEW Google Places API when ready
  useEffect(() => {
    if (googleStatus === 'ready' && containerRef.current && !placeElement) {
      try {
        console.log(`🔧 Initializing NEW Google PlaceAutocompleteElement for ${id}`)
        
        // Create the new PlaceAutocompleteElement
        const element = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: 'se' },
          types: ['address']
        })

        // Style the element
        element.style.width = '100%'
        element.style.height = '40px'
        element.style.border = '1px solid #d1d5db'
        element.style.borderRadius = '6px'
        element.style.padding = '8px 12px'
        element.style.fontSize = '14px'
        element.style.backgroundColor = 'white'

        // Set placeholder and fix text color
        const inputElement = element.querySelector('input') as HTMLInputElement
        if (inputElement) {
          inputElement.placeholder = placeholder
          inputElement.style.outline = 'none'
          inputElement.style.width = '100%'
          inputElement.style.border = 'none'
          inputElement.style.background = 'transparent'
          inputElement.style.color = '#000000' // Svart text
          inputElement.style.webkitTextFillColor = '#000000' // För webkit browsers
          inputElement.style.fontSize = '14px'
          inputElement.style.fontFamily = 'inherit'
          inputElement.style.opacity = '1'
          
          // Force inline style för säkerhets skull
          inputElement.setAttribute('style', inputElement.getAttribute('style') + '; color: #000000 !important; -webkit-text-fill-color: #000000 !important;')
        }
        
        // Aggressive fix - check every 100ms for first 2 seconds
        let checks = 0
        const colorInterval = setInterval(() => {
          const input = element.querySelector('input')
          if (input) {
            input.style.color = '#000000'
            input.style.webkitTextFillColor = '#000000'
            input.style.opacity = '1'
          }
          checks++
          if (checks > 20) { // Stop after 2 seconds
            clearInterval(colorInterval)
          }
        }, 100)

        // Set initial value
        if (value && inputElement) {
          inputElement.value = value
        }

        // Listen for place selection
        element.addEventListener('gmp-placeselect', (event: any) => {
          const place = event.place
          if (place?.formattedAddress || place?.formatted_address) {
            const address = place.formattedAddress || place.formatted_address
            console.log(`📍 Address selected for ${id}:`, address)
            onChange(address)
          }
        })

        // Use MutationObserver to ensure text color stays black
        const observer = new MutationObserver(() => {
          const input = element.querySelector('input')
          if (input) {
            input.style.color = '#000000'
            input.style.webkitTextFillColor = '#000000'
            input.style.opacity = '1'
            // Force style attribute
            input.setAttribute('style', input.getAttribute('style') + '; color: #000000 !important; -webkit-text-fill-color: #000000 !important;')
          }
        })
        
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['style'],
          subtree: true,
          childList: true
        })
        
        // Also observe the input element specifically when it's added
        const inputObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'INPUT') {
                  const input = node as HTMLInputElement
                  input.style.color = '#000000'
                  input.style.webkitTextFillColor = '#000000'
                  input.style.opacity = '1'
                }
              })
            }
          })
        })
        
        inputObserver.observe(element, {
          childList: true,
          subtree: true
        })

        // Add to container
        if (containerRef.current) {
          // Clear container first
          containerRef.current.innerHTML = ''
          // Add class for CSS targeting
          containerRef.current.classList.add('google-autocomplete-text-fix')
          element.classList.add('google-autocomplete-element')
          containerRef.current.appendChild(element)
          setPlaceElement(element)
        }

        console.log(`✅ NEW Google PlaceAutocompleteElement initialized successfully for ${id}`)

      } catch (error) {
        console.error(`Failed to initialize NEW Google PlaceAutocompleteElement for ${id}:`, error)
        setGoogleStatus('failed')
      }
    }
  }, [googleStatus, onChange, id, placeholder, value])

  // Update element value when prop changes and ensure text is visible
  useEffect(() => {
    if (placeElement) {
      const inputElement = placeElement.querySelector('input') as HTMLInputElement
      if (inputElement) {
        if (inputElement.value !== value) {
          inputElement.value = value
        }
        // Ensure text color is always black
        inputElement.style.color = '#000000'
      }
    }
  }, [value, placeElement])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (placeElement && containerRef.current && containerRef.current.contains(placeElement)) {
        containerRef.current.removeChild(placeElement)
        setPlaceElement(null)
      }
    }
  }, [placeElement])

  // Fallback to regular input if Google fails
  if (googleStatus === 'failed') {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 ${className}`}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-xs text-amber-600 mt-1">
          ⚠️ Google Maps är inte tillgängligt. Skriv adressen manuellt.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {googleStatus === 'checking' && (
        <div className="flex items-center justify-center h-10 border border-gray-300 rounded-md bg-gray-50">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Laddar adressförslag...</span>
        </div>
      )}
      
      {googleStatus === 'ready' && (
        <>
          <div ref={containerRef} className={`relative ${className}`}>
            {/* PlaceAutocompleteElement will be inserted here */}
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <MapPin className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xs text-green-600 mt-1">
            ✅ Adressförslag aktiverat (Nya API)
          </p>
        </>
      )}
    </div>
  )
}