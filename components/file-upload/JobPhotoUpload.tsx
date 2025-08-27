'use client'

import { useState } from 'react'
import { Camera, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/token-helper'
import { StorageService, ALLOWED_IMAGE_TYPES } from '@/lib/storage/storage-client'

interface JobPhotoUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  photoType?: 'before' | 'during' | 'after' | 'damage' | 'inventory'
  onUploadComplete?: (photo: any) => void
}

export function JobPhotoUpload({
  open,
  onOpenChange,
  jobId,
  photoType: defaultPhotoType,
  onUploadComplete
}: JobPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoType, setPhotoType] = useState(defaultPhotoType || 'before')
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [sortOrder, setSortOrder] = useState('0')
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = StorageService.validateFile(file, 10, ALLOWED_IMAGE_TYPES)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolokalisering stöds inte av din webbläsare')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setUseCurrentLocation(true)
        toast.success('Position hämtad')
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Kunde inte hämta position')
      }
    )
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)

      const headers = await getAuthHeaders()
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('photoType', photoType)
      if (caption) formData.append('caption', caption)
      if (location) formData.append('location', location)
      formData.append('isPrimary', isPrimary.toString())
      formData.append('sortOrder', sortOrder)
      if (coordinates && useCurrentLocation) {
        formData.append('latitude', coordinates.lat.toString())
        formData.append('longitude', coordinates.lng.toString())
      }
      formData.append('takenAt', new Date().toISOString())

      const response = await fetch(`/api/jobs/${jobId}/photos`, {
        method: 'POST',
        headers: {
          ...headers
          // Don't set Content-Type, let browser set it with boundary
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      toast.success('Foto uppladdat')
      
      if (onUploadComplete) {
        onUploadComplete(result.photo)
      }

      // Reset form
      setSelectedFile(null)
      setImagePreview(null)
      setCaption('')
      setLocation('')
      setIsPrimary(false)
      setSortOrder('0')
      setUseCurrentLocation(false)
      setCoordinates(null)
      onOpenChange(false)

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Kunde inte ladda upp foto')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ladda upp jobbfoto</DialogTitle>
          <DialogDescription>
            Ta eller välj ett foto för att dokumentera jobbet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div className="space-y-4">
              {/* Camera capture for mobile */}
              <div>
                <Label>Ta foto med kamera</Label>
                <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-gray-400">
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Ta foto</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0])
                      }
                    }}
                  />
                </label>
              </div>

              {/* File upload */}
              <div>
                <Label>Eller välj från galleri</Label>
                <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-gray-300 p-4 hover:bg-gray-50">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Välj från enheten</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0])
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <>
              {/* Image preview */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedFile(null)
                      setImagePreview(null)
                    }}
                  >
                    Byt foto
                  </Button>
                </div>
              )}

              {/* Photo type */}
              <div className="space-y-2">
                <Label htmlFor="photoType">Fototyp</Label>
                <Select value={photoType} onValueChange={(value: any) => setPhotoType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Före flytt</SelectItem>
                    <SelectItem value="during">Under flytt</SelectItem>
                    <SelectItem value="after">Efter flytt</SelectItem>
                    <SelectItem value="damage">Skada</SelectItem>
                    <SelectItem value="inventory">Inventarie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Beskrivning</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Beskriv vad fotot visar..."
                  rows={2}
                />
              </div>

              {/* Location in property */}
              <div className="space-y-2">
                <Label htmlFor="location">Plats i fastighet</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="T.ex. Vardagsrum, Kök, Sovrum..."
                />
              </div>

              {/* GPS location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>GPS-position</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={uploading}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Hämta position
                  </Button>
                </div>
                {coordinates && (
                  <p className="text-xs text-gray-500">
                    Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Primary photo */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="primary"
                  checked={isPrimary}
                  onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
                />
                <Label htmlFor="primary" className="text-sm">
                  Sätt som huvudfoto för jobbet
                </Label>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Avbryt
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Laddar upp...' : 'Ladda upp'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}