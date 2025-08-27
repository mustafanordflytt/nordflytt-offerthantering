import { NextRequest, NextResponse } from 'next/server'

// Mock folder data for development
const mockFolders = [
  {
    id: 'folder-001',
    name: 'Kontrakt',
    description: 'Alla flyttkontrakt och avtal',
    parentId: null,
    path: '/Kontrakt',
    color: '#3B82F6',
    icon: 'FileText',
    documentCount: 8,
    totalSize: 4096000,
    createdBy: 'admin',
    permissions: {
      canView: ['admin', 'manager'],
      canEdit: ['admin'],
      canDelete: ['admin']
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01')
  },
  {
    id: 'folder-002',
    name: 'Offerter',
    description: 'Offerter och prislistor',
    parentId: null,
    path: '/Offerter',
    color: '#F59E0B',
    icon: 'Calculator',
    documentCount: 15,
    totalSize: 2048000,
    createdBy: 'admin',
    permissions: {
      canView: ['admin', 'manager', 'sales'],
      canEdit: ['admin', 'manager'],
      canDelete: ['admin']
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-20')
  },
  {
    id: 'folder-003',
    name: 'Foton',
    description: 'Bilder från uppdrag och skadedokumentation',
    parentId: null,
    path: '/Foton',
    color: '#10B981',
    icon: 'Camera',
    documentCount: 24,
    totalSize: 12288000,
    createdBy: 'admin',
    permissions: {
      canView: ['admin', 'manager', 'staff'],
      canEdit: ['admin', 'manager'],
      canDelete: ['admin']
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-28')
  },
  {
    id: 'folder-004',
    name: 'Försäkring',
    description: 'Försäkringsdokument och policies',
    parentId: null,
    path: '/Försäkring',
    color: '#EF4444',
    icon: 'Shield',
    documentCount: 3,
    totalSize: 1536000,
    createdBy: 'admin',
    permissions: {
      canView: ['admin', 'manager'],
      canEdit: ['admin'],
      canDelete: ['admin']
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: 'folder-005',
    name: 'Fakturor',
    description: 'Fakturor och ekonomiska dokument',
    parentId: null,
    path: '/Fakturor',
    color: '#8B5CF6',
    icon: 'Receipt',
    documentCount: 32,
    totalSize: 8192000,
    createdBy: 'admin',
    permissions: {
      canView: ['admin', 'manager', 'accounting'],
      canEdit: ['admin', 'accounting'],
      canDelete: ['admin']
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-30')
  },
  {
    id: 'folder-006',
    name: '2025',
    description: 'Kontrakt från 2025',
    parentId: 'folder-001',
    path: '/Kontrakt/2025',
    color: '#3B82F6',
    icon: 'Calendar',
    documentCount: 5,
    totalSize: 2048000,
    createdBy: 'admin',
    permissions: {
      canView: ['admin', 'manager'],
      canEdit: ['admin'],
      canDelete: ['admin']
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-25')
  },
  {
    id: 'folder-007',
    name: 'Företag',
    description: 'Offerter för företagskunder',
    parentId: 'folder-002',
    path: '/Offerter/Företag',
    color: '#F59E0B',
    icon: 'Building',
    documentCount: 7,
    totalSize: 1024000,
    createdBy: 'admin',
    permissions: {
      canView: ['admin', 'manager', 'sales'],
      canEdit: ['admin', 'manager'],
      canDelete: ['admin']
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-20')
  },
  {
    id: 'folder-008',
    name: 'Innan flytt',
    description: 'Foton tagna innan flyttar',
    parentId: 'folder-003',
    path: '/Foton/Innan flytt',
    color: '#10B981',
    icon: 'ImageIcon',
    documentCount: 12,
    totalSize: 6144000,
    createdBy: 'admin',
    permissions: {
      canView: ['admin', 'manager', 'staff'],
      canEdit: ['admin', 'manager'],
      canDelete: ['admin']
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-28')
  }
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const parentId = searchParams.get('parentId')
    const includeChildren = searchParams.get('includeChildren') === 'true'
    
    let filteredFolders = [...mockFolders]
    
    // Apply parent filter
    if (parentId !== null) {
      filteredFolders = filteredFolders.filter(folder => folder.parentId === parentId)
    }
    
    // Build folder tree if requested
    const buildFolderTree = (folders: typeof mockFolders, parentId: string | null = null): any[] => {
      return folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          ...folder,
          children: includeChildren ? buildFolderTree(folders, folder.id) : []
        }))
    }
    
    const result = includeChildren 
      ? { folders: buildFolderTree(mockFolders), tree: true }
      : { folders: filteredFolders, tree: false }
    
    // Calculate statistics
    const stats = {
      totalFolders: mockFolders.length,
      rootFolders: mockFolders.filter(f => !f.parentId).length,
      totalDocuments: mockFolders.reduce((sum, folder) => sum + folder.documentCount, 0),
      totalSize: mockFolders.reduce((sum, folder) => sum + folder.totalSize, 0),
      averageDocumentsPerFolder: mockFolders.length > 0 
        ? mockFolders.reduce((sum, folder) => sum + folder.documentCount, 0) / mockFolders.length 
        : 0
    }
    
    return NextResponse.json({
      ...result,
      stats
    })
    
  } catch (error) {
    console.error('Unexpected error in folders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, parentId, color, icon } = body
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }
    
    // Check if folder name already exists in the same parent
    const existingFolder = mockFolders.find(
      folder => folder.name === name && folder.parentId === (parentId || null)
    )
    
    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 409 }
      )
    }
    
    // Build path
    let path = `/${name}`
    if (parentId) {
      const parentFolder = mockFolders.find(f => f.id === parentId)
      if (parentFolder) {
        path = `${parentFolder.path}/${name}`
      }
    }
    
    // Create new folder
    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      description: description || '',
      parentId: parentId || null,
      path,
      color: color || '#6B7280',
      icon: icon || 'Folder',
      documentCount: 0,
      totalSize: 0,
      createdBy: 'admin',
      permissions: {
        canView: ['admin', 'manager'],
        canEdit: ['admin'],
        canDelete: ['admin']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // In real implementation, this would save to database
    mockFolders.push(newFolder)
    
    return NextResponse.json(newFolder, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in folder creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}