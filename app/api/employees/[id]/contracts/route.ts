import { NextRequest, NextResponse } from 'next/server'
import { createContract, updateContract } from '@/lib/supabase/employees'
import { sendContractEmail } from '@/lib/email/send-contract'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { generateContractPDF } from '@/lib/pdf/generate-contract'
import { uploadToSupabase } from '@/lib/supabase/storage'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contractType, salary, workingHours, vacationDays, startDate } = body

    // Validate required fields
    if (!contractType || !salary) {
      return NextResponse.json(
        { error: 'Contract type and salary are required' },
        { status: 400 }
      )
    }

    // Generate contract PDF
    const pdfBuffer = await generateContractPDF({
      employeeId: params.id,
      contractType,
      salary,
      workingHours: workingHours || 40,
      vacationDays: vacationDays || 25,
      startDate: startDate || new Date()
    })

    // Upload PDF to Supabase Storage
    const fileName = `contracts/${params.id}-${Date.now()}.pdf`
    const { publicUrl } = await uploadToSupabase({
      bucket: 'employee-documents',
      path: fileName,
      file: pdfBuffer,
      contentType: 'application/pdf'
    })

    // Create contract record
    const contract = await createContract({
      employee_id: params.id,
      contract_type: contractType,
      status: 'draft',
      pdf_url: publicUrl,
      salary,
      working_hours: workingHours || 40,
      vacation_days: vacationDays || 25,
      probation_months: contractType === 'trial' ? 6 : 3,
      notice_period_months: 3,
      additional_terms: body.additionalTerms
    })

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contract created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contractId, action } = body

    if (!contractId || !action) {
      return NextResponse.json(
        { error: 'Contract ID and action are required' },
        { status: 400 }
      )
    }

    let updates: any = {}

    switch (action) {
      case 'send':
        // Get employee details for email
        const { getEmployeeById } = await import('@/lib/supabase/employees')
        const employee = await getEmployeeById(params.id)
        
        if (!employee) {
          return NextResponse.json(
            { error: 'Employee not found' },
            { status: 404 }
          )
        }

        // Get contract details
        const contract = employee.contracts?.find((c: any) => c.id === contractId)
        if (!contract) {
          return NextResponse.json(
            { error: 'Contract not found' },
            { status: 404 }
          )
        }

        // Calculate expiry date (30 days from now)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)

        // Send email
        await sendContractEmail({
          to: employee.email,
          employeeName: employee.name,
          contractNumber: contract.contract_number,
          contractPdfUrl: contract.pdf_url!,
          expiryDate
        })

        updates = {
          status: 'sent',
          sent_date: new Date().toISOString(),
          expiry_date: expiryDate.toISOString()
        }
        break

      case 'sign':
        updates = {
          status: 'signed',
          signed_date: new Date().toISOString()
        }
        break

      case 'expire':
        updates = {
          status: 'expired'
        }
        break

      case 'terminate':
        updates = {
          status: 'terminated'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedContract = await updateContract(contractId, updates)

    return NextResponse.json({
      success: true,
      data: updatedContract,
      message: `Contract ${action} successfully`
    })

  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}