// Tidsloggning för uppdrag med GPS-validering

import { createSimpleGPSModal } from './gps-modal-simple'
import { showGPSEndModal } from './gps-end-modal'
import { logWorkTime } from './staff-employee-sync'

export interface TimeEntry {
  id: string
  jobId: string
  jobNumber?: string // Bokningsnummer
  customerName?: string // Kundnamn  
  serviceType: string
  startTime: string
  endTime?: string
  startGPS?: {
    latitude: number
    longitude: number
    address?: string
  }
  endGPS?: {
    latitude: number
    longitude: number
    address?: string
  }
  duration?: number // i minuter
  status: 'started' | 'completed'
}

export interface JobLocation {
  latitude: number
  longitude: number
  address: string
}

// Beräkna avstånd mellan två GPS-punkter (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Jordens radie i km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Reverse geocoding - konvertera GPS till adress (mock för demo)
const getAddressFromGPS = async (lat: number, lon: number): Promise<string> => {
  try {
    // I verkligheten skulle detta använda Google Maps API eller liknande
    return `${lat.toFixed(4)}, ${lon.toFixed(4)} (GPS-position)`
  } catch (error) {
    return 'Okänd plats'
  }
}

// Enhanced manual confirmation dialog with better UX
const askForManualConfirmation = async (jobLocation: JobLocation, context: 'location_far' | 'gps_failed' = 'gps_failed'): Promise<'confirm' | 'start_without_gps' | 'cancel'> => {
  console.log('askForManualConfirmation called with context:', context, 'address:', jobLocation.address)
  // Use the simple modal that actually works
  const result = await createSimpleGPSModal(jobLocation.address)
  console.log('Simple modal result:', result)
  
  if (result) {
    return 'start_without_gps'
  }
  return 'cancel'
}

// Legacy implementation kept for reference but not used
const askForManualConfirmationLegacy = async (jobLocation: JobLocation, context: 'location_far' | 'gps_failed' = 'gps_failed'): Promise<'confirm' | 'start_without_gps' | 'cancel'> => {
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
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      pointer-events: auto !important;
      touch-action: manipulation;
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
      pointer-events: auto !important;
      z-index: 2147483648;
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
        <button id="start-without-gps-btn" type="button" style="
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
          pointer-events: auto !important;
          position: relative;
          z-index: 2147483649;
          display: block;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        ">
          ✅ Starta ändå
        </button>
        <button id="cancel-btn" type="button" style="
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
          pointer-events: auto !important;
          position: relative;
          z-index: 2147483649;
          display: block;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        ">
          Avbryt
        </button>
      </div>
    `

    // Add event handlers
    const cancelBtn = dialog.querySelector('#cancel-btn')
    const startWithoutGpsBtn = dialog.querySelector('#start-without-gps-btn')

    // Event handlers with immediate action
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        try {
          console.log('GPS Modal: Cancel button clicked')
        } catch (e) {}
        document.body.removeChild(modal)
        resolve('cancel')
      }, { capture: true })

      // Add touch event support
      cancelBtn.addEventListener('touchend', (e) => {
        e.preventDefault()
        e.stopPropagation()
        cancelBtn.click()
      }, { passive: false })
    }

    if (startWithoutGpsBtn) {
      startWithoutGpsBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        try {
          console.log('GPS Modal: Start without GPS clicked')
        } catch (e) {
          // Ignore console errors in some environments
        }
        
        // Show confirmation feedback
        const btn = startWithoutGpsBtn as HTMLElement
        if (btn) {
          btn.textContent = '✅ Startar...'
          btn.style.opacity = '0.7'
        }
        
        // Don't disable the button - just change appearance
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal)
          }
          resolve('start_without_gps')
        }, 100) // Reduced delay for faster response
      }, { capture: true })

      // Add touch event support
      startWithoutGpsBtn.addEventListener('touchend', (e) => {
        e.preventDefault()
        e.stopPropagation()
        startWithoutGpsBtn.click()
      }, { passive: false })
    }
    
    // Remove conflicting touch handlers - let click handle everything
    // This prevents touch/click conflicts on mobile devices

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        try {
          console.log('GPS Modal: Backdrop clicked')
        } catch (e) {}
        document.body.removeChild(modal)
        resolve('cancel')
      }
    })
    
    // Prevent dialog clicks from bubbling to modal
    dialog.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    modal.appendChild(dialog)
    
    // Add modal to body with a small delay to ensure proper rendering
    requestAnimationFrame(() => {
      document.body.appendChild(modal)
      
      // Force a reflow to ensure styles are applied
      modal.offsetHeight
      
      // Focus the start button for better accessibility and mobile UX
      setTimeout(() => {
        if (startWithoutGpsBtn) {
          startWithoutGpsBtn.focus()
          // Force pointer events to be active
          startWithoutGpsBtn.style.pointerEvents = 'auto'
          const cancelBtnElement = cancelBtn as HTMLElement
          if (cancelBtnElement) {
            cancelBtnElement.style.pointerEvents = 'auto'
          }
        }
      }, 100)
    })
  })
}

// Validera att användaren är på plats (inom 500m från jobbadressen) 
export const validateLocationForJob = async (jobLocation: JobLocation): Promise<{
  isValid: boolean
  distance?: number
  currentLocation?: { latitude: number, longitude: number }
  message: string
  manualOverride?: boolean
  skipGPS?: boolean
}> => {
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      // Add a shorter timeout for faster response
      const timeoutId = setTimeout(() => reject(new Error('GPS timeout')), 5000)
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId)
          resolve(pos)
        },
        (err) => {
          clearTimeout(timeoutId)
          reject(err)
        },
        {
          enableHighAccuracy: false, // Changed to false for faster response
          timeout: 5000, // Reduced from 10000
          maximumAge: 60000
        }
      )
    })

    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      jobLocation.latitude,
      jobLocation.longitude
    ) * 1000 // Konvertera till meter

    const isValid = distance <= 500 // Inom 500 meter (för demo)

    if (!isValid) {
      // If not within range, offer manual confirmation
      const userChoice = await askForManualConfirmation(jobLocation, 'location_far')
      
      if (userChoice === 'confirm') {
        return {
          isValid: true,
          distance,
          currentLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          manualOverride: true,
          message: `✅ Manuellt bekräftat på plats\n📍 GPS-avstånd: ${Math.round(distance)}m (utanför auto-godkänt område)\n🔧 Manuell bekräftelse använd`
        }
      } else if (userChoice === 'start_without_gps') {
        return {
          isValid: true,
          distance,
          currentLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          manualOverride: true,
          skipGPS: true,
          message: `🌐 Startat utan GPS-validering\n📍 GPS-avstånd: ${Math.round(distance)}m (ignorerat)\n⚠️ Fortsätter utan platsbekräftelse`
        }
      } else {
        return {
          isValid: false,
          distance,
          currentLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          message: `⚠️ Du är ${Math.round(distance)}m från jobbadressen!\n\n📍 Du måste vara inom 500m för att starta automatiskt.\n\n💡 Tips: Kom närmare uppdraget eller bekräfta manuellt nästa gång.`
        }
      }
    }

    return {
      isValid,
      distance,
      currentLocation: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      message: `✅ På plats (${Math.round(distance)}m från jobbadressen)`
    }
  } catch (error) {
    try {
      console.log('GPS validation failed, showing manual confirmation:', error)
    } catch (e) {}
    
    // GPS completely failed - offer manual confirmation immediately
    const userChoice = await askForManualConfirmation(jobLocation, 'gps_failed')
    
    if (userChoice === 'start_without_gps') {
      return {
        isValid: true,
        manualOverride: true,
        skipGPS: true,
        message: `✅ Jobbet startat utan GPS\n📍 ${jobLocation.address}`
      }
    } else {
      return {
        isValid: false,
        message: '❌ Jobbet avbrutet'
      }
    }
  }
}

// Start time tracking without GPS validation (fallback option)
export const startTimeTrackingWithoutGPS = async (
  jobId: string, 
  serviceType: string,
  jobLocation: JobLocation,
  jobNumber?: string,
  customerName?: string
): Promise<{ success: boolean, timeEntry?: TimeEntry, message: string }> => {
  try {
    // Create time entry without GPS validation
    const timeEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      jobId,
      jobNumber,
      customerName,
      serviceType,
      startTime: new Date().toISOString(),
      startGPS: undefined, // No GPS data
      status: 'started'
    }

    // Save to localStorage for demo
    const existingEntries = JSON.parse(localStorage.getItem('time_entries') || '[]')
    existingEntries.push(timeEntry)
    localStorage.setItem('time_entries', JSON.stringify(existingEntries))

    return {
      success: true,
      timeEntry,
      message: `⏰ Uppdrag startat kl. ${new Date().toLocaleTimeString('sv-SE')}\n🌐 Startade utan GPS-validering\n📍 Jobadress: ${jobLocation.address}\n\n💡 Du kan fortsätta jobbet normalt trots avsaknad av GPS-data.`
    }
  } catch (error) {
    console.error('Error starting time tracking without GPS:', error)
    return {
      success: false,
      message: '❌ Kunde inte starta tidsloggning. Försök igen.'
    }
  }
}

// Starta tidsloggning för ett jobb
export const startTimeTracking = async (
  jobId: string, 
  serviceType: string,
  jobLocation: JobLocation
): Promise<{ success: boolean, timeEntry?: TimeEntry, message: string }> => {
  try {
    // Validera plats först
    const locationValidation = await validateLocationForJob(jobLocation)
    
    if (!locationValidation.isValid) {
      return {
        success: false,
        message: locationValidation.message
      }
    }

    // Skapa tidspost
    const timeEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      jobId,
      serviceType,
      startTime: new Date().toISOString(),
      startGPS: locationValidation.currentLocation ? {
        latitude: locationValidation.currentLocation.latitude,
        longitude: locationValidation.currentLocation.longitude,
        address: await getAddressFromGPS(
          locationValidation.currentLocation.latitude,
          locationValidation.currentLocation.longitude
        )
      } : undefined,
      status: 'started'
    }

    // Spara i localStorage för demo
    const existingEntries = JSON.parse(localStorage.getItem('time_entries') || '[]')
    existingEntries.push(timeEntry)
    localStorage.setItem('time_entries', JSON.stringify(existingEntries))

    return {
      success: true,
      timeEntry,
      message: `⏰ Uppdrag startat kl. ${new Date().toLocaleTimeString('sv-SE')}\n${locationValidation.message}`
    }
  } catch (error) {
    console.error('Error starting time tracking:', error)
    return {
      success: false,
      message: '❌ Kunde inte starta tidsloggning. Försök igen.'
    }
  }
}

// Stoppa tidsloggning för ett jobb
export const stopTimeTracking = async (
  jobId: string,
  jobLocation: JobLocation,
  skipGPSValidation: boolean = false
): Promise<{ success: boolean, timeEntry?: TimeEntry, message: string }> => {
  try {
    // Hämta befintliga tidsloggar
    const existingEntries: TimeEntry[] = JSON.parse(localStorage.getItem('time_entries') || '[]')
    const activeEntry = existingEntries.find(
      entry => entry.jobId === jobId && entry.status === 'started'
    )

    if (!activeEntry) {
      return {
        success: false,
        message: '❌ Inget aktivt uppdrag hittat för detta jobb.'
      }
    }

    // Validera plats om det inte ska skippas
    let locationValidation = { isValid: true, currentLocation: null, distance: 0 }
    
    if (!skipGPSValidation) {
      locationValidation = await validateLocationForJob(jobLocation)
      
      // Show GPS end modal only if validation is not skipped
      if (!locationValidation.isValid || !locationValidation.currentLocation) {
        const action = await showGPSEndModal(
          locationValidation.currentLocation,
          jobLocation,
          locationValidation.distance
        )
        
        if (action === 'cancel') {
          return {
            success: false,
            message: 'Avslutning avbruten'
          }
        }
      }
    }

    // Uppdatera tidspost
    const endTime = new Date()
    const startTime = new Date(activeEntry.startTime)
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) // minuter

    const updatedEntry: TimeEntry = {
      ...activeEntry,
      endTime: endTime.toISOString(),
      endGPS: locationValidation.currentLocation ? {
        latitude: locationValidation.currentLocation.latitude,
        longitude: locationValidation.currentLocation.longitude,
        address: await getAddressFromGPS(
          locationValidation.currentLocation.latitude,
          locationValidation.currentLocation.longitude
        )
      } : undefined,
      duration,
      status: 'completed'
    }

    // Uppdatera i localStorage
    const updatedEntries = existingEntries.map(entry => 
      entry.id === activeEntry.id ? updatedEntry : entry
    )
    localStorage.setItem('time_entries', JSON.stringify(updatedEntries))

    // Log completion to CRM
    try {
      await logWorkTime({
        jobId,
        bookingNumber: activeEntry.jobNumber || '',
        customerName: activeEntry.customerName || '',
        serviceType: activeEntry.serviceType,
        startTime: new Date(activeEntry.startTime),
        endTime: new Date(updatedEntry.endTime!),
        startGPS: activeEntry.startGPS ? {
          lat: activeEntry.startGPS.latitude,
          lng: activeEntry.startGPS.longitude,
          address: activeEntry.startGPS.address
        } : undefined,
        endGPS: locationValidation.currentLocation ? {
          lat: locationValidation.currentLocation.latitude,
          lng: locationValidation.currentLocation.longitude,
          address: jobLocation.address
        } : undefined,
        status: 'completed'
      })
      console.log('Time tracking completed and logged to CRM')
    } catch (error) {
      console.error('Failed to log completion to CRM:', error)
      // Continue even if CRM logging fails
    }

    const hours = Math.floor(duration / 60)
    const minutes = duration % 60

    return {
      success: true,
      timeEntry: updatedEntry,
      message: `✅ Uppdrag avslutat kl. ${endTime.toLocaleTimeString('sv-SE')}\n⏱️ Total tid: ${hours}h ${minutes}m\n${locationValidation.message}`
    }
  } catch (error) {
    console.error('Error stopping time tracking:', error)
    return {
      success: false,
      message: '❌ Kunde inte stoppa tidsloggning. Försök igen.'
    }
  }
}

// Hämta tidsloggar för ett jobb
export const getTimeEntriesForJob = (jobId: string): TimeEntry[] => {
  const entries: TimeEntry[] = JSON.parse(localStorage.getItem('time_entries') || '[]')
  return entries.filter(entry => entry.jobId === jobId)
}

// Kontrollera om ett jobb har aktiv tidsloggning
export const hasActiveTimeTracking = (jobId: string): boolean => {
  const entries = getTimeEntriesForJob(jobId)
  return entries.some(entry => entry.status === 'started')
}

// Beräkna total arbetstid för ett jobb
export const getTotalWorkTime = (jobId: string): { hours: number, minutes: number } => {
  const entries = getTimeEntriesForJob(jobId).filter(entry => entry.status === 'completed')
  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  }
}

// Get current work time for active job (including ongoing time)
export const getCurrentWorkTime = (jobId: string): { hours: number, minutes: number, isActive: boolean } => {
  const entries = getTimeEntriesForJob(jobId)
  const activeEntry = entries.find(entry => entry.status === 'started')
  
  if (activeEntry) {
    const now = new Date()
    const startTime = new Date(activeEntry.startTime)
    const currentMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))
    
    return {
      hours: Math.floor(currentMinutes / 60),
      minutes: currentMinutes % 60,
      isActive: true
    }
  }
  
  return getTotalWorkTime(jobId) as { hours: number, minutes: number, isActive: false }
}

// Time tracking notifications and warnings
export interface TimeWarning {
  type: 'approaching_end' | 'overtime' | 'break_reminder' | 'long_shift'
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  actionRequired: boolean
}

export const checkTimeWarnings = (
  jobId: string, 
  scheduledEndTime: string,
  estimatedHours: number
): TimeWarning[] => {
  const warnings: TimeWarning[] = []
  const currentTime = getCurrentWorkTime(jobId)
  
  if (!currentTime.isActive) return warnings
  
  const scheduledEnd = new Date()
  const [hours, minutes] = scheduledEndTime.split(':').map(Number)
  scheduledEnd.setHours(hours, minutes, 0, 0)
  
  const now = new Date()
  const timeUntilEnd = Math.floor((scheduledEnd.getTime() - now.getTime()) / (1000 * 60))
  const totalWorkedMinutes = (currentTime.hours * 60) + currentTime.minutes
  const estimatedTotalMinutes = estimatedHours * 60
  
  // 20 minutes before scheduled end time
  if (timeUntilEnd <= 20 && timeUntilEnd > 0) {
    warnings.push({
      type: 'approaching_end',
      title: '⏰ Snart sluttid',
      message: `Du har ${timeUntilEnd} minuter kvar av schemalagd tid. Börja avsluta uppdraget.`,
      severity: 'warning',
      actionRequired: true
    })
  }
  
  // Overtime detected
  if (timeUntilEnd <= 0) {
    const overtimeMinutes = Math.abs(timeUntilEnd)
    warnings.push({
      type: 'overtime',
      title: '🚨 Övertid pågår',
      message: `Du jobbar ${Math.floor(overtimeMinutes / 60)}h ${overtimeMinutes % 60}m övertid. Glöm inte rapportera orsaken.`,
      severity: 'critical',
      actionRequired: true
    })
  }
  
  // Break reminder after 4 hours
  if (totalWorkedMinutes >= 240 && totalWorkedMinutes < 250) {
    warnings.push({
      type: 'break_reminder',
      title: '☕ Dags för paus',
      message: 'Du har arbetat i 4 timmar. Ta en välförtjänt paus!',
      severity: 'info',
      actionRequired: false
    })
  }
  
  // Long shift warning after 8 hours
  if (totalWorkedMinutes >= 480) {
    warnings.push({
      type: 'long_shift',
      title: '⚠️ Långt arbetspass',
      message: `Du har arbetat i ${Math.floor(totalWorkedMinutes / 60)} timmar. Överväg att ta en längre paus.`,
      severity: 'warning',
      actionRequired: false
    })
  }
  
  return warnings
}

// Enhanced time tracking with automatic warnings
export const startTimeTrackingWithWarnings = async (
  jobId: string, 
  serviceType: string,
  jobLocation: JobLocation,
  scheduledEndTime: string,
  estimatedHours: number,
  onWarning?: (warnings: TimeWarning[]) => void,
  jobNumber?: string,
  customerName?: string
): Promise<{ success: boolean, timeEntry?: TimeEntry, message: string }> => {
  try {
    // First try to get GPS position
    const position = await new Promise<GeolocationPosition | null>((resolve) => {
      const timeoutId = setTimeout(() => resolve(null), 3000)
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId)
          resolve(pos)
        },
        () => {
          clearTimeout(timeoutId)
          resolve(null)
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 60000
        }
      )
    })

    let currentLocation = null
    let distance = null
    
    if (position) {
      currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        jobLocation.latitude,
        jobLocation.longitude
      )
    }

    // Show GPS modal if no position or too far away
    if (!position || (distance && distance > 500)) {
      const gpsResponse = await showGPSModal(currentLocation, jobLocation, distance)
      
      if (gpsResponse === 'cancel') {
        return {
          success: false,
          message: 'Uppdrag avbrutet av användaren'
        }
      }
    }

    // Create time entry with customer info
    const timeEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      jobId,
      jobNumber,
      customerName,
      serviceType,
      startTime: new Date().toISOString(),
      startGPS: currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: jobLocation.address
      } : undefined,
      status: 'started'
    }

    // Save to localStorage
    const existingEntries = JSON.parse(localStorage.getItem('time_entries') || '[]')
    existingEntries.push(timeEntry)
    localStorage.setItem('time_entries', JSON.stringify(existingEntries))

    // Also save to active tracking
    localStorage.setItem('staff_time_tracking', JSON.stringify({
      activeJobId: jobId,
      startTime: timeEntry.startTime
    }))

    // Log to CRM database
    try {
      await logWorkTime({
        jobId,
        bookingNumber: jobNumber || '',
        customerName: customerName || '',
        serviceType,
        startTime: new Date(timeEntry.startTime),
        startGPS: currentLocation ? {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          address: jobLocation.address
        } : undefined,
        status: 'active'
      })
      console.log('Time tracking started and logged to CRM')
    } catch (error) {
      console.error('Failed to log to CRM:', error)
      // Continue even if CRM logging fails
    }

    // Set up warning monitoring if callback provided
    if (onWarning) {
      const warningInterval = setInterval(() => {
        const warnings = checkTimeWarnings(jobId, scheduledEndTime, estimatedHours)
        if (warnings.length > 0) {
          onWarning(warnings)
        }
        
        // Stop monitoring if job is no longer active
        if (!hasActiveTimeTracking(jobId)) {
          clearInterval(warningInterval)
        }
      }, 60000) // Check every minute
      
      // Store interval ID for cleanup
      localStorage.setItem(`warning_interval_${jobId}`, warningInterval.toString())
    }

    return {
      success: true,
      timeEntry,
      message: `⏰ Uppdrag startat kl. ${new Date().toLocaleTimeString('sv-SE')}`
    }
  } catch (error) {
    console.error('Error starting time tracking:', error)
    return {
      success: false,
      message: '❌ Kunde inte starta tidsloggning. Försök igen.'
    }
  }
}

// Stop tracking and handle overtime reporting
export const stopTimeTrackingWithOvertimeCheck = async (
  jobId: string,
  jobLocation: JobLocation,
  scheduledEndTime: string,
  onOvertimeDetected?: (overtimeInfo: { jobId: string, overtimeMinutes: number, scheduledEndTime: string, actualEndTime: string }) => void,
  skipGPSValidation: boolean = true  // Default to skip GPS validation when ending job
): Promise<{ success: boolean, timeEntry?: TimeEntry, message: string, hasOvertime?: boolean }> => {
  const result = await stopTimeTracking(jobId, jobLocation, skipGPSValidation)
  
  if (result.success && result.timeEntry) {
    // Clean up warning interval
    const intervalId = localStorage.getItem(`warning_interval_${jobId}`)
    if (intervalId) {
      clearInterval(parseInt(intervalId))
      localStorage.removeItem(`warning_interval_${jobId}`)
    }
    
    // Check for overtime
    const scheduledEnd = new Date()
    const [hours, minutes] = scheduledEndTime.split(':').map(Number)
    scheduledEnd.setHours(hours, minutes, 0, 0)
    
    const actualEnd = new Date(result.timeEntry.endTime!)
    const overtimeMs = actualEnd.getTime() - scheduledEnd.getTime()
    
    if (overtimeMs > 0) {
      const overtimeMinutes = Math.floor(overtimeMs / (1000 * 60))
      
      if (onOvertimeDetected) {
        onOvertimeDetected({
          jobId,
          overtimeMinutes,
          scheduledEndTime,
          actualEndTime: actualEnd.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
        })
      }
      
      return {
        ...result,
        hasOvertime: true
      }
    }
  }
  
  return result
}