// Client-safe version of employees functions
// This file can be imported in client components without issues

export type EmployeeData = {
  name: string
  email: string
  phone: string
  role: string
  department: string
  hireDate?: string
  skills?: string[]
  notes?: string
  address?: string
  emergencyContact?: string
  salary?: string | number
  employmentType?: string
}

export async function createEmployeeViaAPI(data: EmployeeData) {
  const response = await fetch('/api/employees', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create employee')
  }
  
  return response.json()
}

export async function getEmployeesViaAPI() {
  const response = await fetch('/api/employees')
  
  if (!response.ok) {
    throw new Error('Failed to fetch employees')
  }
  
  return response.json()
}

export async function getEmployeeByIdViaAPI(staffId: string) {
  const response = await fetch(`/api/employees/${staffId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch employee')
  }
  
  return response.json()
}