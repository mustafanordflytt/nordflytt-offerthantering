import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { sendAssetDocumentEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { documentId, employeeEmail, employeeName } = await request.json()

    if (!documentId || !employeeEmail) {
      return NextResponse.json(
        { error: 'Saknar obligatoriska fält: documentId, employeeEmail' },
        { status: 400 }
    )}

    // Läs dokument-metadata
    const documentsDir = path.join(process.cwd(), 'public', 'generated-documents')
    const metadataPath = path.join(documentsDir, `${documentId}-metadata.json`)
    
    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json(
        { error: 'Dokument hittades inte' },
        { status: 404 }
      )
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))

    // Generera signeringslänk
    const signingToken = `sign_${documentId}_${Date.now()}`
    const signingUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/assets/sign/${signingToken}`

    // Uppdatera metadata med signeringstoken
    metadata.status = 'sent'
    metadata.sentAt = new Date().toISOString()
    metadata.signingToken = signingToken
    metadata.signingUrl = signingUrl
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

    // ========================================
    // 📧 SKICKA RIKTIG E-POST MED SENDGRID
    // ========================================
    
    try {
      await sendAssetDocumentEmail({
        to: employeeEmail,
        employeeName: employeeName || 'Anställd',
        totalItems: metadata.totalItems,
        totalCost: `${metadata.totalCost} kr`,
        signingUrl,
        documentId
      })
      
      console.log(`✅ E-post skickad till ${employeeEmail} för dokument ${documentId}`)
      
    } catch (emailError) {
      console.error('❌ E-post kunde inte skickas:', emailError)
      // Om e-post misslyckas, återställ metadata status
      metadata.status = 'generated'
      delete metadata.sentAt
      delete metadata.signingToken
      delete metadata.signingUrl
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
      
      return NextResponse.json({
        error: 'Dokument genererat men e-post kunde inte skickas. Kontrollera e-postinställningar.',
        details: emailError instanceof Error ? emailError.message : 'Okänt e-postfel'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Tillgångsdokument skickat för signering',
      signingUrl,
      sentTo: employeeEmail
    })

  } catch (error) {
    console.error('Error sending assets document:', error)
    return NextResponse.json(
      { error: 'Kunde inte skicka tillgångsdokument' },
      { status: 500 }
    )
  }
}