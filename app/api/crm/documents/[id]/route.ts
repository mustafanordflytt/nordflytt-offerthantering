import { NextRequest, NextResponse } from 'next/server'

// Mock document data (same as in main route)
const mockDocuments = [
  {
    id: 'doc-001',
    name: 'Flyttkontrakt Anna Svensson',
    originalName: 'kontrakt_anna_svensson_2025.pdf',
    fileType: 'pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    url: '/api/files/kontrakt_anna_svensson_2025.pdf',
    folderId: 'folder-001',
    folderPath: '/Kontrakt/2025',
    category: 'contract',
    tags: ['kontrakt', 'anna svensson', '2025'],
    description: 'Flyttkontrakt för Anna Svensson, flytt från Stockholm till Göteborg',
    uploadedBy: 'admin',
    linkedEntityType: 'customer',
    linkedEntityId: 'customer-001',
    linkedEntityName: 'Anna Svensson',
    isPublic: false,
    downloadCount: 3,
    lastDownloaded: new Date('2025-06-30'),
    createdAt: new Date('2025-06-25'),
    updatedAt: new Date('2025-06-25')
  },
  {
    id: 'doc-002',
    name: 'Offert Erik Johansson AB',
    originalName: 'offert_erik_johansson_ab.pdf',
    fileType: 'pdf',
    fileSize: 512000,
    mimeType: 'application/pdf',
    url: '/api/files/offert_erik_johansson_ab.pdf',
    folderId: 'folder-002',
    folderPath: '/Offerter/Företag',
    category: 'quote',
    tags: ['offert', 'företag', 'erik johansson'],
    description: 'Offert för företagsflytt, 50 anställda',
    uploadedBy: 'admin',
    linkedEntityType: 'lead',
    linkedEntityId: 'lead-002',
    linkedEntityName: 'Erik Johansson AB',
    isPublic: false,
    downloadCount: 1,
    lastDownloaded: new Date('2025-06-29'),
    createdAt: new Date('2025-06-20'),
    updatedAt: new Date('2025-06-20')
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const documentId = resolvedParams.id
    const document = mockDocuments.find(doc => doc.id === documentId)
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // In real implementation, you might want to check permissions here
    // if (!hasPermission(user, document, 'read')) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    // }
    
    return NextResponse.json(document)
    
  } catch (error) {
    console.error('Unexpected error in document detail API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const documentId = resolvedParams.id
    const body = await request.json()
    
    const documentIndex = mockDocuments.findIndex(doc => doc.id === documentId)
    if (documentIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Validate updates
    const { name, category, description, tags, folderId, linkedEntityType, linkedEntityId, linkedEntityName, isPublic } = body
    
    // Update document
    const updatedDocument = {
      ...mockDocuments[documentIndex],
      ...(name && { name }),
      ...(category && { category }),
      ...(description !== undefined && { description }),
      ...(tags && { tags }),
      ...(folderId !== undefined && { folderId }),
      ...(linkedEntityType !== undefined && { linkedEntityType }),
      ...(linkedEntityId !== undefined && { linkedEntityId }),
      ...(linkedEntityName !== undefined && { linkedEntityName }),
      ...(isPublic !== undefined && { isPublic }),
      updatedAt: new Date()
    }
    
    mockDocuments[documentIndex] = updatedDocument
    
    return NextResponse.json(updatedDocument)
    
  } catch (error) {
    console.error('Unexpected error in document update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const documentId = resolvedParams.id
    const documentIndex = mockDocuments.findIndex(doc => doc.id === documentId)
    
    if (documentIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    const document = mockDocuments[documentIndex]
    
    // In real implementation:
    // 1. Delete file from storage
    // 2. Delete thumbnails
    // 3. Remove from database
    // 4. Log the deletion
    
    mockDocuments.splice(documentIndex, 1)
    
    return NextResponse.json({ 
      success: true,
      message: 'Document deleted successfully',
      deletedDocument: {
        id: document.id,
        name: document.name
      }
    })
    
  } catch (error) {
    console.error('Unexpected error in document deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}