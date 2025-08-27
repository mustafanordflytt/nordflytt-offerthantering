import { NextRequest, NextResponse } from 'next/server'

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId') as string
    const category = formData.get('category') as string || 'other'
    const description = formData.get('description') as string || ''
    const tags = formData.get('tags') as string || '[]'
    const linkedEntityType = formData.get('linkedEntityType') as string
    const linkedEntityId = formData.get('linkedEntityId') as string
    const linkedEntityName = formData.get('linkedEntityName') as string
    const isPublic = formData.get('isPublic') === 'true'
    
    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }
    
    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }
    
    // Extract file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    
    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFilename = `${timestamp}_${sanitizedName}`
    
    // In a real implementation, you would:
    // 1. Save the file to a storage service (AWS S3, Azure Blob, etc.)
    // 2. Generate thumbnails for images
    // 3. Extract metadata
    // 4. Scan for viruses
    // 5. Save file info to database
    
    // For now, we'll create a mock document object
    const newDocument = {
      id: `doc-${timestamp}`,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension from display name
      originalName: file.name,
      fileType: fileExtension,
      fileSize: file.size,
      mimeType: file.type,
      url: `/api/files/${uniqueFilename}`,
      thumbnailUrl: file.type.startsWith('image/') ? `/api/files/thumbnails/${uniqueFilename}` : undefined,
      folderId: folderId || null,
      folderPath: folderId ? '/Unknown' : null, // Would be calculated from folder hierarchy
      category: category as any,
      tags: JSON.parse(tags),
      description,
      uploadedBy: 'admin',
      linkedEntityType: linkedEntityType || null,
      linkedEntityId: linkedEntityId || null,
      linkedEntityName: linkedEntityName || null,
      isPublic,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // In real implementation:
    // const buffer = Buffer.from(await file.arrayBuffer())
    // await saveFileToStorage(buffer, uniqueFilename)
    // await saveDocumentToDatabase(newDocument)
    
    return NextResponse.json(newDocument, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in file upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get file type category
function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'photo'
  if (mimeType.includes('pdf')) return 'other'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'other'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'other'
  return 'other'
}

// Helper function to generate thumbnail (mock implementation)
async function generateThumbnail(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null
  
  // In real implementation, you would:
  // 1. Use a library like Sharp or Canvas to resize the image
  // 2. Save the thumbnail to storage
  // 3. Return the thumbnail URL
  
  return `/api/files/thumbnails/thumb_${Date.now()}.jpg`
}

// Helper function to extract metadata
function extractMetadata(file: File) {
  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    lastModified: new Date(file.lastModified)
  }
}