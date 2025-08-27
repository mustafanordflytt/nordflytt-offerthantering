import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

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

// Hitta avtal baserat på signeringstoken
function findContractByToken(contractsData: any, token: string) {
  for (const employeeId in contractsData.employees) {
    const employee = contractsData.employees[employeeId]
    const contract = employee.contracts?.current
    
    if (contract && contract.signingToken === token) {
      return {
        employee,
        contract,
        employeeId
      }
    }
  }
  return null
}

// Hämta avtal för signering baserat på token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ 
        error: 'Token saknas' 
      }, { status: 400 })
    }

    // Hämta data från fallback-databas
    const contractsData = await getContractsData()
    if (!contractsData) {
      return NextResponse.json({ 
        error: 'Kunde inte ladda avtalsdata' 
      }, { status: 500 })
    }

    // Hitta avtal baserat på token
    const result = findContractByToken(contractsData, token)
    if (!result) {
      return NextResponse.json({ 
        error: 'Avtalet hittades inte eller länken är ogiltig' 
      }, { status: 404 })
    }

    const { employee, contract } = result

    // Kontrollera att avtalet inte har gått ut
    if (contract.expiryDate && new Date() > new Date(contract.expiryDate)) {
      return NextResponse.json({ 
        error: 'Avtalet har gått ut. Kontakta HR för nytt avtal.' 
      }, { status: 410 })
    }

    // Kontrollera status
    if (contract.status === 'signed') {
      return NextResponse.json({ 
        error: 'Avtalet är redan signerat' 
      }, { status: 400 })
    }

    if (contract.status !== 'sent') {
      return NextResponse.json({ 
        error: 'Avtalet är inte tillgängligt för signering' 
      }, { status: 400 })
    }

    // Hämta avtalstemplate för rolltyp
    const template = contractsData.contractTemplates[contract.type]
    if (!template) {
      return NextResponse.json({ 
        error: 'Avtalstyp hittades inte' 
      }, { status: 404 })
    }

    // Returnera avtalsdata för frontend
    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        type: contract.type,
        hourlyRate: contract.hourlyRate,
        createdDate: contract.createdDate,
        expiryDate: contract.expiryDate,
        pdfUrl: contract.pdfUrl,
        version: contract.version
      },
      employee: {
        name: employee.name,
        email: employee.email,
        role: employee.role
      },
      template: {
        hourlyRate: template.hourlyRate,
        qualityRequirements: template.qualityRequirements
      },
      companyInfo: contractsData.companyInfo,
      signingRequirements: contractsData.signingRequirements
    })

  } catch (error) {
    console.error('Fel vid hämtning av avtal:', error)
    return NextResponse.json({ 
      error: 'Serverfel vid hämtning av avtal',
      details: error instanceof Error ? error.message : 'Okänt fel'
    }, { status: 500 })
  }
}