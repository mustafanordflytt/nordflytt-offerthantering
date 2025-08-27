// Database operations for staff app
import { supabaseAdmin, withErrorHandling } from './supabase-client'
import type { Database } from '@/types/supabase'

type Job = Database['public']['Tables']['jobs']['Row']
type Customer = Database['public']['Tables']['customers']['Row']
type Employee = Database['public']['Tables']['employees']['Row']

export interface StaffJob {
  id: string
  title: string
  customer: {
    name: string
    address: string
    phone: string
    email?: string
  }
  time: {
    start: string
    end: string
    estimatedDuration: number
  }
  location: {
    from: string
    to: string
    distance?: number
  }
  team: string[]
  services: Array<{
    id: string
    name: string
    price: number
    selected: boolean
  }>
  notes?: string
  status: 'upcoming' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  estimatedValue: number
  actualValue?: number
  photos?: string[]
  completedAt?: string
  lastUpdated: number
}

// Get jobs for a specific date and staff member
export async function getStaffJobs(
  staffId?: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<StaffJob[]> {
  return withErrorHandling(async () => {
    // Get jobs for the specified date
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        customers (
          name,
          phone,
          email,
          address
        )
      `)
      .gte('created_at', `${date}T00:00:00.000Z`)
      .lte('created_at', `${date}T23:59:59.999Z`)
      .order('created_at', { ascending: true })

    if (jobsError) throw jobsError

    // Transform to staff job format
    const staffJobs: StaffJob[] = jobs?.map(job => ({
      id: job.id,
      title: job.title || `Flytt ${job.customer_id}`,
      customer: {
        name: job.customers?.name || 'Okänd kund',
        address: job.customers?.address || job.pickup_address || 'Okänd adress',
        phone: job.customers?.phone || '',
        email: job.customers?.email
      },
      time: {
        start: job.start_time || '08:00',
        end: job.end_time || '17:00',
        estimatedDuration: job.estimated_duration || 480 // 8 hours default
      },
      location: {
        from: job.pickup_address || '',
        to: job.delivery_address || '',
        distance: job.distance
      },
      team: job.assigned_team || ['Okänd'],
      services: job.additional_services || [],
      notes: job.notes,
      status: mapJobStatus(job.status || 'pending'),
      priority: 'medium',
      estimatedValue: job.estimated_price || 0,
      actualValue: job.final_price,
      photos: job.photos || [],
      completedAt: job.completed_at,
      lastUpdated: Date.now()
    })) || []

    return { data: staffJobs, error: null }
  }, 'getStaffJobs')
}

// Update job status
export async function updateJobStatus(
  jobId: string,
  status: 'upcoming' | 'in_progress' | 'completed',
  updatedBy?: string
): Promise<void> {
  return withErrorHandling(async () => {
    const dbStatus = status === 'in_progress' ? 'active' : 
                   status === 'completed' ? 'completed' : 'pending'
    
    const updateData: any = {
      status: dbStatus,
      updated_at: new Date().toISOString()
    }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }
    
    if (updatedBy) {
      updateData.updated_by = updatedBy
    }

    const { error } = await supabaseAdmin
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)

    return { data: null, error }
  }, 'updateJobStatus')
}

// Add service to job
export async function addServiceToJob(
  jobId: string,
  service: {
    name: string
    price: number
    quantity?: number
    description?: string
  },
  updatedBy?: string
): Promise<void> {
  return withErrorHandling(async () => {
    // Get current services
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('additional_services')
      .eq('id', jobId)
      .single()

    if (fetchError) throw fetchError

    const currentServices = job?.additional_services || []
    const newService = {
      id: `service_${Date.now()}`,
      name: service.name,
      price: service.price,
      quantity: service.quantity || 1,
      description: service.description,
      added_at: new Date().toISOString(),
      added_by: updatedBy
    }

    const updatedServices = [...currentServices, newService]

    const { error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        additional_services: updatedServices,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('id', jobId)

    return { data: null, error: updateError }
  }, 'addServiceToJob')
}

// Add photos to job
export async function addPhotosToJob(
  jobId: string,
  photoUrls: string[],
  uploadedBy?: string
): Promise<void> {
  return withErrorHandling(async () => {
    // Get current photos
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('photos')
      .eq('id', jobId)
      .single()

    if (fetchError) throw fetchError

    const currentPhotos = job?.photos || []
    const newPhotos = photoUrls.map(url => ({
      url,
      uploaded_at: new Date().toISOString(),
      uploaded_by: uploadedBy
    }))

    const updatedPhotos = [...currentPhotos, ...newPhotos]

    const { error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        photos: updatedPhotos,
        updated_at: new Date().toISOString(),
        updated_by: uploadedBy
      })
      .eq('id', jobId)

    return { data: null, error: updateError }
  }, 'addPhotosToJob')
}

// Get employee by email
export async function getEmployeeByEmail(email: string): Promise<Employee | null> {
  return withErrorHandling(async () => {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('email', email)
      .single()

    return { data, error }
  }, 'getEmployeeByEmail')
}

// Helper function to map database status to staff app status
function mapJobStatus(dbStatus: string): 'upcoming' | 'in_progress' | 'completed' {
  switch (dbStatus) {
    case 'active':
    case 'in_progress':
      return 'in_progress'
    case 'completed':
    case 'done':
      return 'completed'
    default:
      return 'upcoming'
  }
}

// Create demo data if database is empty
export async function seedDemoData(): Promise<void> {
  try {
    // Check if we already have jobs
    const { data: existingJobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .limit(1)

    if (existingJobs && existingJobs.length > 0) {
      console.log('Demo data already exists, skipping seed')
      return
    }

    // Create demo customer
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        name: 'Demo Kund AB',
        email: 'demo@example.com',
        phone: '+46701234567',
        address: 'Demovägen 123, Stockholm'
      })
      .select()
      .single()

    if (customerError) {
      console.error('Error creating demo customer:', customerError)
      return
    }

    // Create demo job
    const { error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        title: 'Flytt från Stockholm till Göteborg',
        customer_id: customer.id,
        pickup_address: 'Kungsgatan 1, Stockholm',
        delivery_address: 'Avenyn 10, Göteborg',
        start_time: '08:00',
        end_time: '16:00',
        estimated_duration: 480,
        estimated_price: 15000,
        status: 'pending',
        assigned_team: ['Erik Andersson', 'Sofia Lindberg'],
        notes: 'Demo-flytt för testning av staff-appen',
        additional_services: [],
        photos: []
      })

    if (jobError) {
      console.error('Error creating demo job:', jobError)
    } else {
      console.log('Demo data seeded successfully')
    }
  } catch (error) {
    console.error('Error seeding demo data:', error)
  }
}