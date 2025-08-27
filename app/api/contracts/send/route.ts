import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { sendContractEmail } from '@/lib/email'

// Läs fallback-databas
async function getContractsData() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'contracts.json')
    const data = await fs.readFile(dataPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Fel vid läsning av contracts.json:', error)
    return null
  }
}

// Spara uppdaterad databas
async function saveContractsData(data: any) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'contracts.json')
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Fel vid sparande av contracts.json:', error)
    return false
  }
}

// Helper funktion för att få läsbar kontraktstyp
function getContractDisplayName(contractType: string) {
  const displayNames: Record<string, string> = {
    flyttpersonal_utan_korkort: 'Flyttpersonal utan körkort',
    flyttpersonal_b_korkort: 'Flyttpersonal med B-körkort',
    flyttpersonal_c_korkort: 'Flyttpersonal med C-körkort',
    flyttstadning: 'Flyttstädning',
    flytt_stad_utan_korkort: 'Flytt & Städ utan körkort',
    flytt_stad_med_korkort: 'Flytt & Städ med körkort',
    kundtjanst: 'Kundtjänst',
    flyttledare: 'Flyttledare'
  }
  return displayNames[contractType] || contractType.charAt(0).toUpperCase() + contractType.slice(1)
}

// Skicka anställningsavtal för signering
export async function POST(request: NextRequest) {
  try {
    const { employeeId, contractId } = await request.json()

    if (!employeeId || !contractId) {
      return NextResponse.json({ 
        error: 'employeeId och contractId krävs' 
      }, { status: 400 })
    }

    // Hämta data från fallback-databas
    const contractsData = await getContractsData()
    if (!contractsData) {
      return NextResponse.json({ 
        error: 'Kunde inte ladda avtalsdata' 
      }, { status: 500 })
    }

    const employee = contractsData.employees[employeeId]
    if (!employee) {
      return NextResponse.json({ 
        error: 'Anställd hittades inte' 
      }, { status: 404 })
    }

    const contract = employee.contracts?.current
    if (!contract || contract.id !== contractId) {
      return NextResponse.json({ 
        error: 'Avtal hittades inte' 
      }, { status: 404 })
    }

    if (contract.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Avtalet kan endast skickas om det har status "draft"' 
      }, { status: 400 })
    }

    // Generera ny signeringstoken om det inte finns
    if (!contract.signingToken) {
      contract.signingToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    }

    // Uppdatera avtalsstatus
    const expiryDays = contractsData.contractSettings.defaultExpiryDays
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryDays)

    contract.status = 'sent'
    contract.sentDate = new Date().toISOString()
    contract.expiryDate = expiryDate.toISOString()

    // Skapa signeringsurl
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const signingUrl = `${baseUrl}/avtal/signera/${contract.signingToken}`

    // Skicka email via SendGrid
    const emailResult = await sendContractEmail({
      to: employee.email,
      employeeName: employee.name,
      contractType: getContractDisplayName(contract.type),
      hourlyRate: contract.hourlyRate,
      signingUrl: signingUrl,
      expiryDays: expiryDays
    })
    
    if (!emailResult.success) {
      return NextResponse.json({ 
        error: 'Kunde inte skicka email: ' + emailResult.error 
      }, { status: 500 })
    }

    // Spara uppdaterad databas
    const saved = await saveContractsData(contractsData)
    if (!saved) {
      return NextResponse.json({ 
        error: 'Kunde inte spara avtalsdata' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Anställningsavtal skickat till ${employee.email}`,
      signingUrl: signingUrl,
      expiryDate: contract.expiryDate,
      expiryDays: expiryDays,
      emailMessageId: emailResult.messageId
    })

  } catch (error) {
    console.error('Fel vid skickande av avtal:', error)
    return NextResponse.json({ 
      error: 'Serverfel vid skickande av avtal',
      details: error instanceof Error ? error.message : 'Okänt fel'
    }, { status: 500 })
  }
}