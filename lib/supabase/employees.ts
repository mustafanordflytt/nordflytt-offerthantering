import { createClient } from '@supabase/supabase-js'
import { Employee, Contract, Asset, OnboardingStep } from '@/types/employee'

// Use existing Supabase instance or create new one
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create client lazily to avoid errors in client-side code
function getSupabaseClient() {
  // I utvecklingsmiljö, ge bättre felmeddelande
  if (!supabaseUrl || !supabaseServiceKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase miljövariabler saknas. Kontrollera att .env.development.local innehåller NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY')
    }
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Employee CRUD operations
export async function getAllEmployees() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      employee_skills (skill_name, proficiency_level),
      employee_contracts (id, status, contract_type),
      employee_assets (id, status)
    `)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function getEmployeeById(idOrStaffId: string) {
  const supabase = getSupabaseClient()
  
  // Check if it's a UUID (36 characters with dashes) or staff_id (e.g., "staff-009")
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrStaffId)
  
  let query = supabase
    .from('employees')
    .select(`
      *,
      employee_skills (*),
      employee_contracts (*),
      employee_assets (*),
      employee_onboarding (*),
      employee_vehicle_access (*),
      employee_time_reports (*)
    `)
  
  // Query by id if UUID, otherwise by staff_id
  if (isUUID) {
    query = query.eq('id', idOrStaffId)
  } else {
    query = query.eq('staff_id', idOrStaffId)
  }
  
  const { data, error } = await query.single()

  if (error) throw error
  return data
}

export async function createEmployee(employeeData: Partial<Employee>) {
  const supabase = getSupabaseClient()
  // Generate staff ID
  const { data: lastEmployee } = await supabase
    .from('employees')
    .select('staff_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const lastNumber = lastEmployee ? parseInt(lastEmployee.staff_id.split('-')[1]) : 0
  const newStaffId = `staff-${(lastNumber + 1).toString().padStart(3, '0')}`

  const { data, error } = await supabase
    .from('employees')
    .insert({
      ...employeeData,
      staff_id: newStaffId
    })
    .select()
    .single()

  if (error) throw error

  // Create default onboarding steps
  if (data) {
    await createDefaultOnboardingSteps(data.id)
  }

  return data
}

export async function updateEmployee(idOrStaffId: string, updates: Partial<Employee>) {
  const supabase = getSupabaseClient()
  
  // Check if it's a UUID or staff_id
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrStaffId)
  
  let query = supabase
    .from('employees')
    .update(updates)
  
  // Query by id if UUID, otherwise by staff_id
  if (isUUID) {
    query = query.eq('id', idOrStaffId)
  } else {
    query = query.eq('staff_id', idOrStaffId)
  }
  
  const { data, error } = await query.select().single()

  if (error) throw error
  return data
}

// Contract operations
export async function createContract(contractData: Partial<Contract>) {
  const supabase = getSupabaseClient()
  // Generate contract number
  const contractNumber = `NF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

  const { data, error } = await supabase
    .from('employee_contracts')
    .insert({
      ...contractData,
      contract_number: contractNumber
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContract(id: string, updates: Partial<Contract>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employee_contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Asset operations
export async function createAsset(assetData: Partial<Asset>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employee_assets')
    .insert(assetData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createMultipleAssets(assets: Partial<Asset>[]) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employee_assets')
    .insert(assets)
    .select()

  if (error) throw error
  return data
}

export async function updateAsset(id: string, updates: Partial<Asset>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employee_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Onboarding operations
export async function createDefaultOnboardingSteps(employeeId: string) {
  const defaultSteps = [
    {
      employee_id: employeeId,
      step_id: 'contract',
      step_name: 'Anställningsavtal',
      step_type: 'document',
      description: 'Signera anställningsavtal'
    },
    {
      employee_id: employeeId,
      step_id: 'assets',
      step_name: 'Arbetskläder & Utrustning',
      step_type: 'equipment',
      description: 'Hämta ut arbetskläder och utrustning'
    },
    {
      employee_id: employeeId,
      step_id: 'vehicle',
      step_name: 'Fordonsåtkomst',
      step_type: 'access',
      description: 'Aktivera åtkomst till företagsfordon'
    },
    {
      employee_id: employeeId,
      step_id: 'safety',
      step_name: 'Säkerhetsutbildning',
      step_type: 'training',
      description: 'Genomför obligatorisk säkerhetsutbildning'
    },
    {
      employee_id: employeeId,
      step_id: 'staffapp',
      step_name: 'Staff App',
      step_type: 'access',
      description: 'Installera och konfigurera Staff App'
    }
  ]

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('employee_onboarding')
    .insert(defaultSteps)

  if (error) throw error
}

export async function updateOnboardingStep(id: string, updates: Partial<OnboardingStep>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employee_onboarding')
    .update({
      ...updates,
      completed_date: updates.is_completed ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Vehicle access operations
export async function createVehicleAccess(employeeId: string) {
  const supabase = getSupabaseClient()
  // Generate unique 6-digit code
  const personalCode = Math.floor(100000 + Math.random() * 900000).toString()
  
  const expiryDate = new Date()
  expiryDate.setMonth(expiryDate.getMonth() + 6)

  const { data, error } = await supabase
    .from('employee_vehicle_access')
    .insert({
      employee_id: employeeId,
      personal_code: personalCode,
      issued_date: new Date().toISOString(),
      expiry_date: expiryDate.toISOString(),
      authorized_vehicles: ['KeyGarage-787']
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Time report operations
export async function getEmployeeTimeReports(employeeId: string, startDate?: Date, endDate?: Date) {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('employee_time_reports')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate.toISOString())
  }
  if (endDate) {
    query = query.lte('date', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Search and filter
export async function searchEmployees(searchTerm: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    .eq('is_active', true)

  if (error) throw error
  return data
}

export async function getEmployeesByDepartment(department: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('department', department)
    .eq('is_active', true)

  if (error) throw error
  return data
}

export async function getEmployeesByStatus(status: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('status', status)
    .eq('is_active', true)

  if (error) throw error
  return data
}