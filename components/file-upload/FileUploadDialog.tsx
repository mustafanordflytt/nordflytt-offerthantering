'use client'

import { useState, useCallback } from 'react'
import { Upload, X, File, Image } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/token-helper'
import { StorageService } from '@/lib/storage/storage-client'

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  bucket: string
  onUploadComplete?: (file: any) => void
  acceptedTypes?: string[]
  maxSizeMB?: number
}

export function FileUploadDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  bucket,
  onUploadComplete,
  acceptedTypes,
  maxSizeMB = 10
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = StorageService.validateFile(file, maxSizeMB, acceptedTypes)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setUploadProgress(10)

      const headers = await getAuthHeaders()
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('entityType', entityType)
      formData.append('entityId', entityId)
      formData.append('bucket', bucket)
      if (description) formData.append('description', description)
      if (tags) formData.append('tags', tags)

      setUploadProgress(30)

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: {
          ...headers
          // Don't set Content-Type, let browser set it with boundary
        },
        body: formData
      })

      setUploadProgress(80)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadProgress(100)

      toast.success('Fil uppladdad')
      
      if (onUploadComplete) {
        onUploadComplete(result.attachment)
      }

      // Reset form
      setSelectedFile(null)
      setDescription('')
      setTags('')
      setUploadProgress(0)
      onOpenChange(false)

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Kunde inte ladda upp filen')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-12 w-12 text-blue-500" />
    }
    return <File className="h-12 w-12 text-gray-500" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ladda upp fil</DialogTitle>
          <DialogDescription>
            Dra och släpp en fil här eller klicka för att välja
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">
                Dra och släpp din fil här
              </p>
              <p className="text-xs text-gray-500 mt-1">
                eller klicka för att bläddra
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Max storlek: {maxSizeMB}MB
              </p>
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept={acceptedTypes?.join(',')}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0])
                  }
                }}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {getFileIcon(selectedFile)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {StorageService.formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {selectedFile && (
            <>
              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning (valfritt)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Lägg till en beskrivning..."
                  rows={3}
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Taggar (valfritt)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="faktura, kvitto, kontrakt..."
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500">
                  Separera taggar med kommatecken
                </p>
              </div>
            </>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-gray-500">
                Laddar upp... {uploadProgress}%
              </p>
            </div>
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