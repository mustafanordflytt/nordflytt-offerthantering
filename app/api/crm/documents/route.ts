import { NextRequest, NextResponse } from 'next/server'

// Mock document data for development
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
  },
  {
    id: 'doc-003',
    name: 'Innan flytt - Lägenheten',
    originalName: 'before_move_apartment.jpg',
    fileType: 'jpg',
    fileSize: 2048000,
    mimeType: 'image/jpeg',
    url: '/api/files/before_move_apartment.jpg',
    thumbnailUrl: '/api/files/thumbnails/before_move_apartment_thumb.jpg',
    folderId: 'folder-003',
    folderPath: '/Foton/Innan flytt',
    category: 'photo',
    tags: ['foto', 'innan', 'lägenhet'],
    description: 'Foto av lägenheten innan flytt för skadedokumentation',
    uploadedBy: 'admin',
    linkedEntityType: 'job',
    linkedEntityId: 'job-001',
    linkedEntityName: 'Flytt Anna Svensson',
    isPublic: false,
    downloadCount: 0,
    createdAt: new Date('2025-06-28'),
    updatedAt: new Date('2025-06-28')
  },
  {
    id: 'doc-004',
    name: 'Försäkringsdokument',
    originalName: 'insurance_policy_2025.pdf',
    fileType: 'pdf',
    fileSize: 768000,
    mimeType: 'application/pdf',
    url: '/api/files/insurance_policy_2025.pdf',
    folderId: 'folder-004',
    folderPath: '/Försäkring',
    category: 'insurance',
    tags: ['försäkring', 'policy', '2025'],
    description: 'Försäkringspolicy för transportskador',
    uploadedBy: 'admin',
    linkedEntityType: null,
    linkedEntityId: null,
    linkedEntityName: null,
    isPublic: true,
    downloadCount: 8,
    lastDownloaded: new Date('2025-07-01'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'doc-005',
    name: 'Faktura Maria Lindqvist',
    originalName: 'invoice_maria_lindqvist_001.pdf',
    fileType: 'pdf',
    fileSize: 384000,
    mimeType: 'application/pdf',
    url: '/api/files/invoice_maria_lindqvist_001.pdf',
    folderId: 'folder-005',
    folderPath: '/Fakturor/2025',
    category: 'invoice',
    tags: ['faktura', 'maria lindqvist', 'betald'],
    description: 'Faktura för flytt och städning',
    uploadedBy: 'admin',
    linkedEntityType: 'customer',
    linkedEntityId: 'customer-003',
    linkedEntityName: 'Maria Lindqvist',
    isPublic: false,
    downloadCount: 2,
    lastDownloaded: new Date('2025-06-30'),
    createdAt: new Date('2025-06-18'),
    updatedAt: new Date('2025-06-18')
  }
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const folderId = searchParams.get('folderId')
    const category = searchParams.get('category')
    const fileType = searchParams.get('fileType')
    const search = searchParams.get('search')
    const linkedEntityType = searchParams.get('linkedEntityType')
    const linkedEntityId = searchParams.get('linkedEntityId')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'
    
    let filteredDocuments = [...mockDocuments]
    
    // Apply folder filter
    if (folderId) {
      filteredDocuments = filteredDocuments.filter(doc => doc.folderId === folderId)
    }
    
    // Apply category filter
    if (category && category !== 'all') {
      filteredDocuments = filteredDocuments.filter(doc => doc.category === category)
    }
    
    // Apply file type filter
    if (fileType && fileType !== 'all') {
      if (fileType === 'image') {
        filteredDocuments = filteredDocuments.filter(doc => doc.mimeType.startsWith('image/'))
      } else if (fileType === 'document') {
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.mimeType.includes('pdf') || 
          doc.mimeType.includes('document') ||
          doc.mimeType.includes('text')
        )
      } else if (fileType === 'spreadsheet') {
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.mimeType.includes('spreadsheet') || 
          doc.mimeType.includes('excel')
        )
      } else {
        filteredDocuments = filteredDocuments.filter(doc => doc.fileType === fileType)
      }
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredDocuments = filteredDocuments.filter(doc =>
        doc.name.toLowerCase().includes(searchLower) ||
        doc.originalName.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }
    
    // Apply entity linking filter
    if (linkedEntityType) {
      filteredDocuments = filteredDocuments.filter(doc => doc.linkedEntityType === linkedEntityType)
    }
    
    if (linkedEntityId) {
      filteredDocuments = filteredDocuments.filter(doc => doc.linkedEntityId === linkedEntityId)
    }
    
    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit)
      const pageNum = parseInt(page)
      const offset = (pageNum - 1) * limitNum
      filteredDocuments = filteredDocuments.slice(offset, offset + limitNum)
    }
    
    // Calculate statistics
    const stats = {
      totalDocuments: mockDocuments.length,
      totalSize: mockDocuments.reduce((sum, doc) => sum + doc.fileSize, 0),
      documentsByCategory: mockDocuments.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      documentsByType: mockDocuments.reduce((acc, doc) => {
        acc[doc.fileType] = (acc[doc.fileType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentUploads: mockDocuments
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      mostDownloaded: mockDocuments
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 5)
    }
    
    return NextResponse.json({
      documents: filteredDocuments,
      stats,
      total: filteredDocuments.length,
      page: parseInt(page),
      limit: limit ? parseInt(limit) : null
    })
    
  } catch (error) {
    console.error('Unexpected error in documents API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, description, tags, folderId, linkedEntityType, linkedEntityId, linkedEntityName, isPublic } = body
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Document name is required' },
        { status: 400 }
      )
    }
    
    // Create new document metadata (file upload would be handled separately)
    const newDocument = {
      id: `doc-${Date.now()}`,
      name,
      originalName: name,
      fileType: 'unknown',
      fileSize: 0,
      mimeType: 'application/octet-stream',
      url: '/api/files/placeholder',
      folderId: folderId || 'default',
      folderPath: folderId ? '/Unknown' : '/Default',
      category: category || 'other',
      tags: tags || [],
      description: description || '',
      uploadedBy: 'admin',
      linkedEntityType: linkedEntityType || 'none',
      linkedEntityId: linkedEntityId || 'none',
      linkedEntityName: linkedEntityName || 'none',
      isPublic: isPublic || false,
      downloadCount: 0,
      lastDownloaded: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // In real implementation, this would save to database
    mockDocuments.push(newDocument as any)
    
    return NextResponse.json(newDocument, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in document creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}