'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Users,
  User,
  Save,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  type: string
  customerName: string
  customerEmail: string
  customerPhone: string
  assignedTo: string | null
  assignedToName: string | null
  createdAt: string
}

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  specialties: string[]
  currentWorkload: number
  maxTickets: number
  isActive: boolean
  lastActivity: string
}

// Mock data
const mockTicket: Ticket = {
  id: '1',
  ticketNumber: 'TK-2024-001',
  title: 'Skada på möbler under flytt',
  status: 'open',
  priority: 'high',
  type: 'complaint',
  customerName: 'Mustafa Abdulkarim',
  customerEmail: 'mustafa.abdulkarim@hotmail.com',
  customerPhone: '+46 72 368 39 67',
  assignedTo: null,
  assignedToName: null,
  createdAt: '2025-01-15T10:30:00Z'
}

const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    name: 'Erik Andersson',
    email: 'erik@nordflytt.se',
    phone: '+46 70 123 45 67',
    role: 'Kundsupport chef',
    department: 'Kundsupport',
    specialties: ['Klagomål', 'Eskalering', 'Ledning'],
    currentWorkload: 3,
    maxTickets: 10,
    isActive: true,
    lastActivity: '2025-01-15T14:30:00Z'
  },
  {
    id: 'staff-2',
    name: 'Sofia Lindberg',
    email: 'sofia@nordflytt.se',
    phone: '+46 70 234 56 78',
    role: 'Kundsupport agent',
    department: 'Kundsupport',
    specialties: ['Fakturering', 'Administration', 'Allmänna frågor'],
    currentWorkload: 7,
    maxTickets: 15,
    isActive: true,
    lastActivity: '2025-01-15T13:45:00Z'
  },
  {
    id: 'staff-3',
    name: 'Henrik Karlsson',
    email: 'henrik@nordflytt.se',
    phone: '+46 70 345 67 89',
    role: 'Teknisk support',
    department: 'IT',
    specialties: ['Tekniska problem', 'Webbsida', 'System'],
    currentWorkload: 2,
    maxTickets: 8,
    isActive: true,
    lastActivity: '2025-01-15T12:15:00Z'
  },
  {
    id: 'staff-4',
    name: 'Anna Svensson',
    email: 'anna@nordflytt.se',
    phone: '+46 70 456 78 90',
    role: 'Kvalitetsansvarig',
    department: 'Kvalitet',
    specialties: ['Kvalitetskontroll', 'Klagomål', 'Förbättringar'],
    currentWorkload: 1,
    maxTickets: 5,
    isActive: true,
    lastActivity: '2025-01-15T11:00:00Z'
  },
  {
    id: 'staff-5',
    name: 'Marcus Johansson',
    email: 'marcus@nordflytt.se',
    phone: '+46 70 567 89 01',
    role: 'Ekonomiassistent',
    department: 'Ekonomi',
    specialties: ['Fakturering', 'Betalningar', 'Ekonomi'],
    currentWorkload: 5,
    maxTickets: 12,
    isActive: false,
    lastActivity: '2025-01-14T16:30:00Z'
  }
]

export default function AssignTicketPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(mockTicket)
  const [staff, setStaff] = useState<Staff[]>(mockStaff)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [assignmentNote, setAssignmentNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Filter staff based on search, department, and active status
  const filteredStaff = staff.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.specialties.some(specialty => 
                           specialty.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesDepartment = departmentFilter === 'all' || person.department === departmentFilter
    
    return matchesSearch && matchesDepartment && person.isActive
  })

  // Get recommended staff based on ticket type and workload
  const getRecommendedStaff = () => {
    if (!ticket) return []
    
    const typeSpecialtyMap: Record<string, string[]> = {
      'complaint': ['Klagomål', 'Kvalitetskontroll'],
      'billing': ['Fakturering', 'Betalningar', 'Ekonomi'],
      'technical': ['Tekniska problem', 'System', 'Webbsida'],
      'inquiry': ['Allmänna frågor', 'Kundsupport'],
      'general': ['Allmänna frågor']
    }
    
    const relevantSpecialties = typeSpecialtyMap[ticket.type] || []
    
    return filteredStaff
      .filter(person => 
        relevantSpecialties.some(specialty => 
          person.specialties.includes(specialty)
        )
      )
      .sort((a, b) => {
        // Sort by workload (lower is better) and then by specialties match
        const aWorkloadRatio = a.currentWorkload / a.maxTickets
        const bWorkloadRatio = b.currentWorkload / b.maxTickets
        
        if (aWorkloadRatio !== bWorkloadRatio) {
          return aWorkloadRatio - bWorkloadRatio
        }
        
        // If workload is similar, prefer more specialties match
        const aMatches = a.specialties.filter(s => relevantSpecialties.includes(s)).length
        const bMatches = b.specialties.filter(s => relevantSpecialties.includes(s)).length
        
        return bMatches - aMatches
      })
      .slice(0, 3)
  }

  const handleSaveAssignment = async () => {
    if (!ticket || !selectedStaff) return

    setIsSaving(true)
    
    try {
      // Here you would typically send the data to your API
      // const response = await fetch(`/api/crm/tickets/${ticket.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     assignedTo: selectedStaff,
      //     assignmentNote 
      //   })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      router.push(`/crm/arenden/${ticket.id}`)
    } catch (error) {
      console.error('Error assigning ticket:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getWorkloadColor = (workload: number, maxTickets: number) => {
    const ratio = workload / maxTickets
    if (ratio >= 0.9) return 'text-red-600'
    if (ratio >= 0.7) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getWorkloadBadge = (workload: number, maxTickets: number) => {
    const ratio = workload / maxTickets
    if (ratio >= 0.9) return 'bg-red-100 text-red-800'
    if (ratio >= 0.7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Öppet'
      case 'in_progress': return 'Pågående'
      case 'pending': return 'Väntar'
      case 'resolved': return 'Löst'
      case 'closed': return 'Stängt'
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Akut'
      case 'high': return 'Hög'
      case 'medium': return 'Medium'
      case 'low': return 'Låg'
      default: return priority
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'complaint': return 'Klagomål'
      case 'inquiry': return 'Förfrågan'
      case 'technical': return 'Tekniskt'
      case 'billing': return 'Faktura'
      case 'general': return 'Allmänt'
      default: return type
    }
  }

  const recommendedStaff = getRecommendedStaff()
  const selectedStaffMember = staff.find(s => s.id === selectedStaff)

  if (!ticket) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Ärende hittades inte</p>
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
            <p className="text-gray-600">{ticket.ticketNumber} - {ticket.title}</p>
          </div>
        </div>
        <Button 
          onClick={handleSaveAssignment} 
          disabled={!selectedStaff || isSaving}
          className="bg-[#002A5C] hover:bg-[#001a42]"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sparar...' : 'Spara Tilldelning'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ticket Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Ärendeinformation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Typ</label>
              <p className="text-sm mt-1">{getTypeText(ticket.type)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Prioritet</label>
              <p className="text-sm mt-1">{getPriorityText(ticket.priority)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-sm mt-1">{getStatusText(ticket.status)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Kund</label>
              <p className="text-sm mt-1">{ticket.customerName}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Phone className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{ticket.customerPhone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{ticket.customerEmail}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Staff */}
          {recommendedStaff.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Rekommenderad Personal
                </CardTitle>
                <CardDescription>
                  Baserat på ärendetyp och nuvarande arbetsbelastning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedStaff.map((person) => (
                    <div
                      key={person.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedStaff === person.id
                          ? 'border-[#002A5C] bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedStaff(person.id)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarFallback className="bg-[#002A5C] text-white">
                            {getInitials(person.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{person.name}</h4>
                          <p className="text-sm text-gray-600">{person.role}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <Badge className={getWorkloadBadge(person.currentWorkload, person.maxTickets)}>
                            {person.currentWorkload}/{person.maxTickets} ärenden
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Specialiteter:</p>
                          <div className="flex flex-wrap gap-1">
                            {person.specialties.slice(0, 2).map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Staff */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                All Personal
              </CardTitle>
              <CardDescription>
                Välj personal att tilldela ärendet till
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Sök personal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrera på avdelning" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla avdelningar</SelectItem>
                    <SelectItem value="Kundsupport">Kundsupport</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Kvalitet">Kvalitet</SelectItem>
                    <SelectItem value="Ekonomi">Ekonomi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Staff List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStaff.map((person) => (
                  <div
                    key={person.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStaff === person.id
                        ? 'border-[#002A5C] bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStaff(person.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-[#002A5C] text-white">
                            {getInitials(person.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{person.name}</h4>
                          <p className="text-sm text-gray-600">{person.role}</p>
                        </div>
                      </div>
                      <Badge className={getWorkloadBadge(person.currentWorkload, person.maxTickets)}>
                        {person.currentWorkload}/{person.maxTickets}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Avdelning: {person.department}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Specialiteter:</p>
                        <div className="flex flex-wrap gap-1">
                          {person.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Senast aktiv: {new Date(person.lastActivity).toLocaleDateString('sv-SE')} {new Date(person.lastActivity).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredStaff.length === 0 && (
                  <div className="text-center py-8">
                    <UserX className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Ingen personal hittades</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Tilldelningssammanfattning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStaffMember ? (
              <div className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarFallback className="bg-[#002A5C] text-white text-lg">
                      {getInitials(selectedStaffMember.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium">{selectedStaffMember.name}</h3>
                  <p className="text-sm text-gray-600">{selectedStaffMember.role}</p>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Avdelning</label>
                    <p className="text-sm text-gray-600">{selectedStaffMember.department}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Nuvarande arbetsbelastning</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedStaffMember.currentWorkload / selectedStaffMember.maxTickets >= 0.9 
                              ? 'bg-red-500' 
                              : selectedStaffMember.currentWorkload / selectedStaffMember.maxTickets >= 0.7 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((selectedStaffMember.currentWorkload / selectedStaffMember.maxTickets) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {selectedStaffMember.currentWorkload}/{selectedStaffMember.maxTickets}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Kontakt</label>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">{selectedStaffMember.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">{selectedStaffMember.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Anteckning (valfritt)</label>
                  <Textarea
                    placeholder="Lägg till en anteckning om tilldelningen..."
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Välj personal att tilldela</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}