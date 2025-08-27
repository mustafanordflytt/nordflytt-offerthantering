// Centralized demo staff data that can be shared across API routes
export const demoStaffData: Record<string, any> = {
  'staff-001': {
    id: 'staff-001',
    name: 'Lars Andersson',
    email: 'lars.andersson@nordflytt.se',
    phone: '+46 70 123 45 67',
    role: 'admin',
    status: 'available',
    hireDate: '2020-01-15',
    skills: ['Projektledning', 'Kundservice', 'Kvalitetssäkring'],
    currentJobs: 2,
    totalJobsCompleted: 156,
    rating: 4.9,
    department: 'Ledning',
    address: 'Stockholm',
    emergencyContact: { name: 'Anna Andersson', phone: '+46 70 987 65 43', relation: 'Fru' },
    salary: 45000,
    employmentType: 'full_time',
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2025-06-30'),
    certifications: ['Arbetsledare', 'Första Hjälpen', 'Truck-körkort'],
    languages: ['Svenska', 'Engelska', 'Tyska'],
    documents: [
      { name: 'Anställningsavtal', status: 'valid', expiryDate: null },
      { name: 'Truck-körkort', status: 'valid', expiryDate: '2026-01-15' },
      { name: 'Första hjälpen certifikat', status: 'expiring', expiryDate: '2025-03-20' }
    ],
    vacationDays: { total: 25, used: 12, remaining: 13 },
    performance: {
      scores: { leadership: 4.8, technical: 4.5, communication: 4.9, teamwork: 4.7 },
      thisMonth: { completed: 8, rating: 4.9, efficiency: 95 },
      lastMonth: { completed: 12, rating: 4.8, efficiency: 92 },
      thisYear: { completed: 156, rating: 4.9, efficiency: 94 }
    },
    recentJobs: [
      { id: 'job-001', customer: 'Volvo AB', date: '2025-07-01', status: 'completed', rating: 5 },
      { id: 'job-005', customer: 'IKEA Stockholm', date: '2025-06-28', status: 'in_progress', rating: null },
      { id: 'job-012', customer: 'Microsoft Sverige', date: '2025-06-25', status: 'completed', rating: 5 }
    ]
  }
};

// Global array for dynamically created staff
export const dynamicStaffArray: any[] = [
  {
    id: 'staff-001',
    name: 'Lars Andersson',
    email: 'lars.andersson@nordflytt.se',
    phone: '+46 70 123 45 67',
    role: 'admin',
    status: 'available',
    hireDate: '2020-01-15',
    skills: ['Projektledning', 'Kundservice', 'Kvalitetssäkring'],
    currentJobs: 2,
    totalJobsCompleted: 156,
    rating: 4.9,
    department: 'Ledning',
    address: 'Stockholm'
  },
  {
    id: 'staff-002',
    name: 'Maria Eriksson',
    email: 'maria.eriksson@nordflytt.se',
    phone: '+46 73 234 56 78',
    role: 'manager',
    status: 'busy',
    hireDate: '2021-03-22',
    skills: ['Teamledning', 'Schemaläggning', 'Kvalitetskontroll'],
    currentJobs: 2,
    totalJobsCompleted: 89,
    rating: 4.7,
    department: 'Operations',
    address: 'Göteborg'
  },
  {
    id: 'staff-003',
    name: 'Emma Nilsson',
    email: 'emma.nilsson@nordflytt.se',
    phone: '+46 72 456 78 90',
    role: 'customer_service',
    status: 'available',
    hireDate: '2023-01-08',
    skills: ['Kundservice', 'Problemlösning', 'Språk (EN, DE)'],
    currentJobs: 0,
    totalJobsCompleted: 45,
    rating: 4.6,
    department: 'Kundtjänst',
    address: 'Stockholm'
  },
  {
    id: 'staff-004',
    name: 'Peter Svensson',
    email: 'peter.svensson@nordflytt.se',
    phone: '+46 74 567 89 01',
    role: 'driver',
    status: 'scheduled',
    hireDate: '2019-05-10',
    skills: ['C-kort', 'CE-kort', 'Lastbilskörning', 'YKB'],
    currentJobs: 1,
    totalJobsCompleted: 312,
    rating: 4.9,
    department: 'Transport',
    address: 'Uppsala'
  },
  {
    id: 'staff-005',
    name: 'Anna Johansson',
    email: 'anna.johansson@nordflytt.se',
    phone: '+46 75 678 90 12',
    role: 'mover',
    status: 'available',
    hireDate: '2022-08-15',
    skills: ['Tunga lyft', 'Möbelmontering', 'Packteknik'],
    currentJobs: 1,
    totalJobsCompleted: 98,
    rating: 4.5,
    department: 'Flyttteam',
    address: 'Stockholm'
  },
  {
    id: 'staff-006',
    name: 'Mustafa Abdulkarim',
    email: 'mustafa.abdulkarim@hotmail.com',
    phone: '+46 76 789 01 23',
    role: 'flyttpersonal_utan_körkort',
    status: 'available',
    hireDate: '2024-01-01',
    skills: ['Flyttarbete', 'Kundservice', 'Problemlösning'],
    currentJobs: 0,
    totalJobsCompleted: 0,
    rating: 0.0,
    department: 'Flyttteam',
    address: 'Stockholm'
  }
];

// Helper functions
export function getStaffById(id: string) {
  // Check in static data first
  if (demoStaffData[id]) {
    return demoStaffData[id];
  }
  
  // Then check in dynamic array
  return dynamicStaffArray.find(s => s.id === id);
}

export function getAllStaff() {
  return dynamicStaffArray;
}

export function addStaff(staff: any) {
  dynamicStaffArray.push(staff);
  return staff;
}

export function updateStaff(id: string, updates: any) {
  const index = dynamicStaffArray.findIndex(s => s.id === id);
  if (index !== -1) {
    dynamicStaffArray[index] = { ...dynamicStaffArray[index], ...updates };
    return dynamicStaffArray[index];
  }
  return null;
}

export function deleteStaff(id: string) {
  const index = dynamicStaffArray.findIndex(s => s.id === id);
  if (index !== -1) {
    dynamicStaffArray[index].status = 'terminated';
    dynamicStaffArray[index].employmentStatus = 'terminated';
    dynamicStaffArray[index].terminationDate = new Date();
    return true;
  }
  return false;
}