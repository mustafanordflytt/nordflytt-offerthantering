'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  X, 
  AlertCircle, 
  CheckCircle2,
  FileText,
  FileImage,
  Loader2
} from 'lucide-react'
import { useDocuments, useCustomers, useLeads } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface UploadDialogProps {
  isOpen: boolean
  onClose: () => void
  folderId?: string
}

// File type icons
const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return FileImage
  if (file.type.includes('pdf')) return FileText
  return File
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function UploadDialog({ isOpen, onClose, folderId }: UploadDialogProps) {
  const { toast } = useToast()
  const { uploadDocument, folders } = useDocuments()
  const { customers } = useCustomers()
  const { leads } = useLeads()
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Set<string>>(new Set())
  
  // Form data for each file
  const [fileMetadata, setFileMetadata] = useState<Record<string, {
    category: string
    description: string
    tags: string[]
    linkedEntityType: string
    linkedEntityId: string
    linkedEntityName: string
    isPublic: boolean
  }>>({})

  const resetDialog = () => {
    setSelectedFiles([])
    setFileMetadata({})
    setUploadedFiles(new Set())
    setIsUploading(false)
    setIsDragOver(false)
  }

  const handleClose = () => {
    resetDialog()
    onClose()
  }

  // File selection handlers
  const handleFileSelect = useCallback((files: FileList) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fil för stor",
          description: `${file.name} är större än 10MB och kan inte laddas upp.`,
          variant: "destructive",
        })
        return false
      }
      
      // Check if file already selected
      if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        return false
      }
      
      return true
    })
    
    setSelectedFiles(prev => [...prev, ...validFiles])
    
    // Initialize metadata for new files
    validFiles.forEach(file => {
      const fileKey = `${file.name}-${file.size}`
      setFileMetadata(prev => ({
        ...prev,
        [fileKey]: {
          category: 'other',
          description: '',
          tags: [],
          linkedEntityType: '',
          linkedEntityId: '',
          linkedEntityName: '',
          isPublic: false
        }
      }))
    })
  }, [selectedFiles, toast])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  // Remove file from selection
  const removeFile = (index: number) => {
    const file = selectedFiles[index]
    const fileKey = `${file.name}-${file.size}`
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setFileMetadata(prev => {
      const updated = { ...prev }
      delete updated[fileKey]
      return updated
    })
  }

  // Update metadata for a specific file
  const updateFileMetadata = (file: File, field: string, value: any) => {
    const fileKey = `${file.name}-${file.size}`
    setFileMetadata(prev => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        [field]: value
      }
    }))
  }

  // Handle entity selection
  const handleEntitySelect = (file: File, entityType: string, entityValue: string) => {
    const [entityId, entityName] = entityValue.split('|')
    updateFileMetadata(file, 'linkedEntityType', entityType)
    updateFileMetadata(file, 'linkedEntityId', entityId)
    updateFileMetadata(file, 'linkedEntityName', entityName)
  }

  // Upload files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setIsUploading(true)
    const newUploadedFiles = new Set(uploadedFiles)
    
    for (const file of selectedFiles) {
      const fileKey = `${file.name}-${file.size}`
      
      if (uploadedFiles.has(fileKey)) continue
      
      try {
        const metadata = fileMetadata[fileKey]
        await uploadDocument(file, folderId, metadata)
        
        newUploadedFiles.add(fileKey)
        setUploadedFiles(newUploadedFiles)
        
        toast({
          title: "Fil uppladdad",
          description: `${file.name} har laddats upp framgångsrikt.`,
        })
      } catch (error) {
        toast({
          title: "Uppladdning misslyckades",
          description: `Kunde inte ladda upp ${file.name}.`,
          variant: "destructive",
        })
      }
    }
    
    setIsUploading(false)
    
    // If all files uploaded successfully, close dialog
    if (newUploadedFiles.size === selectedFiles.length) {
      setTimeout(() => {
        handleClose()
      }, 1000)
    }
  }

  const getCurrentFolder = () => {
    if (!folderId) return 'Alla Dokument'
    const folder = folders.find(f => f.id === folderId)
    return folder ? folder.name : 'Okänd Mapp'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Ladda upp Dokument</CardTitle>
              <CardDescription>
                Lägg till filer i {getCurrentFolder()}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* File Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver ? "border-[#002A5C] bg-blue-50" : "border-gray-300",
              selectedFiles.length > 0 ? "border-green-300 bg-green-50" : ""
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isDragOver ? 'Släpp filer här' : 'Välj filer att ladda upp'}
            </h3>
            <p className="text-gray-500 mb-4">
              Dra och släpp filer här eller klicka för att välja
            </p>
            <Input
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Välj Filer
              </label>
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Tillåtna filtyper: PDF, Word, Excel, Bilder, Text. Max 10MB per fil.
            </p>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Valda Filer ({selectedFiles.length})</h3>
              
              {selectedFiles.map((file, index) => {
                const fileKey = `${file.name}-${file.size}`
                const metadata = fileMetadata[fileKey] || {}
                const isUploaded = uploadedFiles.has(fileKey)
                const FileIcon = getFileIcon(file)
                
                return (
                  <Card key={fileKey} className={cn(
                    "p-4 transition-colors",
                    isUploaded ? "bg-green-50 border-green-200" : ""
                  )}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <FileIcon className="h-8 w-8 text-[#002A5C]" />
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {file.type}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isUploaded ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Uppladdad
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {!isUploaded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`category-${index}`}>Kategori</Label>
                            <Select
                              value={metadata.category}
                              onValueChange={(value) => updateFileMetadata(file, 'category', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Välj kategori" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="contract">Kontrakt</SelectItem>
                                <SelectItem value="invoice">Faktura</SelectItem>
                                <SelectItem value="quote">Offert</SelectItem>
                                <SelectItem value="photo">Foto</SelectItem>
                                <SelectItem value="insurance">Försäkring</SelectItem>
                                <SelectItem value="other">Annat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`description-${index}`}>Beskrivning</Label>
                            <Textarea
                              id={`description-${index}`}
                              value={metadata.description}
                              onChange={(e) => updateFileMetadata(file, 'description', e.target.value)}
                              placeholder="Beskriv dokumentet..."
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Koppla till</Label>
                            <div className="space-y-2">
                              <Select
                                value={metadata.linkedEntityType}
                                onValueChange={(value) => {
                                  updateFileMetadata(file, 'linkedEntityType', value)
                                  updateFileMetadata(file, 'linkedEntityId', '')
                                  updateFileMetadata(file, 'linkedEntityName', '')
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Välj typ" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Ingen koppling</SelectItem>
                                  <SelectItem value="customer">Kund</SelectItem>
                                  <SelectItem value="lead">Lead</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {metadata.linkedEntityType === 'customer' && (
                                <Select
                                  value={metadata.linkedEntityId ? `${metadata.linkedEntityId}|${metadata.linkedEntityName}` : ''}
                                  onValueChange={(value) => handleEntitySelect(file, 'customer', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Välj kund" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {customers.map(customer => (
                                      <SelectItem key={customer.id} value={`${customer.id}|${customer.name}`}>
                                        {customer.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              
                              {metadata.linkedEntityType === 'lead' && (
                                <Select
                                  value={metadata.linkedEntityId ? `${metadata.linkedEntityId}|${metadata.linkedEntityName}` : ''}
                                  onValueChange={(value) => handleEntitySelect(file, 'lead', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Välj lead" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {leads.map(lead => (
                                      <SelectItem key={lead.id} value={`${lead.id}|${lead.name}`}>
                                        {lead.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`tags-${index}`}>Taggar</Label>
                            <Input
                              id={`tags-${index}`}
                              value={metadata.tags.join(', ')}
                              onChange={(e) => {
                                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                                updateFileMetadata(file, 'tags', tags)
                              }}
                              placeholder="tag1, tag2, tag3"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* Upload Button */}
          {selectedFiles.length > 0 && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Avbryt
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={isUploading || uploadedFiles.size === selectedFiles.length}
                className="bg-[#002A5C] hover:bg-[#001a42]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Laddar upp...
                  </>
                ) : uploadedFiles.size === selectedFiles.length ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Alla filer uppladdade
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Ladda upp {selectedFiles.length - uploadedFiles.size} filer
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}