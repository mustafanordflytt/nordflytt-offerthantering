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

// Validera signeringsdata
function validateSigningData(data: any, requirements: any) {
  const errors: string[] = []

  // Kontrollera obligatoriska fält
  for (const field of requirements.requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${getFieldDisplayName(field)} är obligatoriskt`)
    }
  }

  // Specifik validering för olika fält
  if (data.clearingNumber && !/^\d{4}$/.test(data.clearingNumber)) {
    errors.push('Clearingnummer måste vara 4 siffror')
  }

  if (data.accountNumber && !/^\d{7,10}$/.test(data.accountNumber.replace(/\s+/g, ''))) {
    errors.push('Kontonummer måste vara 7-10 siffror')
  }

  if (data.clothingSize && !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(data.clothingSize)) {
    errors.push('Ogiltig klädstorlek')
  }

  return errors
}

function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    bank: 'Bank',
    clearingNumber: 'Clearingnummer',
    accountNumber: 'Kontonummer',
    clothingSize: 'Klädstorlek',
    emergencyContact: 'Nödkontakt',
    specialRequests: 'Särskilda önskemål'
  }
  return fieldNames[field] || field
}

// Behandla digital signering av avtal
export async function POST(request: NextRequest) {
  try {
    const { 
      signingToken, 
      signature, 
      bank,
      clearingNumber, 
      accountNumber, 
      clothingSize,
      emergencyContact,
      specialRequests,
      signatureMethod = 'digital'
    } = await request.json()

    if (!signingToken || !signature) {
      return NextResponse.json({ 
        error: 'signingToken och signature krävs' 
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
    const result = findContractByToken(contractsData, signingToken)
    if (!result) {
      return NextResponse.json({ 
        error: 'Avtalet hittades inte eller länken är ogiltig' 
      }, { status: 404 })
    }

    const { employee, contract, employeeId } = result

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

    // Validera signeringsdata
    const signingData = {
      bank,
      clearingNumber,
      accountNumber,
      clothingSize,
      emergencyContact,
      specialRequests
    }

    const validationErrors = validateSigningData(signingData, contractsData.signingRequirements)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Valideringsfel',
        details: validationErrors
      }, { status: 400 })
    }

    // Uppdatera avtal med signeringsdata
    contract.status = 'signed'
    contract.signedDate = new Date().toISOString()
    contract.signatureMethod = signatureMethod
    contract.signingData = {
      signature,
      bank,
      clearingNumber,
      accountNumber,
      clothingSize,
      emergencyContact: emergencyContact || null,
      specialRequests: specialRequests || null,
      signedAt: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }

    // Ta bort signeringstoken (inte längre behövd)
    contract.signingToken = null
    contract.expiryDate = null

    // Uppdatera employee-data med signeringsinfo
    if (clearingNumber && accountNumber) {
      employee.bankDetails = {
        bank,
        clearingNumber,
        accountNumber,
        updatedAt: new Date().toISOString()
      }
    }

    if (clothingSize) {
      employee.clothingSize = clothingSize
    }

    if (emergencyContact) {
      employee.emergencyContact = emergencyContact
    }

    // Spara uppdaterad databas
    const saved = await saveContractsData(contractsData)
    if (!saved) {
      return NextResponse.json({ 
        error: 'Kunde inte spara avtalsdata' 
      }, { status: 500 })
    }

    // Mock-logga signeringen
    console.log(`
      ===========================================
      AVTAL SIGNERAT
      ===========================================
      Anställd: ${employee.name} (${employee.email})
      Avtal-ID: ${contract.id}
      Typ: ${contract.type}
      Signerat: ${contract.signedDate}
      Metod: ${signatureMethod}
      ===========================================
    `)

    return NextResponse.json({
      success: true,
      message: 'Avtal signerat framgångsrikt',
      contractId: contract.id,
      signedDate: contract.signedDate,
      employee: {
        name: employee.name,
        email: employee.email,
        role: employee.role
      }
    })

  } catch (error) {
    console.error('Fel vid signering av avtal:', error)
    return NextResponse.json({ 
      error: 'Serverfel vid signering av avtal',
      details: error instanceof Error ? error.message : 'Okänt fel'
    }, { status: 500 })
  }
}