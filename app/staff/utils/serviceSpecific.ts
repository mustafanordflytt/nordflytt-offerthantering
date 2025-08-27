// Tjänstespecifik konfiguration för mobilvyn

export interface ServiceConfig {
  id: string
  name: string
  emoji: string
  timeRange: string
  checklistItems: string[]
  systemRecommendation: string
  color: string
  bgColor: string
  specificActions: {
    primary: { icon: string, label: string, action: string }
    secondary: { icon: string, label: string, action: string }
  }
  specificDetails: {
    items: string[]
    requirements: string[]
  }
}

export const getServiceConfig = (serviceType: string, jobData?: any): ServiceConfig => {
  const configs: Record<string, ServiceConfig> = {
    'Flytt': {
      id: 'flytt',
      name: 'Flytt',
      emoji: '🚚',
      timeRange: '12:00-16:00',
      checklistItems: [
        'Trappor och tillgänglighet kontrollerad',
        'Före-foton av stora möbler tagna',
        'Lastutrymme förberett och kontrollerat'
      ],
      systemRecommendation: 'Börja med att fotografera alla stora möbler innan nedmontering. Kontrollera också trappbredder för säker transport.',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      specificActions: {
        primary: { icon: '📷', label: 'Fota stora möbler', action: 'photo_furniture' },
        secondary: { icon: '🏋️', label: 'Lägg till trappbärning', action: 'add_stairs' }
      },
      specificDetails: {
        items: ['Bohagsvolym', 'Tunga föremål', 'Fotokrav', 'Specialutrustning'],
        requirements: ['Före-foton obligatoriska', 'Mät dörröppningar', 'Kontrollera hissens storlek']
      }
    },
    'Packhjälp': {
      id: 'packning',
      name: 'Packhjälp',
      emoji: '📦',
      timeRange: '08:00-12:00',
      checklistItems: [
        'Packningmaterial räknat och registrerat',
        'Kartonger märkta med rum och innehåll',
        'Kund informerad om packningsprocess'
      ],
      systemRecommendation: 'Märk alla kartonger tydligt med innehåll och destinationsrum. Räkna material för korrekt fakturering.',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border-orange-200',
      specificActions: {
        primary: { icon: '📊', label: 'Räkna material', action: 'count_materials' },
        secondary: { icon: '🏷️', label: 'Fota märkning', action: 'photo_labeling' }
      },
      specificDetails: {
        items: ['Antal kartonger', 'Packmaterial', 'Antal personer', 'Tidsåtgång'],
        requirements: ['Märk med destinationsrum', 'Räkna allt material', 'Dokumentera förbrukning']
      }
    },
    'Flyttstädning': {
      id: 'stadning',
      name: 'Flyttstädning',
      emoji: '🧹',
      timeRange: '16:00-20:00',
      checklistItems: [
        'Rum genomgått med kund (40-punktslista)',
        'Före-bilder av rum och detaljer tagna',
        'Städmaterial och utrustning kontrollerat'
      ],
      systemRecommendation: 'Gå igenom varje rum med kunden enligt 40-punktslistan innan start. Dokumentera utgångsläget med foton.',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200',
      specificActions: {
        primary: { icon: '📋', label: 'Checklista 40p', action: 'checklist_40' },
        secondary: { icon: '🏠', label: 'Fota rum', action: 'photo_rooms' }
      },
      specificDetails: {
        items: ['Städutrustning', 'Checklistor', 'Tidsfönster', 'Kvalitetskontroll'],
        requirements: ['40-punktslista genomgången', 'Före/efter-foton', 'Kundgodkännande']
      }
    }
  }

  const config = configs[serviceType] || configs['Flytt']
  
  // Anpassa rekommendation baserat på jobbdata
  if (jobData) {
    if (jobData.locationInfo?.floor > 1 && !jobData.locationInfo?.elevator) {
      config.systemRecommendation += ` OBS: Våning ${jobData.locationInfo.floor} utan hiss - extra försiktighet krävs.`
    }
    if (jobData.locationInfo?.parkingDistance > 30) {
      config.systemRecommendation += ` Långt till parkering (${jobData.locationInfo.parkingDistance}m) - planera för extra tid.`
    }
  }

  return config
}

// Enhanced photo confirmation with thumbnail preview
const showPhotoConfirmation = (photoData: any, thumbnailData: string, photoType: string) => {
  // Skapa bekräftelse-modal med thumbnail
  const confirmationModal = document.createElement('div')
  confirmationModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `

  const confirmationCard = document.createElement('div')
  confirmationCard.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  `

  const thumbnail = document.createElement('img')
  thumbnail.src = thumbnailData
  thumbnail.style.cssText = `
    width: 120px;
    height: 120px;
    border-radius: 12px;
    object-fit: cover;
    border: 3px solid #22c55e;
    margin-bottom: 16px;
  `

  const title = document.createElement('h3')
  title.textContent = '✅ Foto sparat!'
  title.style.cssText = `
    color: #22c55e;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 12px;
  `

  const details = document.createElement('div')
  details.innerHTML = `
    <div style="color: #666; font-size: 14px; line-height: 1.5;">
      <div style="margin-bottom: 8px;"><strong>📷 ${photoType}</strong></div>
      <div style="margin-bottom: 8px;">📍 ${photoData.gpsText}</div>
      <div style="margin-bottom: 8px;">🕐 ${photoData.timestamp}</div>
      <div style="color: #22c55e; font-weight: 500;">Bilden sparas och skickas till kundens orderbekräftelse</div>
    </div>
  `

  const closeButton = document.createElement('button')
  closeButton.textContent = 'OK'
  closeButton.style.cssText = `
    background: #22c55e;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 16px;
    width: 100%;
  `

  closeButton.onclick = () => {
    document.body.removeChild(confirmationModal)
  }

  confirmationCard.appendChild(thumbnail)
  confirmationCard.appendChild(title)
  confirmationCard.appendChild(details)
  confirmationCard.appendChild(closeButton)
  confirmationModal.appendChild(confirmationCard)
  document.body.appendChild(confirmationModal)

  // Auto-close efter 4 sekunder
  setTimeout(() => {
    if (document.body.contains(confirmationModal)) {
      document.body.removeChild(confirmationModal)
    }
  }, 4000)
}

// Camera choice modal for mobile devices
const showCameraChoiceModal = (serviceType: string, room: string | undefined, resolve: (value: boolean) => void) => {
  const modal = document.createElement('div')
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `

  const dialog = document.createElement('div')
  dialog.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 380px;
    width: 90%;
    text-align: center;
  `

  const photoTypeText = room ? `${serviceType} - ${room}` : serviceType
  
  dialog.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px;">📸</div>
    <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #002A5C;">
      Ta foto
    </h2>
    <p style="color: #666; font-size: 16px; margin-bottom: 24px; line-height: 1.5;">
      <strong>${photoTypeText}</strong><br>
      Välj hur du vill ta fotot:
    </p>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <button id="use-camera" style="
        background: #002A5C;
        color: white;
        border: none;
        padding: 16px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      ">
        <span>📷</span> Använd kamera
      </button>
      
      <button id="use-file" style="
        background: #16a34a;
        color: white;
        border: none;
        padding: 16px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      ">
        <span>📁</span> Välj från galleri
      </button>
      
      <button id="cancel-photo" style="
        background: #f1f5f9;
        color: #64748b;
        border: 2px solid #e2e8f0;
        padding: 14px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      ">
        Avbryt
      </button>
    </div>
    
    <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        💡 Tips: För bästa resultat, se till att bilden är tydlig och visar hela området
      </p>
    </div>
  `

  dialog.querySelector('#use-camera')?.addEventListener('click', () => {
    document.body.removeChild(modal)
    // Alert about HTTPS requirement and use file input instead
    alert('📸 Kamera kräver säker anslutning (HTTPS).\n\nAnvänd "Välj från galleri" för att ta en bild med din mobilkamera och ladda upp den.')
    showCameraChoiceModal(serviceType, room, resolve)
  })

  dialog.querySelector('#use-file')?.addEventListener('click', () => {
    document.body.removeChild(modal)
    useFileInputFallback(serviceType, room, resolve)
  })

  dialog.querySelector('#cancel-photo')?.addEventListener('click', () => {
    document.body.removeChild(modal)
    resolve(false)
  })

  modal.appendChild(dialog)
  document.body.appendChild(modal)
}

// File input fallback function for when camera is not available
const useFileInputFallback = (serviceType: string, room: string | undefined, resolve: (value: boolean) => void) => {
  console.log('Starting file input fallback for camera')
  
  // Create file input element
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.capture = 'environment' // Prefer back camera on mobile
  fileInput.style.display = 'none'
  
  fileInput.onchange = async (event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    
    if (!file) {
      resolve(false)
      return
    }
    
    try {
      // Convert file to data URL
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        
        // Get GPS if available
        let gpsText = 'GPS: Ej tillgänglig'
        let gpsPosition = undefined
        
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((res, rej) => {
              navigator.geolocation.getCurrentPosition(res, rej, { 
                timeout: 5000,
                enableHighAccuracy: true 
              })
            })
            gpsPosition = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
            gpsText = `GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          } catch (e) {
            console.log('GPS inte tillgänglig via fallback')
          }
        }
        
        // Save photo data
        const photos = JSON.parse(localStorage.getItem('staff_photos') || '[]')
        const photoType = room ? `${serviceType} - ${room}` : serviceType
        const photoData = {
          id: Date.now(),
          serviceType,
          room,
          timestamp: new Date().toLocaleString('sv-SE'),
          gpsText,
          gpsPosition,
          fileName: `photo_${Date.now()}.jpg`,
          fileSize: Math.round(dataUrl.length * 0.75),
          dataUrl
        }
        
        // Save to localStorage first (as backup)
        photos.push(photoData)
        localStorage.setItem('staff_photos', JSON.stringify(photos))
        
        // Try to upload to Supabase
        try {
          // Get current job ID from localStorage or generate temp ID
          const currentJobs = JSON.parse(localStorage.getItem('todaysJobs') || '[]')
          const activeJob = currentJobs.find(job => job.status === 'in_progress')
          const jobId = activeJob?.id || `temp_${Date.now()}`
          
          console.log('Uploading photo for job:', jobId)
          
          // Dynamic import to avoid build issues
          const { uploadPhoto } = await import('../../../lib/supabase-storage')
          
          const uploadResult = await uploadPhoto({
            dataUrl,
            serviceType,
            room,
            timestamp: photoData.timestamp,
            gpsPosition
          }, jobId)
          
          if (uploadResult.success) {
            // Update localStorage with public URL
            photoData.publicUrl = uploadResult.publicUrl
            photos[photos.length - 1] = photoData
            localStorage.setItem('staff_photos', JSON.stringify(photos))
            
            alert(`✅ Foto sparat och uppladdad!\\n\\n📷 ${photoType}\\n📍 ${gpsText}\\n🕐 ${photoData.timestamp}\\n☁️ Säkerhetskopierad till molnet\\n\\nBilden sparas permanent och skickas till kundens orderbekräftelse.`)
          } else {
            throw new Error(uploadResult.error || 'Upload failed')
          }
        } catch (uploadError) {
          console.error('Failed to upload to cloud:', uploadError)
          // Still show success since we have local copy
          alert(`✅ Foto sparat lokalt!\\n\\n📷 ${photoType}\\n📍 ${gpsText}\\n🕐 ${photoData.timestamp}\\n⚠️ Uppladdning till molnet misslyckades - sparad lokalt\\n\\nBilden kommer laddas upp när internetanslutningen förbättras.`)
        }
        
        resolve(true)
      }
      
      reader.onerror = () => {
        alert('❌ Kunde inte läsa filen. Försök igen.')
        resolve(false)
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Fel vid filhantering:', error)
      alert('❌ Kunde inte bearbeta bilden. Försök igen.')
      resolve(false)
    }
    
    // Clean up
    document.body.removeChild(fileInput)
  }
  
  fileInput.oncancel = () => {
    document.body.removeChild(fileInput)
    resolve(false)
  }
  
  // Trigger file picker
  document.body.appendChild(fileInput)
  fileInput.click()
}

export const cameraHandler = async (serviceType: string, room?: string): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    // Check if we're in a context where camera should work
    const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
    const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    
    // Always offer choice between camera and file upload on mobile
    if (!hasGetUserMedia || !isSecureContext || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      console.log('Offering camera/file choice for mobile')
      return showCameraChoiceModal(serviceType, room, resolve)
    }
    
    try {
      // Skapa fullskärms-kamera UI
      const cameraModal = document.createElement('div')
      cameraModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 9998;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        touch-action: manipulation;
      `
      
      // Video element för kamera - optimerat för iOS/Android/WebView
      const video = document.createElement('video')
      
      // Critical attributes for cross-platform compatibility
      video.setAttribute('playsinline', 'true') // Critical for iOS
      video.setAttribute('autoplay', 'true')
      video.setAttribute('muted', 'true')
      video.setAttribute('webkit-playsinline', 'true') // Extra iOS support
      video.setAttribute('controls', 'false') // Hide controls
      video.setAttribute('disablepictureinpicture', 'true') // Prevent PiP
      
      // Property versions (some browsers need both)
      video.playsInline = true
      video.autoplay = true
      video.muted = true
      video.controls = false
      video.disablePictureInPicture = true
      
      // Enhanced styling for better compatibility
      video.style.cssText = `
        flex: 1;
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: #000;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        will-change: transform;
      `
      
      // Kontroller
      const controls = document.createElement('div')
      controls.style.cssText = `
        position: absolute;
        bottom: 30px;
        left: 20px;
        right: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
      `
      
      // Ta foto-knapp
      const captureBtn = document.createElement('button')
      captureBtn.innerHTML = '📸'
      captureBtn.style.cssText = `
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: white;
        border: 5px solid #22c55e;
        font-size: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: manipulation;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: transform 0.1s;
      `
      
      // Hover effect för knappen
      captureBtn.onmousedown = () => captureBtn.style.transform = 'scale(0.95)'
      captureBtn.onmouseup = () => captureBtn.style.transform = 'scale(1)'
      
      // Avbryt-knapp
      const cancelBtn = document.createElement('button')
      cancelBtn.innerHTML = '✕'
      cancelBtn.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        border: 2px solid white;
        color: white;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: manipulation;
      `
      
      // Instruktioner
      const instructions = document.createElement('div')
      const photoType = room ? `${serviceType} - ${room}` : serviceType
      instructions.innerHTML = `📷 Fotografera för ${photoType}<br><br>Tryck på den gröna knappen för att ta bild`
      instructions.style.cssText = `
        position: absolute;
        top: 40px;
        left: 20px;
        right: 20px;
        color: white;
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        background: rgba(0,0,0,0.6);
        padding: 20px;
        border-radius: 10px;
        line-height: 1.4;
      `
      
      // Bygg UI
      controls.appendChild(cancelBtn)
      controls.appendChild(captureBtn)
      cameraModal.appendChild(video)
      cameraModal.appendChild(instructions)
      cameraModal.appendChild(controls)
      document.body.appendChild(cameraModal)
      
      // Starta kamera med förbättrade constraints för mobil och WebView
      const videoConstraints = {
        video: { 
          facingMode: 'environment', // Back camera preferred
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
          frameRate: { ideal: 24, min: 15, max: 30 },
          // Additional constraints for better mobile compatibility
          aspectRatio: { ideal: 16/9 },
          resizeMode: 'crop-and-scale'
        }
      }
      
      navigator.mediaDevices.getUserMedia(videoConstraints)
      .then(stream => {
        console.log('Camera stream started successfully')
        video.srcObject = stream
        
        // Enhanced video loading detection
        let videoReady = false
        let retryCount = 0
        const maxRetries = 3
        
        const checkVideoReady = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            videoReady = true
            console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`)
            instructions.innerHTML = `📷 Fotografera för ${room ? `${serviceType} - ${room}` : serviceType}<br><br>Tryck på den gröna knappen för att ta bild`
          } else if (retryCount < maxRetries) {
            retryCount++
            console.log(`Video not ready yet, retry ${retryCount}/${maxRetries}`)
            setTimeout(checkVideoReady, 1000)
          } else {
            console.warn('Video failed to load properly after retries')
            instructions.innerHTML = `⚠️ Kameran laddas...<br><br>Om problem kvarstår, prova filuppladdning istället`
            // Add fallback button
            const fallbackBtn = document.createElement('button')
            fallbackBtn.innerHTML = '📁 Välj fil istället'
            fallbackBtn.style.cssText = `
              margin-top: 10px;
              background: rgba(255,255,255,0.9);
              border: 2px solid white;
              color: #002A5C;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
            `
            fallbackBtn.onclick = () => {
              stream.getTracks().forEach(track => track.stop())
              document.body.removeChild(cameraModal)
              useFileInputFallback(serviceType, room, resolve)
            }
            instructions.appendChild(fallbackBtn)
          }
        }
        
        // Multiple event listeners for video readiness
        video.addEventListener('loadeddata', checkVideoReady)
        video.addEventListener('loadedmetadata', checkVideoReady)
        video.addEventListener('canplay', checkVideoReady)
        
        // Initial check after a short delay
        setTimeout(checkVideoReady, 500)
        
        // Define capture handler
        const originalCaptureHandler = async () => {
          try {
            // Enhanced video readiness check
            if (!videoReady || video.videoWidth === 0 || video.videoHeight === 0) {
              // Try to trigger video loading if it hasn't started
              if (video.paused) {
                try {
                  await video.play()
                  // Wait a moment for dimensions to load
                  await new Promise(resolve => setTimeout(resolve, 500))
                } catch (playError) {
                  console.log('Video play failed in capture:', playError)
                }
              }
              
              // Check again after attempting to play
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                const useFileInstead = confirm(
                  '⚠️ Kameran har problem med att ladda.\n\n' +
                  '📱 Detta kan hända i vissa WebView-miljöer.\n\n' +
                  '❓ Vill du välja en bild från filerna istället?'
                )
                
                if (useFileInstead) {
                  stream.getTracks().forEach(track => track.stop())
                  document.body.removeChild(cameraModal)
                  useFileInputFallback(serviceType, room, resolve)
                }
                return
              }
            }
            
            // Skapa canvas för att fånga bilden
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0)
            
            // Hämta GPS
            let gpsText = 'GPS: Ej tillgänglig'
            let gpsPosition = undefined
            
            if (navigator.geolocation) {
              try {
                const position = await new Promise<GeolocationPosition>((res, rej) => {
                  navigator.geolocation.getCurrentPosition(res, rej, { 
                    timeout: 5000,
                    enableHighAccuracy: true 
                  })
                })
                gpsPosition = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }
                gpsText = `GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
              } catch (e) {
                console.log('GPS inte tillgänglig')
              }
            }
            
            // Spara foto med förbättrad hantering
            const imageData = canvas.toDataURL('image/jpeg', 0.8)
            const photos = JSON.parse(localStorage.getItem('staff_photos') || '[]')
            const photoData = {
              id: Date.now(),
              serviceType,
              room,
              timestamp: new Date().toLocaleString('sv-SE'),
              gpsText,
              gpsPosition,
              fileName: `photo_${Date.now()}.jpg`,
              fileSize: Math.round(imageData.length * 0.75),
              dataUrl: imageData,
              // Ny metadata för bättre hantering
              width: canvas.width,
              height: canvas.height,
              quality: 0.8
            }
            
            photos.push(photoData)
            localStorage.setItem('staff_photos', JSON.stringify(photos))
            
            // Skapa thumbnail för snabb förhandsgranskning
            const thumbnailCanvas = document.createElement('canvas')
            const thumbnailCtx = thumbnailCanvas.getContext('2d')!
            const thumbnailSize = 150
            
            thumbnailCanvas.width = thumbnailSize
            thumbnailCanvas.height = thumbnailSize
            
            // Beräkna crop för kvadratisk thumbnail
            const sourceSize = Math.min(canvas.width, canvas.height)
            const sourceX = (canvas.width - sourceSize) / 2
            const sourceY = (canvas.height - sourceSize) / 2
            
            thumbnailCtx.drawImage(canvas, sourceX, sourceY, sourceSize, sourceSize, 0, 0, thumbnailSize, thumbnailSize)
            const thumbnailData = thumbnailCanvas.toDataURL('image/jpeg', 0.6)
            
            // Stäng kamera
            stream.getTracks().forEach(track => track.stop())
            document.body.removeChild(cameraModal)
            
            // Visa förbättrad bekräftelse med thumbnail
            showPhotoConfirmation(photoData, thumbnailData, photoType)
            
            resolve(true)
          } catch (error) {
            console.error('Fel vid fototagning:', error)
            alert('❌ Kunde inte ta foto. Försök igen.')
            resolve(false)
          }
        }
        
        // Set up capture button with video play handling
        captureBtn.onclick = originalCaptureHandler
        
        // Force play video (especially important for iOS)
        video.play().catch(e => {
          console.warn('Video play failed, requiring user interaction:', e)
          // Show message to user that they need to tap to start
          instructions.innerHTML += '<br><br>🔴 Tryck på den gröna knappen för att starta kameran'
          
          // Override capture button to first start video
          captureBtn.onclick = async () => {
            try {
              await video.play()
              instructions.innerHTML = `📷 Fotografera för ${photoType}<br><br>Tryck på den gröna knappen för att ta bild`
              captureBtn.onclick = originalCaptureHandler
            } catch (playError) {
              console.error('Video play still failed:', playError)
              alert('❌ Kunde inte starta kameran. Försök igen eller använd filväljaren.')
              stream.getTracks().forEach(track => track.stop())
              document.body.removeChild(cameraModal)
              useFileInputFallback(serviceType, room, resolve)
            }
          }
        })
        
        // Avbryt-funktion
        cancelBtn.onclick = () => {
          stream.getTracks().forEach(track => track.stop())
          document.body.removeChild(cameraModal)
          resolve(false)
        }
      })
      .catch(error => {
        document.body.removeChild(cameraModal)
        console.error('Kamera-fel:', error)
        alert('❌ Kunde inte komma åt kameran. Kontrollera att du har gett tillåtelse.')
        resolve(false)
      })
      
    } catch (error) {
      console.error('Fel vid kamera-start:', error)
      alert('❌ Kunde inte starta kamera.')
      resolve(false)
    }
  })
}