'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, X, MapPin, Clock } from 'lucide-react'

interface PhotoData {
  id: number
  serviceType: string
  room?: string
  timestamp: string
  gpsText: string
  gpsPosition?: {
    latitude: number
    longitude: number
  }
  fileName: string
  fileSize: number
  dataUrl: string
}

interface PhotoGalleryProps {
  isOpen: boolean
  onClose: () => void
  jobId?: string
}

export default function PhotoGallery({ isOpen, onClose, jobId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    if (isOpen) {
      const savedPhotos = JSON.parse(localStorage.getItem('staff_photos') || '[]')
      // Sort by newest first
      const sortedPhotos = savedPhotos.sort((a: PhotoData, b: PhotoData) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setPhotos(sortedPhotos)
    }
  }, [isOpen])

  const filteredPhotos = filterType === 'all' 
    ? photos 
    : photos.filter(photo => photo.serviceType === filterType)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Sparade bilder ({photos.length} st)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {photos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Inga bilder sparade än</p>
                <p className="text-sm">Ta bilder från jobbkorten för att se dem här</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div 
                    key={photo.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="aspect-square relative">
                      <img 
                        src={photo.dataUrl}
                        alt={`${photo.serviceType} - ${photo.timestamp}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {photo.serviceType}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {photo.room ? `${photo.serviceType} - ${photo.room}` : photo.serviceType}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {photo.timestamp}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {photo.gpsText.replace('GPS: ', '')}
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-1">
                        {formatFileSize(photo.fileSize)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullskärms bildvisning */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
            <div className="flex-shrink-0 p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedPhoto.room ? `${selectedPhoto.serviceType} - ${selectedPhoto.room}` : selectedPhoto.serviceType}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedPhoto.timestamp}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedPhoto.gpsText.replace('GPS: ', '')}
                    </div>
                    <div>{formatFileSize(selectedPhoto.fileSize)}</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden bg-black flex items-center justify-center">
              <img 
                src={selectedPhoto.dataUrl}
                alt={`${selectedPhoto.serviceType} - ${selectedPhoto.timestamp}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}