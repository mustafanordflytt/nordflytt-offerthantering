// FIX FOR GPS MODAL BUTTON NOT WORKING
// Problem: "Starta ändå" button in GPS modal doesn't respond to clicks

import { Edit } from './lib/time-tracking.ts';

// The issues identified:
// 1. Touch event handlers are preventing default behavior and might conflict with click
// 2. Button gets disabled immediately which might prevent the click from registering
// 3. Multiple high z-index modals might be overlapping

// SOLUTION 1: Remove conflicting touch handlers and fix click handler
const fixedAskForManualConfirmation = async (jobLocation: JobLocation, context: 'location_far' | 'gps_failed' = 'gps_failed'): Promise<'confirm' | 'start_without_gps' | 'cancel'> => {
  return new Promise((resolve) => {
    // Create modern modal instead of browser confirm
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    `

    const dialog = document.createElement('div')
    dialog.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 420px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      position: relative;
      -webkit-overflow-scrolling: touch;
    `

    // Icon and title based on context
    const iconText = context === 'gps_failed' ? '🌐' : '📍'
    const titleText = context === 'gps_failed' 
      ? 'GPS-bekräftelse' 
      : 'Bekräfta plats'

    // Build dialog content with simpler GPS message
    dialog.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">${iconText}</div>
      <h2 style="color: #002A5C; font-size: 24px; font-weight: bold; margin-bottom: 16px;">${titleText}</h2>
      
      <p style="color: #64748b; font-size: 16px; margin-bottom: 24px; line-height: 1.5;">
        ${context === 'gps_failed' 
          ? 'GPS är inte tillgänglig. Du kan starta jobbet ändå.' 
          : 'Du är inte på jobbplatsen enligt GPS. Bekräfta att du är på rätt plats.'}
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-weight: 600; color: #002A5C; margin-bottom: 4px;">📍 Jobbadress:</div>
        <div style="color: #64748b; font-size: 14px; line-height: 1.4;">${jobLocation.address}</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="start-without-gps-btn" style="
          background: #16a34a;
          color: white;
          border: none;
          padding: 20px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        ">
          ✅ Starta ändå
        </button>
        <button id="cancel-btn" style="
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        ">
          Avbryt
        </button>
      </div>
    `

    // Add event handlers - FIXED VERSION
    const cancelBtn = dialog.querySelector('#cancel-btn') as HTMLButtonElement
    const startWithoutGpsBtn = dialog.querySelector('#start-without-gps-btn') as HTMLButtonElement

    // FIXED: Direct click handler without touch interference
    if (startWithoutGpsBtn) {
      startWithoutGpsBtn.addEventListener('click', (e) => {
        e.stopPropagation() // Prevent event bubbling
        console.log('Start without GPS button clicked')
        
        // Visual feedback
        startWithoutGpsBtn.innerHTML = '✅ Startar...'
        startWithoutGpsBtn.style.opacity = '0.7'
        
        // Small delay for visual feedback, then resolve
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal)
          }
          resolve('start_without_gps')
        }, 100) // Reduced delay from 300ms to 100ms
      })
      
      // Add hover effect for desktop
      startWithoutGpsBtn.addEventListener('mouseenter', () => {
        startWithoutGpsBtn.style.background = '#15803d'
      })
      
      startWithoutGpsBtn.addEventListener('mouseleave', () => {
        startWithoutGpsBtn.style.background = '#16a34a'
      })
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        console.log('Cancel button clicked')
        if (document.body.contains(modal)) {
          document.body.removeChild(modal)
        }
        resolve('cancel')
      })
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('Backdrop clicked')
        if (document.body.contains(modal)) {
          document.body.removeChild(modal)
        }
        resolve('cancel')
      }
    })

    // Prevent dialog clicks from bubbling to modal
    dialog.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    modal.appendChild(dialog)
    document.body.appendChild(modal)
    
    // Focus the start button for accessibility
    startWithoutGpsBtn?.focus()
  })
}

// SOLUTION 2: Alternative approach using native confirm as fallback
const alternativeGPSConfirmation = async (): Promise<boolean> => {
  // First try to remove any existing modals
  const existingModals = document.querySelectorAll('div[style*="z-index: 999999"]')
  existingModals.forEach(modal => modal.remove())
  
  // Use native confirm as fallback
  return confirm('GPS är inte tillgänglig. Vill du starta jobbet ändå?')
}

// SOLUTION 3: Debug helper to check for modal conflicts
const debugModalConflicts = () => {
  const highZIndexElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const zIndex = window.getComputedStyle(el).zIndex
    return parseInt(zIndex) > 10000
  })
  
  console.log('High z-index elements:', highZIndexElements.length)
  highZIndexElements.forEach(el => {
    console.log(`- ${el.tagName}, z-index: ${window.getComputedStyle(el).zIndex}`)
  })
}

export { fixedAskForManualConfirmation, alternativeGPSConfirmation, debugModalConflicts }