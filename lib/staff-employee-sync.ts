// Staff-till-CRM synkronisering
import { supabase } from './supabase'

export interface StaffEmployee {
  id: string
  email: string
  name: string
  role: string
  department?: string
  phone?: string
  employee_id?: string // CRM employee ID
}

// Hämta anställd från CRM baserat på email
export async function getEmployeeByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('anstallda_extended')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      console.error('Error fetching employee:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getEmployeeByEmail:', error)
    return null
  }
}

// Skapa eller uppdatera staff-session med CRM-koppling
export async function createStaffSession(email: string, password?: string): Promise<StaffEmployee | null> {
  try {
    // Hämta anställd från CRM
    const employee = await getEmployeeByEmail(email)
    
    if (!employee) {
      console.error('No employee found with email:', email)
      return null
    }
    
    // Skapa staff session
    const staffSession: StaffEmployee = {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role || 'Flyttare',
      department: employee.department,
      phone: employee.phone,
      employee_id: employee.id // Viktigt! CRM employee ID
    }
    
    // Spara i localStorage för nu (kan bytas till säkrare metod senare)
    localStorage.setItem('staff_auth', JSON.stringify({
      ...staffSession,
      loginTime: new Date().toISOString()
    }))
    
    return staffSession
  } catch (error) {
    console.error('Error creating staff session:', error)
    return null
  }
}

// Logga arbetstid i CRM
export async function logWorkTime(timeEntry: {
  jobId: string
  bookingNumber: string
  customerName: string
  serviceType: string
  startTime: Date
  endTime?: Date
  startGPS?: { lat: number; lng: number; address?: string }
  endGPS?: { lat: number; lng: number; address?: string }
  status: 'active' | 'completed' | 'paused' | 'cancelled'
}) {
  try {
    // Hämta staff auth
    const authData = localStorage.getItem('staff_auth')
    if (!authData) {
      throw new Error('No staff auth found')
    }
    
    const staff = JSON.parse(authData)
    if (!staff.employee_id) {
      throw new Error('No employee_id in staff auth')
    }
    
    // Beräkna duration om slutfört
    let duration_minutes = null
    if (timeEntry.endTime && timeEntry.startTime) {
      duration_minutes = Math.round(
        (timeEntry.endTime.getTime() - timeEntry.startTime.getTime()) / 1000 / 60
      )
    }
    
    // Skapa eller uppdatera tidsrapport
    const timeReport = {
      employee_id: staff.employee_id,
      employee_name: staff.name,
      job_id: timeEntry.jobId,
      booking_number: timeEntry.bookingNumber,
      customer_name: timeEntry.customerName,
      service_type: timeEntry.serviceType,
      start_time: timeEntry.startTime.toISOString(),
      end_time: timeEntry.endTime?.toISOString() || null,
      duration_minutes,
      start_gps: timeEntry.startGPS || {},
      end_gps: timeEntry.endGPS || {},
      start_address: timeEntry.startGPS?.address || '',
      end_address: timeEntry.endGPS?.address || '',
      status: timeEntry.status
    }
    
    // Kolla om det finns en aktiv rapport för detta jobb
    const { data: existingReport } = await supabase
      .from('staff_timereports')
      .select('id')
      .eq('employee_id', staff.employee_id)
      .eq('job_id', timeEntry.jobId)
      .eq('status', 'active')
      .single()
    
    if (existingReport && timeEntry.status === 'completed') {
      // Uppdatera befintlig rapport
      const { data, error } = await supabase
        .from('staff_timereports')
        .update({
          end_time: timeReport.end_time,
          duration_minutes: timeReport.duration_minutes,
          end_gps: timeReport.end_gps,
          end_address: timeReport.end_address,
          status: timeReport.status
        })
        .eq('id', existingReport.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } else if (!existingReport && timeEntry.status === 'active') {
      // Skapa ny rapport
      const { data, error } = await supabase
        .from('staff_timereports')
        .insert([timeReport])
        .select()
        .single()
      
      if (error) throw error
      return data
    }
    
    return null
  } catch (error) {
    console.error('Error logging work time:', error)
    throw error
  }
}

// Hämta arbetstid för en anställd
export async function getEmployeeWorkTime(employeeId: string, startDate?: Date, endDate?: Date) {
  try {
    let query = supabase
      .from('staff_timereports')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_time', { ascending: false })
    
    if (startDate) {
      query = query.gte('start_time', startDate.toISOString())
    }
    
    if (endDate) {
      query = query.lte('start_time', endDate.toISOString())
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching employee work time:', error)
    return []
  }
}

// Hämta dagens arbetstid för en anställd
export async function getTodaysWorkTime(employeeId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return getEmployeeWorkTime(employeeId, today, tomorrow)
}

// Hämta aktiva arbeten för alla anställda (för CRM dashboard)
export async function getActiveWork() {
  try {
    const { data, error } = await supabase
      .from('active_staff_work')
      .select('*')
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching active work:', error)
    return []
  }
}