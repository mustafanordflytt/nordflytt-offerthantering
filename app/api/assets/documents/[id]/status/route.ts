import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Hämta dokument metadata från fil
    const metadataPath = path.join(process.cwd(), 'public', 'generated-documents', `${id}-metadata.json`)
    
    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json(
        { error: 'Dokument hittades inte' },
        { status: 404 }
      )
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    
    // Returnera dokumentstatus
    return NextResponse.json({
      id: metadata.id,
      status: metadata.status,
      employeeName: metadata.employeeName,
      employeeEmail: metadata.employeeEmail,
      createdAt: metadata.createdAt,
      sentAt: metadata.sentAt,
      signedAt: metadata.signedAt,
      signingData: metadata.signingData,
      totalItems: metadata.totalItems,
      totalCost: metadata.totalCost
    })
    
  } catch (error) {
    console.error('Fel vid hämtning av dokumentstatus:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta dokumentstatus' },
      { status: 500 }
    )
  }
}