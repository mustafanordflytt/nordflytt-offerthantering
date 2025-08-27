'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Award,
  Target,
  Users,
  MessageCircle,
  FileText,
  Package,
  Car,
  Key,
  Plus,
  Send,
  Download,
  Eye,
  RefreshCw,
  Lock,
  Unlock,
  Shirt,
  HardHat,
  Truck,
  Activity,
  UserPlus,
  Sparkles as Spray,
  XCircle,
  Archive,
  Signature,
  BookOpen,
  Smartphone,
  Snowflake,
  Wrench
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import ContractManagement from '@/components/contracts/ContractManagement'
import AssetDocumentGenerator from '@/components/assets/AssetDocumentGenerator'
import AssetDocumentStatus from '@/components/assets/AssetDocumentStatus'
import OffboardingTab from '@/components/staff/OffboardingTab'
import PerformanceTab from '@/components/staff/PerformanceTab'
import EmployeeTimeReports from '@/components/crm/EmployeeTimeReports'

// Nordflytt-specifika utrustningstyper
const equipmentTypes = {
  arbetskläder: [
    'T-shirt Nordflytt',
    'Fleece-jacka Nordflytt', 
    'Reflexväst',
    'Arbetsbyxor',
    'Vinterjacka',
    'Mössa med logga'
  ],
  skyddsutrustning: [
    'Arbetshandskar',
    'Ryggskydd/Bälte',
    'Säkerhetsskor',
    'Hjälm',
    'Knäskydd',
    'Hörselskydd'
  ],
  verktyg: [
    'Skruvmejsel-set',
    'Nyckelset',
    'Måttband 5m',
    'Bärrem',
    'Verktygslåda',
    'Packtejp-hållare'
  ],
  teknik: [
    'Staff App-telefon',
    'Laddare USB-C',
    'Hörlurar',
    'Powerbank',
    'Bilhållare telefon'
  ],
  fordon: [
    'Spännband-set (4st)',
    'Presenning 6x4m',
    'Lastbalkar',
    'Varningstriangel',
    'Första hjälpen-kit',
    'Reflexväst extra'
  ],
  städ: [
    'Dammsugare Nilfisk',
    'Kemikalier grundset',
    'Trasor mikrofiber',
    'Städförkläde',
    'Hinkar med moppar',
    'Fönsterputs-kit'
  ]
}

// Startpaket per roll
const startPackages = {
  'flyttpersonal_utan_korkort': [
    { category: 'arbetskläder', type: 'T-shirt Nordflytt', cost: 299, quantity: 2 },
    { category: 'arbetskläder', type: 'Fleece-jacka Nordflytt', cost: 599, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Arbetshandskar', cost: 199, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Ryggskydd/Bälte', cost: 899, quantity: 1 },
    { category: 'teknik', type: 'Staff App-telefon', cost: 2999, quantity: 1 }
  ],
  'flyttpersonal_b_korkort': [
    { category: 'arbetskläder', type: 'T-shirt Nordflytt', cost: 299, quantity: 2 },
    { category: 'arbetskläder', type: 'Fleece-jacka Nordflytt', cost: 599, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Arbetshandskar', cost: 199, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Ryggskydd/Bälte', cost: 899, quantity: 1 },
    { category: 'teknik', type: 'Staff App-telefon', cost: 2999, quantity: 1 },
    { category: 'fordon', type: 'Spännband-set (4st)', cost: 399, quantity: 1 },
    { category: 'fordon', type: 'Reflexväst extra', cost: 149, quantity: 1 }
  ],
  'flyttpersonal_c_korkort': [
    { category: 'arbetskläder', type: 'T-shirt Nordflytt', cost: 299, quantity: 2 },
    { category: 'arbetskläder', type: 'Fleece-jacka Nordflytt', cost: 599, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Arbetshandskar', cost: 199, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Ryggskydd/Bälte', cost: 899, quantity: 1 },
    { category: 'teknik', type: 'Staff App-telefon', cost: 2999, quantity: 1 },
    { category: 'fordon', type: 'Spännband-set (4st)', cost: 399, quantity: 1 },
    { category: 'fordon', type: 'Lastbalkar', cost: 799, quantity: 1 },
    { category: 'fordon', type: 'Första hjälpen-kit', cost: 299, quantity: 1 }
  ],
  'flyttstadning': [
    { category: 'arbetskläder', type: 'T-shirt Nordflytt', cost: 299, quantity: 2 },
    { category: 'arbetskläder', type: 'Städförkläde', cost: 199, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Arbetshandskar', cost: 199, quantity: 2 },
    { category: 'städ', type: 'Kemikalier grundset', cost: 799, quantity: 1 },
    { category: 'städ', type: 'Trasor mikrofiber', cost: 149, quantity: 1 },
    { category: 'teknik', type: 'Staff App-telefon', cost: 2999, quantity: 1 }
  ],
  'flytt_stad_utan_korkort': [
    { category: 'arbetskläder', type: 'T-shirt Nordflytt', cost: 299, quantity: 2 },
    { category: 'arbetskläder', type: 'Städförkläde', cost: 199, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Arbetshandskar', cost: 199, quantity: 2 },
    { category: 'skyddsutrustning', type: 'Ryggskydd/Bälte', cost: 899, quantity: 1 },
    { category: 'städ', type: 'Kemikalier grundset', cost: 799, quantity: 1 },
    { category: 'teknik', type: 'Staff App-telefon', cost: 2999, quantity: 1 }
  ],
  'flytt_stad_med_korkort': [
    { category: 'arbetskläder', type: 'T-shirt Nordflytt', cost: 299, quantity: 2 },
    { category: 'arbetskläder', type: 'Städförkläde', cost: 199, quantity: 1 },
    { category: 'skyddsutrustning', type: 'Arbetshandskar', cost: 199, quantity: 2 },
    { category: 'skyddsutrustning', type: 'Ryggskydd/Bälte', cost: 899, quantity: 1 },
    { category: 'städ', type: 'Kemikalier grundset', cost: 799, quantity: 1 },
    { category: 'fordon', type: 'Spännband-set (4st)', cost: 399, quantity: 1 },
    { category: 'teknik', type: 'Staff App-telefon', cost: 2999, quantity: 1 }
  ]
}

// Mock data för komplett anställd-profil
const mockStaffData = {
  'staff-001': {
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
    employmentType: 'full_time',
    
    // Avtal
    contracts: [
      {
        id: 'contract-001',
        type: 'ledning',
        status: 'signed',
        createdDate: new Date('2024-01-15'),
        signedDate: new Date('2024-01-16'),
        version: '2024.1',
        signatureMethod: 'bankid',
        pdfUrl: '/contracts/lars-andersson-2024.pdf'
      }
    ],
    
    // Tillgångar
    assets: [
      {
        id: 'asset-001',
        category: 'klader',
        type: 'tshirt',
        name: 'Nordflytt T-shirt',
        size: 'L',
        quantity: 3,
        issuedDate: new Date('2024-01-15'),
        status: 'utdelat',
        condition: 'nytt',
        originalCost: 249,
        currentValue: 200,
        depreciationRate: 0.8,
        supplier: 'Profilprodukter AB',
        warrantyUntil: new Date('2024-07-15')
      },
      {
        id: 'asset-002',
        category: 'klader',
        type: 'jacket',
        name: 'Arbetsjacka',
        size: 'L',
        quantity: 1,
        issuedDate: new Date('2024-01-15'),
        status: 'utdelat',
        condition: 'bra',
        originalCost: 899,
        currentValue: 720,
        depreciationRate: 0.8,
        supplier: 'Workwear Nordic',
        warrantyUntil: new Date('2025-01-15')
      },
      {
        id: 'asset-003',
        category: 'utrustning',
        type: 'lifting_belt',
        name: 'Lyftbälte',
        size: 'L',
        quantity: 1,
        issuedDate: new Date('2024-01-15'),
        status: 'utdelat',
        condition: 'bra',
        originalCost: 899,
        currentValue: 800,
        depreciationRate: 0.9,
        supplier: 'Ergonomic Tools',
        warrantyUntil: new Date('2026-01-15')
      }
    ],
    
    // Fordonsaccess
    vehicleAccess: {
      id: 'access-001',
      vehicleId: 'vehicle-001',
      vehicleName: 'KeyGarage 787',
      personalCode: '742856',
      accessLevel: 'admin',
      status: 'aktiv',
      isActive: true,
      issuedDate: new Date('2024-01-15'),
      expiryDate: new Date('2024-07-15'),
      createdBy: 'HR Admin',
      lastUsed: new Date('2024-01-20'),
      usageCount: 45
    },
    
    accessLogs: [
      {
        id: 'log-001',
        vehicleId: 'vehicle-001',
        action: 'unlock',
        timestamp: new Date('2024-01-20T08:30:00'),
        location: 'Stockholm Depot',
        success: true
      },
      {
        id: 'log-002',
        vehicleId: 'vehicle-001',
        action: 'lock',
        timestamp: new Date('2024-01-20T16:45:00'),
        location: 'Stockholm Depot',
        success: true
      }
    ],
    
    // Onboarding
    onboardingProgress: 100,
    onboardingSteps: [
      {
        id: 'welcome',
        name: 'Välkomstmöte',
        category: 'setup',
        completed: true,
        completedDate: new Date('2024-01-15'),
        completedBy: 'HR Admin'
      },
      {
        id: 'contract',
        name: 'Avtal signerat',
        category: 'documentation',
        completed: false,
        completedDate: null,
        completedBy: null
      },
      {
        id: 'assets',
        name: 'Arbetskläder utdelade',
        category: 'assets',
        completed: false,
        completedDate: null,
        completedBy: null
      },
      {
        id: 'vehicle',
        name: 'Fordonsaccess given',
        category: 'access',
        completed: false,
        completedDate: null,
        completedBy: null
      },
      {
        id: 'app',
        name: 'Personalapp-inlogg',
        category: 'setup',
        completed: false,
        completedDate: null,
        completedBy: null
      },
      {
        id: 'safety',
        name: 'Säkerhetsutbildning',
        category: 'training',
        completed: false,
        completedDate: null,
        completedBy: null
      }
    ],
    
    // Prestanda
    recentJobs: [
      { id: 'job-001', customer: 'Volvo AB', date: '2025-07-01', status: 'completed', rating: 5 },
      { id: 'job-005', customer: 'IKEA Stockholm', date: '2025-06-28', status: 'in_progress', rating: null },
      { id: 'job-012', customer: 'Microsoft Sverige', date: '2025-06-25', status: 'completed', rating: 5 }
    ],
    performance: {
      thisMonth: { completed: 8, rating: 4.9, efficiency: 95 },
      lastMonth: { completed: 12, rating: 4.8, efficiency: 92 },
      thisYear: { completed: 156, rating: 4.9, efficiency: 94 }
    },
    certifications: ['Arbetsledare', 'Första Hjälpen', 'Truck-körkort'],
    workSchedule: {
      monday: '08:00-17:00',
      tuesday: '08:00-17:00', 
      wednesday: '08:00-17:00',
      thursday: '08:00-17:00',
      friday: '08:00-16:00',
      saturday: 'Ledig',
      sunday: 'Ledig'
    }
  }
}

export default function StaffProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const staffId = params.id as string
  const [staff, setStaff] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false)
  const [contractData, setContractData] = useState<any>(null)
  const [newAsset, setNewAsset] = useState({
    category: '',
    type: '',
    size: '',
    quantity: 1,
    cost: '',
    supplier: '',
    status: 'utdelad',
    expectedLifespan: 12,
    distributedDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showContractModal, setShowContractModal] = useState(false)
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false)
  const [editingPackageType, setEditingPackageType] = useState<'start' | 'winter'>('start')
  const [editPackageItems, setEditPackageItems] = useState<any[]>([])
  const [assetDocument, setAssetDocument] = useState<any>(null)
  const [expandedOnboardingStep, setExpandedOnboardingStep] = useState<string | null>(null)
  
  // Interactive Safety Training State
  const [currentSafetyStep, setCurrentSafetyStep] = useState<number>(0)
  const [completedSafetySteps, setCompletedSafetySteps] = useState<number[]>([])
  const [currentScenario, setCurrentScenario] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState<boolean>(false)
  const [scenarioProgress, setScenarioProgress] = useState<{[key: number]: boolean}>({})
  const [safetyTrainingCompleted, setSafetyTrainingCompleted] = useState<boolean>(false)

  useEffect(() => {
    // Fetch staff data from API
    const fetchStaff = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/employees/${staffId}`)
        if (response.ok) {
          const result = await response.json()
          console.log('API Response:', result) // Debug log
          
          const employeeData = result.data || result.employee || result
          
          try {
            // Convert date strings back to Date objects
            const employee = {
              ...employeeData,
              // Map field names från API till komponentens förväntade fält
              id: employeeData.id || employeeData.staff_id,
              staffId: employeeData.staff_id || employeeData.id,
              hireDate: employeeData.hire_date ? new Date(employeeData.hire_date) : new Date(),
              contracts: employeeData.employee_contracts || employeeData.contracts || [],
              assets: (employeeData.employee_assets || employeeData.assets || []).map((asset: any) => ({
                ...asset,
                assignedDate: asset.assignedDate ? new Date(asset.assignedDate) : null,
                returnDate: asset.returnDate ? new Date(asset.returnDate) : null
              })) || [],
              vehicleAccess: employeeData.vehicleAccess ? {
                ...employeeData.vehicleAccess,
                issuedDate: new Date(employeeData.vehicleAccess.issuedDate),
                expiryDate: new Date(employeeData.vehicleAccess.expiryDate)
              } : null,
              onboardingProgress: employeeData.onboardingProgress ? {
                ...employeeData.onboardingProgress,
                startDate: new Date(employeeData.onboardingProgress.startDate),
                expectedCompletion: new Date(employeeData.onboardingProgress.expectedCompletion)
              } : null,
              accessLogs: employeeData.accessLogs?.map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp)
              })) || [],
              onboardingSteps: employeeData.employee_onboarding || employeeData.onboardingSteps || [
                { id: 'contract', name: 'Anställningsavtal', category: 'documentation', completed: false },
                { id: 'assets', name: 'Arbetskläder & Utrustning', category: 'assets', completed: false },
                { id: 'vehicle', name: 'Fordonsåtkomst', category: 'access', completed: false },
                { id: 'safety', name: 'Säkerhetsutbildning', category: 'training', completed: false },
                { id: 'app', name: 'Staff App', category: 'setup', completed: false }
              ],
              performance: employeeData.performance || {
                rating: employeeData.rating || 0,
                totalJobsCompleted: employeeData.total_jobs_completed || 0
              }
            }
            console.log('Processed employee:', employee) // Debug log
            setStaff(employee)
          } catch (dateError) {
            console.error('Error processing dates:', dateError)
            // Use raw data without date conversion
            setStaff(employeeData)
          }
        } else {
          // Fallback to mock data if API fails
          const staffData = mockStaffData[staffId as keyof typeof mockStaffData]
          setStaff(staffData || null)
        }
      } catch (error) {
        console.error('Error fetching staff:', error)
        // Fallback to mock data
        const staffData = mockStaffData[staffId as keyof typeof mockStaffData]
        setStaff(staffData || null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStaff()
  }, [staffId])

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administratör',
      manager: 'Chef',
      flyttledare: 'Flyttledare',
      flyttpersonal_utan_korkort: 'Flyttpersonal utan körkort',
      flyttpersonal_b_korkort: 'Flyttpersonal med B-körkort',
      flyttpersonal_c_korkort: 'Flyttpersonal med C-körkort',
      flyttstadning: 'Flyttstädningspersonal',
      flytt_stad_utan_korkort: 'Flytt & Städ utan körkort',
      flytt_stad_med_korkort: 'Flytt & Städ med körkort',
      mover: 'Flyttledare', // Bakåtkompatibilitet
      driver: 'Chaufför',
      customer_service: 'Kundtjänst'
    }
    return labels[role] || role
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Tillgänglig',
      busy: 'Upptagen',
      scheduled: 'Schemalagd',
      on_leave: 'Ledig'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-red-100 text-red-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'on_leave': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'mover': return 'bg-orange-100 text-orange-800'
      case 'driver': return 'bg-green-100 text-green-800'
      case 'customer_service': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getContractStatusLabel = (status: string) => {
    const labels = {
      signed: 'Signerat',
      pending: 'Väntar',
      expired: 'Utgånget',
      draft: 'Utkast'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getAssetStatusColor = (status: string) => {
    switch (status) {
      case 'utdelat': return 'bg-blue-100 text-blue-800'
      case 'returnerat': return 'bg-green-100 text-green-800'
      case 'forlorat': return 'bg-red-100 text-red-800'
      case 'skadat': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAssetStatusLabel = (status: string) => {
    const labels = {
      utdelat: 'Utdelat',
      returnerat: 'Returnerat',
      forlorat: 'Förlorat',
      skadat: 'Skadat'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'arbetskläder': return <Shirt className="h-4 w-4 text-blue-600" />
      case 'skyddsutrustning': return <HardHat className="h-4 w-4 text-yellow-600" />
      case 'verktyg': return <Wrench className="h-4 w-4 text-gray-600" />
      case 'teknik': return <Smartphone className="h-4 w-4 text-purple-600" />
      case 'fordon': return <Truck className="h-4 w-4 text-green-600" />
      case 'städ': return <Spray className="h-4 w-4 text-cyan-600" />
      // Backward compatibility
      case 'klader': return <Shirt className="h-4 w-4 text-blue-600" />
      case 'utrustning': return <HardHat className="h-4 w-4 text-yellow-600" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      arbetskläder: 'Arbetskläder',
      skyddsutrustning: 'Skyddsutrustning',
      verktyg: 'Verktyg & Utrustning',
      teknik: 'Teknik & Telefon',
      fordon: 'Fordonsutrustning',
      städ: 'Städutrustning',
      // Backward compatibility
      klader: 'Kläder',
      utrustning: 'Utrustning'
    }
    return labels[category as keyof typeof labels] || category
  }

  const getOnboardingCategoryIcon = (category: string) => {
    switch (category) {
      case 'documentation': return <FileText className="h-4 w-4" />
      case 'assets': return <Package className="h-4 w-4" />
      case 'access': return <Car className="h-4 w-4" />
      case 'training': return <BookOpen className="h-4 w-4" />
      case 'setup': return <Smartphone className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getOnboardingCategoryColor = (category: string) => {
    switch (category) {
      case 'documentation': return 'bg-blue-100 text-blue-800'
      case 'assets': return 'bg-green-100 text-green-800'
      case 'access': return 'bg-purple-100 text-purple-800'
      case 'training': return 'bg-orange-100 text-orange-800'
      case 'setup': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateTotalAssetValue = () => {
    if (!staff?.assets) return 0
    return staff.assets.reduce((total: number, asset: any) => 
      total + (asset.currentValue * asset.quantity), 0
    )
  }

  const calculateOriginalAssetValue = () => {
    if (!staff?.assets) return 0
    return staff.assets.reduce((total: number, asset: any) => 
      total + (asset.originalCost * asset.quantity), 0
    )
  }

  const handleReturnAsset = (assetId: string) => {
    if (!staff) return
    const updatedAssets = staff.assets.map((asset: any) => 
      asset.id === assetId 
        ? { ...asset, status: 'returnerat', returnDate: new Date() }
        : asset
    )
    setStaff({ ...staff, assets: updatedAssets })
    toast({
      title: "Tillgång returnerad",
      description: "Tillgången har markerats som returnerad."
    })
  }

  const handleMarkLost = (assetId: string) => {
    if (!staff) return
    const updatedAssets = staff.assets.map((asset: any) => 
      asset.id === assetId 
        ? { ...asset, status: 'forlorat', returnDate: new Date() }
        : asset
    )
    setStaff({ ...staff, assets: updatedAssets })
    toast({
      title: "Tillgång förlorad",
      description: "Tillgången har markerats som förlorad."
    })
  }

  const handleDeleteAsset = (assetId: string) => {
    if (!staff) return
    const updatedAssets = staff.assets.filter((asset: any) => asset.id !== assetId)
    setStaff({ ...staff, assets: updatedAssets })
    toast({
      title: "Tillgång borttagen",
      description: "Tillgången har tagits bort från systemet."
    })
  }

  const handleEditStartPackage = () => {
    const roleKey = staff.role.replace(/\s+/g, '_').toLowerCase()
    const packageItems = startPackages[roleKey as keyof typeof startPackages] || []
    setEditPackageItems([...packageItems])
    setEditingPackageType('start')
    setIsEditPackageOpen(true)
  }

  const handleEditWinterPackage = () => {
    const winterItems = [
      { category: 'arbetskläder', type: 'Vinterjacka', cost: 899, quantity: 1 },
      { category: 'arbetskläder', type: 'Mössa med logga', cost: 199, quantity: 1 }
    ]
    setEditPackageItems([...winterItems])
    setEditingPackageType('winter')
    setIsEditPackageOpen(true)
  }

  const handleSavePackageEdit = () => {
    // Here you would normally save to database/API
    toast({
      title: "Paket uppdaterat",
      description: `${editingPackageType === 'start' ? 'Startpaket' : 'Vinterpaket'} har uppdaterats.`
    })
    setIsEditPackageOpen(false)
  }

  const handleAddPackageItem = () => {
    const newItem = {
      category: 'arbetskläder',
      type: '',
      cost: 0,
      quantity: 1
    }
    setEditPackageItems([...editPackageItems, newItem])
  }

  const handleRemovePackageItem = (index: number) => {
    const updatedItems = editPackageItems.filter((_, i) => i !== index)
    setEditPackageItems(updatedItems)
  }

  const handleUpdatePackageItem = (index: number, field: string, value: any) => {
    const updatedItems = editPackageItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    )
    setEditPackageItems(updatedItems)
  }

  const handleAssetDocumentGenerated = (document: any) => {
    setAssetDocument(document)
    toast({
      title: "Tillgångsdokument skapat",
      description: `Dokument genererat för ${staff.name}`
    })
  }

  const handleAssetDocumentSent = (document: any) => {
    setAssetDocument(document)
    toast({
      title: "Dokument skickat",
      description: `Tillgångsförteckning skickad till ${staff.email}`
    })
  }

  const handleAssetDocumentSigned = (document: any) => {
    setAssetDocument(document)
    toast({
      title: "Dokument signerat",
      description: `${staff.name} har signerat tillgångsförteckningen`
    })
  }

  // Polling för att upptäcka när tillgångsdokument signeras
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (assetDocument?.status === 'sent') {
      console.log('Starting polling for asset document status...')
      
      // Hämta uppdaterad status var 3:e sekund
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/assets/documents/${assetDocument.id}/status`)
          if (response.ok) {
            const updatedDoc = await response.json()
            if (updatedDoc.status !== assetDocument.status) {
              setAssetDocument(updatedDoc)
              if (updatedDoc.status === 'signed') {
                toast({
                  title: "✅ Tillgångsdokument signerat!",
                  description: `${staff.name} har signerat tillgångsförteckningen.`
                })
              }
            }
          }
        } catch (error) {
          console.error('Error polling asset document status:', error)
        }
      }, 3000)
    }
    
    return () => {
      if (interval) {
        console.log('Stopping asset document polling')
        clearInterval(interval)
      }
    }
  }, [assetDocument?.status, assetDocument?.id, staff?.name])

  const handleRevokeAccess = (accessId: string) => {
    if (!staff || !staff.vehicleAccess) return
    // For now, just disable access (since vehicleAccess is an object, not array)
    const updatedAccess = { ...staff.vehicleAccess, isActive: false, revokedDate: new Date() }
    setStaff({ ...staff, vehicleAccess: updatedAccess })
    toast({
      title: "Åtkomst spärrad",
      description: "Fordonsåtkomst har spärrats."
    })
  }

  const generateVehicleCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleGenerateNewCode = async (accessId: string) => {
    if (!staff || !staff.vehicleAccess) return
    
    try {
      // 1. Spärra alla befintliga aktiva koder för denna employee
      if (staff.vehicleAccess && staff.vehicleAccess.isActive) {
        // Mark old code as blocked
        const oldAccess = { ...staff.vehicleAccess, isActive: false, status: 'spärrad', revokedDate: new Date() }
        setStaff({ ...staff, vehicleAccess: oldAccess })
      }

      // 2. Generera ny 6-siffrig kod
      const newCode = generateVehicleCode();
      
      // 3. Sätt giltighetstid (6 månader från idag)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      
      // 4. Skapa ny kod
      const newAccess = {
        ...staff.vehicleAccess,
        personalCode: newCode,
        status: 'aktiv',
        isActive: true,
        issuedDate: new Date(),
        expiryDate: expiryDate,
        createdBy: 'Admin', // Should be current user
        revokedDate: null
      }
      
      setStaff({ ...staff, vehicleAccess: newAccess })
      
      toast({
        title: "Ny fordonskod skapad!",
        description: `Ny 6-siffrig kod: ${newCode}. Gammal kod automatiskt spärrad.`
      })
      
    } catch (error) {
      console.error('Error creating new code:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa ny fordonskod",
        variant: "destructive"
      })
    }
  }

  const handleSendCodeEmail = async () => {
    if (!staff || !staff.vehicleAccess || !staff.vehicleAccess.personalCode) {
      toast({
        title: "Fel",
        description: "Ingen fordonskod att skicka",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/vehicle-access/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: staff.id,
          employeeName: staff.name,
          employeeEmail: staff.email,
          vehicleCode: staff.vehicleAccess.personalCode,
          expiryDate: staff.vehicleAccess.expiryDate
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      toast({
        title: "Email skickat!",
        description: `Fordonskod skickad till ${staff.email}`
      })
      
    } catch (error) {
      console.error('Error sending vehicle code email:', error)
      toast({
        title: "Email-fel",
        description: "Kunde inte skicka fordonskod via email",
        variant: "destructive"
      })
    }
  }

  const handleActivateAccess = () => {
    if (!staff || !staff.vehicleAccess) return
    // Reactivate the vehicle access
    const updatedAccess = { ...staff.vehicleAccess, isActive: true, status: 'aktiv', revokedDate: null }
    setStaff({ ...staff, vehicleAccess: updatedAccess })
    toast({
      title: "Åtkomst aktiverad",
      description: "Fordonsåtkomst har återaktiverats."
    })
  }

  const handleCreateVehicleAccess = () => {
    if (!staff) return
    
    // Generate 6-digit vehicle code
    const newCode = generateVehicleCode();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    
    // Create new vehicle access
    const newAccess = {
      personalCode: newCode,
      accessLevel: 'basic',
      authorizedVehicles: ['KeyGarage-787'],
      issuedDate: new Date(),
      expiryDate: expiryDate,
      isActive: true,
      status: 'aktiv',
      createdBy: 'Admin'
    }
    
    setStaff({ ...staff, vehicleAccess: newAccess })
    
    // Automatically mark "Fordonsåtkomst" onboarding step as completed
    autoCompleteOnboardingStep('vehicle', 'Fordonsåtkomst skapad')
    
    toast({
      title: "Fordonsåtkomst skapad",
      description: `Ny 6-siffrig fordonskod skapad: ${newAccess.personalCode}. Onboarding uppdaterad!`
    })
  }

  const handleCompleteOnboardingStep = (stepId: string) => {
    if (!staff || !staff.onboardingSteps) return
    
    const updatedSteps = staff.onboardingSteps.map((step: any) => 
      step.id === stepId 
        ? { ...step, completed: true, completedDate: new Date() }
        : step
    )
    
    // Calculate new progress
    const completedSteps = updatedSteps.filter((step: any) => step.completed).length
    const totalSteps = updatedSteps.length
    const newProgress = {
      ...staff.onboardingProgress,
      completedSteps,
      totalSteps
    }
    
    setStaff({ 
      ...staff, 
      onboardingSteps: updatedSteps, 
      onboardingProgress: newProgress 
    })
    
    toast({
      title: "Steg slutfört",
      description: "Onboarding-steget har markerats som slutfört."
    })
  }

  // Interactive Safety Training Functions
  const handleSafetyStepComplete = (stepIndex: number) => {
    if (!completedSafetySteps.includes(stepIndex)) {
      setCompletedSafetySteps([...completedSafetySteps, stepIndex])
      
      toast({
        title: "Steg slutfört!",
        description: `Du har slutfört steg ${stepIndex + 1} av säkerhetsutbildningen.`
      })
      
      // Check if all steps are completed
      const totalSteps = 5 // Total number of safety training steps
      if (completedSafetySteps.length + 1 >= totalSteps) {
        setSafetyTrainingCompleted(true)
        toast({
          title: "🎉 Säkerhetsutbildning slutförd!",
          description: "Du kan nu markera hela säkerhetsutbildningen som klar."
        })
      }
    }
  }

  const handleScenarioAnswer = (scenarioIndex: number, answer: string, isCorrect: boolean) => {
    setSelectedAnswer(answer)
    setShowFeedback(true)
    
    if (isCorrect) {
      setScenarioProgress({ ...scenarioProgress, [scenarioIndex]: true })
      
      // Auto-advance after showing feedback
      setTimeout(() => {
        setShowFeedback(false)
        setSelectedAnswer(null)
        if (scenarioIndex < 2) { // We have 3 scenarios (0, 1, 2)
          setCurrentScenario(scenarioIndex + 1)
        }
      }, 3000)
    }
  }

  const resetScenario = () => {
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  const completeSafetyTraining = () => {
    handleCompleteOnboardingStep('safety')
    toast({
      title: "🎉 Säkerhetsutbildning slutförd!",
      description: "Du har framgångsrikt slutfört all säkerhetsträning. Onboarding uppdaterad!"
    })
  }

  // Function to simulate Staff App login completion
  const completeStaffAppSetup = () => {
    autoCompleteOnboardingStep('app', 'Staff App-inlogg slutförd')
  }

  // Safety Training Data
  const safetySteps = [
    {
      id: 1,
      title: "🏋️ Bärteknik & Ryggsäkerhet",
      duration: "10 min",
      description: "Lär dig grundläggande lyftteknik för att skydda din rygg"
    },
    {
      id: 2,
      title: "💰 Upsell-möjligheter",
      duration: "15 min", 
      description: "Maximera provision genom smart försäljning"
    },
    {
      id: 3,
      title: "🚛 Lastbilspackning & Säkring",
      duration: "15 min",
      description: "Tetris-principen för säker transport"
    },
    {
      id: 4,
      title: "🏠 Problemlösning & Kundkommunikation", 
      duration: "10 min",
      description: "Hantera oväntade situationer professionellt"
    },
    {
      id: 5,
      title: "📋 Dokumentation & Avslut",
      duration: "5 min",
      description: "Skydda dig själv genom korrekt dokumentation"
    }
  ]

  const trainingScenarios = [
    {
      id: 1,
      title: "🎹 Piano-scenario",
      situation: "Du är mitt i en flytt när kunden säger:",
      customerDialog: "\"Åh, jag glömde nämna pianot i vardagsrummet... kan ni flytta det också?\"",
      answers: [
        { 
          id: "A", 
          text: "\"Det blir extra kostnad\"", 
          isCorrect: false,
          feedback: "För vagt! Kunden vet inte vad det kostar eller varför. Du får troligen motstånd."
        },
        { 
          id: "B", 
          text: "\"Vi försöker bara lyfta det\"", 
          isCorrect: false,
          feedback: "FARLIGT! Du riskerar ryggskada och pianot kan skadas. Företaget blir ansvarigt."
        },
        { 
          id: "C", 
          text: "\"Ett piano över 100kg kräver specialhantering för 2,000kr\"", 
          isCorrect: true,
          feedback: "PERFEKT! Du skyddar dig själv, förklarar värdet och tjänar 100kr provision. Professionellt!"
        }
      ],
      learningPoint: "Tunga föremål = säkerhet först + försäljningsmöjlighet"
    },
    {
      id: 2,
      title: "🛋️ Soffa-scenario", 
      situation: "Kunden visar sin antika lädersoffa och säger:",
      customerDialog: "\"Det är en väldigt dyr soffa från Italien. Tänk om den blir skadad...\"",
      answers: [
        { 
          id: "A", 
          text: "\"Vi är försiktiga\"", 
          isCorrect: false,
          feedback: "Inte övertygande! Kunden är fortfarande orolig och du missar en försäljning."
        },
        { 
          id: "B", 
          text: "\"Skyddsemballering för 200kr garanterar att soffan är 100% skyddad\"", 
          isCorrect: true,
          feedback: "UTMÄRKT! Du lugnar kunden, skyddar soffan och tjänar 10kr provision. Win-win!"
        },
        { 
          id: "C", 
          text: "\"Vi tar inget ansvar för skador\"", 
          isCorrect: false,
          feedback: "Katastrofalt! Kunden blir arg och kan klaga. Dålig kundservice skadar företaget."
        }
      ],
      learningPoint: "Kundens oro = din försäljningsmöjlighet"
    },
    {
      id: 3,
      title: "🗂️ Återvinning-scenario",
      situation: "Kunden pekar på en hög gamla möbler och säger:",
      customerDialog: "\"All den här skräpen... jag vet inte vad jag ska göra med allt det här.\"",
      answers: [
        { 
          id: "A", 
          text: "\"Det är inte vårt problem\"", 
          isCorrect: false,
          feedback: "Dålig service! Du missar en stor försäljning och kunden blir missnöjd."
        },
        { 
          id: "B", 
          text: "\"Vi kan ta hand om allt för 1,000kr - då slipper ni oroa er\"", 
          isCorrect: true,
          feedback: "FANTASTISKT! Du löser kundens problem och tjänar 50kr provision. Excellent service!"
        },
        { 
          id: "C", 
          text: "\"Ring kommunen själv\"", 
          isCorrect: false,
          feedback: "Oprofessionellt! Du hjälper inte kunden och missar en lukrativ försäljning."
        }
      ],
      learningPoint: "Kundens problem = din möjlighet att hjälpa OCH tjäna"
    }
  ]

  const handleSendContract = (contractId: string) => {
    if (!staff || !staff.contracts) return
    
    const updatedContracts = staff.contracts.map((contract: any) => 
      contract.id === contractId 
        ? { 
            ...contract, 
            status: 'sent', 
            sentDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        : contract
    )
    
    setStaff({ ...staff, contracts: updatedContracts })
    
    // Automatically mark "Anställningsavtal" onboarding step as completed
    handleCompleteOnboardingStep('contract')
    
    toast({
      title: "Avtal skickat",
      description: `Anställningsavtalet har skickats till ${staff.email}. Onboarding-steg markerat som slutfört!`
    })
  }

  // Auto-complete onboarding steps based on actions
  const autoCompleteOnboardingStep = (stepId: string, actionDescription: string) => {
    if (!staff || !staff.onboardingSteps) return
    
    // Check if step is already completed
    const step = staff.onboardingSteps.find((s: any) => s.id === stepId)
    if (step && step.completed) return
    
    handleCompleteOnboardingStep(stepId)
    
    toast({
      title: "🎉 Onboarding uppdaterad!",
      description: `${actionDescription} → Onboarding-steg automatiskt slutfört!`
    })
  }

  // Hantera kategori-ändring
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setNewAsset({...newAsset, category: value, type: ''})
    setAvailableTypes(equipmentTypes[value as keyof typeof equipmentTypes] || [])
  }

  // Generera startpaket
  const generateStartPackage = (position: string) => {
    const roleKey = position.replace(/\s+/g, '_').toLowerCase()
    const packageItems = startPackages[roleKey as keyof typeof startPackages] || []
    
    let totalCost = 0
    const newAssets: any[] = []
    
    packageItems.forEach((item, index) => {
      const assetItem = {
        id: `asset-${staff.id}-${Date.now()}-${index}`,
        type: item.type,
        name: item.type,
        category: item.category,
        size: (item.category === 'arbetskläder' || item.category === 'skyddsutrustning') ? 
               staff.clothingSize || 'M' : 'One Size',
        quantity: item.quantity,
        assignedDate: new Date(),
        distributedDate: new Date().toISOString().split('T')[0],
        status: 'utdelad',
        condition: 'new',
        originalCost: item.cost,
        currentValue: item.cost,
        supplier: 'Nordflytt Lager',
        expectedLifespan: item.category === 'teknik' ? 24 : 12,
        notes: `Del av startpaket för ${getRoleLabel(position)}`,
        returnDate: null
      }
      newAssets.push(assetItem)
      totalCost += item.cost * item.quantity
    })
    
    // Add to staff assets
    const updatedAssets = [...staff.assets, ...newAssets]
    setStaff({ ...staff, assets: updatedAssets })
    
    // Automatically mark "Arbetskläder" onboarding step as completed
    autoCompleteOnboardingStep('assets', 'Startpaket utdelat')
    
    toast({
      title: "Startpaket skapat",
      description: `${newAssets.length} tillgångar utdelade för totalt ${totalCost} kr. Onboarding uppdaterad!`
    })
  }

  // Generera säsongskläder
  const generateSeasonalClothing = () => {
    const winterItems = [
      {
        category: 'arbetskläder',
        type: 'Vinterjacka',
        cost: 899,
        quantity: 1
      },
      {
        category: 'arbetskläder', 
        type: 'Mössa med logga',
        cost: 199,
        quantity: 1
      }
    ]
    
    const newAssets: any[] = []
    winterItems.forEach((item, index) => {
      const assetItem = {
        id: `asset-${staff.id}-${Date.now()}-winter-${index}`,
        type: item.type,
        name: item.type,
        category: item.category,
        size: staff.clothingSize || 'M',
        quantity: item.quantity,
        assignedDate: new Date(),
        distributedDate: new Date().toISOString().split('T')[0],
        status: 'utdelad',
        condition: 'new',
        originalCost: item.cost,
        currentValue: item.cost,
        supplier: 'Nordflytt Lager',
        expectedLifespan: 12,
        notes: 'Säsongskläder - Vinter',
        returnDate: null
      }
      newAssets.push(assetItem)
    })
    
    const updatedAssets = [...staff.assets, ...newAssets]
    setStaff({ ...staff, assets: updatedAssets })
    
    toast({
      title: "Vinterkläder tillagda",
      description: `${newAssets.length} vintertillgångar utdelade.`
    })
  }

  const handleIssueAsset = () => {
    if (!staff || !newAsset.type.trim() || !newAsset.category) return
    
    // Create new asset
    const newAssetItem = {
      id: `asset-${staff.id}-${Date.now()}`,
      type: newAsset.type,
      name: newAsset.type,
      category: newAsset.category,
      size: newAsset.size || 'One Size',
      quantity: newAsset.quantity,
      assignedDate: new Date(),
      distributedDate: newAsset.distributedDate,
      status: newAsset.status,
      condition: 'new',
      originalCost: parseInt(newAsset.cost) || 0,
      currentValue: parseInt(newAsset.cost) || 0,
      supplier: newAsset.supplier || 'Okänd',
      expectedLifespan: newAsset.expectedLifespan,
      notes: newAsset.notes || '',
      returnDate: null
    }
    
    // Add to staff assets
    const updatedAssets = [...staff.assets, newAssetItem]
    setStaff({ ...staff, assets: updatedAssets })
    
    // Reset form
    setNewAsset({
      category: '',
      type: '',
      size: '',
      quantity: 1,
      cost: '',
      supplier: '',
      status: 'utdelad',
      expectedLifespan: 12,
      distributedDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setAvailableTypes([])
    setSelectedCategory('')
    setIsNewAssetOpen(false)
    
    toast({
      title: "Tillgång utdelad",
      description: `${newAssetItem.name} har utdelats till ${staff.name}.`
    })
  }


  const fetchStaff = async () => {
    // Hjälpfunktion för att uppdatera staff-data (kopierad från useEffect)
    try {
      const response = await fetch(`/api/employees/${staffId}`)
      if (response.ok) {
        const result = await response.json()
        const employeeData = result.data || result.employee || result
        const employee = {
          ...employeeData,
          hireDate: employeeData.hire_date ? new Date(employeeData.hire_date) : new Date(),
          contracts: employeeData.contracts || {}
        }
        setStaff(employee)
      }
    } catch (error) {
      console.error('Fel vid uppdatering av staff:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar profil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Anställd hittades inte</h3>
          <p className="mt-1 text-sm text-gray-500">Den anställde du letar efter existerar inte.</p>
          <Link href="/crm/anstallda" className="mt-4 inline-block">
            <Button>Tillbaka till Personal</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm/anstallda">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till Personal
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#002A5C] flex items-center justify-center text-white text-xl font-bold">
              {staff.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{staff.name}</h1>
              <p className="text-gray-600">{getRoleLabel(staff.role)} • {staff.department}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/crm/anstallda/${staff.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Redigera
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Badge className={getStatusColor(staff.status)}>
                {getStatusLabel(staff.status)}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">Status</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-xl font-bold">{staff.rating}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Betyg</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <span className="text-xl font-bold">{staff.totalJobsCompleted}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Slutförda</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <span className="text-xl font-bold">{staff.assets.length}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Tillgångar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <span className="text-xl font-bold">{staff.vehicleAccess?.authorizedVehicles?.length || 0}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Fordonsaccess</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <span className="text-xl font-bold text-green-600">{staff.onboardingProgress ? Math.round((staff.onboardingProgress.completedSteps / staff.onboardingProgress.totalSteps) * 100) : 0}%</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Onboarding</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="contracts">Avtal</TabsTrigger>
          <TabsTrigger value="assets">Tillgångar</TabsTrigger>
          <TabsTrigger value="vehicle">Fordonsaccess</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="timereports">Tidsrapporter</TabsTrigger>
          <TabsTrigger value="performance">Prestanda</TabsTrigger>
          <TabsTrigger value="offboarding" className={cn(
            "text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700",
            staff.status === 'uppsagd' && "bg-red-100"
          )}>
            Offboarding
          </TabsTrigger>
        </TabsList>

        {/* ÖVERSIKT TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personuppgifter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">E-post</label>
                    <p className="text-sm">{staff.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefon</label>
                    <p className="text-sm">{staff.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Adress</label>
                    <p className="text-sm">{staff.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nödkontakt</label>
                    <p className="text-sm">{staff.emergencyContact}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">Anteckningar</label>
                  <p className="text-sm mt-1">{staff.notes}</p>
                </div>
              </CardContent>
            </Card>

            {/* Work Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Arbetsinformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Roll</label>
                  <div className="mt-1">
                    <Badge className={getRoleColor(staff.role)}>
                      {getRoleLabel(staff.role)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Avdelning</label>
                  <p className="text-sm mt-1">{staff.department}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Anställningsdatum</label>
                  <p className="text-sm mt-1">{staff.hireDate instanceof Date ? staff.hireDate.toLocaleDateString('sv-SE') : new Date(staff.hireDate).toLocaleDateString('sv-SE')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Anställningsform</label>
                  <p className="text-sm mt-1">Heltid</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AVTAL TAB - FÖRBÄTTRAD MED NYA KOMPONENTER */}
        <TabsContent value="contracts" className="space-y-6">
          <ContractManagement
            staffId={staff.id}
            staffName={staff.name}
            staffRole={staff.role}
            staffEmail={staff.email}
            contracts={staff.contracts || {}}
          />
        </TabsContent>

        {/* TILLGÅNGAR TAB */}
        <TabsContent value="assets" className="space-y-6">
          {/* Snabbåtgärder */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-[#002A5C]">Snabbåtgärder</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2">
                <Button 
                  onClick={() => generateStartPackage(staff.role)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Lägg till Startpaket
                </Button>
                <Button 
                  onClick={handleEditStartPackage}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={generateSeasonalClothing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Snowflake className="h-4 w-4 mr-2" />
                  Lägg till Vinterkläder
                </Button>
                <Button 
                  onClick={handleEditWinterPackage}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-[#002A5C]" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Totalt Tillgångar</p>
                    <p className="text-2xl font-bold">{staff.assets.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ursprungligt Värde</p>
                    <p className="text-2xl font-bold">{calculateOriginalAssetValue().toLocaleString('sv-SE')} kr</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Nuvarande Värde</p>
                    <p className="text-2xl font-bold">{calculateTotalAssetValue().toLocaleString('sv-SE')} kr</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tillgångsdokument sektion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AssetDocumentGenerator
              employeeId={staffId}
              employeeName={staff.name}
              employeeEmail={staff.email}
              employeeRole={getRoleLabel(staff.role)}
              assets={staff.assets}
              onDocumentGenerated={handleAssetDocumentGenerated}
            />
            
            <AssetDocumentStatus
              document={assetDocument}
              employeeEmail={staff.email}
              employeeId={staffId}
              onDocumentSent={handleAssetDocumentSent}
              onDocumentSigned={handleAssetDocumentSigned}
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Utdelade Tillgångar
                </CardTitle>
                <Dialog open={isNewAssetOpen} onOpenChange={setIsNewAssetOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Utdela Tillgång
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Utdela Ny Tillgång</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <div>
                        <Label>Kategori *</Label>
                        <select 
                          value={newAsset.category} 
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Välj kategori</option>
                          <option value="arbetskläder">Arbetskläder</option>
                          <option value="skyddsutrustning">Skyddsutrustning</option>
                          <option value="verktyg">Verktyg & Utrustning</option>
                          <option value="teknik">Teknik & Telefon</option>
                          <option value="fordon">Fordonsutrustning</option>
                          <option value="städ">Städutrustning</option>
                        </select>
                      </div>
                      
                      {availableTypes.length > 0 && (
                        <div>
                          <Label>Typ *</Label>
                          <select 
                            value={newAsset.type} 
                            onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Välj typ</option>
                            {availableTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {(newAsset.category === 'arbetskläder' || newAsset.category === 'skyddsutrustning') && (
                        <div>
                          <Label>Storlek</Label>
                          <Input 
                            value={newAsset.size} 
                            onChange={(e) => setNewAsset({...newAsset, size: e.target.value})} 
                            placeholder={staff?.clothingSize || "S, M, L, XL"}
                            defaultValue={staff?.clothingSize}
                          />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Kostnad (SEK) *</Label>
                          <Input 
                            type="number" 
                            value={newAsset.cost}
                            onChange={(e) => setNewAsset({...newAsset, cost: e.target.value})}
                            placeholder="599" 
                            required 
                          />
                        </div>
                        
                        <div>
                          <Label>Leverantör</Label>
                          <Input 
                            value={newAsset.supplier}
                            onChange={(e) => setNewAsset({...newAsset, supplier: e.target.value})}
                            placeholder="Stadium, Biltema etc." 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Status *</Label>
                          <select 
                            value={newAsset.status} 
                            onChange={(e) => setNewAsset({...newAsset, status: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Välj status</option>
                            <option value="på-lager">På lager</option>
                            <option value="utdelad">Utdelad</option>
                            <option value="återlämnad">Återlämnad</option>
                            <option value="förlorad">Förlorad/Skadad</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label>Förväntad livslängd (månader)</Label>
                          <Input 
                            type="number" 
                            value={newAsset.expectedLifespan}
                            onChange={(e) => setNewAsset({...newAsset, expectedLifespan: parseInt(e.target.value) || 12})}
                            placeholder="12" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Antal</Label>
                          <Input 
                            type="number" 
                            value={newAsset.quantity} 
                            onChange={(e) => setNewAsset({...newAsset, quantity: parseInt(e.target.value) || 1})} 
                          />
                        </div>
                        
                        {newAsset.status === 'utdelad' && (
                          <div>
                            <Label>Utdelningsdatum *</Label>
                            <Input 
                              type="date" 
                              value={newAsset.distributedDate}
                              onChange={(e) => setNewAsset({...newAsset, distributedDate: e.target.value})}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Anteckningar</Label>
                        <Textarea 
                          value={newAsset.notes}
                          onChange={(e) => setNewAsset({...newAsset, notes: e.target.value})}
                          placeholder="Eventuella anteckningar..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => {
                          setIsNewAssetOpen(false)
                          setNewAsset({
                            category: '',
                            type: '',
                            size: '',
                            quantity: 1,
                            cost: '',
                            supplier: '',
                            status: 'utdelad',
                            expectedLifespan: 12,
                            distributedDate: new Date().toISOString().split('T')[0],
                            notes: ''
                          })
                          setAvailableTypes([])
                          setSelectedCategory('')
                        }}>
                          Avbryt
                        </Button>
                        <Button 
                          onClick={handleIssueAsset}
                          disabled={!newAsset.category || !newAsset.type || !newAsset.cost}
                        >
                          Utdela
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {staff.assets.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="mb-2">Inga tillgångar utdelade än</p>
                  <p className="text-sm">Använd "Skapa Startpaket" eller "Utdela Tillgång" för att komma igång</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left font-medium text-gray-700">Typ</th>
                        <th className="p-3 text-left font-medium text-gray-700">Storlek</th>
                        <th className="p-3 text-left font-medium text-gray-700">Status</th>
                        <th className="p-3 text-left font-medium text-gray-700">Kostnad</th>
                        <th className="p-3 text-left font-medium text-gray-700">Utdelad</th>
                        <th className="p-3 text-left font-medium text-gray-700">Leverantör</th>
                        <th className="p-3 text-right font-medium text-gray-700">Åtgärder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.assets.map((asset: any) => (
                        <tr key={asset.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              {getCategoryIcon(asset.category)}
                              <div>
                                <div className="font-medium">{asset.name || asset.type}</div>
                                <div className="text-sm text-gray-500">
                                  <Badge variant="outline" className="text-xs">
                                    {getCategoryLabel(asset.category)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            {asset.size || 'One Size'}
                            {asset.quantity > 1 && (
                              <div className="text-xs text-gray-500">
                                Antal: {asset.quantity}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge className={getAssetStatusColor(asset.status)}>
                              {getAssetStatusLabel(asset.status)}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            <div className="font-medium">{asset.originalCost || asset.cost || 0} kr</div>
                            {asset.currentValue !== asset.originalCost && (
                              <div className="text-xs text-gray-500">
                                Nu: {asset.currentValue || 0} kr
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {asset.distributedDate ? 
                              new Date(asset.distributedDate).toLocaleDateString('sv-SE') :
                              asset.assignedDate ? 
                                new Date(asset.assignedDate).toLocaleDateString('sv-SE') : 
                                'Okänt'
                            }
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {asset.supplier || 'Okänd'}
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end space-x-2">
                              {asset.status === 'utdelat' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-green-600 hover:bg-green-50 border-green-200"
                                    onClick={() => handleReturnAsset(asset.id)}
                                  >
                                    <Archive className="h-3 w-3 mr-1" />
                                    Återlämna
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 hover:bg-red-50 border-red-200"
                                    onClick={() => handleMarkLost(asset.id)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Förlorad
                                  </Button>
                                </>
                              )}
                              {asset.status === 'återlämnad' && (
                                <span className="text-xs text-gray-500">Returnerad</span>
                              )}
                              {asset.status === 'förlorad' && (
                                <span className="text-xs text-red-500">Förlorad</span>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 border-red-200"
                                onClick={() => handleDeleteAsset(asset.id)}
                                title="Ta bort tillgång permanent"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORDONSACCESS TAB */}
        <TabsContent value="vehicle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Fordonsåtkomst
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.vehicleAccess ? (
                  <>
                    {/* Förbättrad kodvisning */}
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold">🚗 KeyGarage 787 Fordonskod</h4>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          staff.vehicleAccess.status === 'aktiv' || staff.vehicleAccess.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {(staff.vehicleAccess.status || (staff.vehicleAccess.isActive ? 'AKTIV' : 'SPÄRRAD')).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Kod:</span>
                          <div className="font-mono font-bold text-2xl text-blue-600 mt-1">
                            {staff.vehicleAccess.personalCode}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Giltig till:</span>
                          <div className="font-medium mt-1">
                            {staff.vehicleAccess.expiryDate instanceof Date ? 
                              staff.vehicleAccess.expiryDate.toLocaleDateString('sv-SE') : 
                              new Date(staff.vehicleAccess.expiryDate).toLocaleDateString('sv-SE')
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Skapad:</span>
                          <div>
                            {staff.vehicleAccess.issuedDate instanceof Date ? 
                              staff.vehicleAccess.issuedDate.toLocaleDateString('sv-SE') : 
                              new Date(staff.vehicleAccess.issuedDate).toLocaleDateString('sv-SE')
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Skapad av:</span>
                          <div>{staff.vehicleAccess.createdBy || 'Admin'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Åtgärder */}
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={() => handleGenerateNewCode('main')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Ny Kod
                      </Button>
                      
                      <Button
                        onClick={handleSendCodeEmail}
                        disabled={!staff.vehicleAccess.personalCode || staff.vehicleAccess.status === 'spärrad'}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Mail className="w-4 h-4" />
                        Skicka Email
                      </Button>
                      
                      <Button
                        onClick={staff.vehicleAccess.isActive !== false ? () => handleRevokeAccess('main') : handleActivateAccess}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          staff.vehicleAccess.isActive !== false 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {staff.vehicleAccess.isActive !== false ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Spärra
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Aktivera
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Säkerhetsinformation */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">⚠️ Säkerhet & Ansvar</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• <strong>Personlig kod:</strong> Får ALDRIG delas med andra</li>
                        <li>• <strong>Loggning:</strong> All användning loggas i ABUS KeyGarage 787</li>
                        <li>• <strong>Ansvar:</strong> Personal ansvarar för skador vid kodanvändning</li>
                        <li>• <strong>Åtkomst:</strong> 06:00-23:00 dagligen</li>
                        <li>• <strong>Placering:</strong> Kodlås vid vänster bakdäck, vid skärmen</li>
                        <li>• <strong>Användning:</strong> Slå in 6-siffrig kod → Ta/lämna nyckel</li>
                      </ul>
                    </div>

                    {/* Platsinformation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-blue-800 mb-2">📍 Låsboxens Placering</h4>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">🚛</div>
                        <div>
                          <p className="text-sm text-blue-700 font-medium">
                            Kodlåset sitter vid <strong>vänster bakdäck</strong>
                          </p>
                          <p className="text-xs text-blue-600">
                            Leta vid skärmen på lastbilen
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admin påminnelser */}
                    {(() => {
                      const createdAt = staff.vehicleAccess.issuedDate instanceof Date ? 
                        staff.vehicleAccess.issuedDate : new Date(staff.vehicleAccess.issuedDate);
                      const monthsSinceCreation = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
                      return monthsSinceCreation >= 5 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-yellow-800 mb-2">🔔 Admin Påminnelse</h4>
                          <p className="text-sm text-yellow-700">
                            Koden skapades för {monthsSinceCreation} månader sedan. 
                            Överväg att förnya för säkerhet.
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-4">Ingen fordonsåtkomst tilldelad</p>
                    <Button onClick={handleCreateVehicleAccess}>
                      <Plus className="h-4 w-4 mr-2" />
                      Skapa fordonsåtkomst
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Senaste Åtkomst
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.accessLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        log.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {log.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{log.action === 'unlock' ? 'Låste upp' : 'Låste'} fordon</p>
                        <p className="text-sm text-gray-600">{log.timestamp.toLocaleString('sv-SE')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{log.location}</p>
                      <p className="text-xs text-gray-500">{log.success ? 'Framgångsrik' : 'Misslyckad'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONBOARDING TAB */}
        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Introduktionsprocess
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Progress value={staff.onboardingProgress ? Math.round((staff.onboardingProgress.completedSteps / staff.onboardingProgress.totalSteps) * 100) : 0} className="w-32" />
                  <span className="text-sm font-medium">{staff.onboardingProgress ? Math.round((staff.onboardingProgress.completedSteps / staff.onboardingProgress.totalSteps) * 100) : 0}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.onboardingSteps.map((step: any) => (
                  <div key={step.id} className="space-y-4">
                    {/* Original step design */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div 
                        className="flex items-center space-x-4 cursor-pointer flex-1"
                        onClick={() => {
                          if ((step.name === 'Säkerhetsutbildning' || step.name === 'Systemtillgång') && !step.completed) {
                            setExpandedOnboardingStep(
                              expandedOnboardingStep === step.id ? null : step.id
                            )
                          }
                        }}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          step.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                        )}>
                          {step.completed ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            (step.name === 'Säkerhetsutbildning' || step.name === 'Systemtillgång') && !step.completed 
                              ? 'text-blue-600 hover:text-blue-800' 
                              : ''
                          }`}>
                            {step.name}
                            {(step.name === 'Säkerhetsutbildning' || step.name === 'Systemtillgång') && !step.completed && (
                              <span className="ml-2 text-sm text-blue-500">→ Klicka för träning</span>
                            )}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Badge className={getOnboardingCategoryColor(step.category)}>
                              {getOnboardingCategoryIcon(step.category)}
                              <span className="ml-1">{step.category}</span>
                            </Badge>
                            {step.completed && (
                              <span>• Slutförd: {step.completedDate instanceof Date ? step.completedDate.toLocaleDateString('sv-SE') : new Date(step.completedDate).toLocaleDateString('sv-SE')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {step.completed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Slutförd
                          </Badge>
                        ) : (
                          <Button size="sm" onClick={() => handleCompleteOnboardingStep(step.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Markera som slutförd
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Interactive Safety Training */}
                    {expandedOnboardingStep === step.id && step.name === 'Säkerhetsutbildning' && (
                      <div className="ml-12 border-l-2 border-blue-200 pl-6 py-4 bg-blue-50 rounded-r-lg">
                        <h4 className="font-semibold text-blue-800 mb-4">🎯 Interaktiv Säkerhetsutbildning</h4>
                        <p className="text-sm text-blue-700 mb-6">
                          Klicka igenom träningen steg för steg. Genomför praktiska scenarios för att lära dig säkerhet och upsell-teknik.
                        </p>
                        
                        {/* Progress Overview */}
                        <div className="bg-white p-4 rounded-lg border mb-6">
                          <h5 className="font-medium text-blue-800 mb-3">📊 Tränings-progression</h5>
                          <div className="grid grid-cols-5 gap-2">
                            {safetySteps.map((step, index) => (
                              <div 
                                key={step.id}
                                className={cn(
                                  "p-2 rounded text-xs text-center cursor-pointer transition-colors",
                                  completedSafetySteps.includes(index) 
                                    ? "bg-green-100 text-green-800 border border-green-300" 
                                    : currentSafetyStep === index
                                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                                    : "bg-gray-100 text-gray-600 border border-gray-300"
                                )}
                                onClick={() => setCurrentSafetyStep(index)}
                              >
                                <div className="font-semibold">Steg {step.id}</div>
                                <div className="text-xs mt-1">{step.duration}</div>
                                {completedSafetySteps.includes(index) && (
                                  <CheckCircle className="h-3 w-3 mx-auto mt-1" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Current Step Content */}
                        <div className="bg-white p-6 rounded-lg border">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium text-blue-800 text-lg">
                              {safetySteps[currentSafetyStep]?.title}
                            </h5>
                            <Badge variant="secondary">{safetySteps[currentSafetyStep]?.duration}</Badge>
                          </div>
                          <p className="text-sm text-blue-700 mb-6">
                            {safetySteps[currentSafetyStep]?.description}
                          </p>

                          {/* Step 1: Lifting Technique */}
                          {currentSafetyStep === 0 && (
                            <div className="space-y-4">
                              <div className="bg-red-50 p-4 rounded">
                                <h6 className="font-semibold mb-3 text-red-800">🚨 Grundläggande lyftteknik:</h6>
                                <ul className="space-y-2 text-red-700 text-sm">
                                  <li>• <strong>Rak rygg alltid:</strong> Böj knäna, INTE ryggen</li>
                                  <li>• <strong>Nära kroppen:</strong> Håll föremålet så nära magen som möjligt</li>
                                  <li>• <strong>Fötterna stadigt:</strong> Axelbredd mellan fötterna</li>
                                  <li>• <strong>Vrid inte:</strong> Flytta fötterna istället för att vrida ryggen</li>
                                </ul>
                              </div>
                              <div className="bg-blue-50 p-4 rounded">
                                <h6 className="font-semibold mb-3 text-blue-800">💰 När sälja tunga lyft istället:</h6>
                                <ul className="space-y-2 text-blue-700 text-sm">
                                  <li>• Föremål över 50kg för en person</li>
                                  <li>• Piano, kassaskåp, stor vitvarukyl</li>
                                  <li>• <strong>Pris:</strong> 1,000-2,000kr = 50-100kr provision</li>
                                </ul>
                              </div>
                              <Button 
                                onClick={() => handleSafetyStepComplete(0)}
                                className="w-full"
                                disabled={completedSafetySteps.includes(0)}
                              >
                                {completedSafetySteps.includes(0) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Slutfört: Bärteknik & Ryggsäkerhet
                                  </>
                                ) : (
                                  "Slutför Bärteknik & Ryggsäkerhet"
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Step 2: Interactive Scenarios */}
                          {currentSafetyStep === 1 && (
                            <div className="space-y-6">
                              <div className="bg-yellow-50 p-4 rounded">
                                <h6 className="font-semibold mb-3 text-yellow-800">💼 Praktiska upsell-scenarios</h6>
                                <p className="text-sm text-yellow-700">
                                  Lär dig hantera verkliga kundmöten och tjäna provision
                                </p>
                              </div>

                              {/* Current Scenario */}
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h6 className="font-semibold mb-4 text-gray-800">
                                  {trainingScenarios[currentScenario]?.title}
                                </h6>
                                
                                <div className="bg-gray-50 p-4 rounded mb-4">
                                  <p className="text-sm text-gray-700 mb-2">
                                    {trainingScenarios[currentScenario]?.situation}
                                  </p>
                                  <div className="bg-blue-100 p-3 rounded italic text-blue-800">
                                    {trainingScenarios[currentScenario]?.customerDialog}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <p className="font-medium text-gray-800">Hur svarar du?</p>
                                  {trainingScenarios[currentScenario]?.answers.map((answer) => (
                                    <div key={answer.id}>
                                      <Button
                                        variant={selectedAnswer === answer.id ? "default" : "outline"}
                                        className="w-full text-left justify-start h-auto p-3"
                                        onClick={() => handleScenarioAnswer(currentScenario, answer.id, answer.isCorrect)}
                                        disabled={showFeedback}
                                      >
                                        <span className="font-medium mr-3">{answer.id})</span>
                                        {answer.text}
                                      </Button>
                                      
                                      {/* Show feedback */}
                                      {showFeedback && selectedAnswer === answer.id && (
                                        <div className={cn(
                                          "mt-2 p-3 rounded text-sm",
                                          answer.isCorrect 
                                            ? "bg-green-50 border border-green-200 text-green-800"
                                            : "bg-red-50 border border-red-200 text-red-800"
                                        )}>
                                          <div className="flex items-center gap-2 mb-2">
                                            {answer.isCorrect ? (
                                              <>
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="font-semibold">RÄTT SVAR!</span>
                                              </>
                                            ) : (
                                              <>
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="font-semibold">FEL SVAR</span>
                                              </>
                                            )}
                                          </div>
                                          <p>{answer.feedback}</p>
                                          {answer.isCorrect && (
                                            <div className="mt-2 text-xs bg-green-100 p-2 rounded">
                                              💡 <strong>Lärdom:</strong> {trainingScenarios[currentScenario]?.learningPoint}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Scenario navigation */}
                                <div className="flex justify-between mt-6">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setCurrentScenario(Math.max(0, currentScenario - 1))}
                                    disabled={currentScenario === 0}
                                  >
                                    Föregående scenario
                                  </Button>
                                  <div className="text-sm text-gray-600 flex items-center">
                                    Scenario {currentScenario + 1} av {trainingScenarios.length}
                                  </div>
                                  <Button 
                                    variant="outline"
                                    onClick={() => setCurrentScenario(Math.min(trainingScenarios.length - 1, currentScenario + 1))}
                                    disabled={currentScenario === trainingScenarios.length - 1}
                                  >
                                    Nästa scenario
                                  </Button>
                                </div>
                              </div>

                              <Button 
                                onClick={() => handleSafetyStepComplete(1)}
                                className="w-full"
                                disabled={completedSafetySteps.includes(1) || Object.keys(scenarioProgress).length < 3}
                              >
                                {completedSafetySteps.includes(1) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Slutfört: Upsell-möjligheter
                                  </>
                                ) : (
                                  `Slutför Upsell-träning (${Object.keys(scenarioProgress).length}/3 scenarios)`
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Step 3: Truck Packing */}
                          {currentSafetyStep === 2 && (
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-4 rounded">
                                <h6 className="font-semibold mb-3 text-blue-800">🚛 Tetris-principen:</h6>
                                <ul className="space-y-2 text-blue-700 text-sm">
                                  <li>• <strong>Tungt först:</strong> Vitvaror, bokhyllor längst in</li>
                                  <li>• <strong>Väggstöd:</strong> Madrasser och speglar mot väggarna</li>
                                  <li>• <strong>Fyll luckor:</strong> Småsaker i alla mellanrum</li>
                                  <li>• <strong>Lätt sist:</strong> Kläder och kuddar överst</li>
                                </ul>
                              </div>
                              <div className="bg-red-50 p-4 rounded">
                                <h6 className="font-semibold mb-3 text-red-800">🔒 Säkringsregler:</h6>
                                <ul className="space-y-2 text-red-700 text-sm">
                                  <li>• <strong>Spännband:</strong> Korsbandning över hela lasset</li>
                                  <li>• <strong>Ingenting löst:</strong> Allt ska vara säkrat</li>
                                  <li>• <strong>Viktfördelning:</strong> Jämn belastning</li>
                                </ul>
                              </div>
                              <Button 
                                onClick={() => handleSafetyStepComplete(2)}
                                className="w-full"
                                disabled={completedSafetySteps.includes(2)}
                              >
                                {completedSafetySteps.includes(2) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Slutfört: Lastbilspackning & Säkring
                                  </>
                                ) : (
                                  "Slutför Lastbilspackning & Säkring"
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Step 4: Problem Solving */}
                          {currentSafetyStep === 3 && (
                            <div className="space-y-4">
                              <div className="bg-yellow-50 p-4 rounded">
                                <h6 className="font-semibold mb-3 text-yellow-800">🔧 Vanliga problem & lösningar:</h6>
                                <div className="space-y-3 text-sm text-yellow-700">
                                  <div>
                                    <strong>Problem:</strong> Möbler passar inte genom dörr<br/>
                                    <strong>Lösning:</strong> Demontering-tjänst 250kr eller alternativ rutt
                                  </div>
                                  <div>
                                    <strong>Problem:</strong> Mer volym än bokat<br/>
                                    <strong>Lösning:</strong> "Vi har 15m³ mer än bokat - extra kostnad eller andra turen"
                                  </div>
                                </div>
                              </div>
                              <Button 
                                onClick={() => handleSafetyStepComplete(3)}
                                className="w-full"
                                disabled={completedSafetySteps.includes(3)}
                              >
                                {completedSafetySteps.includes(3) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Slutfört: Problemlösning & Kundkommunikation
                                  </>
                                ) : (
                                  "Slutför Problemlösning & Kundkommunikation"
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Step 5: Documentation */}
                          {currentSafetyStep === 4 && (
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-4 rounded">
                                <h6 className="font-semibold mb-3 text-blue-800">📋 Dokumentation för skydd:</h6>
                                <ul className="space-y-2 text-blue-700 text-sm">
                                  <li>• <strong>Före flytten:</strong> Foto på övergripande situation</li>
                                  <li>• <strong>Under flytten:</strong> Dokumentera befintliga skador</li>
                                  <li>• <strong>Efter flytten:</strong> Foto på slutresultat</li>
                                </ul>
                              </div>
                              <div className="bg-green-50 p-4 rounded">
                                <h6 className="font-semibold mb-3 text-green-800">📱 Registrera i Staff App:</h6>
                                <ul className="space-y-2 text-green-700 text-sm">
                                  <li>• Alla tillval som sålts (provision räknas automatiskt)</li>
                                  <li>• Eventuella problem eller specialförhållanden</li>
                                  <li>• Tid för extra tjänster</li>
                                </ul>
                              </div>
                              <Button 
                                onClick={() => handleSafetyStepComplete(4)}
                                className="w-full"
                                disabled={completedSafetySteps.includes(4)}
                              >
                                {completedSafetySteps.includes(4) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Slutfört: Dokumentation & Avslut
                                  </>
                                ) : (
                                  "Slutför Dokumentation & Avslut"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Complete Safety Training */}
                        {safetyTrainingCompleted && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-green-800">🎉 Grattis! Säkerhetsutbildning slutförd</h5>
                                <p className="text-sm text-green-700">Du har slutfört alla 5 steg av säkerhetsutbildningen</p>
                              </div>
                            </div>
                            <Button 
                              onClick={completeSafetyTraining}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              Markera hela säkerhetsutbildningen som slutförd
                            </Button>
                          </div>
                        )}

                        {/* Safety Rules Summary */}
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-6">
                          <h5 className="font-medium text-red-800 mb-3">⚠️ Kritiska säkerhetsregler (ALLA ROLLER):</h5>
                          <div className="space-y-2 text-sm text-red-700">
                            <div><strong>Arbetssäkerhet:</strong> Använd alltid skyddsutrustning, lyft aldrig över din kapacitet</div>
                            <div><strong>Egendomsskydd:</strong> Dokumentera skador som fanns innan du kom</div>
                            <div><strong>Kommunikation:</strong> Informera kund om alla problem och förändringar</div>
                            <div><strong>Eskalering:</strong> Ring arbetsledning vid osäkerhet - bättre säkert än ledset</div>
                            <div><strong>Provision-regel:</strong> Sälja tillval ÄR ditt jobb - det hjälper både kund och företag</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expandable content for Systemtillgång */}
                    {expandedOnboardingStep === step.id && step.name === 'Systemtillgång' && (
                      <div className="ml-12 border-l-2 border-green-200 pl-6 py-4 bg-green-50 rounded-r-lg">
                        <h4 className="font-semibold text-green-800 mb-4">📱 Staff App Utbildning - Praktisk Guide</h4>
                        <p className="text-sm text-green-700 mb-6">Lär dig använda Staff App:en för att checka in, dokumentera arbetet och registrera försäljning</p>
                        
                        <div className="space-y-6">
                          {/* Steg 1: Komma igång */}
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium text-green-800 mb-3">📱 Steg 1: Komma igång (5 min)</h5>
                            <div className="space-y-3 text-sm">
                              <div className="bg-blue-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">Ladda ner och logga in:</h6>
                                <ol className="space-y-1 text-blue-800">
                                  <li>1. Sök "Nordflytt Staff" i App Store/Google Play</li>
                                  <li>2. Ladda ner och installera appen</li>
                                  <li>3. Öppna appen och tryck "Logga in"</li>
                                  <li>4. Ange din email: <code className="bg-white px-1 rounded">{staff.email}</code></li>
                                  <li>5. Ange lösenord (du får det via SMS från HR)</li>
                                  <li>6. Godkänn GPS-behörighet (KRÄVS för check-in)</li>
                                  <li>7. Godkänn kamera-behörighet (KRÄVS för foton)</li>
                                </ol>
                              </div>
                              <div className="bg-green-50 p-2 rounded text-green-800 text-xs">
                                ✅ <strong>Kontrollera:</strong> Du ser startsidan med "Välkommen {staff.name}"
                              </div>
                            </div>
                          </div>

                          {/* Steg 2: Dagliga rutiner */}
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium text-green-800 mb-3">📅 Steg 2: Dagliga rutiner (10 min)</h5>
                            <div className="space-y-3 text-sm">
                              <div className="bg-blue-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">Check-in på uppdrag:</h6>
                                <ol className="space-y-1 text-blue-800">
                                  <li>1. Öppna appen när du kommer till uppdragsplatsen</li>
                                  <li>2. Tryck på dagens uppdrag i listan</li>
                                  <li>3. Tryck "Checka in" (GPS kontrollerar att du är på plats)</li>
                                  <li>4. VIKTIGT: Checka in vid EXAKT starttid - inte tidigare!</li>
                                </ol>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">Schema och information:</h6>
                                <ul className="space-y-1 text-yellow-800">
                                  <li>• "Schema" - se alla dina uppdrag för veckan</li>
                                  <li>• "Uppdragsinformation" - kund, adress, specialinstruktioner</li>
                                  <li>• "Kontakta team" - ring arbetsledning direkt från appen</li>
                                </ul>
                              </div>
                              <div className="bg-red-50 p-2 rounded text-red-800 text-xs">
                                ⚠️ <strong>VIKTIGT:</strong> Ingen betalning utan korrekt check-in!
                              </div>
                            </div>
                          </div>

                          {/* Steg 3: Foto-dokumentation */}
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium text-green-800 mb-3">📸 Steg 3: Foto-dokumentation (10 min)</h5>
                            <div className="space-y-3 text-sm">
                              <div className="bg-blue-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">När ska du fota:</h6>
                                <ul className="space-y-1 text-blue-800">
                                  <li>• <strong>FÖRE:</strong> Lägenhet/hus innan du börjar</li>
                                  <li>• <strong>UNDER:</strong> Skador du upptäcker (inte ditt fel)</li>
                                  <li>• <strong>EFTER:</strong> Hur det ser ut när du är klar</li>
                                  <li>• <strong>VOLYM:</strong> Faktisk mängd föremål (för justering)</li>
                                </ul>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">Hur tar du foton i appen:</h6>
                                <ol className="space-y-1 text-yellow-800">
                                  <li>1. Gå till ditt aktiva uppdrag</li>
                                  <li>2. Tryck "Dokumentera" eller kamera-ikonen</li>
                                  <li>3. Välj fototyp: Före/Under/Efter/Volym</li>
                                  <li>4. Ta fotot och lägg till kommentar vid behov</li>
                                  <li>5. Fotot laddas upp automatiskt</li>
                                </ol>
                              </div>
                              <div className="bg-green-50 p-2 rounded text-green-800 text-xs">
                                💡 <strong>Tips:</strong> Fler foton = bättre skydd mot klagomål = behåll all lön
                              </div>
                            </div>
                          </div>

                          {/* Steg 4: Registrera tillval/försäljning */}
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium text-green-800 mb-3">💰 Steg 4: Registrera tillval/försäljning (10 min)</h5>
                            <div className="space-y-3 text-sm">
                              <div className="bg-blue-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">Så registrerar du försäljning:</h6>
                                <ol className="space-y-1 text-blue-800">
                                  <li>1. Gå till "Tillval" i ditt aktiva uppdrag</li>
                                  <li>2. Tryck "Lägg till tillval"</li>
                                  <li>3. Välj tjänst från prislistan (ex: Tunga lyft 2,000kr)</li>
                                  <li>4. Bekräfta med kunden innan du registrerar</li>
                                  <li>5. Din provision beräknas automatiskt (5% av priset)</li>
                                </ol>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">Vanliga tillval och provision:</h6>
                                <ul className="space-y-1 text-yellow-800">
                                  <li>• Tunga lyft över 100kg: 2,000kr = <strong>100kr provision</strong></li>
                                  <li>• Skyddsemballering: 200kr = <strong>10kr provision</strong></li>
                                  <li>• Återvinning: 1,000kr = <strong>50kr provision</strong></li>
                                  <li>• Extra städning: 500kr = <strong>25kr provision</strong></li>
                                </ul>
                              </div>
                              <div className="bg-green-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">Se din månadsförsäljning:</h6>
                                <p className="text-green-800">"Min profil" → "Försäljning" → se total provision denna månad</p>
                              </div>
                            </div>
                          </div>

                          {/* Steg 5: Avsluta uppdrag */}
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium text-green-800 mb-3">✅ Steg 5: Avsluta uppdrag (5 min)</h5>
                            <div className="space-y-3 text-sm">
                              <div className="bg-blue-50 p-3 rounded">
                                <h6 className="font-semibold mb-2">Check-out och rapportering:</h6>
                                <ol className="space-y-1 text-blue-800">
                                  <li>1. Tryck "Checka ut" när uppdraget är klart</li>
                                  <li>2. Fyll i eventuella kommentarer för kunden</li>
                                  <li>3. Rapportera problem om det uppstått några</li>
                                  <li>4. Bekräfta att allt material är hämtat/levererat</li>
                                  <li>5. Uppdraget markeras som slutfört</li>
                                </ol>
                              </div>
                              <div className="bg-green-50 p-2 rounded text-green-800 text-xs">
                                ✅ <strong>Klart:</strong> Din arbetstid och provision registreras automatiskt
                              </div>
                            </div>
                          </div>

                          {/* Vanliga problem */}
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h5 className="font-medium text-red-800 mb-3">⚠️ Vanliga problem och lösningar:</h5>
                            <div className="space-y-2 text-sm text-red-700">
                              <div><strong>GPS fungerar inte:</strong> Kontrollera att du gett appen plats-behörighet</div>
                              <div><strong>Kan inte checka in:</strong> Du är för långt från uppdragsadressen (max 50m)</div>
                              <div><strong>Foton laddas inte upp:</strong> Kontrollera internetanslutning och försök igen</div>
                              <div><strong>Glömt lösenord:</strong> Tryck "Glömt lösenord" eller ring HR</div>
                              <div><strong>Appen kraschar:</strong> Starta om appen, uppdatera till senaste version</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRESTANDA TAB */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab staff={staff} setStaff={setStaff} />
        </TabsContent>

        {/* TIDSRAPPORTER TAB */}
        <TabsContent value="timereports" className="space-y-6">
          <EmployeeTimeReports 
            employeeId={staffId} 
            employeeName={staff.name} 
          />
        </TabsContent>

        {/* OFFBOARDING TAB */}
        <TabsContent value="offboarding" className="space-y-6">
          <OffboardingTab staff={staff} setStaff={setStaff} />
        </TabsContent>
      </Tabs>

      {/* Edit Package Modal */}
      <Dialog open={isEditPackageOpen} onOpenChange={setIsEditPackageOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Redigera {editingPackageType === 'start' ? 'Startpaket' : 'Vinterpaket'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Anpassa innehållet i {editingPackageType === 'start' ? 'startpaketet' : 'vinterpaketet'}
              </p>
              <Button onClick={handleAddPackageItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Lägg till artikel
              </Button>
            </div>
            
            <div className="space-y-3">
              {editPackageItems.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-3 p-3 border rounded-lg">
                  <div>
                    <Label className="text-xs">Kategori</Label>
                    <select 
                      value={item.category} 
                      onChange={(e) => handleUpdatePackageItem(index, 'category', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="arbetskläder">Arbetskläder</option>
                      <option value="skyddsutrustning">Skyddsutrustning</option>
                      <option value="verktyg">Verktyg & Utrustning</option>
                      <option value="teknik">Teknik & Telefon</option>
                      <option value="fordon">Fordonsutrustning</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Typ</Label>
                    <Input 
                      value={item.type}
                      onChange={(e) => handleUpdatePackageItem(index, 'type', e.target.value)}
                      className="text-sm"
                      placeholder="T-shirt, Handskar etc."
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Kostnad (kr)</Label>
                    <Input 
                      type="number"
                      value={item.cost}
                      onChange={(e) => handleUpdatePackageItem(index, 'cost', parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Antal</Label>
                    <Input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdatePackageItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="text-sm"
                      min="1"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={() => handleRemovePackageItem(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {editPackageItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Inga artiklar i paketet. Klicka "Lägg till artikel" för att börja.
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Totalt: {editPackageItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0)} kr
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditPackageOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleSavePackageEdit}>
                  Spara ändringar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}