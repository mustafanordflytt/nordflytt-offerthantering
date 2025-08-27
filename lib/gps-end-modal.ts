/**
 * GPS End Modal - Specific modal for ending jobs with GPS validation
 */

export const showGPSEndModal = async (
  currentLocation?: { latitude: number, longitude: number },
  jobLocation?: { latitude: number, longitude: number, address: string },
  distance?: number
): Promise<'end_without_gps' | 'cancel'> => {
  return new Promise((resolve) => {
    // Create modal backdrop
    const modal = document.createElement('div')
    modal.className = 'gps-modal-backdrop'
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    `
    
    // Create dialog
    const dialog = document.createElement('div')
    dialog.className = 'gps-modal-dialog'
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      position: relative;
    `
    
    // Modal content
    const iconStyle = distance && distance > 500 ? '⚠️' : '📍'
    const titleText = 'GPS-bekräftelse för avslut'
    
    dialog.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
        ${iconStyle} ${titleText}
      </h2>
      
      <div style="margin-bottom: 24px; line-height: 1.6; color: #666;">
        ${distance && distance > 500 ? `
          <p style="margin: 0 0 12px 0;">
            <strong style="color: #dc2626;">Du är ${Math.round(distance)}m från jobbadressen.</strong>
          </p>
          <p style="margin: 0 0 12px 0;">
            För bästa kvalitetssäkring bör du vara på plats vid avslut.
          </p>
        ` : currentLocation ? `
          <p style="margin: 0 0 12px 0;">
            <strong style="color: #16a34a;">✅ Du är på rätt plats!</strong>
          </p>
          <p style="margin: 0;">
            GPS-position bekräftad för avslut av uppdraget.
          </p>
        ` : `
          <p style="margin: 0 0 12px 0;">
            GPS-position kunde inte hämtas för avslut.
          </p>
          <p style="margin: 0;">
            Vill du avsluta uppdraget ändå?
          </p>
        `}
        
        ${jobLocation ? `
          <div style="margin-top: 12px; padding: 12px; background: #f5f5f5; border-radius: 6px; font-size: 14px;">
            <strong>Jobbadress:</strong><br>
            ${jobLocation.address}
          </div>
        ` : ''}
      </div>
      
      <div style="display: flex; gap: 12px;">
        <button id="cancel-end" style="
          flex: 1;
          padding: 12px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">
          Avbryt
        </button>
        
        <button id="end-without-gps" style="
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          background: ${distance && distance > 500 ? '#dc2626' : '#16a34a'};
          color: white;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">
          ${distance && distance > 500 ? 'Avsluta ändå' : 'Avsluta uppdrag'}
        </button>
      </div>
    `
    
    // Add event handlers
    const cancelBtn = dialog.querySelector('#cancel-end')
    const endWithoutGpsBtn = dialog.querySelector('#end-without-gps')
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        document.body.removeChild(modal)
        resolve('cancel')
      })
    }
    
    if (endWithoutGpsBtn) {
      endWithoutGpsBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Show confirmation feedback
        const btn = endWithoutGpsBtn as HTMLElement
        btn.textContent = '✅ Avslutar...'
        btn.style.opacity = '0.7'
        
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal)
          }
          resolve('end_without_gps')
        }, 100)
      })
    }
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
        resolve('cancel')
      }
    })
    
    // Prevent dialog clicks from bubbling
    dialog.addEventListener('click', (e) => {
      e.stopPropagation()
    })
    
    modal.appendChild(dialog)
    document.body.appendChild(modal)
    
    // Focus the button
    setTimeout(() => {
      if (endWithoutGpsBtn) {
        (endWithoutGpsBtn as HTMLElement).focus()
      }
    }, 100)
  })
}