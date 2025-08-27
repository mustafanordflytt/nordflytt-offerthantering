// ROBUST GPS MODAL - Fungerar garanterat på både desktop och mobil

export interface JobLocation {
  latitude: number
  longitude: number
  address: string
}

export const showGPSModal = async (jobLocation: JobLocation): Promise<'start_without_gps' | 'cancel'> => {
  return new Promise((resolve) => {
    // Skapa unik ID för denna modal
    const modalId = `gps-modal-${Date.now()}`
    const btnId = `gps-btn-${Date.now()}`
    const cancelId = `gps-cancel-${Date.now()}`
    
    // Skapa style element med unika CSS-regler
    const style = document.createElement('style')
    style.textContent = `
      #${modalId} {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.8) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
        touch-action: none !important;
      }
      
      #${modalId} * {
        pointer-events: auto !important;
        -webkit-tap-highlight-color: transparent !important;
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
      }
      
      #${modalId} .modal-dialog {
        background: white !important;
        border-radius: 16px !important;
        padding: 24px !important;
        max-width: 400px !important;
        width: 90% !important;
        max-height: 90vh !important;
        overflow-y: auto !important;
        position: relative !important;
        z-index: 2147483648 !important;
        pointer-events: auto !important;
      }
      
      #${btnId}, #${cancelId} {
        display: block !important;
        width: 100% !important;
        border: none !important;
        border-radius: 12px !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
        pointer-events: auto !important;
        position: relative !important;
        z-index: 2147483649 !important;
        outline: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        appearance: none !important;
        margin: 0 !important;
        min-height: 56px !important;
        transition: opacity 0.2s ease !important;
      }
      
      #${btnId} {
        background: #16a34a !important;
        color: white !important;
        padding: 16px 24px !important;
        margin-bottom: 12px !important;
      }
      
      #${btnId}:active {
        opacity: 0.8 !important;
        transform: scale(0.98) !important;
      }
      
      #${cancelId} {
        background: #f1f5f9 !important;
        color: #475569 !important;
        padding: 14px 24px !important;
      }
      
      #${cancelId}:active {
        opacity: 0.8 !important;
        transform: scale(0.98) !important;
      }
      
      @media (hover: hover) {
        #${btnId}:hover {
          background: #15803d !important;
        }
        #${cancelId}:hover {
          background: #e2e8f0 !important;
        }
      }
    `
    document.head.appendChild(style)
    
    // Skapa modal HTML
    const modal = document.createElement('div')
    modal.id = modalId
    modal.innerHTML = `
      <div class="modal-dialog">
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🌐</div>
          <h2 style="color: #002A5C; font-size: 24px; font-weight: bold; margin: 0 0 16px 0;">
            GPS-bekräftelse
          </h2>
          <p style="color: #64748b; font-size: 16px; margin: 0 0 24px 0; line-height: 1.5;">
            GPS är inte tillgänglig. Du kan starta jobbet ändå.
          </p>
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <div style="font-weight: 600; color: #002A5C; margin-bottom: 4px;">📍 Jobbadress:</div>
            <div style="color: #64748b; font-size: 14px;">${jobLocation.address}</div>
          </div>
          <button id="${btnId}" type="button">
            ✅ Starta ändå
          </button>
          <button id="${cancelId}" type="button">
            Avbryt
          </button>
        </div>
      </div>
    `
    
    // Lägg till modal till body
    document.body.appendChild(modal)
    
    // Force reflow för att säkerställa rendering
    void modal.offsetHeight
    
    // Variabler för knappar (behövs för cleanup)
    let startBtn: HTMLElement | null = null
    let cancelBtn: HTMLElement | null = null
    
    // Funktion för att rensa upp
    const cleanup = () => {
      // Ta bort event listeners
      if (startBtn) {
        startBtn.removeEventListener('click', handleStart)
        startBtn.removeEventListener('touchend', handleStart)
      }
      if (cancelBtn) {
        cancelBtn.removeEventListener('click', handleCancel)
        cancelBtn.removeEventListener('touchend', handleCancel)
      }
      modal.removeEventListener('click', handleBackdrop)
      
      // Ta bort modal och style
      if (document.body.contains(modal)) {
        document.body.removeChild(modal)
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
    
    // Event handlers
    const handleStart = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      
      // Ge visuell feedback
      const btn = document.getElementById(btnId) as HTMLButtonElement
      if (btn) {
        btn.textContent = '✅ Startar...'
        btn.style.opacity = '0.7'
      }
      
      // Vänta lite för feedback
      setTimeout(() => {
        cleanup()
        resolve('start_without_gps')
      }, 200)
    }
    
    const handleCancel = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      
      cleanup()
      resolve('cancel')
    }
    
    const handleBackdrop = (e: Event) => {
      if (e.target === modal) {
        e.preventDefault()
        e.stopPropagation()
        cleanup()
        resolve('cancel')
      }
    }
    
    // Hämta knappar efter DOM är uppdaterad
    requestAnimationFrame(() => {
      startBtn = document.getElementById(btnId)
      cancelBtn = document.getElementById(cancelId)
      
      if (startBtn && cancelBtn) {
        // Lägg till event listeners för både click och touch
        startBtn.addEventListener('click', handleStart, { capture: true })
        startBtn.addEventListener('touchend', handleStart, { capture: true, passive: false })
        
        cancelBtn.addEventListener('click', handleCancel, { capture: true })
        cancelBtn.addEventListener('touchend', handleCancel, { capture: true, passive: false })
        
        modal.addEventListener('click', handleBackdrop, { capture: true })
        
        // Fokusera på start-knappen
        setTimeout(() => {
          startBtn.focus()
        }, 100)
      } else {
        console.error('GPS Modal: Kunde inte hitta knappar!')
        cleanup()
        resolve('cancel')
      }
    })
  })
}