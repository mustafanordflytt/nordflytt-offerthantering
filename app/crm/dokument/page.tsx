'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Upload, 
  FolderPlus, 
  FileText, 
  FileImage, 
  File,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Folder,
  FolderOpen,
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  HardDrive,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  X,
  Loader2
} from 'lucide-react'
import { useDocuments } from '@/lib/store'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import UploadDialog from './components/UploadDialog'
import FilePreview from './components/FilePreview'

// File type icons mapping
const getFileIcon = (mimeType: string, fileType: string) => {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('pdf') || fileType === 'pdf') return FileText
  return File
}

// File size formatter
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Category labels
const CATEGORY_LABELS = {
  contract: 'Kontrakt',
  invoice: 'Faktura',
  quote: 'Offert',
  photo: 'Foto',
  insurance: 'Försäkring',
  other: 'Annat'
}

// Category colors
const CATEGORY_COLORS = {
  contract: 'bg-blue-100 text-blue-800',
  invoice: 'bg-green-100 text-green-800',
  quote: 'bg-yellow-100 text-yellow-800',
  photo: 'bg-purple-100 text-purple-800',
  insurance: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
}

export default function DocumentsPage() {
  const { toast } = useToast()
  const { 
    documents, 
    folders, 
    currentFolderId, 
    isLoading, 
    error,
    fetchDocuments, 
    fetchFolders,
    uploadDocument,
    createFolder,
    deleteDocument,
    downloadDocument,
    setCurrentFolder,
    searchDocuments
  } = useDocuments()

  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    fetchDocuments(currentFolderId || undefined)
    fetchFolders()
  }, [currentFolderId])

  // Filter and sort documents
  const filteredDocuments = useCallback(() => {
    let filtered = searchDocuments(searchTerm, {
      category: categoryFilter,
      fileType: fileTypeFilter
    })

    // Apply folder filter
    if (currentFolderId) {
      filtered = filtered.filter(doc => doc.folderId === currentFolderId)
    } else {
      filtered = filtered.filter(doc => !doc.folderId)
    }

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'size':
          comparison = a.fileSize - b.fileSize
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [documents, searchTerm, categoryFilter, fileTypeFilter, currentFolderId, sortBy, sortOrder, searchDocuments])

  // Current folder breadcrumb
  const getCurrentPath = () => {
    if (!currentFolderId) return [{ name: 'Alla Dokument', id: null }]
    
    const folder = folders.find(f => f.id === currentFolderId)
    if (!folder) return [{ name: 'Alla Dokument', id: null }]
    
    const path = [{ name: 'Alla Dokument', id: null }]
    const parts = folder.path.split('/').filter(Boolean)
    
    parts.forEach((part, index) => {
      const pathSoFar = '/' + parts.slice(0, index + 1).join('/')
      const folderInPath = folders.find(f => f.path === pathSoFar)
      if (folderInPath) {
        path.push({ name: folderInPath.name, id: folderInPath.id })
      }
    })
    
    return path
  }

  // File upload handlers
  const handleFileUpload = useCallback(async (files: FileList) => {
    Array.from(files).forEach(async (file) => {
      try {
        await uploadDocument(file, currentFolderId || undefined, {
          category: 'other',
          tags: [],
          isPublic: false
        })
        
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
    })
  }, [currentFolderId, uploadDocument, toast])

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
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  // Calculate statistics
  const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0)
  const documentsByCategory = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Är du säker på att du vill ta bort detta dokument?')) {
      try {
        await deleteDocument(documentId)
        toast({
          title: "Dokument borttaget",
          description: "Dokumentet har tagits bort framgångsrikt.",
        })
      } catch (error) {
        toast({
          title: "Borttagning misslyckades",
          description: "Kunde inte ta bort dokumentet.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownload = async (documentId: string) => {
    try {
      await downloadDocument(documentId)
      toast({
        title: "Nedladdning startad",
        description: "Dokumentet laddas ner...",
      })
    } catch (error) {
      toast({
        title: "Nedladdning misslyckades",
        description: "Kunde inte ladda ner dokumentet.",
        variant: "destructive",
      })
    }
  }

  const handlePreview = (document: any) => {
    setPreviewDocument(document)
    setShowPreview(true)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar dokument...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">Error: {error}</p>
            </div>
            <Button onClick={() => fetchDocuments()} className="mt-4">
              Försök igen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div 
      className="p-6 space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dokumentbibliotek</h1>
          <p className="text-gray-600">Hantera filer och dokument för kunder och uppdrag</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowNewFolderDialog(true)} variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            Ny Mapp
          </Button>
          <Button onClick={() => setShowUploadDialog(true)} className="bg-[#002A5C] hover:bg-[#001a42]">
            <Upload className="mr-2 h-4 w-4" />
            Ladda upp
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <File className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totala Dokument</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Folder className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mappar</p>
                <p className="text-2xl font-bold">{folders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Storlek</p>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Senaste Upload</p>
                <p className="text-2xl font-bold">
                  {documents.length > 0 ? 'Idag' : 'Ingen'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        {getCurrentPath().map((item, index) => (
          <div key={item.id || 'root'} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            <button
              onClick={() => setCurrentFolder(item.id)}
              className={cn(
                "hover:text-[#002A5C] transition-colors",
                index === getCurrentPath().length - 1 ? "font-medium text-gray-900" : ""
              )}
            >
              {item.name}
            </button>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Sök och Filtrera</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök dokument..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Kategorier</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Filtyper</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Bilder</SelectItem>
                <SelectItem value="document">Dokument</SelectItem>
                <SelectItem value="spreadsheet">Kalkylblad</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  Sortera efter {sortBy === 'name' ? 'namn' : sortBy === 'date' ? 'datum' : 'storlek'}
                  {sortOrder === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSort('name')}>
                  Sortera efter Namn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('date')}>
                  Sortera efter Datum
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('size')}>
                  Sortera efter Storlek
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Folders */}
      {folders.filter(folder => folder.parentId === currentFolderId).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Folder className="mr-2 h-5 w-5" />
              Mappar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders
                .filter(folder => folder.parentId === currentFolderId)
                .map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setCurrentFolder(folder.id)}
                    className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[#002A5C] transition-colors"
                  >
                    <FolderOpen className="h-12 w-12 text-[#002A5C] mb-2" />
                    <span className="text-sm font-medium text-center">{folder.name}</span>
                    <span className="text-xs text-gray-500">{folder.documentCount} dokument</span>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid/List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <File className="mr-2 h-5 w-5" />
              Dokument ({filteredDocuments().length})
            </div>
            {selectedFiles.size > 0 && (
              <div className="text-sm text-gray-600">
                {selectedFiles.size} valda
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments().length === 0 ? (
            <div 
              className={cn(
                "text-center py-12 border-2 border-dashed rounded-lg transition-colors",
                isDragOver ? "border-[#002A5C] bg-blue-50" : "border-gray-300"
              )}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {isDragOver ? 'Släpp filer här' : 'Inga dokument'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isDragOver 
                  ? 'Släpp dina filer för att ladda upp dem'
                  : 'Börja genom att ladda upp dina första dokument'
                }
              </p>
              {!isDragOver && (
                <div className="mt-6">
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-[#002A5C] hover:bg-[#001a42]">
                    <Upload className="mr-2 h-4 w-4" />
                    Ladda upp dokument
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredDocuments().map((document) => {
                const FileIcon = getFileIcon(document.mimeType, document.fileType)
                return (
                  <div
                    key={document.id}
                    className="group relative p-4 rounded-lg border border-gray-200 hover:border-[#002A5C] hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col items-center text-center">
                      <FileIcon className="h-12 w-12 text-[#002A5C] mb-2" />
                      <h3 className="text-sm font-medium truncate w-full">{document.name}</h3>
                      <p className="text-xs text-gray-500">{formatFileSize(document.fileSize)}</p>
                      <Badge className={cn("mt-2 text-xs", CATEGORY_COLORS[document.category])}>
                        {CATEGORY_LABELS[document.category]}
                      </Badge>
                      
                      {document.linkedEntityName && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <LinkIcon className="h-3 w-3 mr-1" />
                          {document.linkedEntityName}
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(document.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Ladda ner
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreview(document)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Förhandsgranska
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Redigera
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Ta bort
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments().map((document) => {
                const FileIcon = getFileIcon(document.mimeType, document.fileType)
                return (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <FileIcon className="h-8 w-8 text-[#002A5C]" />
                      <div>
                        <h3 className="font-medium">{document.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatFileSize(document.fileSize)}</span>
                          <span>•</span>
                          <span>{new Date(document.createdAt).toLocaleDateString('sv-SE')}</span>
                          <span>•</span>
                          <Badge className={cn("text-xs", CATEGORY_COLORS[document.category])}>
                            {CATEGORY_LABELS[document.category]}
                          </Badge>
                          {document.linkedEntityName && (
                            <>
                              <span>•</span>
                              <div className="flex items-center">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {document.linkedEntityName}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(document.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePreview(document)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Förhandsgranska
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Redigera
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Ta bort
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <Upload className="mx-auto h-16 w-16 text-[#002A5C] mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Släpp filer här</h2>
            <p className="text-gray-600">Filerna kommer att laddas upp automatiskt</p>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        folderId={currentFolderId || undefined}
      />

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <NewFolderDialog
          isOpen={showNewFolderDialog}
          onClose={() => setShowNewFolderDialog(false)}
          parentId={currentFolderId}
        />
      )}

      {/* File Preview */}
      <FilePreview
        document={previewDocument}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false)
          setPreviewDocument(null)
        }}
        onDownload={handleDownload}
      />
    </div>
  )
}

// New Folder Dialog Component
function NewFolderDialog({ isOpen, onClose, parentId }: { isOpen: boolean, onClose: () => void, parentId: string | null }) {
  const { toast } = useToast()
  const { createFolder } = useDocuments()
  const [folderName, setFolderName] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const [folderColor, setFolderColor] = useState('#3B82F6')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Mappnamn krävs",
        description: "Ange ett namn för mappen.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      await createFolder({
        name: folderName.trim(),
        description: folderDescription.trim(),
        parentId,
        color: folderColor,
        createdBy: 'admin',
        permissions: {
          canView: ['admin', 'manager'],
          canEdit: ['admin'],
          canDelete: ['admin']
        }
      })

      toast({
        title: "Mapp skapad",
        description: `Mappen "${folderName}" har skapats framgångsrikt.`,
      })

      setFolderName('')
      setFolderDescription('')
      setFolderColor('#3B82F6')
      onClose()
    } catch (error) {
      toast({
        title: "Kunde inte skapa mapp",
        description: "Ett fel uppstod när mappen skulle skapas.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Ny Mapp</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="folder-name">Mappnamn *</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ange mappnamn"
              maxLength={50}
            />
          </div>
          
          <div>
            <Label htmlFor="folder-description">Beskrivning</Label>
            <Textarea
              id="folder-description"
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder="Beskriv vad mappen innehåller"
              rows={3}
              maxLength={200}
            />
          </div>
          
          <div>
            <Label htmlFor="folder-color">Färg</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="folder-color"
                type="color"
                value={folderColor}
                onChange={(e) => setFolderColor(e.target.value)}
                className="w-12 h-10 p-1 border rounded"
              />
              <span className="text-sm text-gray-600">{folderColor}</span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={isCreating || !folderName.trim()}
              className="bg-[#002A5C] hover:bg-[#001a42]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skapar...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Skapa Mapp
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}