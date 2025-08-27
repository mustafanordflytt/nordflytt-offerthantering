'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAuthHeaders } from '@/lib/auth/token-helper'

// TypeScript Interfaces
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  customerType: 'private' | 'business'
  notes?: string
  createdAt: Date
  updatedAt: Date
  bookingCount: number
  totalValue: number
  lastBooking?: Date
  status: 'active' | 'inactive' | 'blacklisted'
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: 'website' | 'referral' | 'marketing' | 'cold_call' | 'other'
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  priority: 'low' | 'medium' | 'high'
  estimatedValue: number
  expectedCloseDate?: Date
  assignedTo?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  activities: Activity[]
}

export interface Job {
  id: string
  bookingNumber: string
  customerId: string
  customerName: string
  fromAddress: string
  toAddress: string
  moveDate: Date
  moveTime: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assignedStaff: string[]
  estimatedHours: number
  actualHours?: number
  totalPrice: number
  services: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'manager' | 'mover' | 'driver' | 'customer_service'
  status: 'active' | 'inactive' | 'on_leave'
  hireDate: Date
  skills: string[]
  currentJobs: string[]
  totalJobsCompleted: number
  rating: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Issue {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  type: 'bug' | 'feature_request' | 'customer_complaint' | 'system_issue' | 'other'
  reportedBy: string
  assignedTo?: string
  customerId?: string
  jobId?: string
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  comments: Comment[]
}

export interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description?: string
  entityType: 'customer' | 'lead' | 'job' | 'staff'
  entityId: string
  userId: string
  completed: boolean
  dueDate?: Date
  createdAt: Date
}

export interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: Date
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  entityType?: string
  entityId?: string
  createdAt: Date
}

export interface Document {
  id: string
  name: string
  originalName: string
  fileType: string
  fileSize: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  folderId?: string
  folderPath?: string
  category: 'contract' | 'invoice' | 'quote' | 'photo' | 'insurance' | 'other'
  tags: string[]
  description?: string
  uploadedBy: string
  linkedEntityType?: 'customer' | 'job' | 'lead' | 'staff'
  linkedEntityId?: string
  linkedEntityName?: string
  isPublic: boolean
  downloadCount: number
  lastDownloaded?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Folder {
  id: string
  name: string
  description?: string
  parentId?: string
  path: string
  color?: string
  icon?: string
  documentCount: number
  totalSize: number
  createdBy: string
  permissions: {
    canView: string[]
    canEdit: string[]
    canDelete: string[]
  }
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  totalCustomers: number
  totalLeads: number
  activeJobs: number
  completedJobsThisMonth: number
  totalRevenue: number
  revenueThisMonth: number
  conversionRate: number
  avgJobValue: number
  upcomingJobs: Job[]
  recentActivities: Activity[]
  criticalIssues: Issue[]
  notifications: Notification[]
}

// Store Interfaces
interface CustomerStore {
  customers: Customer[]
  selectedCustomer: Customer | null
  isLoading: boolean
  error: string | null
  fetchCustomers: () => Promise<void>
  getCustomer: (id: string) => Customer | undefined
  createCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  setSelectedCustomer: (customer: Customer | null) => void
}

interface LeadStore {
  leads: Lead[]
  selectedLead: Lead | null
  isLoading: boolean
  error: string | null
  fetchLeads: () => Promise<void>
  getLead: (id: string) => Lead | undefined
  createLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'activities'>) => Promise<void>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  convertToCustomer: (leadId: string) => Promise<void>
  setSelectedLead: (lead: Lead | null) => void
}

interface JobStore {
  jobs: Job[]
  selectedJob: Job | null
  isLoading: boolean
  error: string | null
  fetchJobs: () => Promise<void>
  getJob: (id: string) => Job | undefined
  createJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>
  deleteJob: (id: string) => Promise<void>
  setSelectedJob: (job: Job | null) => void
}

interface StaffStore {
  staff: Staff[]
  selectedStaff: Staff | null
  isLoading: boolean
  error: string | null
  fetchStaff: () => Promise<void>
  getStaff: (id: string) => Staff | undefined
  createStaff: (staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>
  deleteStaff: (id: string) => Promise<void>
  setSelectedStaff: (staff: Staff | null) => void
}

interface IssueStore {
  issues: Issue[]
  selectedIssue: Issue | null
  isLoading: boolean
  error: string | null
  fetchIssues: () => Promise<void>
  getIssue: (id: string) => Issue | undefined
  createIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<void>
  updateIssue: (id: string, updates: Partial<Issue>) => Promise<void>
  deleteIssue: (id: string) => Promise<void>
  addComment: (issueId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<void>
  setSelectedIssue: (issue: Issue | null) => void
}

interface ActivityStore {
  activities: Activity[]
  isLoading: boolean
  error: string | null
  fetchActivities: () => Promise<void>
  createActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  getActivitiesForEntity: (entityType: string, entityId: string) => Activity[]
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>
}

interface DashboardStore {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  fetchDashboardStats: () => Promise<void>
}

interface DocumentStore {
  documents: Document[]
  folders: Folder[]
  selectedDocument: Document | null
  selectedFolder: Folder | null
  currentFolderId: string | null
  isLoading: boolean
  error: string | null
  fetchDocuments: (folderId?: string) => Promise<void>
  fetchFolders: () => Promise<void>
  uploadDocument: (file: File, folderId?: string, metadata?: Partial<Document>) => Promise<void>
  createFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt' | 'documentCount' | 'totalSize'>) => Promise<void>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  moveDocument: (documentId: string, newFolderId?: string) => Promise<void>
  downloadDocument: (id: string) => Promise<void>
  searchDocuments: (query: string, filters?: any) => Document[]
  setCurrentFolder: (folderId: string | null) => void
  setSelectedDocument: (document: Document | null) => void
}

interface AuthStore {
  user: { id: string; name: string; email: string; role: string } | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => void
}

// Store Implementations
export const useCustomers = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      selectedCustomer: null,
      isLoading: false,
      error: null,
      
      fetchCustomers: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/crm/customers', {
            headers: await getAuthHeaders()
          })
          if (!response.ok) {
            throw new Error('Failed to fetch customers')
          }
          const data = await response.json()
          set({ customers: data.customers || [], isLoading: false })
        } catch (error) {
          console.error('Error fetching customers:', error)
          set({ error: 'Failed to fetch customers', isLoading: false })
        }
      },
      
      getCustomer: (id: string) => {
        return get().customers.find(customer => customer.id === id)
      },
      
      createCustomer: async (customerData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/crm/customers', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(customerData)
          })
          
          if (!response.ok) {
            throw new Error('Failed to create customer')
          }
          
          const data = await response.json()
          set(state => ({ 
            customers: [...state.customers, data.customer], 
            isLoading: false 
          }))
        } catch (error) {
          console.error('Error creating customer:', error)
          set({ error: 'Failed to create customer', isLoading: false })
        }
      },
      
      updateCustomer: async (id: string, updates) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/crm/customers/${id}`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(updates)
          })
          
          if (!response.ok) {
            throw new Error('Failed to update customer')
          }
          
          const data = await response.json()
          set(state => ({
            customers: state.customers.map(customer =>
              customer.id === id ? { ...customer, ...data.customer } : customer
            ),
            isLoading: false
          }))
        } catch (error) {
          console.error('Error updating customer:', error)
          set({ error: 'Failed to update customer', isLoading: false })
        }
      },
      
      deleteCustomer: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const headers = await getAuthHeaders()
          // Remove Content-Type for DELETE request
          delete (headers as any)['Content-Type']
          
          const response = await fetch(`/api/crm/customers/${id}`, {
            method: 'DELETE',
            headers
          })
          
          if (!response.ok) {
            throw new Error('Failed to delete customer')
          }
          
          set(state => ({
            customers: state.customers.filter(customer => customer.id !== id),
            selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer,
            isLoading: false
          }))
        } catch (error) {
          console.error('Error deleting customer:', error)
          set({ error: 'Failed to delete customer', isLoading: false })
        }
      },
      
      setSelectedCustomer: (customer) => {
        set({ selectedCustomer: customer })
      }
    }),
    {
      name: 'crm-customers',
      partialize: (state) => ({ customers: state.customers })
    }
  )
)

export const useLeads = create<LeadStore>()(
  persist(
    (set, get) => ({
      leads: [],
      selectedLead: null,
      isLoading: false,
      error: null,
      
      fetchLeads: async () => {
        set({ isLoading: true, error: null })
        try {
          const headers = await getAuthHeaders()
          const response = await fetch('/api/crm/leads', { headers })
          if (!response.ok) {
            throw new Error('Failed to fetch leads')
          }
          const data = await response.json()
          // Ensure leads is always an array, even if API returns something unexpected
          const leads = Array.isArray(data.leads) ? data.leads : 
                       Array.isArray(data) ? data : 
                       []
          set({ leads, isLoading: false })
        } catch (error: any) {
          console.error('Error fetching leads:', error)
          set({ error: error.message || 'Failed to fetch leads', isLoading: false, leads: [] })
        }
      },
      
      getLead: (id: string) => {
        return get().leads.find(lead => lead.id === id)
      },
      
      createLead: async (leadData) => {
        set({ isLoading: true, error: null })
        try {
          const newLead: Lead = {
            ...leadData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            activities: []
          }
          set(state => ({ 
            leads: [...state.leads, newLead], 
            isLoading: false 
          }))
        } catch (error) {
          set({ error: 'Failed to create lead', isLoading: false })
        }
      },
      
      updateLead: async (id: string, updates) => {
        set({ isLoading: true, error: null })
        try {
          // Update local state optimistically
          set(state => ({
            leads: state.leads.map(lead =>
              lead.id === id 
                ? { ...lead, ...updates, updatedAt: new Date() }
                : lead
            ),
            isLoading: false
          }))
          
          // Then update backend
          const headers = await getAuthHeaders()
          const response = await fetch(`/api/crm/leads/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
          })
          
          if (!response.ok) {
            throw new Error('Failed to update lead on server')
          }
          
          const data = await response.json()
          
          // Update with server response
          set(state => ({
            leads: state.leads.map(lead =>
              lead.id === id ? { ...lead, ...data.lead } : lead
            )
          }))
          
        } catch (error: any) {
          console.error('Error updating lead:', error)
          
          // Revert optimistic update
          const originalLead = get().leads.find(l => l.id === id)
          if (originalLead) {
            set(state => ({
              leads: state.leads.map(lead =>
                lead.id === id ? originalLead : lead
              ),
              error: 'Failed to update lead',
              isLoading: false
            }))
          }
          
          throw error // Re-throw for UI to handle
        }
      },
      
      deleteLead: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            leads: state.leads.filter(lead => lead.id !== id),
            selectedLead: state.selectedLead?.id === id ? null : state.selectedLead,
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to delete lead', isLoading: false })
        }
      },
      
      convertToCustomer: async (leadId: string) => {
        const lead = get().getLead(leadId)
        if (lead) {
          const customerStore = useCustomers.getState()
          await customerStore.createCustomer({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            address: '',
            customerType: 'private',
            bookingCount: 0,
            totalValue: 0,
            status: 'active'
          })
          await get().deleteLead(leadId)
        }
      },
      
      setSelectedLead: (lead) => {
        set({ selectedLead: lead })
      }
    }),
    {
      name: 'crm-leads',
      partialize: (state) => ({ leads: state.leads })
    }
  )
)

export const useJobs = create<JobStore>()(
  persist(
    (set, get) => ({
      jobs: [],
      selectedJob: null,
      isLoading: false,
      error: null,
      
      fetchJobs: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/crm/bookings')
          if (!response.ok) {
            throw new Error('Failed to fetch jobs')
          }
          const data = await response.json()
          set({ jobs: data.bookings || [], isLoading: false })
        } catch (error) {
          console.error('Error fetching jobs:', error)
          set({ error: 'Failed to fetch jobs', isLoading: false })
        }
      },
      
      getJob: (id: string) => {
        return get().jobs.find(job => job.id === id)
      },
      
      createJob: async (jobData) => {
        set({ isLoading: true, error: null })
        try {
          const newJob: Job = {
            ...jobData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
          set(state => ({ 
            jobs: [...state.jobs, newJob], 
            isLoading: false 
          }))
        } catch (error) {
          set({ error: 'Failed to create job', isLoading: false })
        }
      },
      
      updateJob: async (id: string, updates) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            jobs: state.jobs.map(job =>
              job.id === id 
                ? { ...job, ...updates, updatedAt: new Date() }
                : job
            ),
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to update job', isLoading: false })
        }
      },
      
      deleteJob: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            jobs: state.jobs.filter(job => job.id !== id),
            selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to delete job', isLoading: false })
        }
      },
      
      setSelectedJob: (job) => {
        set({ selectedJob: job })
      }
    }),
    {
      name: 'crm-jobs',
      partialize: (state) => ({ jobs: state.jobs })
    }
  )
)

export const useStaff = create<StaffStore>()(
  persist(
    (set, get) => ({
      staff: [],
      selectedStaff: null,
      isLoading: false,
      error: null,
      
      fetchStaff: async () => {
        set({ isLoading: true, error: null })
        try {
          const headers = getAuthHeaders()
          const response = await fetch('/api/crm/staff', { headers })
          
          if (!response.ok) {
            throw new Error('Failed to fetch staff')
          }
          
          const data = await response.json()
          set({ staff: data.staff || [], isLoading: false })
        } catch (error) {
          console.error('Error fetching staff:', error)
          set({ error: 'Failed to fetch staff', isLoading: false })
        }
      },
      
      getStaff: (id: string) => {
        return get().staff.find(staff => staff.id === id)
      },
      
      createStaff: async (staffData) => {
        set({ isLoading: true, error: null })
        try {
          const headers = getAuthHeaders()
          const response = await fetch('/api/crm/staff', {
            method: 'POST',
            headers,
            body: JSON.stringify(staffData)
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to create staff' }))
            throw new Error(errorData.error || 'Failed to create staff')
          }
          
          const data = await response.json()
          const newStaff = data.staff || data
          
          set(state => ({ 
            staff: [...state.staff, newStaff], 
            isLoading: false 
          }))
        } catch (error) {
          set({ error: 'Failed to create staff', isLoading: false })
        }
      },
      
      updateStaff: async (id: string, updates) => {
        set({ isLoading: true, error: null })
        try {
          const headers = getAuthHeaders()
          const response = await fetch(`/api/crm/staff/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to update staff' }))
            throw new Error(errorData.error || 'Failed to update staff')
          }
          
          const data = await response.json()
          const updatedStaff = data.staff || data
          
          set(state => ({
            staff: state.staff.map(staff =>
              staff.id === id ? updatedStaff : staff
            ),
            isLoading: false
          }))
        } catch (error) {
          console.error('Error updating staff:', error)
          set({ error: 'Failed to update staff', isLoading: false })
          throw error
        }
      },
      
      deleteStaff: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const headers = getAuthHeaders()
          const response = await fetch(`/api/crm/staff/${id}`, {
            method: 'DELETE',
            headers
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to delete staff' }))
            throw new Error(errorData.error || 'Failed to delete staff')
          }
          
          set(state => ({
            staff: state.staff.filter(staff => staff.id !== id),
            selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff,
            isLoading: false
          }))
        } catch (error) {
          console.error('Error deleting staff:', error)
          set({ error: 'Failed to delete staff', isLoading: false })
          throw error
        }
      },
      
      setSelectedStaff: (staff) => {
        set({ selectedStaff: staff })
      }
    }),
    {
      name: 'crm-staff',
      partialize: (state) => ({ staff: state.staff })
    }
  )
)

export const useIssues = create<IssueStore>()(
  persist(
    (set, get) => ({
      issues: [],
      selectedIssue: null,
      isLoading: false,
      error: null,
      
      fetchIssues: async () => {
        set({ isLoading: true, error: null })
        try {
          // TODO: Replace with actual API call
          set({ issues: [], isLoading: false })
        } catch (error) {
          set({ error: 'Failed to fetch issues', isLoading: false })
        }
      },
      
      getIssue: (id: string) => {
        return get().issues.find(issue => issue.id === id)
      },
      
      createIssue: async (issueData) => {
        set({ isLoading: true, error: null })
        try {
          const newIssue: Issue = {
            ...issueData,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            comments: []
          }
          set(state => ({ 
            issues: [...state.issues, newIssue], 
            isLoading: false 
          }))
        } catch (error) {
          set({ error: 'Failed to create issue', isLoading: false })
        }
      },
      
      updateIssue: async (id: string, updates) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            issues: state.issues.map(issue =>
              issue.id === id 
                ? { ...issue, ...updates, updatedAt: new Date() }
                : issue
            ),
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to update issue', isLoading: false })
        }
      },
      
      deleteIssue: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            issues: state.issues.filter(issue => issue.id !== id),
            selectedIssue: state.selectedIssue?.id === id ? null : state.selectedIssue,
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to delete issue', isLoading: false })
        }
      },
      
      addComment: async (issueId: string, commentData) => {
        set({ isLoading: true, error: null })
        try {
          const newComment: Comment = {
            ...commentData,
            id: Date.now().toString(),
            createdAt: new Date()
          }
          set(state => ({
            issues: state.issues.map(issue =>
              issue.id === issueId 
                ? { ...issue, comments: [...issue.comments, newComment], updatedAt: new Date() }
                : issue
            ),
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to add comment', isLoading: false })
        }
      },
      
      setSelectedIssue: (issue) => {
        set({ selectedIssue: issue })
      }
    }),
    {
      name: 'crm-issues',
      partialize: (state) => ({ issues: state.issues })
    }
  )
)

export const useActivities = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],
      isLoading: false,
      error: null,
      
      fetchActivities: async () => {
        set({ isLoading: true, error: null })
        try {
          // TODO: Replace with actual API call
          set({ activities: [], isLoading: false })
        } catch (error) {
          set({ error: 'Failed to fetch activities', isLoading: false })
        }
      },
      
      createActivity: async (activityData) => {
        set({ isLoading: true, error: null })
        try {
          const newActivity: Activity = {
            ...activityData,
            id: Date.now().toString(),
            createdAt: new Date()
          }
          set(state => ({ 
            activities: [...state.activities, newActivity], 
            isLoading: false 
          }))
        } catch (error) {
          set({ error: 'Failed to create activity', isLoading: false })
        }
      },
      
      updateActivity: async (id: string, updates) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            activities: state.activities.map(activity =>
              activity.id === id 
                ? { ...activity, ...updates }
                : activity
            ),
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to update activity', isLoading: false })
        }
      },
      
      deleteActivity: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            activities: state.activities.filter(activity => activity.id !== id),
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to delete activity', isLoading: false })
        }
      },
      
      getActivitiesForEntity: (entityType: string, entityId: string) => {
        return get().activities.filter(
          activity => activity.entityType === entityType && activity.entityId === entityId
        )
      }
    }),
    {
      name: 'crm-activities',
      partialize: (state) => ({ activities: state.activities })
    }
  )
)

export const useNotifications = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      
      fetchNotifications: async () => {
        set({ isLoading: true })
        try {
          // TODO: Replace with actual API call
          const notifications: Notification[] = []
          const unreadCount = notifications.filter(n => !n.read).length
          set({ notifications, unreadCount, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
        }
      },
      
      markAsRead: async (id: string) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }))
      },
      
      markAllAsRead: async () => {
        set(state => ({
          notifications: state.notifications.map(notification => ({ 
            ...notification, 
            read: true 
          })),
          unreadCount: 0
        }))
      },
      
      deleteNotification: async (id: string) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === id)
          const wasUnread = notification && !notification.read
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
          }
        })
      },
      
      createNotification: async (notificationData) => {
        const newNotification: Notification = {
          ...notificationData,
          id: Date.now().toString(),
          createdAt: new Date()
        }
        set(state => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: newNotification.read ? state.unreadCount : state.unreadCount + 1
        }))
      }
    }),
    {
      name: 'crm-notifications',
      partialize: (state) => ({ 
        notifications: state.notifications,
        unreadCount: state.unreadCount 
      })
    }
  )
)

export const useDashboard = create<DashboardStore>((set) => ({
  stats: null,
  isLoading: false,
  error: null,
  
  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/crm/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      const stats = await response.json()
      set({ stats, isLoading: false })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      set({ error: 'Failed to fetch dashboard stats', isLoading: false })
    }
  }
}))

export const useDocuments = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: [],
      folders: [],
      selectedDocument: null,
      selectedFolder: null,
      currentFolderId: null,
      isLoading: false,
      error: null,
      
      fetchDocuments: async (folderId) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/crm/documents${folderId ? `?folderId=${folderId}` : ''}`)
          if (!response.ok) {
            throw new Error('Failed to fetch documents')
          }
          const data = await response.json()
          set({ documents: data.documents || [], isLoading: false })
        } catch (error) {
          console.error('Error fetching documents:', error)
          set({ error: 'Failed to fetch documents', isLoading: false })
        }
      },
      
      fetchFolders: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/crm/documents/folders')
          if (!response.ok) {
            throw new Error('Failed to fetch folders')
          }
          const data = await response.json()
          set({ folders: data.folders || [], isLoading: false })
        } catch (error) {
          console.error('Error fetching folders:', error)
          set({ error: 'Failed to fetch folders', isLoading: false })
        }
      },
      
      uploadDocument: async (file, folderId, metadata) => {
        set({ isLoading: true, error: null })
        try {
          const formData = new FormData()
          formData.append('file', file)
          if (folderId) formData.append('folderId', folderId)
          if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
              if (value !== undefined) {
                formData.append(key, typeof value === 'string' ? value : JSON.stringify(value))
              }
            })
          }

          const response = await fetch('/api/crm/documents/upload', {
            method: 'POST',
            body: formData
          })
          
          if (!response.ok) {
            throw new Error('Failed to upload document')
          }
          
          const newDocument = await response.json()
          set(state => ({ 
            documents: [...state.documents, newDocument], 
            isLoading: false 
          }))
        } catch (error) {
          console.error('Error uploading document:', error)
          set({ error: 'Failed to upload document', isLoading: false })
        }
      },
      
      createFolder: async (folderData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/crm/documents/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(folderData)
          })
          
          if (!response.ok) {
            throw new Error('Failed to create folder')
          }
          
          const newFolder = await response.json()
          set(state => ({ 
            folders: [...state.folders, newFolder], 
            isLoading: false 
          }))
        } catch (error) {
          console.error('Error creating folder:', error)
          set({ error: 'Failed to create folder', isLoading: false })
        }
      },
      
      updateDocument: async (id, updates) => {
        try {
          const response = await fetch(`/api/crm/documents/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          })
          
          if (!response.ok) {
            throw new Error('Failed to update document')
          }
          
          const updatedDocument = await response.json()
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === id ? { ...doc, ...updatedDocument } : doc
            )
          }))
        } catch (error) {
          console.error('Error updating document:', error)
          set({ error: 'Failed to update document' })
        }
      },
      
      deleteDocument: async (id) => {
        try {
          const response = await fetch(`/api/crm/documents/${id}`, {
            method: 'DELETE'
          })
          
          if (!response.ok) {
            throw new Error('Failed to delete document')
          }
          
          set(state => ({
            documents: state.documents.filter(doc => doc.id !== id),
            selectedDocument: state.selectedDocument?.id === id ? null : state.selectedDocument
          }))
        } catch (error) {
          console.error('Error deleting document:', error)
          set({ error: 'Failed to delete document' })
        }
      },
      
      deleteFolder: async (id) => {
        try {
          const response = await fetch(`/api/crm/documents/folders/${id}`, {
            method: 'DELETE'
          })
          
          if (!response.ok) {
            throw new Error('Failed to delete folder')
          }
          
          set(state => ({
            folders: state.folders.filter(folder => folder.id !== id),
            selectedFolder: state.selectedFolder?.id === id ? null : state.selectedFolder
          }))
        } catch (error) {
          console.error('Error deleting folder:', error)
          set({ error: 'Failed to delete folder' })
        }
      },
      
      moveDocument: async (documentId, newFolderId) => {
        try {
          const response = await fetch(`/api/crm/documents/${documentId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderId: newFolderId })
          })
          
          if (!response.ok) {
            throw new Error('Failed to move document')
          }
          
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === documentId ? { ...doc, folderId: newFolderId } : doc
            )
          }))
        } catch (error) {
          console.error('Error moving document:', error)
          set({ error: 'Failed to move document' })
        }
      },
      
      downloadDocument: async (id) => {
        try {
          const response = await fetch(`/api/crm/documents/${id}/download`)
          if (!response.ok) {
            throw new Error('Failed to download document')
          }
          
          const blob = await response.blob()
          const document = get().documents.find(doc => doc.id === id)
          if (document) {
            const url = window.URL.createObjectURL(blob)
            const a = window.document.createElement('a')
            a.href = url
            a.download = document.originalName
            window.document.body.appendChild(a)
            a.click()
            window.document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }
        } catch (error) {
          console.error('Error downloading document:', error)
          set({ error: 'Failed to download document' })
        }
      },
      
      searchDocuments: (query, filters) => {
        const { documents } = get()
        return documents.filter(doc => {
          const matchesQuery = query === '' || 
            doc.name.toLowerCase().includes(query.toLowerCase()) ||
            doc.originalName.toLowerCase().includes(query.toLowerCase()) ||
            doc.description?.toLowerCase().includes(query.toLowerCase()) ||
            doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
            
          const matchesFilters = !filters || Object.entries(filters).every(([key, value]) => {
            if (!value || value === 'all') return true
            if (key === 'fileType') return doc.fileType === value
            if (key === 'category') return doc.category === value
            if (key === 'linkedEntityType') return doc.linkedEntityType === value
            return true
          })
          
          return matchesQuery && matchesFilters
        })
      },
      
      setCurrentFolder: (folderId) => {
        set({ currentFolderId: folderId })
      },
      
      setSelectedDocument: (document) => {
        set({ selectedDocument: document })
      }
    }),
    {
      name: 'crm-documents',
      partialize: (state) => ({ 
        documents: state.documents,
        folders: state.folders
      })
    }
  )
)

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          // Use the new CRM auth service
          const { crmAuth } = await import('@/lib/auth/crm-auth')
          const result = await crmAuth.signIn(email, password)
          
          if (result.success && result.user) {
            const user = {
              id: result.user.id,
              name: result.user.name,
              email: result.user.email,
              role: result.user.role
            }
            set({ user, isAuthenticated: true, isLoading: false })
            return true
          }
          
          set({ isLoading: false })
          return false
        } catch (error) {
          console.error('Store login error:', error)
          set({ isLoading: false })
          return false
        }
      },
      
      logout: async () => {
        try {
          const { crmAuth } = await import('@/lib/auth/crm-auth')
          await crmAuth.signOut()
          set({ user: null, isAuthenticated: false })
        } catch (error) {
          console.error('Store logout error:', error)
          set({ user: null, isAuthenticated: false })
        }
      },
      
      checkAuth: async () => {
        try {
          const { crmAuth } = await import('@/lib/auth/crm-auth')
          const user = crmAuth.getCurrentUser()
          
          if (user) {
            const storeUser = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
            set({ user: storeUser, isAuthenticated: true })
          } else {
            set({ user: null, isAuthenticated: false })
          }
        } catch (error) {
          console.error('Store checkAuth error:', error)
          set({ user: null, isAuthenticated: false })
        }
      }
    }),
    {
      name: 'crm-auth',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)