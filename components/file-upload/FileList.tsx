'use client'

import { useState, useEffect } from 'react'
import { File, Image, Download, Trash2, ExternalLink, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/token-helper'
import { StorageService } from '@/lib/storage/storage-client'

interface FileListProps {
  entityType?: string
  entityId?: string
  bucket?: string
  showUploadButton?: boolean
  onUploadClick?: () => void
}

interface FileAttachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  publicUrl: string
  description?: string
  tags: string[]
  uploadedBy: {
    name: string
    email: string
  }
  uploadedAt: string
}

export function FileList({
  entityType,
  entityId,
  bucket,
  showUploadButton = true,
  onUploadClick
}: FileListProps) {
  const [files, setFiles] = useState<FileAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [entityType, entityId, bucket])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      
      const params = new URLSearchParams()
      if (entityType) params.append('entityType', entityType)
      if (entityId) params.append('entityId', entityId)
      if (bucket) params.append('bucket', bucket)
      
      const response = await fetch(`/api/storage/list?${params}`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }
      
      const result = await response.json()
      setFiles(result.attachments || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Kunde inte hämta filer')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      const headers = await getAuthHeaders()
      const file = files.find(f => f.id === fileId)
      
      if (!file) return
      
      // Extract bucket and path from publicUrl or use stored values
      // This is a simplified version - you might need to adjust based on your URL structure
      const urlParts = file.publicUrl.split('/storage/v1/object/public/')
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL')
      }
      
      const [fileBucket, ...pathParts] = urlParts[1].split('/')
      const filePath = pathParts.join('/')
      
      const response = await fetch(`/api/storage/${fileBucket}/${filePath}`, {
        method: 'DELETE',
        headers
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete file')
      }
      
      toast.success('Fil borttagen')
      setDeleteFileId(null)
      fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Kunde inte ta bort filen')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5" />
    }
    return <File className="h-5 w-5" />
  }

  const filteredFiles = files.filter(file => 
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sök filer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {showUploadButton && onUploadClick && (
          <Button onClick={onUploadClick}>
            Ladda upp fil
          </Button>
        )}
      </div>

      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Inga filer hittades' : 'Inga filer uppladdade än'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{file.fileName}</h4>
                      {file.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {file.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{StorageService.formatFileSize(file.fileSize)}</span>
                        <span>{file.uploadedBy.name}</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString('sv-SE')}</span>
                      </div>
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(file.publicUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = file.publicUrl
                        a.download = file.fileName
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteFileId(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort fil?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort denna fil? Detta kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFileId && handleDelete(deleteFileId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}