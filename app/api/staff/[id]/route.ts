import { NextRequest, NextResponse } from 'next/server'
import { getStaffById } from '@/lib/staff-data'
import fs from 'fs'
import path from 'path'

// Helper function to load contract data
async function loadContractData(employeeId: string) {
  try {
    const contractsPath = path.join(process.cwd(), 'data', 'contracts.json')
    if (fs.existsSync(contractsPath)) {
      const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'))
      return contractsData.employees?.[employeeId]?.contracts?.current || null
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
    const { id } = await params
    
    // Get the specific employee
    const employee = getStaffById(id)
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
    
    // Load real contract data if available
    const realContract = await loadContractData(id)
    
    // Determine if this is a new employee (staff-007 and higher are new)
    const isNewEmployee = parseInt(id.replace('staff-', '')) >= 7
    
    // Enhance employee data with additional profile information
    const enhancedEmployee = {
      ...employee,
      // Reset basic stats for new employees
      totalJobsCompleted: isNewEmployee ? 0 : employee.totalJobsCompleted,
      rating: isNewEmployee ? 0 : employee.rating,
      currentJobs: isNewEmployee ? [] : employee.currentJobs,
      // Add contracts - use real contract data if available, otherwise create fallback
      contracts: employee.contracts || (realContract ? { current: realContract } : isNewEmployee ? {} : {
        current: {
          id: `contract-${id}`,
          type: employee.role === 'admin' ? 'ledning' : 'flyttare',
          status: isNewEmployee ? 'draft' : 'signed',
          createdDate: employee.hireDate,
          signedDate: isNewEmployee ? null : employee.hireDate,
          sentDate: null,
          expiryDate: null,
          version: '2024.1',
          signatureMethod: 'bankid',
          pdfUrl: `/contracts/${employee.name.replace(' ', '-').toLowerCase()}-2024.pdf`
        }
      }),
      // Add assets - preserve existing assets or start empty for new employees
      assets: (employee as any).assets || (isNewEmployee ? [] : [
        {
          id: `asset-${id}-001`,
          type: 'tshirt',
          name: 'Nordflytt T-shirt',
          size: 'M',
          quantity: 2,
          assignedDate: employee.hireDate,
          condition: 'new',
          originalCost: 249,
          currentValue: 199,
          status: 'utdelat'
        }
      ]),
      // Add vehicle access - preserve existing access or create default
      vehicleAccess: (employee as any).vehicleAccess || (employee.id === 'staff-007' ? {
        personalCode: Math.floor(100000 + Math.random() * 900000).toString(),
        accessLevel: 'basic',
        status: 'aktiv',
        authorizedVehicles: ['KeyGarage-787'],
        issuedDate: employee.hireDate,
        expiryDate: new Date(new Date(employee.hireDate).getTime() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
        createdBy: 'HR Admin',
        isActive: true
      } : (isNewEmployee ? null : {
        personalCode: Math.floor(100000 + Math.random() * 900000).toString(),
        accessLevel: 'basic',
        authorizedVehicles: ['KeyGarage-787'],
        issuedDate: employee.hireDate,
        expiryDate: new Date(new Date(employee.hireDate).getFullYear() + 1, 11, 31),
        isActive: true
      })),
      // Add onboarding progress - preserve existing progress
      onboardingProgress: (employee as any).onboardingProgress || {
        completedSteps: isNewEmployee ? 0 : 3,
        totalSteps: 8,
        currentStep: isNewEmployee ? 'Välkommen' : 'Säkerhetsutbildning',
        startDate: employee.hireDate,
        expectedCompletion: new Date(new Date(employee.hireDate).getTime() + 30 * 24 * 60 * 60 * 1000)
      },
      // Add access logs - preserve existing logs
      accessLogs: (employee as any).accessLogs || (isNewEmployee ? [] : [
        {
          id: 'log-001',
          action: 'unlock',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          location: 'Lager Stockholm',
          success: true
        },
        {
          id: 'log-002',
          action: 'lock',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          location: 'Lager Stockholm',
          success: true
        }
      ]),
      // Add onboarding steps - preserve existing steps or create default for new employees
      onboardingSteps: (employee as any).onboardingSteps || (isNewEmployee ? [] : [
        {
          id: 'step-001',
          name: 'Säkerhetsutbildning',
          category: 'training',
          completed: isNewEmployee ? false : true,
          completedDate: isNewEmployee ? null : new Date(new Date(employee.hireDate).getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'step-002',
          name: 'Systemtillgång',
          category: 'setup',
          completed: isNewEmployee ? false : true,
          completedDate: isNewEmployee ? null : new Date(new Date(employee.hireDate).getTime() + 14 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'step-003',
          name: 'Fordonsåtkomst',
          category: 'access',
          completed: false,
          completedDate: null
        },
        {
          id: 'step-004',
          name: 'Arbetskläder',
          category: 'assets',
          completed: false,
          completedDate: null
        },
        {
          id: 'step-005',
          name: 'Anställningsavtal',
          category: 'documentation',
          completed: false,
          completedDate: null
        }
      ]),
      // Add performance data - preserve existing performance data
      performance: (employee as any).performance || {
        thisMonth: {
          completed: isNewEmployee ? 0 : 12,
          rating: isNewEmployee ? 0 : 4.6,
          efficiency: isNewEmployee ? 0 : 94
        },
        lastMonth: {
          completed: isNewEmployee ? 0 : 15,
          rating: isNewEmployee ? 0 : 4.8,
          efficiency: isNewEmployee ? 0 : 96
        },
        thisYear: {
          completed: isNewEmployee ? 0 : 156,
          rating: isNewEmployee ? 0 : 4.7,
          efficiency: isNewEmployee ? 0 : 95
        }
      }
    }
    
    return NextResponse.json({ employee: enhancedEmployee })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}