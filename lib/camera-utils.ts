'use client'

export interface CapturedImage {
  id: string
  type: 'lastbil' | 'städning'
  room?: string
  timestamp: string
  gpsPosition?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  imageData: string // base64
  fileSize: number
  jobId: string
}

export interface CameraOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  facingMode?: 'user' | 'environment'
}

export class CameraService {
  private static instance: CameraService
  private mediaStream: MediaStream | null = null

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService()
    }
    return CameraService.instance
  }

  async checkCameraPermission(): Promise<boolean> {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return permission.state === 'granted'
    } catch (error) {
      console.warn('Permission API not supported, attempting direct camera access')
      return true // Fallback to attempting direct access
    }
  }

  async requestCameraAccess(options: CameraOptions = {}): Promise<MediaStream> {
    const constraints = {
      video: {
        facingMode: options.facingMode || 'environment',
        width: { ideal: options.maxWidth || 1920 },
        height: { ideal: options.maxHeight || 1080 }
      }
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      return this.mediaStream
    } catch (error) {
      console.error('Camera access denied:', error)
      throw new Error('Kamera åtkomst nekad. Kontrollera att du har gett tillåtelse för kamera.')
    }
  }

  async getCurrentPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          console.warn('GPS position not available:', error)
          resolve(null)
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 300000 
        }
      )
    })
  }

  async captureImage(
    type: 'lastbil' | 'städning',
    jobId: string,
    room?: string,
    options: CameraOptions = {}
  ): Promise<CapturedImage> {
    if (!this.mediaStream) {
      throw new Error('Kamera ej tillgänglig. Försök igen.')
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Get GPS position
        const position = await this.getCurrentPosition()
        
        // Create video element
        const video = document.createElement('video')
        video.srcObject = this.mediaStream
        video.style.display = 'none'
        document.body.appendChild(video)
        
        video.onloadedmetadata = () => {
          video.play()
          
          // Create canvas
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          // Set canvas size
          canvas.width = options.maxWidth || 1920
          canvas.height = options.maxHeight || 1080
          
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Convert to base64 with compression
          const quality = options.quality || 0.8
          const imageData = canvas.toDataURL('image/jpeg', quality)
          
          // Calculate file size (approximate)
          const fileSize = Math.round((imageData.length * 3) / 4)
          
          // Clean up
          video.pause()
          document.body.removeChild(video)
          
          const capturedImage: CapturedImage = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            room,
            timestamp: new Date().toISOString(),
            gpsPosition: position ? {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            } : undefined,
            imageData,
            fileSize,
            jobId
          }
          
          resolve(capturedImage)
        }
        
        video.onerror = () => {
          document.body.removeChild(video)
          reject(new Error('Kunde inte ladda kamera video'))
        }
        
      } catch (error) {
        reject(error)
      }
    })
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
  }

  async compressImage(imageData: string, maxSizeKB: number = 1024): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions to stay under size limit
        let { width, height } = img
        let quality = 0.9
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0)
        
        let compressedData = canvas.toDataURL('image/jpeg', quality)
        let currentSize = Math.round((compressedData.length * 3) / 4) / 1024 // KB
        
        // Reduce quality until under size limit
        while (currentSize > maxSizeKB && quality > 0.1) {
          quality -= 0.1
          compressedData = canvas.toDataURL('image/jpeg', quality)
          currentSize = Math.round((compressedData.length * 3) / 4) / 1024
        }
        
        resolve(compressedData)
      }
      
      img.src = imageData
    })
  }

  formatImageForEmail(image: CapturedImage): string {
    const date = new Date(image.timestamp).toLocaleString('sv-SE')
    const gpsText = image.gpsPosition 
      ? `GPS: ${image.gpsPosition.latitude.toFixed(6)}, ${image.gpsPosition.longitude.toFixed(6)}`
      : 'GPS: Ej tillgänglig'
    
    if (image.type === 'lastbil') {
      return `Foto av lastbil efter lastning - ${date}\n${gpsText}`
    } else {
      const roomText = image.room ? ` (${image.room})` : ''
      return `Flyttstädning utförd enligt 40-punktslista${roomText} - ${date}\n${gpsText}`
    }
  }
}

// Export singleton instance
export const cameraService = CameraService.getInstance()