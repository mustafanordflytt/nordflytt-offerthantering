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
import { 
  Car, 
  Truck, 
  Key, 
  Plus, 
  Search, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Activity,
  Lock,
  Unlock,
  RefreshCw,
  Bell,
  History,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Vehicle {
  id: string
  registrationNumber: string
  make: string
  model: string
  year: number
  type: 'van' | 'truck' | 'car' | 'trailer'
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service'
  currentLocation?: string
  mileage: number
  fuelLevel?: number
  lastService?: Date
  nextService?: Date
  insuranceExpiry: Date
  inspectionExpiry: Date
  notes?: string
}

interface VehicleAccess {
  id: string
  vehicleId: string
  employeeId: string
  employeeName: string
  personalCode: string
  accessLevel: 'basic' | 'advanced' | 'admin'
  isActive: boolean
  grantedDate: Date
  expiryDate?: Date
  revokedDate?: Date
  revokedBy?: string
  lastUsed?: Date
  usageCount: number
  notes?: string
}

interface AccessLog {
  id: string
  vehicleId: string
  employeeId: string
  employeeName: string
  action: 'unlock' | 'lock' | 'start' | 'stop' | 'emergency'
  timestamp: Date
  location?: string
  success: boolean
  code?: string
  notes?: string
}

const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-001',
    registrationNumber: 'ABC 123',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2022,
    type: 'van',
    status: 'available',
    currentLocation: 'Stockholm Depot',
    mileage: 45000,
    fuelLevel: 75,
    lastService: new Date('2024-01-15'),
    nextService: new Date('2024-04-15'),
    insuranceExpiry: new Date('2024-12-31'),
    inspectionExpiry: new Date('2024-11-30'),
    notes: 'Huvudbil för Stockholm-området'
  },
  {
    id: 'vehicle-002',
    registrationNumber: 'DEF 456',
    make: 'Volvo',
    model: 'FH',
    year: 2021,
    type: 'truck',
    status: 'in_use',
    currentLocation: 'Göteborg',
    mileage: 87000,
    fuelLevel: 45,
    lastService: new Date('2024-01-10'),
    nextService: new Date('2024-04-10'),
    insuranceExpiry: new Date('2024-12-31'),
    inspectionExpiry: new Date('2024-10-15'),
    notes: 'Långdistanstransporter'
  },
  {
    id: 'vehicle-003',
    registrationNumber: 'GHI 789',
    make: 'Ford',
    model: 'Transit',
    year: 2020,
    type: 'van',
    status: 'maintenance',
    currentLocation: 'Verkstad Malmö',
    mileage: 92000,
    fuelLevel: 20,
    lastService: new Date('2024-01-05'),
    nextService: new Date('2024-02-05'),
    insuranceExpiry: new Date('2024-12-31'),
    inspectionExpiry: new Date('2024-09-30'),
    notes: 'Bromsreparation pågår'
  }
]

const mockVehicleAccess: VehicleAccess[] = [
  {
    id: 'access-001',
    vehicleId: 'vehicle-001',
    employeeId: 'staff-001',
    employeeName: 'Lars Andersson',
    personalCode: 'LA2401',
    accessLevel: 'admin',
    isActive: true,
    grantedDate: new Date('2024-01-15'),
    lastUsed: new Date('2024-01-20'),
    usageCount: 45,
    notes: 'Huvudansvarig för flottan'
  },
  {
    id: 'access-002',
    vehicleId: 'vehicle-001',
    employeeId: 'staff-003',
    employeeName: 'Johan Karlsson',
    personalCode: 'JK2403',
    accessLevel: 'basic',
    isActive: true,
    grantedDate: new Date('2024-01-10'),
    lastUsed: new Date('2024-01-19'),
    usageCount: 23,
    notes: 'Ordinarie chaufför'
  },
  {
    id: 'access-003',
    vehicleId: 'vehicle-002',
    employeeId: 'staff-005',
    employeeName: 'Peter Svensson',
    personalCode: 'PS2405',
    accessLevel: 'advanced',
    isActive: false,
    grantedDate: new Date('2024-01-08'),
    revokedDate: new Date('2024-01-18'),
    revokedBy: 'Lars Andersson',
    lastUsed: new Date('2024-01-17'),
    usageCount: 12,
    notes: 'Tillfälligt spärrad - semester'
  }
]

const mockAccessLogs: AccessLog[] = [
  {
    id: 'log-001',
    vehicleId: 'vehicle-001',
    employeeId: 'staff-003',
    employeeName: 'Johan Karlsson',
    action: 'unlock',
    timestamp: new Date('2024-01-20T08:30:00'),
    location: 'Stockholm Depot',
    success: true,
    code: 'JK2403',
    notes: 'Morgontur till Södermalm'
  },
  {
    id: 'log-002',
    vehicleId: 'vehicle-001',
    employeeId: 'staff-003',
    employeeName: 'Johan Karlsson',
    action: 'lock',
    timestamp: new Date('2024-01-20T16:45:00'),
    location: 'Stockholm Depot',
    success: true,
    code: 'JK2403',
    notes: 'Återkommen från uppdrag'
  },
  {
    id: 'log-003',
    vehicleId: 'vehicle-002',
    employeeId: 'staff-005',
    employeeName: 'Peter Svensson',
    action: 'unlock',
    timestamp: new Date('2024-01-19T14:20:00'),
    location: 'Göteborg',
    success: false,
    code: 'PS2405',
    notes: 'Kod spärrad - kontakta admin'
  }
]

export default function VehicleAccessPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles)
  const [vehicleAccess, setVehicleAccess] = useState<VehicleAccess[]>(mockVehicleAccess)
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(mockAccessLogs)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vehicleFilter, setVehicleFilter] = useState<string>('all')
  const [isNewAccessOpen, setIsNewAccessOpen] = useState(false)
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('vehicles')
  const [selectedAccess, setSelectedAccess] = useState<VehicleAccess | null>(null)
  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false)
  
  const [newAccess, setNewAccess] = useState({
    vehicleId: '',
    employeeId: '',
    employeeName: '',
    accessLevel: 'basic' as VehicleAccess['accessLevel'],
    expiryDate: '',
    notes: ''
  })
  
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'van' as Vehicle['type'],
    mileage: 0,
    insuranceExpiry: '',
    inspectionExpiry: '',
    notes: ''
  })

  const generatePersonalCode = (employeeName: string) => {
    const initials = employeeName.split(' ').map(n => n[0]).join('').toUpperCase()
    const year = new Date().getFullYear().toString().slice(-2)
    const random = Math.floor(Math.random() * 90) + 10
    return `${initials}${year}${random}`
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredAccess = vehicleAccess.filter(access => {
    const matchesSearch = access.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         access.personalCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVehicle = vehicleFilter === 'all' || access.vehicleId === vehicleFilter
    return matchesSearch && matchesVehicle
  })

  const getVehicleStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'in_use': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_service': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVehicleStatusIcon = (status: Vehicle['status']) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />
      case 'in_use': return <Activity className="h-4 w-4" />
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />
      case 'out_of_service': return <XCircle className="h-4 w-4" />
      default: return <Car className="h-4 w-4" />
    }
  }

  const getVehicleStatusLabel = (status: Vehicle['status']) => {
    const labels = {
      available: 'Tillgänglig',
      in_use: 'I bruk',
      maintenance: 'Underhåll',
      out_of_service: 'Ur funktion'
    }
    return labels[status]
  }

  const getVehicleTypeIcon = (type: Vehicle['type']) => {
    switch (type) {
      case 'van': return <Car className="h-4 w-4" />
      case 'truck': return <Truck className="h-4 w-4" />
      case 'car': return <Car className="h-4 w-4" />
      case 'trailer': return <Truck className="h-4 w-4" />
      default: return <Car className="h-4 w-4" />
    }
  }

  const getAccessLevelColor = (level: VehicleAccess['accessLevel']) => {
    switch (level) {
      case 'basic': return 'bg-gray-100 text-gray-800'
      case 'advanced': return 'bg-blue-100 text-blue-800'
      case 'admin': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccessLevelLabel = (level: VehicleAccess['accessLevel']) => {
    const labels = {
      basic: 'Grundläggande',
      advanced: 'Avancerad',
      admin: 'Administratör'
    }
    return labels[level]
  }

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'Okänt fordon'
  }

  const handleCreateAccess = () => {
    const personalCode = generatePersonalCode(newAccess.employeeName)
    const access: VehicleAccess = {
      id: `access-${Date.now()}`,
      vehicleId: newAccess.vehicleId,
      employeeId: newAccess.employeeId,
      employeeName: newAccess.employeeName,
      personalCode,
      accessLevel: newAccess.accessLevel,
      isActive: true,
      grantedDate: new Date(),
      expiryDate: newAccess.expiryDate ? new Date(newAccess.expiryDate) : undefined,
      usageCount: 0,
      notes: newAccess.notes
    }
    
    setVehicleAccess([...vehicleAccess, access])
    setNewAccess({
      vehicleId: '',
      employeeId: '',
      employeeName: '',
      accessLevel: 'basic',
      expiryDate: '',
      notes: ''
    })
    setIsNewAccessOpen(false)
  }

  const handleCreateVehicle = () => {
    const vehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      registrationNumber: newVehicle.registrationNumber,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      type: newVehicle.type,
      status: 'available',
      mileage: newVehicle.mileage,
      insuranceExpiry: new Date(newVehicle.insuranceExpiry),
      inspectionExpiry: new Date(newVehicle.inspectionExpiry),
      notes: newVehicle.notes
    }
    
    setVehicles([...vehicles, vehicle])
    setNewVehicle({
      registrationNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'van',
      mileage: 0,
      insuranceExpiry: '',
      inspectionExpiry: '',
      notes: ''
    })
    setIsNewVehicleOpen(false)
  }

  const handleRevokeAccess = (accessId: string) => {
    setVehicleAccess(vehicleAccess.map(access => 
      access.id === accessId 
        ? { ...access, isActive: false, revokedDate: new Date(), revokedBy: 'Admin' }
        : access
    ))
  }

  const handleActivateAccess = (accessId: string) => {
    setVehicleAccess(vehicleAccess.map(access => 
      access.id === accessId 
        ? { ...access, isActive: true, revokedDate: undefined, revokedBy: undefined }
        : access
    ))
  }

  const handleRegenerateCode = (accessId: string) => {
    const access = vehicleAccess.find(a => a.id === accessId)
    if (access) {
      const newCode = generatePersonalCode(access.employeeName)
      setVehicleAccess(vehicleAccess.map(a => 
        a.id === accessId 
          ? { ...a, personalCode: newCode }
          : a
      ))
    }
  }

  // Calculate stats
  const totalVehicles = vehicles.length
  const availableVehicles = vehicles.filter(v => v.status === 'available').length
  const inUseVehicles = vehicles.filter(v => v.status === 'in_use').length
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length
  const totalAccess = vehicleAccess.length
  const activeAccess = vehicleAccess.filter(a => a.isActive).length
  const revokedAccess = vehicleAccess.filter(a => !a.isActive).length
  const recentLogs = accessLogs.filter(log => 
    new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fordonsaccess & Kodhantering</h1>
          <p className="text-gray-600">Hantera fordonsåtkomst och personliga koder</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isNewVehicleOpen} onOpenChange={setIsNewVehicleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Nytt Fordon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrera Nytt Fordon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registrationNumber">Registreringsnummer</Label>
                    <Input
                      id="registrationNumber"
                      placeholder="ABC 123"
                      value={newVehicle.registrationNumber}
                      onChange={(e) => setNewVehicle({...newVehicle, registrationNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Fordonstyp</Label>
                    <Select 
                      value={newVehicle.type} 
                      onValueChange={(value) => setNewVehicle({...newVehicle, type: value as Vehicle['type']})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="van">Skåpbil</SelectItem>
                        <SelectItem value="truck">Lastbil</SelectItem>
                        <SelectItem value="car">Personbil</SelectItem>
                        <SelectItem value="trailer">Släp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="make">Märke</Label>
                    <Input
                      id="make"
                      placeholder="Mercedes"
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Modell</Label>
                    <Input
                      id="model"
                      placeholder="Sprinter"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Årsmodell</Label>
                    <Input
                      id="year"
                      type="number"
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear()})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mileage">Mätarställning</Label>
                    <Input
                      id="mileage"
                      type="number"
                      placeholder="0"
                      value={newVehicle.mileage}
                      onChange={(e) => setNewVehicle({...newVehicle, mileage: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insuranceExpiry">Försäkring utgår</Label>
                    <Input
                      id="insuranceExpiry"
                      type="date"
                      value={newVehicle.insuranceExpiry}
                      onChange={(e) => setNewVehicle({...newVehicle, insuranceExpiry: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="inspectionExpiry">Besiktning utgår</Label>
                    <Input
                      id="inspectionExpiry"
                      type="date"
                      value={newVehicle.inspectionExpiry}
                      onChange={(e) => setNewVehicle({...newVehicle, inspectionExpiry: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Anteckningar</Label>
                  <Textarea
                    id="notes"
                    placeholder="Eventuella anteckningar..."
                    value={newVehicle.notes}
                    onChange={(e) => setNewVehicle({...newVehicle, notes: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewVehicleOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleCreateVehicle}>
                    Registrera Fordon
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isNewAccessOpen} onOpenChange={setIsNewAccessOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#002A5C] hover:bg-[#001a42]">
                <Plus className="mr-2 h-4 w-4" />
                Ge Åtkomst
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ge Fordonsåtkomst</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeName">Anställd</Label>
                    <Input
                      id="employeeName"
                      placeholder="Namn på anställd"
                      value={newAccess.employeeName}
                      onChange={(e) => setNewAccess({...newAccess, employeeName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleId">Fordon</Label>
                    <Select 
                      value={newAccess.vehicleId} 
                      onValueChange={(value) => setNewAccess({...newAccess, vehicleId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj fordon" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accessLevel">Åtkomstnivå</Label>
                    <Select 
                      value={newAccess.accessLevel} 
                      onValueChange={(value) => setNewAccess({...newAccess, accessLevel: value as VehicleAccess['accessLevel']})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Grundläggande - Lås upp/låsa</SelectItem>
                        <SelectItem value="advanced">Avancerad - Inkl. motorstart</SelectItem>
                        <SelectItem value="admin">Administratör - Full åtkomst</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Utgångsdatum (valfritt)</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={newAccess.expiryDate}
                      onChange={(e) => setNewAccess({...newAccess, expiryDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Anteckningar</Label>
                  <Textarea
                    id="notes"
                    placeholder="Eventuella anteckningar..."
                    value={newAccess.notes}
                    onChange={(e) => setNewAccess({...newAccess, notes: e.target.value})}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Personlig kod kommer att genereras automatiskt</h4>
                  <p className="text-sm text-blue-700">
                    En unik personlig kod kommer att skapas baserat på användarens initialer och aktuellt år.
                    Koden kan användas för att låsa upp fordonet och starta motorn beroende på åtkomstnivå.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewAccessOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleCreateAccess}>
                    Ge Åtkomst
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt Fordon</p>
                <p className="text-2xl font-bold">{totalVehicles}</p>
                <p className="text-xs text-gray-500">{availableVehicles} tillgängliga</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Key className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktiva Åtkomster</p>
                <p className="text-2xl font-bold text-green-600">{activeAccess}</p>
                <p className="text-xs text-gray-500">{totalAccess} totalt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Lock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Spärrade</p>
                <p className="text-2xl font-bold text-red-600">{revokedAccess}</p>
                <p className="text-xs text-gray-500">Åtkomster</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktivitet (24h)</p>
                <p className="text-2xl font-bold text-blue-600">{recentLogs}</p>
                <p className="text-xs text-gray-500">Åtkomstförsök</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vehicles">Fordon</TabsTrigger>
          <TabsTrigger value="access">Åtkomster</TabsTrigger>
          <TabsTrigger value="logs">Loggar</TabsTrigger>
          <TabsTrigger value="codes">Kodhantering</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
          {/* Vehicle Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtrera Fordon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Sök efter registreringsnummer, märke eller modell..."
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
                    <SelectItem value="available">Tillgänglig</SelectItem>
                    <SelectItem value="in_use">I bruk</SelectItem>
                    <SelectItem value="maintenance">Underhåll</SelectItem>
                    <SelectItem value="out_of_service">Ur funktion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Vehicles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getVehicleTypeIcon(vehicle.type)}
                      <span className="ml-2 font-medium">{vehicle.registrationNumber}</span>
                    </div>
                    <Badge className={cn("flex items-center gap-1", getVehicleStatusColor(vehicle.status))}>
                      {getVehicleStatusIcon(vehicle.status)}
                      {getVehicleStatusLabel(vehicle.status)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{vehicle.make} {vehicle.model}</CardTitle>
                  <CardDescription>Årsmodell {vehicle.year}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mätarställning:</span>
                      <span>{vehicle.mileage.toLocaleString('sv-SE')} km</span>
                    </div>
                    {vehicle.currentLocation && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Plats:</span>
                        <span>{vehicle.currentLocation}</span>
                      </div>
                    )}
                    {vehicle.fuelLevel && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bränsle:</span>
                        <span>{vehicle.fuelLevel}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Försäkring:</span>
                      <span className={cn(
                        vehicle.insuranceExpiry < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      )}>
                        {vehicle.insuranceExpiry.toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Besiktning:</span>
                      <span className={cn(
                        vehicle.inspectionExpiry < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      )}>
                        {vehicle.inspectionExpiry.toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Åtkomster:</span>
                      <span className="font-medium">
                        {vehicleAccess.filter(a => a.vehicleId === vehicle.id && a.isActive).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          {/* Access Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtrera Åtkomster</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Sök efter anställd eller kod..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Fordon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla Fordon</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Access List */}
          <Card>
            <CardHeader>
              <CardTitle>Åtkomster ({filteredAccess.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Anställd
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fordon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kod
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Åtkomstnivå
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Åtgärder
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAccess.map((access) => (
                      <tr key={access.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                                {access.employeeName.split(' ').map(n => n[0]).join('')}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{access.employeeName}</div>
                              <div className="text-sm text-gray-500">
                                Sedan: {access.grantedDate.toLocaleDateString('sv-SE')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getVehicleName(access.vehicleId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {access.usageCount} användningar
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {access.personalCode}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getAccessLevelColor(access.accessLevel)}>
                            {getAccessLevelLabel(access.accessLevel)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {access.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aktiv
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Spärrad
                              </Badge>
                            )}
                          </div>
                          {access.lastUsed && (
                            <div className="text-xs text-gray-500 mt-1">
                              Senast: {access.lastUsed.toLocaleDateString('sv-SE')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {access.isActive ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeAccess(access.id)}
                              >
                                <Lock className="h-4 w-4 mr-1" />
                                Spärra
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivateAccess(access.id)}
                              >
                                <Unlock className="h-4 w-4 mr-1" />
                                Aktivera
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRegenerateCode(access.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Access Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Åtkomstloggar</CardTitle>
              <CardDescription>Senaste aktiviteter för fordonsåtkomst</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        log.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {log.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {log.employeeName} - {log.action === 'unlock' ? 'Låste upp' : 'Låste'} fordon
                        </div>
                        <div className="text-xs text-gray-500">
                          {getVehicleName(log.vehicleId)} • {log.timestamp.toLocaleString('sv-SE')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-gray-600">{log.code}</div>
                      {log.location && (
                        <div className="text-xs text-gray-500">{log.location}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes" className="space-y-6">
          {/* Code Management */}
          <Card>
            <CardHeader>
              <CardTitle>Kodhantering</CardTitle>
              <CardDescription>Hantera personliga koder och säkerhetsinställningar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">Säkerhetsinställningar</span>
                  </div>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Koder roteras automatiskt var 90:e dag</li>
                      <li>Maximalt 3 misslyckade försök innan spärr</li>
                      <li>Alla åtkomstförsök loggas</li>
                      <li>Notifikationer skickas vid uppsägning</li>
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Aktiva Koder</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {vehicleAccess.filter(a => a.isActive).map((access) => (
                          <div key={access.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="text-sm font-medium">{access.employeeName}</div>
                              <div className="text-xs text-gray-500">
                                {getVehicleName(access.vehicleId)}
                              </div>
                            </div>
                            <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                              {access.personalCode}
                            </code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Spärrade Koder</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {vehicleAccess.filter(a => !a.isActive).map((access) => (
                          <div key={access.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <div>
                              <div className="text-sm font-medium">{access.employeeName}</div>
                              <div className="text-xs text-gray-500">
                                Spärrad: {access.revokedDate?.toLocaleDateString('sv-SE')}
                              </div>
                            </div>
                            <code className="text-sm font-mono bg-white px-2 py-1 rounded text-red-600">
                              {access.personalCode}
                            </code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}