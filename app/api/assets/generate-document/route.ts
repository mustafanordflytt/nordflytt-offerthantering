import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { employeeId, employeeName, employeeEmail, employeeRole, assets, documentType = 'assets' } = await request.json()

    if (!employeeId || !employeeName || !assets) {
      return NextResponse.json(
        { error: 'Saknar obligatoriska fält: employeeId, employeeName, assets' },
        { status: 400 }
      )
    }

    // Läs template
    const templatePath = path.join(process.cwd(), 'templates', 'assets-document-template.html')
    let template = fs.readFileSync(templatePath, 'utf8')

    // Generera dokument-ID
    const documentId = `ASSETS-${employeeId}-${Date.now()}`
    const issueDate = new Date().toLocaleDateString('sv-SE')
    const generationDate = new Date().toLocaleString('sv-SE')

    // Förbered assets data
    const processedAssets = assets.map((asset: any) => {
      // Konvertera kategori till CSS-klass och visningsnamn
      const categoryMappings: { [key: string]: { class: string, display: string } } = {
        'arbetskläder': { class: 'arbetskladar', display: 'Arbetskläder' },
        'skyddsutrustning': { class: 'skyddsutrustning', display: 'Skyddsutrustning' },
        'verktyg': { class: 'verktyg', display: 'Verktyg & Utrustning' },
        'teknik': { class: 'teknik', display: 'Teknik & Telefon' },
        'fordon': { class: 'fordon', display: 'Fordonsutrustning' }
      }

      const categoryInfo = categoryMappings[asset.category] || { class: 'default', display: asset.category }
      
      // Status-mappningar
      const statusMappings: { [key: string]: string } = {
        'utdelad': 'Utdelad',
        'utdelat': 'Utdelad',
        'på-lager': 'På lager',
        'återlämnad': 'Återlämnad',
        'förlorad': 'Förlorad/Skadad'
      }

      return {
        ...asset,
        name: asset.type || asset.name || 'Okänt',
        categoryClass: categoryInfo.class,
        categoryDisplay: categoryInfo.display,
        statusDisplay: statusMappings[asset.status] || asset.status,
        cost: asset.originalCost || asset.cost || 0,
        size: asset.size || 'One Size',
        quantity: asset.quantity || 1,
        supplier: asset.supplier || 'Nordflytt Lager'
      }
    })

    // Beräkna totaler
    const totalItems = processedAssets.reduce((sum: number, asset: any) => sum + (asset.quantity || 1), 0)
    const totalCost = processedAssets.reduce((sum: number, asset: any) => sum + ((asset.cost || 0) * (asset.quantity || 1)), 0)

    // Skapa Handlebars-liknande ersättningar
    const replacements: { [key: string]: string } = {
      employeeName,
      employeeId,
      employeeEmail: employeeEmail || 'Ej angiven',
      employeeRole: employeeRole || 'Anställd',
      documentId,
      issueDate,
      generationDate,
      totalItems: totalItems.toString(),
      totalCost: `${totalCost.toLocaleString('sv-SE')} kr`,
      // Endast anställd signerar tillgångsdokument
      signingDate: '{{signingDate}}', // Fylls i vid signering
      signingMethod: '{{signingMethod}}' // Fylls i vid signering
    }

    // Ersätt enkla placeholders
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      template = template.replace(regex, value)
    })

    // Hantera assets-loop (förenklad Handlebars-ersättning)
    const assetsHtml = processedAssets.map((asset: any) => `
      <tr>
        <td><strong>${asset.name}</strong><br><small>${asset.type || ''}</small></td>
        <td>
          <span class="category-badge category-${asset.categoryClass}">
            ${asset.categoryDisplay}
          </span>
        </td>
        <td>${asset.size}</td>
        <td>${asset.quantity}st</td>
        <td>${asset.supplier}</td>
        <td><strong>${asset.cost} kr</strong></td>
        <td>${asset.statusDisplay}</td>
      </tr>
    `).join('')

    // Ersätt assets-loop
    template = template.replace(/{{#each assets}}[\s\S]*?{{\/each}}/g, assetsHtml)

    // Spara dokument (i en riktig app skulle detta gå till databas)
    const documentsDir = path.join(process.cwd(), 'public', 'generated-documents')
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true })
    }

    const filename = `${documentId}.html`
    const filepath = path.join(documentsDir, filename)
    fs.writeFileSync(filepath, template)

    // Skapa metadata för dokumentet
    const documentMetadata = {
      id: documentId,
      type: 'assets',
      employeeId,
      employeeName,
      employeeEmail,
      status: 'generated',
      createdAt: new Date().toISOString(),
      htmlPath: `/generated-documents/${filename}`,
      pdfPath: `/generated-documents/${documentId}.pdf`,
      assets: processedAssets,
      totalItems,
      totalCost,
      signingRequirements: {
        employeeName,
        employeeEmail,
        documentId,
        requiresSignature: true
      }
    }

    // I en riktig app skulle detta sparas i databas
    // För demo sparar vi som JSON-fil
    const metadataPath = path.join(documentsDir, `${documentId}-metadata.json`)
    fs.writeFileSync(metadataPath, JSON.stringify(documentMetadata, null, 2))

    return NextResponse.json({
      success: true,
      document: documentMetadata,
      message: 'Tillgångsdokument genererat framgångsrikt'
    })

  } catch (error) {
    console.error('Error generating assets document:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera tillgångsdokument' },
      { status: 500 }
    )
  }
}