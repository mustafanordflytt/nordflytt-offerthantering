import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeById, updateEmployee } from '@/lib/supabase/employees'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { getStaffById } from '@/lib/staff-data'
import fs from 'fs'
import path from 'path'

// Helper function to load contract data
async function loadContractData(employeeId: string) {
  try {
    const contractsPath = path.join(process.cwd(), 'data', 'contracts.json')
    if (fs.existsSync(contractsPath)) {
      const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'))
      
      console.log(`Looking for contracts for employee: ${employeeId}`)
      
      // Try to find contract by employee ID (could be staff_id or UUID)
      let contractEmployee = contractsData.employees?.[employeeId];
      
      // If not found by direct ID, search through all employees
      if (!contractEmployee) {
        for (const key in contractsData.employees) {
          const emp = contractsData.employees[key];
          if (emp.id === employeeId) {
            contractEmployee = emp;
            break;
          }
        }
      }
      
      if (contractEmployee) {
        console.log(`Found contract data for ${employeeId}:`, contractEmployee.contracts)
        return contractEmployee.contracts || null
      }
    }
  } catch (error) {
    console.warn('Could not load contract data:', error)
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Kontrollera autentisering om inte i demo-läge
    if (process.env.ENABLE_DEMO_AUTH !== 'true') {
      const authResult = await validateCRMAuth(request)
      if (!authResult.isValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { id } = await params
    let employee = null
    
    try {
      // Try to get from Supabase first
      employee = await getEmployeeById(id)
    } catch (supabaseError: any) {
      // If Supabase fails (not configured), use mock data
      if (supabaseError.message === 'Missing Supabase environment variables') {
        console.log('Supabase not configured, using mock data for employee:', id)
        const mockEmployee = getStaffById(id)
        if (mockEmployee) {
          employee = {
            ...mockEmployee,
            employee_contracts: [],
            employee_assets: [],
            employee_onboarding: [],
            employee_vehicle_access: null,
            employee_time_reports: []
          }
        }
      } else {
        throw supabaseError
      }
    }
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Load real contract data if available
    const contractsData = await loadContractData(id)
    
    // Debug logging
    console.log(`Loading contract for employee ${id}:`, contractsData ? 'Found' : 'Not found')
    
    // If we have contract data from contracts.json, include it
    if (contractsData) {
      employee.contracts = contractsData
      console.log(`Contract data for ${id}:`, contractsData)
    }

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Kontrollera autentisering om inte i demo-läge
    if (process.env.ENABLE_DEMO_AUTH !== 'true') {
      const authResult = await validateCRMAuth(request)
      if (!authResult.isValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { id } = await params
    const body = await request.json()
    
    // Get existing employee first
    const existingEmployee = await getEmployeeById(id)
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Update employee
    const updatedEmployee = await updateEmployee(existingEmployee.id, body)

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    })

  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Kontrollera autentisering om inte i demo-läge
    if (process.env.ENABLE_DEMO_AUTH !== 'true') {
      const authResult = await validateCRMAuth(request)
      if (!authResult.isValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { id } = await params

    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured - simulating delete operation')
      
      // Simulate successful delete in development
      return NextResponse.json({
        success: true,
        message: 'Employee deleted successfully (simulated)',
        warning: 'Detta är en simulerad borttagning - Supabase är inte konfigurerat'
      })
    }

    // Get existing employee first
    const existingEmployee = await getEmployeeById(id)
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Soft delete - just mark as inactive
    await updateEmployee(existingEmployee.id, {
      is_active: false,
      status: 'terminated'
    })

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting employee:', error)
    
    // If it's specifically about missing env vars, handle gracefully
    if (error.message === 'Missing Supabase environment variables') {
      return NextResponse.json({
        success: true,
        message: 'Employee deleted successfully (simulated)',
        warning: 'Detta är en simulerad borttagning - Supabase är inte konfigurerat'
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}