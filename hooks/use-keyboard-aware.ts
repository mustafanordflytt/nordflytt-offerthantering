import { useEffect, useState } from 'react'

interface ViewportHeight {
  height: number
  isKeyboardOpen: boolean
}

/**
 * Hook to handle keyboard-aware layouts on mobile devices
 * Detects when virtual keyboard is open and adjusts viewport accordingly
 */
export function useKeyboardAware() {
  const [viewport, setViewport] = useState<ViewportHeight>({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isKeyboardOpen: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initialHeight = window.innerHeight
    let resizeTimer: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(resizeTimer)
      
      // Debounce resize events
      resizeTimer = setTimeout(() => {
        const currentHeight = window.innerHeight
        const heightDifference = initialHeight - currentHeight
        
        // Consider keyboard open if viewport shrinks by more than 150px
        // This threshold works for most mobile keyboards
        const keyboardOpen = heightDifference > 150
        
        setViewport({
          height: currentHeight,
          isKeyboardOpen: keyboardOpen
        })

        // Add class to body for CSS targeting
        if (keyboardOpen) {
          document.body.classList.add('keyboard-open')
        } else {
          document.body.classList.remove('keyboard-open')
        }
      }, 100)
    }

    // Visual Viewport API for better mobile support
    if ('visualViewport' in window && window.visualViewport) {
      const handleViewportChange = () => {
        const vv = window.visualViewport
        if (!vv) return
        
        const keyboardHeight = window.innerHeight - vv.height
        const keyboardOpen = keyboardHeight > 100
        
        setViewport({
          height: vv.height,
          isKeyboardOpen: keyboardOpen
        })

        if (keyboardOpen) {
          document.body.classList.add('keyboard-open')
          document.body.style.height = `${vv.height}px`
        } else {
          document.body.classList.remove('keyboard-open')
          document.body.style.height = ''
        }
      }

      window.visualViewport.addEventListener('resize', handleViewportChange)
      window.visualViewport.addEventListener('scroll', handleViewportChange)
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange)
        window.visualViewport?.removeEventListener('scroll', handleViewportChange)
        clearTimeout(resizeTimer)
      }
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize)
      
      // Also listen to focus/blur on inputs
      const handleFocus = () => {
        setTimeout(() => {
          const currentHeight = window.innerHeight
          if (currentHeight < initialHeight * 0.75) {
            setViewport({
              height: currentHeight,
              isKeyboardOpen: true
            })
            document.body.classList.add('keyboard-open')
          }
        }, 300)
      }
      
      const handleBlur = () => {
        setTimeout(() => {
          setViewport({
            height: window.innerHeight,
            isKeyboardOpen: false
          })
          document.body.classList.remove('keyboard-open')
        }, 100)
      }
      
      // Add listeners to all inputs
      document.addEventListener('focusin', handleFocus)
      document.addEventListener('focusout', handleBlur)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        document.removeEventListener('focusin', handleFocus)
        document.removeEventListener('focusout', handleBlur)
        clearTimeout(resizeTimer)
      }
    }
  }, [])

  return viewport
}

/**
 * Hook to scroll element into view when keyboard opens
 * Useful for keeping form inputs visible
 */
export function useScrollIntoViewOnFocus() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT') {
        
        // Wait for keyboard to open
        setTimeout(() => {
          // Check if element is in viewport
          const rect = target.getBoundingClientRect()
          const viewportHeight = window.visualViewport?.height || window.innerHeight
          
          if (rect.bottom > viewportHeight || rect.top < 0) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }, 300)
      }
    }

    document.addEventListener('focusin', handleFocus)
    
    return () => {
      document.removeEventListener('focusin', handleFocus)
    }
  }, [])
}