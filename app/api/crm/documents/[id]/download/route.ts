import { NextRequest, NextResponse } from 'next/server'

// Mock document data for download tracking
const mockDocuments = [
  {
    id: 'doc-001',
    name: 'Flyttkontrakt Anna Svensson',
    originalName: 'kontrakt_anna_svensson_2025.pdf',
    fileType: 'pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    url: '/api/files/kontrakt_anna_svensson_2025.pdf',
    downloadCount: 3,
    lastDownloaded: new Date('2025-06-30')
  },
  {
    id: 'doc-002',
    name: 'Offert Erik Johansson AB',
    originalName: 'offert_erik_johansson_ab.pdf',
    fileType: 'pdf',
    fileSize: 512000,
    mimeType: 'application/pdf',
    url: '/api/files/offert_erik_johansson_ab.pdf',
    downloadCount: 1,
    lastDownloaded: new Date('2025-06-29')
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
    
    // In real implementation, you would:
    // 1. Check user permissions
    // 2. Get file from storage (S3, Azure Blob, etc.)
    // 3. Update download count and last downloaded date
    // 4. Log the download activity
    // 5. Stream the file content
    
    // Update download statistics
    document.downloadCount += 1
    document.lastDownloaded = new Date()
    
    // For demo purposes, we'll create a mock PDF content
    const mockPdfContent = createMockPdfContent(document.name)
    
    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Type', document.mimeType)
    headers.set('Content-Disposition', `attachment; filename="${document.originalName}"`)
    headers.set('Content-Length', document.fileSize.toString())
    headers.set('Cache-Control', 'no-cache')
    
    return new NextResponse(mockPdfContent, {
      status: 200,
      headers
    })
    
  } catch (error) {
    console.error('Unexpected error in document download:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to create mock PDF content for demo
function createMockPdfContent(documentName: string): Uint8Array {
  // This is a very basic mock PDF content
  // In a real implementation, you would fetch the actual file from storage
  const pdfHeader = '%PDF-1.4\n'
  const pdfContent = `
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(${documentName}) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000235 00000 n 
0000000329 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
399
%%EOF
`
  
  const fullContent = pdfHeader + pdfContent
  return new TextEncoder().encode(fullContent)
}

// Helper function to track download activity (would be database operation in real app)
function trackDownload(documentId: string, userId: string) {
  // In real implementation:
  // 1. Insert download record into database
  // 2. Update document download count
  // 3. Update last downloaded timestamp
  // 4. Optionally send analytics data
  
  console.log(`Document ${documentId} downloaded by user ${userId}`)
}