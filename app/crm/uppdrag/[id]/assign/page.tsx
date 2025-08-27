'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Users,
  User,
  Calendar,
  Clock,
  MapPin,
  Save,
  UserCheck,
  UserX,
  Search,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  bookingNumber: string
  customerName: string
  fromAddress: string
  toAddress: string
  moveDate: string
  moveTime: string
  status: string
  priority: string
  assignedStaff: string[]
  estimatedHours: number
  totalPrice: number
  notes: string
}

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: string
  skills: string[]
  availability: {
    [key: string]: {
      available: boolean
      startTime?: string
      endTime?: string
      assignedJobs?: string[]
    }
  }
  isActive: boolean
}

// Mock staff data - in real app this would come from API
const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'Erik Andersson',
    email: 'erik@nordflytt.se',
    phone: '+46 70 123 45 67',
    role: 'Flyttchef',
    skills: ['Tunga lyft', 'Planering', 'Kundkontakt'],
    availability: {},
    isActive: true
  },
  {
    id: '2',
    name: 'Anna Svensson',
    email: 'anna@nordflytt.se',
    phone: '+46 70 234 56 78',
    role: 'Flyttare',
    skills: ['Packning', 'Städning', 'Piano'],
    availability: {},
    isActive: true
  },
  {
    id: '3',
    name: 'Marcus Johansson',
    email: 'marcus@nordflytt.se',
    phone: '+46 70 345 67 89',
    role: 'Flyttare',
    skills: ['Tunga lyft', 'Lastbil', 'Montering'],
    availability: {},
    isActive: true
  },
  {
    id: '4',
    name: 'Sofia Lindberg',
    email: 'sofia@nordflytt.se',
    phone: '+46 70 456 78 90',
    role: 'Flyttassistent',
    skills: ['Packning', 'Städning', 'Kundkontakt'],
    availability: {},
    isActive: true
  },
  {
    id: '5',
    name: 'Henrik Karlsson',
    email: 'henrik@nordflytt.se',
    phone: '+46 70 567 89 01',
    role: 'Lastbilschaufför',
    skills: ['Lastbil', 'Tunga lyft', 'Navigering'],
    availability: {},
    isActive: true
  }
]

export default function AssignStaffPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [staff, setStaff] = useState<Staff[]>(mockStaff)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string)
    }
  }, [params.id])

  const fetchJob = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/crm/jobs/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job')
      }
      const data = await response.json()
      setJob(data.job)
      setSelectedStaff(data.job.assignedStaff || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStaffToggle = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  const handleSaveAssignment = async () => {
    if (!job) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/crm/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assignedStaff: selectedStaff 
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update assignment')
      }
      
      router.push(`/crm/uppdrag/${job.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignment')
    } finally {
      setIsSaving(false)
    }
  }

  // Filter staff based on search and role
  const filteredStaff = staff.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === 'all' || person.role === roleFilter
    
    return matchesSearch && matchesRole && person.isActive
  })

  const getSelectedStaffDetails = () => {
    return staff.filter(person => selectedStaff.includes(person.id))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Flyttchef': return 'bg-blue-100 text-blue-800'
      case 'Lastbilschaufför': return 'bg-green-100 text-green-800'
      case 'Flyttare': return 'bg-yellow-100 text-yellow-800'
      case 'Flyttassistent': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar uppdrag...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error: {error || 'Uppdrag hittades inte'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Gå tillbaka
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tilldela Personal</h1>
            <p className="text-gray-600">{job.bookingNumber} - {job.customerName}</p>
          </div>
        </div>
        <Button onClick={handleSaveAssignment} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sparar...' : 'Spara Tilldelning'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Uppdragsinformation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {new Date(job.moveDate).toLocaleDateString('sv-SE')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{job.moveTime}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-green-600 mt-1" />
                <span className="text-sm">{job.fromAddress.split(',')[0]}</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-red-600 mt-1" />
                <span className="text-sm">{job.toAddress.split(',')[0]}</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Beräknad tid:</span>
                  <p className="font-medium">{job.estimatedHours}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Pris:</span>
                  <p className="font-medium">{job.totalPrice.toLocaleString('sv-SE')} kr</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Tillgänglig Personal
            </CardTitle>
            <CardDescription>
              Välj personal som ska tilldelas detta uppdrag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök personal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrera på roll" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla roller</SelectItem>
                  <SelectItem value="Flyttchef">Flyttchef</SelectItem>
                  <SelectItem value="Lastbilschaufför">Lastbilschaufför</SelectItem>
                  <SelectItem value="Flyttare">Flyttare</SelectItem>
                  <SelectItem value="Flyttassistent">Flyttassistent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Staff List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStaff.map((person) => (
                <div
                  key={person.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStaff.includes(person.id)
                      ? 'border-[#002A5C] bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleStaffToggle(person.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedStaff.includes(person.id)}
                      onChange={() => handleStaffToggle(person.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{person.name}</h4>
                        <Badge className={getRoleColor(person.role)}>
                          {person.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{person.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {person.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredStaff.length === 0 && (
                <div className="text-center py-4">
                  <UserX className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Ingen personal hittades</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Staff Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Vald Personal ({selectedStaff.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStaff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Ingen personal vald</p>
                <p className="text-xs text-gray-500 mt-1">
                  Välj personal från listan till vänster
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getSelectedStaffDetails().map((person) => (
                  <div key={person.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{person.name}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStaffToggle(person.id)}
                        className="h-auto p-1 text-red-600 hover:text-red-700"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge className={getRoleColor(person.role)}>
                      {person.role}
                    </Badge>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{person.phone}</p>
                    </div>
                  </div>
                ))}
                
                <div className="pt-3 border-t">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Sammanfattning:</p>
                    <p>• {selectedStaff.length} personer tilldelade</p>
                    <p>• Beräknad kostnad: {(selectedStaff.length * 500).toLocaleString('sv-SE')} kr/tim</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedStaff.length > 0 && (
                <p>
                  {selectedStaff.length} personer valda för uppdraget
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/crm/uppdrag/${job.id}`}>
                <Button variant="outline">
                  Avbryt
                </Button>
              </Link>
              <Button 
                onClick={handleSaveAssignment} 
                disabled={isSaving}
                className="bg-[#002A5C] hover:bg-[#001a42]"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Sparar...' : 'Spara Tilldelning'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}