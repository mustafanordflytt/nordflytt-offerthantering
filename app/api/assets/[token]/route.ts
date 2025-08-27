import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Signeringstoken krävs' },
        { status: 400 }
      )
    }

    // Sök efter dokument med matchande token
    const documentsDir = path.join(process.cwd(), 'public', 'generated-documents')
    
    if (!fs.existsSync(documentsDir)) {
      return NextResponse.json(
        { error: 'Dokument hittades inte' },
        { status: 404 }
      )
    }

    // Hitta dokument genom att söka igenom alla metadata-filer
    const files = fs.readdirSync(documentsDir)
    const metadataFiles = files.filter(file => file.endsWith('-metadata.json'))
    
    let foundDocument = null
    let documentData = null

    for (const metadataFile of metadataFiles) {
      const metadataPath = path.join(documentsDir, metadataFile)
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
      
      if (metadata.signingToken === token) {
        foundDocument = metadata
        break
      }
    }

    if (!foundDocument) {
      return NextResponse.json(
        { error: 'Ogiltigt signeringstoken eller dokumentet hittades inte' },
        { status: 404 }
      )
    }

    // Kontrollera om dokumentet redan är signerat
    if (foundDocument.status === 'signed') {
      return NextResponse.json(
        { error: 'Detta dokument har redan signerats' },
        { status: 410 }
      )
    }

    // Kontrollera om signeringslänken har upphört (t.ex. efter 30 dagar)
    const createdAt = new Date(foundDocument.createdAt)
    const expiryDate = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 dagar
    
    if (new Date() > expiryDate) {
      return NextResponse.json(
        { error: 'Signeringslänken har upphört att gälla' },
        { status: 410 }
      )
    }

    // Läs tillgångsdata från HTML-filen eller metadata
    const assets = foundDocument.assets || []

    // Mockad personaldata (i riktig app skulle detta komma från databas)
    const employee = {
      id: foundDocument.employeeId,
      name: foundDocument.employeeName,
      email: foundDocument.employeeEmail || 'okänd@nordflytt.se',
      position: 'Flyttpersonal'
    }

    // Returnera dokumentdata
    return NextResponse.json({
      document: {
        id: foundDocument.id,
        type: foundDocument.type,
        employeeId: foundDocument.employeeId,
        employeeName: foundDocument.employeeName,
        status: foundDocument.status,
        createdAt: foundDocument.createdAt,
        htmlPath: foundDocument.htmlPath,
        totalItems: foundDocument.totalItems,
        totalCost: foundDocument.totalCost,
        signingToken: foundDocument.signingToken
      },
      employee,
      assets
    })

  } catch (error) {
    console.error('Error fetching asset document:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta dokumentdata' },
      { status: 500 }
    )
  }
}