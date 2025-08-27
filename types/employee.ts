export interface Employee {
  id: string
  staff_id: string
  name: string
  email: string
  phone?: string
  role: string
  department?: string
  status: 'available' | 'busy' | 'scheduled' | 'off_duty' | 'terminated'
  hire_date: Date
  employment_type: 'full_time' | 'part_time' | 'contract'
  salary?: number
  address?: string
  emergency_contact?: string
  avatar_url?: string
  rating: number
  total_jobs_completed: number
  notes?: string
  created_at: Date
  updated_at: Date
  is_active: boolean
  // Relations
  skills?: EmployeeSkill[]
  contracts?: Contract[]
  assets?: Asset[]
  onboarding?: OnboardingStep[]
  vehicle_access?: VehicleAccess
  time_reports?: TimeReport[]
}

export interface EmployeeSkill {
  id: string
  employee_id: string
  skill_name: string
  proficiency_level: number // 1-5
  created_at: Date
}

export interface Contract {
  id: string
  employee_id: string
  contract_type: 'permanent' | 'fixed_term' | 'trial'
  contract_number: string
  status: 'draft' | 'sent' | 'signed' | 'expired' | 'terminated'
  pdf_url?: string
  sent_date?: Date
  signed_date?: Date
  expiry_date?: Date
  salary: number
  working_hours: number
  vacation_days: number
  probation_months: number
  notice_period_months: number
  additional_terms?: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface Asset {
  id: string
  employee_id: string
  asset_type: 'clothing' | 'equipment' | 'tools' | 'tech'
  asset_name: string
  category?: string
  size?: string
  quantity: number
  original_cost: number
  current_value: number
  status: 'utdelad' | 'återlämnad' | 'förlorad' | 'skadat'
  condition: 'new' | 'good' | 'fair' | 'poor'
  serial_number?: string
  supplier?: string
  distributed_date?: Date
  return_date?: Date
  expected_lifespan_months?: number
  notes?: string
  receipt_pdf_url?: string
  created_at: Date
  updated_at: Date
}

export interface OnboardingStep {
  id: string
  employee_id: string
  step_id: string
  step_name: string
  step_type: 'document' | 'training' | 'equipment' | 'access'
  description?: string
  is_completed: boolean
  completed_date?: Date
  completed_by?: string
  due_date?: Date
  notes?: string
  created_at: Date
}

export interface VehicleAccess {
  id: string
  employee_id: string
  personal_code: string
  access_level: string
  authorized_vehicles: string[]
  issued_date: Date
  expiry_date?: Date
  is_active: boolean
  revoked_date?: Date
  revoked_reason?: string
  created_at: Date
  updated_at: Date
}

export interface TimeReport {
  id: string
  employee_id: string
  job_id?: string
  date: Date
  start_time: string
  end_time: string
  break_minutes: number
  total_hours: number
  overtime_hours: number
  hourly_rate: number
  total_pay: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  approved_by?: string
  approved_date?: Date
  notes?: string
  created_at: Date
}