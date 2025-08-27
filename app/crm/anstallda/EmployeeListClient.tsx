'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Users,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  Shield,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function EmployeeListClient() {
  const router = useRouter()
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees')
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }
      
      const data = await response.json()
      setEmployees(data.data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      console.error('Kunde inte hämta anställda')
      // Fallback to empty array
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleViewDetails = (staffId: string) => {
    router.push(`/crm/anstallda/${staffId}`)
  }

  const handleCallStaff = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleEmailStaff = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const handleEditStaff = (staff: any) => {
    router.push(`/crm/anstallda/${staff.staff_id}/edit`)
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna anställd?')) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${staffId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete employee')
      }

      const result = await response.json()
      
      if (result.warning) {
        alert(`${result.message}\n\nOBS: ${result.warning}`)
      } else {
        alert('Anställd har tagits bort från systemet')
      }

      // Refresh list
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Fel: Kunde inte ta bort anställd')
    }
  }

  // Filter and sort employees
  const filteredStaff = employees
    .filter(person => {
      const matchesSearch = 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone?.includes(searchTerm)
      
      const matchesStatus = statusFilter === 'all' || person.status === statusFilter
      const matchesRole = roleFilter === 'all' || person.role === roleFilter
      
      return matchesSearch && matchesStatus && matchesRole
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return b.rating - a.rating
        case 'jobs':
          return b.total_jobs_completed - a.total_jobs_completed
        case 'newest':
          return new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime()
        default:
          return 0
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'busy':
        return 'bg-yellow-100 text-yellow-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'off_duty':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Tillgänglig'
      case 'busy':
        return 'Upptagen'
      case 'scheduled':
        return 'Schemalagd'
      case 'off_duty':
        return 'Ledig'
      default:
        return status
    }
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administratör',
      driver: 'Chaufför',
      mover: 'Flyttare',
      'team_lead': 'Gruppledare'
    }
    return roleMap[role] || role
  }

  // Stats calculation
  const stats = {
    total: employees.length,
    available: employees.filter(s => s.status === 'available').length,
    busy: employees.filter(s => s.status === 'busy' || s.status === 'scheduled').length,
    averageRating: employees.length > 0 
      ? (employees.reduce((sum, s) => sum + (s.rating || 0), 0) / employees.length).toFixed(1)
      : '0.0'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#002A5C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personal</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total === 1 ? 'anställd' : 'anställda'} i systemet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tillgängliga</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.available / stats.total) * 100).toFixed(0)}% av personal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upptagna</CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.busy}</div>
            <p className="text-xs text-muted-foreground">
              Aktiva uppdrag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Snittbetyg</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Utmärkt nivå
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal</CardTitle>
              <CardDescription>
                Hantera personalresurser och schemaläggning
              </CardDescription>
            </div>
            <Link href="/crm/anstallda/new">
              <Button className="bg-[#002A5C] hover:bg-[#002A5C]/90">
                <Plus className="mr-2 h-4 w-4" />
                Ny Anställd
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Sök efter namn, email eller telefon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla statusar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="available">Tillgänglig</SelectItem>
                <SelectItem value="busy">Upptagen</SelectItem>
                <SelectItem value="scheduled">Schemalagd</SelectItem>
                <SelectItem value="off_duty">Ledig</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla roller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla roller</SelectItem>
                <SelectItem value="admin">Administratör</SelectItem>
                <SelectItem value="driver">Chaufför</SelectItem>
                <SelectItem value="mover">Flyttare</SelectItem>
                <SelectItem value="team_lead">Gruppledare</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sortera efter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Namn</SelectItem>
                <SelectItem value="rating">Betyg</SelectItem>
                <SelectItem value="jobs">Slutförda jobb</SelectItem>
                <SelectItem value="newest">Nyast först</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm font-medium text-gray-500">
                  <th className="pb-3">Anställd</th>
                  <th className="pb-3">Roll</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Betyg</th>
                  <th className="pb-3">Slutförda Jobb</th>
                  <th className="pb-3 text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStaff.map((person) => (
                  <tr 
                    key={person.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest('.action-buttons')) {
                        handleViewDetails(person.staff_id)
                      }
                    }}
                  >
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-[#002A5C] flex items-center justify-center text-white font-medium">
                            {person.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {person.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {person.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-gray-900">{getRoleLabel(person.role)}</div>
                      <div className="text-sm text-gray-500">{person.department}</div>
                    </td>
                    <td className="py-4">
                      <Badge className={cn(getStatusColor(person.status))}>
                        {getStatusLabel(person.status)}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{person.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-gray-900">{person.total_jobs_completed}</div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 action-buttons">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCallStaff(person.phone)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEmailStaff(person.email)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(person.staff_id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visa detaljer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditStaff(person)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Redigera
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStaff(person.staff_id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Ta bort
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Inga anställda hittades</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Add missing imports
import { Star, Eye } from 'lucide-react'