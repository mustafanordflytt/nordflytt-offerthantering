'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle,
  AlertTriangle,
  Image,
  FolderOpen,
  Download
} from 'lucide-react'

interface DesktopPhotoManagerProps {
  jobData: any
  currentPhase: 'before' | 'during' | 'after'
  onPhotoAdded?: (photo: any) => void
}

interface PhotoItem {
  id: string
  file: File
  preview: string
  category: string
  timestamp: string
  uploaded: boolean
}

export default function DesktopPhotoManager({ jobData, currentPhase, onPhotoAdded }: DesktopPhotoManagerProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const phaseConfig = {
    before: {
      title: 'Före-bilder',
      description: 'Dokumentera utgångsläget',
      color: 'blue',
      categories: ['Övergripande vy', 'Stora möbler', 'Värdeföremål', 'Skador (befintliga)']
    },
    during: {
      title: 'Arbetsbilder',
      description: 'Dokumentera processen',
      color: 'orange',
      categories: ['Packningsprocess', 'Materialanvändning', 'Säkerhetsåtgärder', 'Teamwork']
    },
    after: {
      title: 'Efter-bilder',
      description: 'Dokumentera resultatet',
      color: 'green',
      categories: ['Slutresultat', 'Kundnöjdhet', 'Städning', 'Transport klar']
    }
  }

  const config = phaseConfig[currentPhase]

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newPhoto: PhotoItem = {
          id: Date.now().toString() + Math.random(),
          file,
          preview: e.target?.result as string,
          category: config.categories[0], // Default category
          timestamp: new Date().toLocaleString('sv-SE'),
          uploaded: false
        }
        setPhotos(prev => [...prev, newPhoto])
        
        // Simulate upload
        setTimeout(() => {
          setPhotos(prev => prev.map(p => 
            p.id === newPhoto.id ? { ...p, uploaded: true } : p
          ))
          
          // Save to localStorage (matching mobile format)
          const savedPhotos = JSON.parse(localStorage.getItem('staff_photos') || '[]')
          const photoData = {
            id: parseInt(newPhoto.id),
            serviceType: jobData.serviceType || 'Okänt',
            room: newPhoto.category,
            timestamp: newPhoto.timestamp,
            gpsText: `GPS: Desktop upload - ${jobData.toAddress || 'Okänd adress'}`,
            fileName: file.name,
            fileSize: file.size,
            dataUrl: newPhoto.preview
          }
          savedPhotos.push(photoData)
          localStorage.setItem('staff_photos', JSON.stringify(savedPhotos))
          
          if (onPhotoAdded) {
            onPhotoAdded(photoData)
          }
        }, 1000)
      }
      reader.readAsDataURL(file)
    })
  }

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      // Create video element for camera preview
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.style.width = '100%'
      video.style.height = '300px'
      video.style.objectFit = 'cover'
      
      // Create modal for camera
      const modal = document.createElement('div')
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
      `
      
      const container = document.createElement('div')
      container.style.cssText = `
        background: white; padding: 20px; border-radius: 12px; 
        max-width: 500px; width: 90%;
      `
      
      const title = document.createElement('h3')
      title.textContent = 'Kamera'
      title.style.marginBottom = '15px'
      
      const buttonContainer = document.createElement('div')
      buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;'
      
      const captureBtn = document.createElement('button')
      captureBtn.textContent = '📸 Ta foto'
      captureBtn.style.cssText = 'padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 6px; cursor: pointer;'
      
      const closeBtn = document.createElement('button')
      closeBtn.textContent = 'Stäng'
      closeBtn.style.cssText = 'padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;'
      
      const canvas = document.createElement('canvas')
      
      captureBtn.onclick = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0)
        
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
            handleFiles([file])
          }
        })
        
        stream.getTracks().forEach(track => track.stop())
        document.body.removeChild(modal)
      }
      
      closeBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop())
        document.body.removeChild(modal)
      }
      
      buttonContainer.appendChild(captureBtn)
      buttonContainer.appendChild(closeBtn)
      container.appendChild(title)
      container.appendChild(video)
      container.appendChild(buttonContainer)
      modal.appendChild(container)
      document.body.appendChild(modal)
      
    } catch (error) {
      alert('Kamera inte tillgänglig. Använd filuppladdning istället.')
    }
  }

  const updateCategory = (photoId: string, category: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, category } : p
    ))
  }

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Camera className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-indigo-900">{config.title}</h3>
          <Badge className={`bg-${config.color}-100 text-${config.color}-700 border-${config.color}-300`}>
            {photos.length} bilder
          </Badge>
        </div>
        <p className="text-sm text-indigo-600">{config.description}</p>
      </div>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragOver 
            ? 'border-indigo-400 bg-indigo-100' 
            : 'border-indigo-300 bg-indigo-50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        <div className="flex flex-col items-center space-y-3">
          <Upload className="h-12 w-12 text-indigo-400" />
          <div>
            <p className="text-indigo-700 font-medium">
              Dra och släpp bilder här, eller
            </p>
            <div className="flex space-x-2 mt-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Välj filer
              </Button>
              <Button
                onClick={openCamera}
                variant="outline"
                className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                <Camera className="h-4 w-4 mr-2" />
                Öppna kamera
              </Button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square bg-white rounded-lg overflow-hidden border-2 border-gray-200">
                <img 
                  src={photo.preview} 
                  alt={photo.category}
                  className="w-full h-full object-cover"
                />
                
                {/* Upload status overlay */}
                {!photo.uploaded && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-xs">Laddar upp...</div>
                  </div>
                )}
                
                {photo.uploaded && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Category selector */}
              <select
                value={photo.category}
                onChange={(e) => updateCategory(photo.id, e.target.value)}
                className="mt-1 w-full text-xs p-1 border border-gray-300 rounded bg-white"
              >
                {config.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <div className="text-xs text-gray-500 mt-1">
                {photo.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {photos.length > 0 && (
        <div className="mt-4 pt-3 border-t border-indigo-200 text-sm text-indigo-600">
          <div className="flex justify-between items-center">
            <span>
              {photos.filter(p => p.uploaded).length} av {photos.length} bilder uppladdade
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportera alla
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}