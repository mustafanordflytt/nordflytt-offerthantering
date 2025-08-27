import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { 
      signingToken, 
      signature, 
      signatureMethod = 'digital',
      employeeName,
      confirmAssets = true
    } = await request.json()

    if (!signingToken || !signature) {
      return NextResponse.json(
        { error: 'Signeringstoken och signatur krävs' },
        { status: 400 }
      )
    }

    // Hitta dokument baserat på signeringstoken
    const documentsDir = path.join(process.cwd(), 'public', 'generated-documents')
    const files = fs.readdirSync(documentsDir)
    
    let documentMetadata = null
    let metadataPath = ''
    
    for (const file of files) {
      if (file.endsWith('-metadata.json')) {
        const filePath = path.join(documentsDir, file)
        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        
        if (metadata.signingToken === signingToken) {
          documentMetadata = metadata
          metadataPath = filePath
          break
        }
      }
    }

    if (!documentMetadata) {
      return NextResponse.json(
        { error: 'Ogiltigt signeringstoken eller dokument hittades inte' },
        { status: 404 }
      )
    }

    // Kontrollera att dokumentet inte redan är signerat
    if (documentMetadata.status === 'signed') {
      return NextResponse.json(
        { error: 'Dokumentet är redan signerat' },
        { status: 400 }
      )
    }

    // Uppdatera dokument med signeringsdata
    const signingDate = new Date().toLocaleString('sv-SE')
    const signingData = {
      signature,
      signatureMethod,
      employeeName: employeeName || documentMetadata.employeeName,
      signedAt: new Date().toISOString(),
      signedDate: signingDate,
      confirmAssets,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }

    documentMetadata.status = 'signed'
    documentMetadata.signingData = signingData
    documentMetadata.signedAt = signingData.signedAt

    // Uppdatera HTML-dokumentet med signeringsdata
    const htmlPath = path.join(process.cwd(), 'public', documentMetadata.htmlPath.substring(1))
    let htmlContent = fs.readFileSync(htmlPath, 'utf8')
    
    // Ersätt placeholders för signering
    htmlContent = htmlContent.replace('{{signingDate}}', signingDate)
    htmlContent = htmlContent.replace('{{signingMethod}}', signatureMethod === 'digital' ? 'Digital signatur' : 'Elektronisk signatur')
    
    // Lägg till signatur-information
    const signatureSection = `
    <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px; border: 1px solid #4caf50;">
      <h4 style="color: #2e7d32; margin: 0 0 10px 0;">✅ Dokument Signerat</h4>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Signerat av:</strong> ${signingData.employeeName}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Datum:</strong> ${signingDate}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Metod:</strong> ${signatureMethod === 'digital' ? 'Digital signatur' : 'Elektronisk signatur'}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Signatur:</strong> <code style="background: white; padding: 2px 4px; border-radius: 3px;">${signature}</code></p>
    </div>`
    
    // Sätt in signaturen innan footer
    htmlContent = htmlContent.replace('<div class="footer">', signatureSection + '\n    <div class="footer">')
    
    fs.writeFileSync(htmlPath, htmlContent)
    fs.writeFileSync(metadataPath, JSON.stringify(documentMetadata, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Tillgångsdokument signerat framgångsrikt',
      document: {
        id: documentMetadata.id,
        status: 'signed',
        signedAt: signingData.signedAt,
        signedBy: signingData.employeeName,
        method: signatureMethod,
        htmlUrl: documentMetadata.htmlPath,
        pdfUrl: documentMetadata.pdfPath
      }
    })

  } catch (error) {
    console.error('Error signing assets document:', error)
    return NextResponse.json(
      { error: 'Kunde inte signera tillgångsdokument' },
      { status: 500 }
    )
  }
}