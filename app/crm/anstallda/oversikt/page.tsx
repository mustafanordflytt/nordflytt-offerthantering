'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  User, 
  Plus, 
  Search, 
  Filter,
  FileText,
  Package,
  Car,
  Award,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Star,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Activity,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmployeeOverview {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  hireDate: Date
  status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  avatar?: string
  address: string
  emergencyContact: string
  
  // Contract status
  contractStatus: 'signed' | 'pending' | 'expired' | 'draft'
  contractSignedDate?: Date
  contractExpiryDate?: Date
  
  // Assets
  totalAssets: number
  activeAssets: number
  returnedAssets: number
  lostAssets: number
  
  // Vehicle access
  vehicleAccess: boolean
  personalCode?: string
  accessLevel?: 'basic' | 'advanced' | 'admin'
  
  // Onboarding
  onboardingProgress: number
  onboardingSteps: {
    id: string
    name: string
    completed: boolean
    completedDate?: Date
  }[]
  
  // Performance
  totalJobsCompleted: number
  averageRating: number
  customerFeedback: number
  
  // Documents
  documents: {
    id: string
    name: string
    type: 'id' | 'certificate' | 'license' | 'other'
    uploadDate: Date
    expiryDate?: Date
  }[]
  
  // Notes
  notes?: string
  lastUpdated: Date
}

const mockEmployees: EmployeeOverview[] = [
  {
    id: 'staff-001',
    name: 'Lars Andersson',
    email: 'lars.andersson@nordflytt.se',
    phone: '+46 70 123 45 67',
    role: 'admin',
    department: 'Ledning',
    hireDate: new Date('2020-01-15'),
    status: 'active',
    address: 'Stockholm',
    emergencyContact: 'Anna Andersson, +46 70 987 65 43',
    contractStatus: 'signed',
    contractSignedDate: new Date('2024-01-16'),
    contractExpiryDate: new Date('2025-01-15'),
    totalAssets: 8,
    activeAssets: 6,
    returnedAssets: 2,
    lostAssets: 0,
    vehicleAccess: true,
    personalCode: 'LA2401',
    accessLevel: 'admin',
    onboardingProgress: 100,
    onboardingSteps: [
      { id: 'contract', name: 'Avtal signerat', completed: true, completedDate: new Date('2024-01-16') },
      { id: 'assets', name: 'Arbetskläder utdelade', completed: true, completedDate: new Date('2024-01-17') },
      { id: 'vehicle', name: 'Fordonsaccess given', completed: true, completedDate: new Date('2024-01-18') },
      { id: 'app', name: 'Personalapp-inlogg', completed: true, completedDate: new Date('2024-01-19') },
      { id: 'safety', name: 'Säkerhetsutbildning', completed: true, completedDate: new Date('2024-01-20') }
    ],
    totalJobsCompleted: 156,
    averageRating: 4.9,
    customerFeedback: 98,
    documents: [
      { id: 'doc-001', name: 'Körkort', type: 'license', uploadDate: new Date('2024-01-15'), expiryDate: new Date('2029-01-15') },
      { id: 'doc-002', name: 'Legitimation', type: 'id', uploadDate: new Date('2024-01-15'), expiryDate: new Date('2029-01-15') },
      { id: 'doc-003', name: 'Truckcertifikat', type: 'certificate', uploadDate: new Date('2024-01-15'), expiryDate: new Date('2026-01-15') }
    ],
    notes: 'Erfaren projektledare med expertis inom komplexa flytt',
    lastUpdated: new Date('2024-01-20')
  },
  {
    id: 'staff-002',
    name: 'Maria Eriksson',
    email: 'maria.eriksson@nordflytt.se',
    phone: '+46 73 234 56 78',
    role: 'manager',
    department: 'Operations',
    hireDate: new Date('2021-03-22'),
    status: 'active',
    address: 'Göteborg',
    emergencyContact: 'Per Eriksson, +46 70 876 54 32',
    contractStatus: 'signed',
    contractSignedDate: new Date('2024-01-10'),
    totalAssets: 5,
    activeAssets: 4,
    returnedAssets: 1,
    lostAssets: 0,
    vehicleAccess: true,
    personalCode: 'ME2402',
    accessLevel: 'advanced',
    onboardingProgress: 80,
    onboardingSteps: [
      { id: 'contract', name: 'Avtal signerat', completed: true, completedDate: new Date('2024-01-10') },
      { id: 'assets', name: 'Arbetskläder utdelade', completed: true, completedDate: new Date('2024-01-11') },
      { id: 'vehicle', name: 'Fordonsaccess given', completed: true, completedDate: new Date('2024-01-12') },
      { id: 'app', name: 'Personalapp-inlogg', completed: true, completedDate: new Date('2024-01-13') },
      { id: 'safety', name: 'Säkerhetsutbildning', completed: false }
    ],
    totalJobsCompleted: 89,
    averageRating: 4.7,
    customerFeedback: 94,
    documents: [
      { id: 'doc-004', name: 'Körkort', type: 'license', uploadDate: new Date('2024-01-10'), expiryDate: new Date('2028-03-22') },
      { id: 'doc-005', name: 'Legitimation', type: 'id', uploadDate: new Date('2024-01-10') }
    ],
    notes: 'Stark teamledare med fokus på effektivitet',
    lastUpdated: new Date('2024-01-19')
  },
  {
    id: 'staff-003',
    name: 'Johan Karlsson',
    email: 'johan.karlsson@nordflytt.se',
    phone: '+46 76 345 67 89',
    role: 'mover',
    department: 'Flyttteam',
    hireDate: new Date('2022-06-10'),
    status: 'active',
    address: 'Malmö',
    emergencyContact: 'Lisa Karlsson, +46 70 765 43 21',
    contractStatus: 'signed',
    contractSignedDate: new Date('2024-01-10'),
    totalAssets: 12,
    activeAssets: 10,
    returnedAssets: 1,
    lostAssets: 1,
    vehicleAccess: true,
    personalCode: 'JK2403',
    accessLevel: 'basic',
    onboardingProgress: 60,
    onboardingSteps: [
      { id: 'contract', name: 'Avtal signerat', completed: true, completedDate: new Date('2024-01-10') },
      { id: 'assets', name: 'Arbetskläder utdelade', completed: true, completedDate: new Date('2024-01-11') },
      { id: 'vehicle', name: 'Fordonsaccess given', completed: true, completedDate: new Date('2024-01-12') },
      { id: 'app', name: 'Personalapp-inlogg', completed: false },
      { id: 'safety', name: 'Säkerhetsutbildning', completed: false }
    ],
    totalJobsCompleted: 234,
    averageRating: 4.8,
    customerFeedback: 96,
    documents: [
      { id: 'doc-006', name: 'Körkort', type: 'license', uploadDate: new Date('2024-01-08'), expiryDate: new Date('2027-06-10') },
      { id: 'doc-007', name: 'Legitimation', type: 'id', uploadDate: new Date('2024-01-08') }
    ],
    notes: 'Pålitlig flyttledare med C-kort och lyfttruck-behörighet',
    lastUpdated: new Date('2024-01-18')
  },
  {
    id: 'staff-004',
    name: 'Emma Nilsson',
    email: 'emma.nilsson@nordflytt.se',
    phone: '+46 72 456 78 90',
    role: 'customer_service',
    department: 'Kundtjänst',
    hireDate: new Date('2023-01-08'),
    status: 'active',
    address: 'Uppsala',
    emergencyContact: 'Mikael Nilsson, +46 70 654 32 10',
    contractStatus: 'pending',
    totalAssets: 3,
    activeAssets: 3,
    returnedAssets: 0,
    lostAssets: 0,
    vehicleAccess: false,
    onboardingProgress: 40,
    onboardingSteps: [
      { id: 'contract', name: 'Avtal signerat', completed: false },
      { id: 'assets', name: 'Arbetskläder utdelade', completed: true, completedDate: new Date('2024-01-09') },
      { id: 'vehicle', name: 'Fordonsaccess given', completed: false },
      { id: 'app', name: 'Personalapp-inlogg', completed: true, completedDate: new Date('2024-01-10') },
      { id: 'safety', name: 'Säkerhetsutbildning', completed: false }
    ],
    totalJobsCompleted: 45,
    averageRating: 4.6,
    customerFeedback: 92,
    documents: [
      { id: 'doc-008', name: 'Legitimation', type: 'id', uploadDate: new Date('2024-01-08') }
    ],
    notes: 'Ny medarbetare med stark kundservicebakgrund',
    lastUpdated: new Date('2024-01-17')
  }
]

export default function StaffOverviewPage() {
  const [employees, setEmployees] = useState<EmployeeOverview[]>(mockEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [contractFilter, setContractFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOverview | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter
    const matchesContract = contractFilter === 'all' || employee.contractStatus === contractFilter
    return matchesSearch && matchesStatus && matchesDepartment && matchesContract
  })

  const getStatusColor = (status: EmployeeOverview['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800'
      case 'terminated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: EmployeeOverview['status']) => {
    switch (status) {
      case 'active': return <UserCheck className="h-4 w-4" />
      case 'inactive': return <User className="h-4 w-4" />
      case 'on_leave': return <Clock className="h-4 w-4" />
      case 'terminated': return <UserX className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: EmployeeOverview['status']) => {
    const labels = {
      active: 'Aktiv',
      inactive: 'Inaktiv',
      on_leave: 'Ledig',
      terminated: 'Avslutad'
    }
    return labels[status]
  }

  const getContractStatusColor = (status: EmployeeOverview['contractStatus']) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getContractStatusLabel = (status: EmployeeOverview['contractStatus']) => {
    const labels = {
      signed: 'Signerat',
      pending: 'Väntar',
      expired: 'Utgånget',
      draft: 'Utkast'
    }
    return labels[status]
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administratör',
      manager: 'Chef',
      mover: 'Flyttledare',
      driver: 'Chaufför',
      customer_service: 'Kundtjänst'
    }
    return labels[role] || role
  }

  const getOnboardingStatus = (progress: number) => {
    if (progress === 100) return { color: 'text-green-600', label: 'Slutförd' }
    if (progress >= 80) return { color: 'text-blue-600', label: 'Nästan klar' }
    if (progress >= 50) return { color: 'text-yellow-600', label: 'Pågår' }
    return { color: 'text-red-600', label: 'Behöver åtgärd' }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      id: 'Legitimation',
      certificate: 'Certifikat',
      license: 'Körkort',
      other: 'Övrigt'
    }
    return labels[type as keyof typeof labels] || type
  }

  // Calculate aggregate stats
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const pendingContracts = employees.filter(e => e.contractStatus === 'pending').length
  const incompleteOnboarding = employees.filter(e => e.onboardingProgress < 100).length
  const averageRating = employees.reduce((sum, e) => sum + e.averageRating, 0) / employees.length
  const totalAssets = employees.reduce((sum, e) => sum + e.activeAssets, 0)
  const vehicleAccessCount = employees.filter(e => e.vehicleAccess).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personalöversikt</h1>
          <p className="text-gray-600">Komplett översikt av all personal och deras status</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importera
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Personal</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
                <p className="text-xs text-green-600">{activeEmployees} aktiva</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Väntande Avtal</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingContracts}</p>
                <p className="text-xs text-gray-600">Behöver signering</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Onboarding</p>
                <p className="text-2xl font-bold text-blue-600">{incompleteOnboarding}</p>
                <p className="text-xs text-gray-600">Ofullständiga</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Snittbetyg</p>
                <p className="text-2xl font-bold text-purple-600">{averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-600">Kundnöjdhet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="assets">Tillgångar</TabsTrigger>
          <TabsTrigger value="performance">Prestanda</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtrera Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Sök efter namn, email eller telefon..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla Status</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                    <SelectItem value="on_leave">Ledig</SelectItem>
                    <SelectItem value="terminated">Avslutad</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Avdelning" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla Avdelningar</SelectItem>
                    <SelectItem value="Ledning">Ledning</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Flyttteam">Flyttteam</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Kundtjänst">Kundtjänst</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Avtalsstatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla Avtal</SelectItem>
                    <SelectItem value="signed">Signerat</SelectItem>
                    <SelectItem value="pending">Väntar</SelectItem>
                    <SelectItem value="expired">Utgånget</SelectItem>
                    <SelectItem value="draft">Utkast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Employee Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">{getRoleLabel(employee.role)}</p>
                      </div>
                    </div>
                    <Badge className={cn("flex items-center gap-1", getStatusColor(employee.status))}>
                      {getStatusIcon(employee.status)}
                      {getStatusLabel(employee.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Avtal:</span>
                      <Badge className={getContractStatusColor(employee.contractStatus)}>
                        {getContractStatusLabel(employee.contractStatus)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Onboarding:</span>
                      <div className="flex items-center">
                        <Progress value={employee.onboardingProgress} className="w-16 h-2 mr-2" />
                        <span className={cn("text-xs", getOnboardingStatus(employee.onboardingProgress).color)}>
                          {employee.onboardingProgress}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tillgångar:</span>
                      <span className="font-medium">{employee.activeAssets}/{employee.totalAssets}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Fordonsaccess:</span>
                      {employee.vehicleAccess ? (
                        <div className="flex items-center text-green-600">
                          <Car className="h-4 w-4 mr-1" />
                          <span className="text-xs">{employee.personalCode}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Ingen</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Betyg:</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-medium">{employee.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Anställd: {employee.hireDate.toLocaleDateString('sv-SE')}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detaljer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Status</CardTitle>
              <CardDescription>Översikt över onboarding-progress för alla anställda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-medium">{employee.name}</h4>
                        <p className="text-sm text-gray-500">{employee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center">
                          <Progress value={employee.onboardingProgress} className="w-24 h-2 mr-3" />
                          <span className={cn("text-sm font-medium", getOnboardingStatus(employee.onboardingProgress).color)}>
                            {employee.onboardingProgress}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {employee.onboardingSteps.filter(s => s.completed).length}/{employee.onboardingSteps.length} steg
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {employee.onboardingSteps.map((step) => (
                          <div
                            key={step.id}
                            className={cn(
                              "w-3 h-3 rounded-full",
                              step.completed ? "bg-green-500" : "bg-gray-300"
                            )}
                            title={step.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tillgångsöversikt</CardTitle>
              <CardDescription>Översikt över utdelade tillgångar per anställd</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-medium">{employee.name}</h4>
                        <p className="text-sm text-gray-500">{employee.department}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-[#002A5C]">{employee.totalAssets}</div>
                        <div className="text-xs text-gray-500">Totalt</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{employee.activeAssets}</div>
                        <div className="text-xs text-gray-500">Aktiva</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{employee.returnedAssets}</div>
                        <div className="text-xs text-gray-500">Returnerade</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">{employee.lostAssets}</div>
                        <div className="text-xs text-gray-500">Förlorade</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prestationsöversikt</CardTitle>
              <CardDescription>Översikt över prestanda och kundnöjdhet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-medium">{employee.name}</h4>
                        <p className="text-sm text-gray-500">{employee.department}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-lg font-bold text-[#002A5C]">{employee.totalJobsCompleted}</div>
                        <div className="text-xs text-gray-500">Slutförda jobb</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-lg font-bold text-yellow-600">{employee.averageRating.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-gray-500">Snittbetyg</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{employee.customerFeedback}%</div>
                        <div className="text-xs text-gray-500">Kundnöjdhet</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Personaldetaljer</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium text-xl">
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
                  <p className="text-gray-600">{getRoleLabel(selectedEmployee.role)} • {selectedEmployee.department}</p>
                  <div className="flex items-center mt-2">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedEmployee.email}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedEmployee.phone}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Onboarding Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEmployee.onboardingSteps.map((step) => (
                        <div key={step.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            {step.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400 mr-2" />
                            )}
                            <span className={cn("text-sm", step.completed ? "text-gray-900" : "text-gray-500")}>
                              {step.name}
                            </span>
                          </div>
                          {step.completedDate && (
                            <span className="text-xs text-gray-500">
                              {step.completedDate.toLocaleDateString('sv-SE')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dokument</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEmployee.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm">{doc.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {getDocumentTypeLabel(doc.type)}
                            </div>
                            {doc.expiryDate && (
                              <div className={cn(
                                "text-xs",
                                doc.expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                                  ? "text-red-600" 
                                  : "text-green-600"
                              )}>
                                Utgår: {doc.expiryDate.toLocaleDateString('sv-SE')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedEmployee.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Anteckningar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{selectedEmployee.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}