'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Download, 
  ExternalLink,
  FileText,
  FileImage,
  File,
  Calendar,
  User,
  Tag,
  Link as LinkIcon,
  HardDrive
} from 'lucide-react'
import { Document } from '@/lib/store'
import { cn } from '@/lib/utils'

interface FilePreviewProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onDownload: (documentId: string) => void
}

// File size formatter
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Category labels and colors
const CATEGORY_LABELS = {
  contract: 'Kontrakt',
  invoice: 'Faktura',
  quote: 'Offert',
  photo: 'Foto',
  insurance: 'Försäkring',
  other: 'Annat'
}

const CATEGORY_COLORS = {
  contract: 'bg-blue-100 text-blue-800',
  invoice: 'bg-green-100 text-green-800',
  quote: 'bg-yellow-100 text-yellow-800',
  photo: 'bg-purple-100 text-purple-800',
  insurance: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
}

// Get file icon
const getFileIcon = (mimeType: string, fileType: string) => {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('pdf') || fileType === 'pdf') return FileText
  return File
}

export default function FilePreview({ document, isOpen, onClose, onDownload }: FilePreviewProps) {
  const [previewError, setPreviewError] = useState(false)

  if (!isOpen || !document) return null

  const FileIcon = getFileIcon(document.mimeType, document.fileType)
  const canPreview = document.mimeType.startsWith('image/') || document.mimeType.includes('pdf')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <FileIcon className="h-8 w-8 text-[#002A5C]" />
              <div>
                <CardTitle className="text-xl">{document.name}</CardTitle>
                <CardDescription className="mt-1">
                  {document.originalName} • {formatFileSize(document.fileSize)}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Preview Area */}
            <div className="lg:col-span-2">
              <div className="h-full border rounded-lg overflow-hidden bg-gray-50">
                {canPreview && !previewError ? (
                  <div className="h-full flex items-center justify-center">
                    {document.mimeType.startsWith('image/') ? (
                      <img
                        src={document.url}
                        alt={document.name}
                        className="max-w-full max-h-full object-contain"
                        onError={() => setPreviewError(true)}
                      />
                    ) : document.mimeType.includes('pdf') ? (
                      <iframe
                        src={`${document.url}#toolbar=0`}
                        className="w-full h-full border-0"
                        title={document.name}
                        onError={() => setPreviewError(true)}
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <FileIcon className="h-24 w-24 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Förhandsgranskning ej tillgänglig</h3>
                    <p className="text-sm text-center">
                      {previewError 
                        ? 'Kunde inte ladda förhandsgranskningen'
                        : 'Denna filtyp stöder inte förhandsgranskning'
                      }
                    </p>
                    <Button 
                      onClick={() => onDownload(document.id)}
                      className="mt-4"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Ladda ner för att visa
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Info */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dokumentinformation</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Kategori</span>
                    <Badge className={cn("text-xs", CATEGORY_COLORS[document.category])}>
                      {CATEGORY_LABELS[document.category]}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Filtyp</span>
                    <span className="text-sm font-medium">{document.fileType.toUpperCase()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Storlek</span>
                    <div className="flex items-center text-sm">
                      <HardDrive className="h-3 w-3 mr-1" />
                      {formatFileSize(document.fileSize)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uppladdad</span>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(document.createdAt).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uppladdad av</span>
                    <div className="flex items-center text-sm">
                      <User className="h-3 w-3 mr-1" />
                      {document.uploadedBy}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nedladdningar</span>
                    <span className="text-sm font-medium">{document.downloadCount}</span>
                  </div>
                </div>
              </div>

              {/* Linked Entity */}
              {document.linkedEntityName && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Kopplat till</h3>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-[#002A5C] mr-3" />
                    <div>
                      <p className="font-medium">{document.linkedEntityName}</p>
                      <p className="text-sm text-gray-600 capitalize">{document.linkedEntityType}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {document.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Beskrivning</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {document.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {document.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Taggar</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t space-y-2">
                <Button 
                  onClick={() => onDownload(document.id)}
                  className="w-full bg-[#002A5C] hover:bg-[#001a42]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Ladda ner
                </Button>
                
                {document.url && (
                  <Button 
                    onClick={() => window.open(document.url, '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Öppna i ny flik
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}