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
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  UserPlus, 
  Plus, 
  Search, 
  Filter,
  FileText,
  Package,
  Car,
  Smartphone,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  Send,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Bell,
  Activity,
  Target,
  Award,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingStep {
  id: string
  name: string
  description: string
  category: 'documentation' | 'assets' | 'access' | 'training' | 'setup'
  required: boolean
  order: number
  estimatedTime: number // minutes
  instructions: string
  checklist: string[]
  assignedTo?: string
  dueDate?: Date
  completedDate?: Date
  completedBy?: string
  notes?: string
}

interface OnboardingTemplate {
  id: string
  name: string
  description: string
  role: string
  department: string
  steps: OnboardingStep[]
  totalEstimatedTime: number
  isActive: boolean
}

interface OnboardingProcess {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  role: string
  department: string
  startDate: Date
  targetCompletionDate: Date
  actualCompletionDate?: Date
  templateId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  progress: number
  steps: OnboardingStep[]
  assignedMentor?: string
  mentorEmail?: string
  notes?: string
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    name: 'Välkomstmöte',
    description: 'Första intryck och introduktion till företaget',
    category: 'setup',
    required: true,
    order: 1,
    estimatedTime: 60,
    instructions: 'Genomför välkomstmöte med ny anställd. Gå igenom företagskultur, värderingar och förväntningar.',
    checklist: [
      'Välkomna och introducera sig själv',
      'Gå igenom företagshistoria och värderingar',
      'Förklara organisationsstruktur',
      'Presentera kollegor och team',
      'Ge överblick över första dagen/veckan'
    ]
  },
  {
    id: 'contract',
    name: 'Avtal signerat',
    description: 'Anställningsavtal digitalt signerat',
    category: 'documentation',
    required: true,
    order: 2,
    estimatedTime: 15,
    instructions: 'Skicka anställningsavtal för digital signering via BankID eller Oneflow.',
    checklist: [
      'Avtal skapat och granskat',
      'Skickat till anställd för signering',
      'Signerat av båda parter',
      'Arkiverat i personalsystem'
    ]
  },
  {
    id: 'documents',
    name: 'Dokument insamlade',
    description: 'Alla nödvändiga dokument insamlade och verifierade',
    category: 'documentation',
    required: true,
    order: 3,
    estimatedTime: 30,
    instructions: 'Samla in och verifiera alla nödvändiga dokument från den anställde.',
    checklist: [
      'Giltig legitimation (ID/pass)',
      'Körkort (om relevant för rollen)',
      'Utbildningscertifikat',
      'Tidigare arbetsgivarintyg',
      'Skatteverket blankett'
    ]
  },
  {
    id: 'assets',
    name: 'Arbetskläder utdelade',
    description: 'Alla nödvändiga arbetskläder och utrustning utdelade',
    category: 'assets',
    required: true,
    order: 4,
    estimatedTime: 45,
    instructions: 'Dela ut arbetskläder och utrustning baserat på roll och storlek.',
    checklist: [
      'Storlek uppmätt och dokumenterad',
      'T-shirts och jackor utdelade',
      'Arbetsbyxor och skor',
      'Säkerhetsutrustning',
      'Kvitto undertecknat'
    ]
  },
  {
    id: 'vehicle',
    name: 'Fordonsaccess given',
    description: 'Personlig kod genererad och fordonsaccess konfigurerad',
    category: 'access',
    required: false,
    order: 5,
    estimatedTime: 20,
    instructions: 'Generera personlig kod och konfigurera fordonsaccess baserat på roll.',
    checklist: [
      'Personlig kod genererad',
      'Fordonsaccess konfigurerad',
      'Säkerhetsinstruktioner givna',
      'Testaccess genomförd',
      'Loggar verifierade'
    ]
  },
  {
    id: 'app',
    name: 'Personalapp-inlogg',
    description: 'Inlogg till personalapp skapat och testat',
    category: 'setup',
    required: true,
    order: 6,
    estimatedTime: 30,
    instructions: 'Skapa inloggningsuppgifter till personalapp och genomför grundläggande träning.',
    checklist: [
      'Användaruppgifter skapade',
      'Första inloggning genomförd',
      'Grundläggande funktioner visade',
      'Testorder genomförd',
      'Support-kontakter delgivna'
    ]
  },
  {
    id: 'safety',
    name: 'Säkerhetsutbildning',
    description: 'Genomgång av säkerhetsrutiner och arbetsmiljöregler',
    category: 'training',
    required: true,
    order: 7,
    estimatedTime: 90,
    instructions: 'Genomför säkerhetsutbildning anpassad för roll och arbetsplats.',
    checklist: [
      'Arbetsmiljöregler genomgångna',
      'Säkerhetsutrustning demonstrerad',
      'Nödsituationer och rutiner',
      'Rapportering av tillbud',
      'Säkerhetstest genomfört'
    ]
  },
  {
    id: 'mentor',
    name: 'Mentor tilldelad',
    description: 'Mentor tilldelad för första månaden',
    category: 'setup',
    required: true,
    order: 8,
    estimatedTime: 15,
    instructions: 'Tilldela erfaren kollega som mentor för den nya anställde.',
    checklist: [
      'Mentor identifierad och tillfrågad',
      'Första möte schemalagt',
      'Kontaktuppgifter utbytta',
      'Förväntningar tydliggjorda',
      'Uppföljningsschema bestämt'
    ]
  },
  {
    id: 'training',
    name: 'Rollspecifik utbildning',
    description: 'Utbildning specifik för den anställdes roll',
    category: 'training',
    required: true,
    order: 9,
    estimatedTime: 240,
    instructions: 'Genomför rollspecifik utbildning anpassad för den anställdes arbetsuppgifter.',
    checklist: [
      'Arbetsprocesser genomgångna',
      'Verktyg och system tränade',
      'Kvalitetsstandarder förklarade',
      'Praktiska övningar genomförda',
      'Kompetenstest godkänt'
    ]
  },
  {
    id: 'evaluation',
    name: 'Första utvärdering',
    description: 'Utvärdering av första veckan och feedback',
    category: 'setup',
    required: true,
    order: 10,
    estimatedTime: 60,
    instructions: 'Genomför utvärdering av första veckan och samla feedback.',
    checklist: [
      'Utvärderingsmöte genomfört',
      'Feedback från anställd samlad',
      'Eventuella problem identifierade',
      'Handlingsplan för fortsättning',
      'Nästa uppföljning schemalagd'
    ]
  }
]

const mockTemplates: OnboardingTemplate[] = [
  {
    id: 'template-admin',
    name: 'Administratör Onboarding',
    description: 'Komplett onboarding för administrativa roller',
    role: 'admin',
    department: 'Ledning',
    steps: defaultSteps,
    totalEstimatedTime: 585,
    isActive: true
  },
  {
    id: 'template-mover',
    name: 'Flyttare Onboarding',
    description: 'Onboarding för flyttpersonal med fokus på säkerhet',
    role: 'mover',
    department: 'Flyttteam',
    steps: defaultSteps.filter(s => s.category !== 'setup' || s.id === 'welcome'),
    totalEstimatedTime: 450,
    isActive: true
  },
  {
    id: 'template-driver',
    name: 'Chaufför Onboarding',
    description: 'Onboarding för chaufförer med fordonsaccess',
    role: 'driver',
    department: 'Transport',
    steps: defaultSteps,
    totalEstimatedTime: 585,
    isActive: true
  }
]

const mockProcesses: OnboardingProcess[] = [
  {
    id: 'process-001',
    employeeId: 'staff-001',
    employeeName: 'Lars Andersson',
    employeeEmail: 'lars.andersson@nordflytt.se',
    role: 'admin',
    department: 'Ledning',
    startDate: new Date('2024-01-15'),
    targetCompletionDate: new Date('2024-01-22'),
    actualCompletionDate: new Date('2024-01-20'),
    templateId: 'template-admin',
    status: 'completed',
    progress: 100,
    steps: defaultSteps.map(s => ({
      ...s,
      completedDate: new Date('2024-01-' + (15 + s.order).toString()),
      completedBy: 'HR Admin'
    })),
    assignedMentor: 'Maria Eriksson',
    mentorEmail: 'maria.eriksson@nordflytt.se'
  },
  {
    id: 'process-002',
    employeeId: 'staff-004',
    employeeName: 'Emma Nilsson',
    employeeEmail: 'emma.nilsson@nordflytt.se',
    role: 'customer_service',
    department: 'Kundtjänst',
    startDate: new Date('2024-01-08'),
    targetCompletionDate: new Date('2024-01-15'),
    templateId: 'template-admin',
    status: 'in_progress',
    progress: 40,
    steps: defaultSteps.map((s, i) => ({
      ...s,
      completedDate: i < 4 ? new Date('2024-01-' + (8 + i).toString()) : undefined,
      completedBy: i < 4 ? 'HR Admin' : undefined
    })),
    assignedMentor: 'Lars Andersson',
    mentorEmail: 'lars.andersson@nordflytt.se'
  },
  {
    id: 'process-003',
    employeeId: 'staff-005',
    employeeName: 'Anna Johansson',
    employeeEmail: 'anna.johansson@nordflytt.se',
    role: 'mover',
    department: 'Flyttteam',
    startDate: new Date('2024-01-22'),
    targetCompletionDate: new Date('2024-01-29'),
    templateId: 'template-mover',
    status: 'not_started',
    progress: 0,
    steps: defaultSteps.map(s => ({ ...s })),
    assignedMentor: 'Johan Karlsson',
    mentorEmail: 'johan.karlsson@nordflytt.se'
  }
]

export default function OnboardingPage() {
  const [processes, setProcesses] = useState<OnboardingProcess[]>(mockProcesses)
  const [templates, setTemplates] = useState<OnboardingTemplate[]>(mockTemplates)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [isNewProcessOpen, setIsNewProcessOpen] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<OnboardingProcess | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  
  const [newProcess, setNewProcess] = useState({
    employeeName: '',
    employeeEmail: '',
    role: '',
    department: '',
    templateId: '',
    startDate: new Date().toISOString().split('T')[0],
    assignedMentor: '',
    mentorEmail: '',
    notes: ''
  })

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || process.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || process.department === departmentFilter
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const getStatusColor = (status: OnboardingProcess['status']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: OnboardingProcess['status']) => {
    switch (status) {
      case 'not_started': return <Clock className="h-4 w-4" />
      case 'in_progress': return <Activity className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'overdue': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: OnboardingProcess['status']) => {
    const labels = {
      not_started: 'Ej startad',
      in_progress: 'Pågår',
      completed: 'Slutförd',
      overdue: 'Försenad'
    }
    return labels[status]
  }

  const getCategoryIcon = (category: OnboardingStep['category']) => {
    switch (category) {
      case 'documentation': return <FileText className="h-4 w-4" />
      case 'assets': return <Package className="h-4 w-4" />
      case 'access': return <Car className="h-4 w-4" />
      case 'training': return <BookOpen className="h-4 w-4" />
      case 'setup': return <Smartphone className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: OnboardingStep['category']) => {
    const labels = {
      documentation: 'Dokumentation',
      assets: 'Tillgångar',
      access: 'Åtkomst',
      training: 'Utbildning',
      setup: 'Konfiguration'
    }
    return labels[category]
  }

  const getCategoryColor = (category: OnboardingStep['category']) => {
    switch (category) {
      case 'documentation': return 'bg-blue-100 text-blue-800'
      case 'assets': return 'bg-green-100 text-green-800'
      case 'access': return 'bg-purple-100 text-purple-800'
      case 'training': return 'bg-orange-100 text-orange-800'
      case 'setup': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateProcess = () => {
    const template = templates.find(t => t.id === newProcess.templateId)
    if (!template) return

    const startDate = new Date(newProcess.startDate)
    const targetCompletionDate = new Date(startDate)
    targetCompletionDate.setDate(startDate.getDate() + 7) // 7 days default

    const process: OnboardingProcess = {
      id: `process-${Date.now()}`,
      employeeId: `staff-${Date.now()}`,
      employeeName: newProcess.employeeName,
      employeeEmail: newProcess.employeeEmail,
      role: newProcess.role,
      department: newProcess.department,
      startDate,
      targetCompletionDate,
      templateId: newProcess.templateId,
      status: 'not_started',
      progress: 0,
      steps: template.steps.map(s => ({ ...s })),
      assignedMentor: newProcess.assignedMentor,
      mentorEmail: newProcess.mentorEmail,
      notes: newProcess.notes
    }
    
    setProcesses([...processes, process])
    setNewProcess({
      employeeName: '',
      employeeEmail: '',
      role: '',
      department: '',
      templateId: '',
      startDate: new Date().toISOString().split('T')[0],
      assignedMentor: '',
      mentorEmail: '',
      notes: ''
    })
    setIsNewProcessOpen(false)
  }

  const handleCompleteStep = (processId: string, stepId: string) => {
    setProcesses(processes.map(process => {
      if (process.id === processId) {
        const updatedSteps = process.steps.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              completedDate: new Date(),
              completedBy: 'Current User'
            }
          }
          return step
        })
        
        const completedSteps = updatedSteps.filter(s => s.completedDate).length
        const progress = Math.round((completedSteps / updatedSteps.length) * 100)
        const status = progress === 100 ? 'completed' : 'in_progress'
        
        return {
          ...process,
          steps: updatedSteps,
          progress,
          status: status as OnboardingProcess['status'],
          actualCompletionDate: progress === 100 ? new Date() : undefined
        }
      }
      return process
    }))
  }

  const handleStartProcess = (processId: string) => {
    setProcesses(processes.map(process => 
      process.id === processId 
        ? { ...process, status: 'in_progress' as const }
        : process
    ))
  }

  // Calculate stats
  const totalProcesses = processes.length
  const activeProcesses = processes.filter(p => p.status === 'in_progress').length
  const completedProcesses = processes.filter(p => p.status === 'completed').length
  const overdueProcesses = processes.filter(p => p.status === 'overdue').length
  const notStartedProcesses = processes.filter(p => p.status === 'not_started').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Onboarding Workflow</h1>
          <p className="text-gray-600">Hantera introduktionsprocessen för nya anställda</p>
        </div>
        <Dialog open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#002A5C] hover:bg-[#001a42]">
              <Plus className="mr-2 h-4 w-4" />
              Ny Onboarding
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Starta Ny Onboarding</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeName">Anställd</Label>
                  <Input
                    id="employeeName"
                    placeholder="Namn på ny anställd"
                    value={newProcess.employeeName}
                    onChange={(e) => setNewProcess({...newProcess, employeeName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="employeeEmail">Email</Label>
                  <Input
                    id="employeeEmail"
                    type="email"
                    placeholder="email@nordflytt.se"
                    value={newProcess.employeeEmail}
                    onChange={(e) => setNewProcess({...newProcess, employeeEmail: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Roll</Label>
                  <Select 
                    value={newProcess.role} 
                    onValueChange={(value) => setNewProcess({...newProcess, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj roll" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administratör</SelectItem>
                      <SelectItem value="manager">Chef</SelectItem>
                      <SelectItem value="mover">Flyttare</SelectItem>
                      <SelectItem value="driver">Chaufför</SelectItem>
                      <SelectItem value="customer_service">Kundtjänst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Avdelning</Label>
                  <Select 
                    value={newProcess.department} 
                    onValueChange={(value) => setNewProcess({...newProcess, department: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj avdelning" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ledning">Ledning</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Flyttteam">Flyttteam</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Kundtjänst">Kundtjänst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="templateId">Onboarding Mall</Label>
                <Select 
                  value={newProcess.templateId} 
                  onValueChange={(value) => setNewProcess({...newProcess, templateId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj mall" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.totalEstimatedTime} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Startdatum</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newProcess.startDate}
                    onChange={(e) => setNewProcess({...newProcess, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="assignedMentor">Mentor</Label>
                  <Input
                    id="assignedMentor"
                    placeholder="Tilldelad mentor"
                    value={newProcess.assignedMentor}
                    onChange={(e) => setNewProcess({...newProcess, assignedMentor: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="mentorEmail">Mentor Email</Label>
                <Input
                  id="mentorEmail"
                  type="email"
                  placeholder="mentor@nordflytt.se"
                  value={newProcess.mentorEmail}
                  onChange={(e) => setNewProcess({...newProcess, mentorEmail: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Anteckningar</Label>
                <Textarea
                  id="notes"
                  placeholder="Eventuella anteckningar..."
                  value={newProcess.notes}
                  onChange={(e) => setNewProcess({...newProcess, notes: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsNewProcessOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateProcess}>
                  Starta Onboarding
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt</p>
                <p className="text-2xl font-bold">{totalProcesses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pågående</p>
                <p className="text-2xl font-bold text-blue-600">{activeProcesses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Slutförda</p>
                <p className="text-2xl font-bold text-green-600">{completedProcesses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ej startade</p>
                <p className="text-2xl font-bold text-gray-600">{notStartedProcesses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Försenade</p>
                <p className="text-2xl font-bold text-red-600">{overdueProcesses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrera Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök efter anställd eller email..."
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
                <SelectItem value="not_started">Ej startad</SelectItem>
                <SelectItem value="in_progress">Pågår</SelectItem>
                <SelectItem value="completed">Slutförd</SelectItem>
                <SelectItem value="overdue">Försenad</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Processes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProcesses.map((process) => (
          <Card key={process.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                    {process.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">{process.employeeName}</h3>
                    <p className="text-sm text-gray-500">{process.role} • {process.department}</p>
                  </div>
                </div>
                <Badge className={cn("flex items-center gap-1", getStatusColor(process.status))}>
                  {getStatusIcon(process.status)}
                  {getStatusLabel(process.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progress:</span>
                  <div className="flex items-center">
                    <Progress value={process.progress} className="w-20 h-2 mr-2" />
                    <span className="text-sm font-medium">{process.progress}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Startdatum:</span>
                  <span>{process.startDate.toLocaleDateString('sv-SE')}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Målcomplettering:</span>
                  <span className={cn(
                    process.targetCompletionDate < new Date() && process.status !== 'completed' 
                      ? 'text-red-600' 
                      : 'text-gray-900'
                  )}>
                    {process.targetCompletionDate.toLocaleDateString('sv-SE')}
                  </span>
                </div>
                
                {process.assignedMentor && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mentor:</span>
                    <span>{process.assignedMentor}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Slutförda steg:</span>
                  <span className="font-medium">
                    {process.steps.filter(s => s.completedDate).length}/{process.steps.length}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProcess(process)
                      setIsDetailOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visa detaljer
                  </Button>
                  
                  {process.status === 'not_started' && (
                    <Button
                      size="sm"
                      onClick={() => handleStartProcess(process.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Starta
                    </Button>
                  )}
                  
                  {process.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProcess(process)
                        setIsDetailOpen(true)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Fortsätt
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Process Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Onboarding Detaljer</DialogTitle>
          </DialogHeader>
          {selectedProcess && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium text-xl">
                    {selectedProcess.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProcess.employeeName}</h2>
                    <p className="text-gray-600">{selectedProcess.role} • {selectedProcess.department}</p>
                    <p className="text-sm text-gray-500">{selectedProcess.employeeEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={cn("flex items-center gap-1 mb-2", getStatusColor(selectedProcess.status))}>
                    {getStatusIcon(selectedProcess.status)}
                    {getStatusLabel(selectedProcess.status)}
                  </Badge>
                  <div className="flex items-center">
                    <Progress value={selectedProcess.progress} className="w-32 h-3 mr-3" />
                    <span className="text-lg font-bold">{selectedProcess.progress}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Tidslinje</h3>
                  <div className="space-y-2 text-sm">
                    <div>Startdatum: {selectedProcess.startDate.toLocaleDateString('sv-SE')}</div>
                    <div>Målcomplettering: {selectedProcess.targetCompletionDate.toLocaleDateString('sv-SE')}</div>
                    {selectedProcess.actualCompletionDate && (
                      <div>Slutförd: {selectedProcess.actualCompletionDate.toLocaleDateString('sv-SE')}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Mentor</h3>
                  <div className="space-y-2 text-sm">
                    {selectedProcess.assignedMentor && (
                      <>
                        <div>Namn: {selectedProcess.assignedMentor}</div>
                        <div>Email: {selectedProcess.mentorEmail}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Onboarding Steg</h3>
                <div className="space-y-4">
                  {selectedProcess.steps.map((step) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                            step.completedDate ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                          )}>
                            {step.completedDate ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <h4 className="font-medium">{step.name}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(step.category)}>
                            {getCategoryIcon(step.category)}
                            <span className="ml-1">{getCategoryLabel(step.category)}</span>
                          </Badge>
                          {step.required && (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Obligatorisk
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        {step.instructions}
                      </div>
                      
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-2">Checklista:</h5>
                        <div className="space-y-1">
                          {step.checklist.map((item, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <div className="w-4 h-4 border rounded mr-2 flex items-center justify-center">
                                {step.completedDate && <CheckCircle className="h-3 w-3 text-green-600" />}
                              </div>
                              <span className={step.completedDate ? "text-gray-900" : "text-gray-600"}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-gray-500">
                          Estimerad tid: {step.estimatedTime} minuter
                          {step.completedDate && (
                            <span className="ml-2">
                              • Slutförd: {step.completedDate.toLocaleDateString('sv-SE')}
                            </span>
                          )}
                        </div>
                        {!step.completedDate && selectedProcess.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              handleCompleteStep(selectedProcess.id, step.id)
                              setSelectedProcess({
                                ...selectedProcess,
                                steps: selectedProcess.steps.map(s => 
                                  s.id === step.id 
                                    ? { ...s, completedDate: new Date(), completedBy: 'Current User' }
                                    : s
                                )
                              })
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Slutför
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}