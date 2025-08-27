// Shared staff data store
// In production, this would be a database

export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  hireDate: Date
  skills: string[]
  currentJobs: string[]
  totalJobsCompleted: number
  rating: number
  notes: string
  avatar: string
  department: string
  address: string
  emergencyContact: string
  salary?: number
  employmentType: string
}

// Use global variable for persistence across module reloads
declare global {
  var staffData: StaffMember[] | undefined
}

// Initial staff data
const initialStaffData: StaffMember[] = [
  {
    id: 'staff-001',
    name: 'Lars Andersson',
    email: 'lars.andersson@nordflytt.se',
    phone: '+46 70 123 45 67',
    role: 'admin',
    status: 'available',
    hireDate: new Date('2020-01-15'),
    skills: ['Projektledning', 'Kundservice', 'Kvalitetssäkring'],
    currentJobs: ['job-001', 'job-005'],
    totalJobsCompleted: 156,
    rating: 4.9,
    notes: 'Erfaren projektledare med expertis inom komplexa flytt',
    avatar: '/placeholder-user.jpg',
    department: 'Ledning',
    address: 'Stockholm',
    emergencyContact: 'Anna Andersson, +46 70 987 65 43',
    salary: 45000,
    employmentType: 'full_time'
  },
  {
    id: 'staff-002',
    name: 'Maria Eriksson',
    email: 'maria.eriksson@nordflytt.se',
    phone: '+46 73 234 56 78',
    role: 'manager',
    status: 'busy',
    hireDate: new Date('2021-03-22'),
    skills: ['Teamledning', 'Schemaläggning', 'Kvalitetskontroll'],
    currentJobs: ['job-002', 'job-003'],
    totalJobsCompleted: 89,
    rating: 4.7,
    notes: 'Stark teamledare med fokus på effektivitet',
    avatar: '/placeholder-user.jpg',
    department: 'Operations',
    address: 'Göteborg',
    emergencyContact: 'Per Eriksson, +46 70 876 54 32',
    salary: 42000,
    employmentType: 'full_time'
  },
  {
    id: 'staff-003',
    name: 'Johan Karlsson',
    email: 'johan.karlsson@nordflytt.se',
    phone: '+46 76 345 67 89',
    role: 'mover',
    status: 'scheduled',
    hireDate: new Date('2022-06-10'),
    skills: ['Tunga lyft', 'Möbelmontering', 'Lastbilskörning'],
    currentJobs: ['job-004'],
    totalJobsCompleted: 234,
    rating: 4.8,
    notes: 'Pålitlig flyttledare med C-kort och lyfttruck-behörighet',
    avatar: '/placeholder-user.jpg',
    department: 'Flyttteam',
    address: 'Malmö',
    emergencyContact: 'Lisa Karlsson, +46 70 765 43 21',
    salary: 38000,
    employmentType: 'full_time'
  },
  {
    id: 'staff-004',
    name: 'Emma Nilsson',
    email: 'emma.nilsson@nordflytt.se',
    phone: '+46 72 456 78 90',
    role: 'customer_service',
    status: 'available',
    hireDate: new Date('2023-01-08'),
    skills: ['Kundservice', 'Problemlösning', 'Språk (EN, DE)'],
    currentJobs: [],
    totalJobsCompleted: 45,
    rating: 4.6,
    notes: 'Ny medarbetare med stark kundservicebakgrund',
    avatar: '/placeholder-user.jpg',
    department: 'Kundtjänst',
    address: 'Uppsala',
    emergencyContact: 'Mikael Nilsson, +46 70 654 32 10',
    salary: 32000,
    employmentType: 'full_time'
  },
  {
    id: 'staff-005',
    name: 'Peter Svensson',
    email: 'peter.svensson@nordflytt.se',
    phone: '+46 74 567 89 01',
    role: 'driver',
    status: 'on_leave',
    hireDate: new Date('2019-09-15'),
    skills: ['Stortransporter', 'Geografikunskap', 'Säkerhetsrutiner'],
    currentJobs: [],
    totalJobsCompleted: 312,
    rating: 4.9,
    notes: 'Senior chaufför med expertis inom långdistanstransporter',
    avatar: '/placeholder-user.jpg',
    department: 'Transport',
    address: 'Örebro',
    emergencyContact: 'Ingrid Svensson, +46 70 543 21 09',
    salary: 40000,
    employmentType: 'full_time'
  },
  {
    id: 'staff-006',
    name: 'Anna Johansson',
    email: 'anna.johansson@nordflytt.se',
    phone: '+46 75 678 90 12',
    role: 'mover',
    status: 'available',
    hireDate: new Date('2022-11-01'),
    skills: ['Packning', 'Inventering', 'Kvalitetssäkring'],
    currentJobs: ['job-006'],
    totalJobsCompleted: 98,
    rating: 4.5,
    notes: 'Noggrann packare med särskild expertis inom ömtåliga föremål',
    avatar: '/placeholder-user.jpg',
    department: 'Flyttteam',
    address: 'Linköping',
    emergencyContact: 'Erik Johansson, +46 70 432 10 98',
    salary: 35000,
    employmentType: 'full_time'
  },
  {
    id: 'staff-007',
    name: 'Mustafa Abdulkarim',
    email: 'mustafa.abdulkarim@hotmail.com',
    phone: '+46 76 789 01 23',
    role: 'flyttpersonal_utan_korkort',
    status: 'available',
    hireDate: new Date('2025-01-01'),
    skills: ['Packning', 'Inventering', 'Fotodokumentation'],
    currentJobs: [],
    totalJobsCompleted: 0,
    rating: 0,
    notes: 'Ny anställd flyttpersonal utan körkort',
    avatar: '/placeholder-user.jpg',
    department: 'Flyttteam',
    address: 'Stockholm',
    emergencyContact: 'Kontakt ej angiven',
    salary: 130 * 160, // 130 kr/h * 160h/mån
    employmentType: 'full_time'
  }
]

// Initialize global staff data if not already set
if (!global.staffData) {
  global.staffData = initialStaffData
}

// Export functions to manage staff data
export const getAllStaff = (): StaffMember[] => {
  return global.staffData!
}

export const getStaffById = (id: string): StaffMember | undefined => {
  return global.staffData!.find(staff => staff.id === id)
}

export const addStaff = (newStaff: Omit<StaffMember, 'id'>): StaffMember => {
  const newId = `staff-${(global.staffData!.length + 1).toString().padStart(3, '0')}`
  const staffMember: StaffMember = {
    id: newId,
    ...newStaff
  }
  global.staffData!.push(staffMember)
  return staffMember
}

export const updateStaff = (id: string, updates: Partial<StaffMember>): StaffMember | undefined => {
  const index = global.staffData!.findIndex(staff => staff.id === id)
  if (index === -1) return undefined
  
  global.staffData![index] = { ...global.staffData![index], ...updates }
  return global.staffData![index]
}

export const deleteStaff = (id: string): boolean => {
  const index = global.staffData!.findIndex(staff => staff.id === id)
  if (index === -1) return false
  
  global.staffData!.splice(index, 1)
  return true
}