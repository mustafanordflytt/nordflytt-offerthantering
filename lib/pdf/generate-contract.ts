import { jsPDF } from 'jspdf'
import { getEmployeeById } from '@/lib/supabase/employees'

interface GenerateContractParams {
  employeeId: string
  contractType: 'permanent' | 'fixed_term' | 'trial'
  salary: number
  workingHours: number
  vacationDays: number
  startDate: Date
}

export async function generateContractPDF({
  employeeId,
  contractType,
  salary,
  workingHours,
  vacationDays,
  startDate
}: GenerateContractParams): Promise<Buffer> {
  // Get employee details
  const employee = await getEmployeeById(employeeId)
  if (!employee) {
    throw new Error('Employee not found')
  }

  // Create PDF
  const doc = new jsPDF()
  
  // Add Nordflytt logo/header
  doc.setFontSize(24)
  doc.setTextColor(0, 42, 92) // Nordflytt blue
  doc.text('NORDFLYTT', 105, 20, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('ANSTÄLLNINGSAVTAL', 105, 35, { align: 'center' })
  
  // Contract type
  let contractTypeText = ''
  switch (contractType) {
    case 'permanent':
      contractTypeText = 'Tillsvidareanställning'
      break
    case 'fixed_term':
      contractTypeText = 'Visstidsanställning'
      break
    case 'trial':
      contractTypeText = 'Provanställning'
      break
  }
  
  doc.setFontSize(12)
  doc.text(`Avtalstyp: ${contractTypeText}`, 20, 55)
  
  // Employee information
  doc.setFontSize(14)
  doc.text('ARBETSTAGARE', 20, 70)
  doc.setFontSize(11)
  doc.text(`Namn: ${employee.name}`, 20, 80)
  doc.text(`Personnummer: ${employee.personal_number || 'Ej angivet'}`, 20, 87)
  doc.text(`Adress: ${employee.address || 'Ej angiven'}`, 20, 94)
  doc.text(`E-post: ${employee.email}`, 20, 101)
  doc.text(`Telefon: ${employee.phone}`, 20, 108)
  
  // Employer information
  doc.setFontSize(14)
  doc.text('ARBETSGIVARE', 20, 125)
  doc.setFontSize(11)
  doc.text('Företag: Nordflytt AB', 20, 135)
  doc.text('Organisationsnummer: 556123-4567', 20, 142)
  doc.text('Adress: Industrivägen 10, 123 45 Stockholm', 20, 149)
  
  // Employment terms
  doc.setFontSize(14)
  doc.text('ANSTÄLLNINGSVILLKOR', 20, 165)
  doc.setFontSize(11)
  
  const terms = [
    `Befattning: ${employee.role}`,
    `Anställningens början: ${startDate.toLocaleDateString('sv-SE')}`,
    `Arbetstid: ${workingHours} timmar per vecka`,
    `Lön: ${salary.toLocaleString('sv-SE')} kr per månad`,
    `Semester: ${vacationDays} dagar per år`,
    `Uppsägningstid: 3 månader från båda parter`,
    contractType === 'trial' ? 'Provanställning: 6 månader' : ''
  ].filter(Boolean)
  
  let yPos = 175
  terms.forEach(term => {
    doc.text(`• ${term}`, 25, yPos)
    yPos += 7
  })
  
  // Additional terms
  doc.setFontSize(14)
  doc.text('ÖVRIGA VILLKOR', 20, yPos + 10)
  doc.setFontSize(10)
  
  const additionalTerms = [
    'Arbetstagaren omfattas av kollektivavtal mellan Transportarbetareförbundet och Biltrafikens Arbetsgivareförbund.',
    'Arbetstidsförläggning sker enligt överenskommelse med närmaste chef.',
    'Övertidsersättning utgår enligt kollektivavtal.',
    'Arbetsgivaren tillhandahåller nödvändig arbetsutrustning och skyddskläder.',
    'Detta avtal har upprättats i två exemplar, varav parterna tagit var sitt.'
  ]
  
  yPos += 20
  additionalTerms.forEach(term => {
    const lines = doc.splitTextToSize(term, 170)
    doc.text(lines, 20, yPos)
    yPos += lines.length * 5 + 3
  })
  
  // Signature fields
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(12)
  doc.text('UNDERSKRIFTER', 20, yPos + 20)
  
  // Employee signature
  doc.text('Arbetstagare:', 20, yPos + 35)
  doc.line(20, yPos + 45, 90, yPos + 45)
  doc.setFontSize(10)
  doc.text('Namnförtydligande och datum', 20, yPos + 50)
  
  // Employer signature
  doc.text('Arbetsgivare:', 110, yPos + 35)
  doc.line(110, yPos + 45, 180, yPos + 45)
  doc.text('Namnförtydligande och datum', 110, yPos + 50)
  
  // Convert to buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

// Generate asset receipt PDF
export async function generateAssetReceiptPDF(
  employee: any,
  assets: any[]
): Promise<Buffer> {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(24)
  doc.setTextColor(0, 42, 92)
  doc.text('NORDFLYTT', 105, 20, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('KVITTO - UTLÄMNAD UTRUSTNING', 105, 35, { align: 'center' })
  
  // Date and receipt number
  doc.setFontSize(11)
  doc.text(`Datum: ${new Date().toLocaleDateString('sv-SE')}`, 20, 50)
  doc.text(`Kvittonummer: ${Date.now()}`, 120, 50)
  
  // Employee info
  doc.setFontSize(12)
  doc.text('MOTTAGARE', 20, 65)
  doc.setFontSize(11)
  doc.text(`Namn: ${employee.name}`, 20, 75)
  doc.text(`Anställningsnummer: ${employee.staff_id}`, 20, 82)
  
  // Asset list
  doc.setFontSize(12)
  doc.text('UTLÄMNAD UTRUSTNING', 20, 100)
  
  // Table headers
  let yPos = 110
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Artikel', 20, yPos)
  doc.text('Storlek', 80, yPos)
  doc.text('Antal', 110, yPos)
  doc.text('Värde (kr)', 130, yPos)
  doc.text('Kvitteras', 160, yPos)
  
  doc.setFont(undefined, 'normal')
  doc.line(20, yPos + 2, 190, yPos + 2)
  
  yPos += 10
  let totalValue = 0
  
  assets.forEach(asset => {
    doc.text(asset.asset_name, 20, yPos)
    doc.text(asset.size || '-', 80, yPos)
    doc.text(asset.quantity.toString(), 110, yPos)
    doc.text(asset.original_cost.toLocaleString('sv-SE'), 130, yPos)
    doc.rect(165, yPos - 4, 4, 4) // Checkbox
    
    totalValue += asset.original_cost * asset.quantity
    yPos += 8
  })
  
  // Total
  doc.line(20, yPos, 190, yPos)
  yPos += 8
  doc.setFont(undefined, 'bold')
  doc.text('TOTALT VÄRDE:', 100, yPos)
  doc.text(`${totalValue.toLocaleString('sv-SE')} kr`, 130, yPos)
  
  // Terms
  doc.setFont(undefined, 'normal')
  yPos += 20
  doc.setFontSize(10)
  const terms = [
    'Mottagaren ansvarar för utlämnad utrustning enligt gällande personalhandbok.',
    'Vid avslutad anställning ska all utrustning återlämnas i gott skick.',
    'Förlorad eller skadad utrustning kan komma att debiteras.'
  ]
  
  terms.forEach(term => {
    const lines = doc.splitTextToSize(term, 170)
    doc.text(lines, 20, yPos)
    yPos += lines.length * 5 + 3
  })
  
  // Signatures
  yPos += 15
  doc.text('Utlämnat av:', 20, yPos)
  doc.line(20, yPos + 10, 80, yPos + 10)
  
  doc.text('Mottaget av:', 110, yPos)
  doc.line(110, yPos + 10, 170, yPos + 10)
  
  return Buffer.from(doc.output('arraybuffer'))
}