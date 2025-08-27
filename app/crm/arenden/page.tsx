'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Plus, 
  MessageSquare,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  MoreHorizontal,
  Phone,
  Mail,
  Bug,
  HelpCircle,
  FileText,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Ticket {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  type: 'complaint' | 'inquiry' | 'technical' | 'billing' | 'general'
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  assignedTo: string | null
  assignedToName: string | null
  createdAt: string
  updatedAt: string
  lastActivity: string
  tags: string[]
  commentCount: number
  attachments: number
}

// Mock data - in real app this would come from API
const mockTickets: Ticket[] = [
  {
    id: '1',
    ticketNumber: 'TK-2024-001',
    title: 'Skada på möbler under flytt',
    description: 'Under flytten igår skadades min bokhylla. Den har fått en stor buckla på sidan.',
    status: 'open',
    priority: 'high',
    type: 'complaint',
    customerId: 'f1916745-dc9c-4eee-943d-da636b90c258',
    customerName: 'Mustafa Abdulkarim',
    customerEmail: 'mustafa.abdulkarim@hotmail.com',
    customerPhone: '+46 72 368 39 67',
    assignedTo: null,
    assignedToName: null,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    lastActivity: '2025-01-15T10:30:00Z',
    tags: ['möbelskada', 'ersättning'],
    commentCount: 0,
    attachments: 2
  },
  {
    id: '2',
    ticketNumber: 'TK-2024-002',
    title: 'Fråga om tilläggstjänster',
    description: 'Hej! Jag undrar om ni även erbjuder pianoflytt? Jag har ett stort piano som behöver flyttas.',
    status: 'in_progress',
    priority: 'medium',
    type: 'inquiry',
    customerId: 'fa0163ee-eb44-42f5-8d5c-abe33e16460d',
    customerName: 'Anna Svensson',
    customerEmail: 'anna.svensson@example.com',
    customerPhone: '+46 70 123 45 67',
    assignedTo: 'staff-1',
    assignedToName: 'Erik Andersson',
    createdAt: '2025-01-14T14:20:00Z',
    updatedAt: '2025-01-15T09:15:00Z',
    lastActivity: '2025-01-15T09:15:00Z',
    tags: ['piano', 'tilläggstjänst'],
    commentCount: 3,
    attachments: 0
  },
  {
    id: '3',
    ticketNumber: 'TK-2024-003',
    title: 'Faktura för flyttjobb NF-B3914890',
    description: 'Jag har inte fått fakturan för min flytt som genomfördes förra veckan. Kan ni skicka den igen?',
    status: 'resolved',
    priority: 'medium',
    type: 'billing',
    customerId: 'f1916745-dc9c-4eee-943d-da636b90c258',
    customerName: 'Mustafa Abdulkarim',
    customerEmail: 'mustafa.abdulkarim@hotmail.com',
    customerPhone: '+46 72 368 39 67',
    assignedTo: 'staff-2',
    assignedToName: 'Sofia Lindberg',
    createdAt: '2025-01-13T16:45:00Z',
    updatedAt: '2025-01-14T11:30:00Z',
    lastActivity: '2025-01-14T11:30:00Z',
    tags: ['faktura', 'administration'],
    commentCount: 4,
    attachments: 1
  },
  {
    id: '4',
    ticketNumber: 'TK-2024-004',
    title: 'Problem med bokningssystemet',
    description: 'Jag kan inte logga in på er webbsida för att se min bokning. Får felmeddelande hela tiden.',
    status: 'pending',
    priority: 'low',
    type: 'technical',
    customerId: '3948fa65-28e4-4427-ad56-c378bada3d84',
    customerName: 'Marcus Johansson',
    customerEmail: 'marcus.j@email.com',
    customerPhone: '+46 70 987 65 43',
    assignedTo: 'staff-3',
    assignedToName: 'Henrik Karlsson',
    createdAt: '2025-01-12T11:15:00Z',
    updatedAt: '2025-01-13T14:20:00Z',
    lastActivity: '2025-01-13T14:20:00Z',
    tags: ['webbsida', 'tekniskt'],
    commentCount: 2,
    attachments: 1
  },
  {
    id: '5',
    ticketNumber: 'TK-2024-005',
    title: 'Önskemål om återkoppling',
    description: 'Mycket nöjd med flytten! Vill bara ge positiv feedback till era anställda.',
    status: 'closed',
    priority: 'low',
    type: 'general',
    customerId: 'customer-5',
    customerName: 'Lisa Petersson',
    customerEmail: 'lisa.p@example.com',
    customerPhone: '+46 70 555 44 33',
    assignedTo: 'staff-1',
    assignedToName: 'Erik Andersson',
    createdAt: '2025-01-10T13:30:00Z',
    updatedAt: '2025-01-11T10:15:00Z',
    lastActivity: '2025-01-11T10:15:00Z',
    tags: ['feedback', 'positiv'],
    commentCount: 1,
    attachments: 0
  }
]

export default function ArendenPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'priority' | 'status'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort tickets
  const filteredAndSortedTickets = tickets
    .filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
      const matchesType = typeFilter === 'all' || ticket.type === typeFilter
      const matchesAssignee = assigneeFilter === 'all' || 
                             (assigneeFilter === 'unassigned' && !ticket.assignedTo) ||
                             (assigneeFilter !== 'unassigned' && ticket.assignedTo === assigneeFilter)
      
      return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssignee
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updated':
          comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'status':
          const statusOrder = { open: 1, in_progress: 2, pending: 3, resolved: 4, closed: 5 }
          comparison = statusOrder[a.status] - statusOrder[b.status]
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <MessageSquare className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'pending': return <AlertTriangle className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'inquiry': return <HelpCircle className="h-4 w-4 text-blue-600" />
      case 'technical': return <Bug className="h-4 w-4 text-purple-600" />
      case 'billing': return <CreditCard className="h-4 w-4 text-green-600" />
      case 'general': return <FileText className="h-4 w-4 text-gray-600" />
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
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

  // Stats calculations
  const totalTickets = tickets.length
  const openTickets = tickets.filter(t => t.status === 'open').length
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length
  const unassignedTickets = tickets.filter(t => !t.assignedTo).length

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ärenden</h1>
          <p className="text-gray-600">Hantera kundsupport och support tickets</p>
        </div>
        <Link href="/crm/arenden/new">
          <Button className="bg-[#002A5C] hover:bg-[#001a42]">
            <Plus className="mr-2 h-4 w-4" />
            Nytt Ärende
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt Ärenden</p>
                <p className="text-2xl font-bold">{totalTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Öppna</p>
                <p className="text-2xl font-bold">{openTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pågående</p>
                <p className="text-2xl font-bold">{inProgressTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ej Tilldelade</p>
                <p className="text-2xl font-bold">{unassignedTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sök och Filtrera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök ärenden, kunder eller nummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Statusar</SelectItem>
                <SelectItem value="open">Öppet</SelectItem>
                <SelectItem value="in_progress">Pågående</SelectItem>
                <SelectItem value="pending">Väntar</SelectItem>
                <SelectItem value="resolved">Löst</SelectItem>
                <SelectItem value="closed">Stängt</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioritet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Prioriteter</SelectItem>
                <SelectItem value="urgent">Akut</SelectItem>
                <SelectItem value="high">Hög</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Låg</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Typer</SelectItem>
                <SelectItem value="complaint">Klagomål</SelectItem>
                <SelectItem value="inquiry">Förfrågan</SelectItem>
                <SelectItem value="technical">Tekniskt</SelectItem>
                <SelectItem value="billing">Faktura</SelectItem>
                <SelectItem value="general">Allmänt</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tilldelad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                <SelectItem value="unassigned">Ej tilldelade</SelectItem>
                <SelectItem value="staff-1">Erik Andersson</SelectItem>
                <SelectItem value="staff-2">Sofia Lindberg</SelectItem>
                <SelectItem value="staff-3">Henrik Karlsson</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Ärendelista ({filteredAndSortedTickets.length} ärenden)
            </CardTitle>
            <Button onClick={() => setTickets([...mockTickets])} variant="outline" size="sm">
              Uppdatera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Ärende</TableHead>
                  <TableHead>Kund</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('priority')}
                      className="h-auto p-0 font-semibold"
                    >
                      Prioritet
                      {sortBy === 'priority' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Tilldelad</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('updated')}
                      className="h-auto p-0 font-semibold"
                    >
                      Senast aktiv
                      {sortBy === 'updated' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Link 
                        href={`/crm/arenden/${ticket.id}`}
                        className="font-medium text-[#002A5C] hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(ticket.type)}
                        <span className="text-sm">{getTypeText(ticket.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link 
                          href={`/crm/arenden/${ticket.id}`}
                          className="font-medium hover:text-[#002A5C] hover:underline"
                        >
                          {ticket.title}
                        </Link>
                        <p className="text-sm text-gray-600 truncate max-w-96">
                          {ticket.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          {ticket.commentCount > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <MessageSquare className="h-3 w-3" />
                              <span>{ticket.commentCount}</span>
                            </div>
                          )}
                          {ticket.attachments > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <FileText className="h-3 w-3" />
                              <span>{ticket.attachments}</span>
                            </div>
                          )}
                          {ticket.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link 
                          href={`/crm/kunder/${ticket.customerId}`}
                          className="font-medium hover:text-[#002A5C] hover:underline"
                        >
                          {ticket.customerName}
                        </Link>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />
                          <span>{ticket.customerEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span>{ticket.customerPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ticket.status)}
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusText(ticket.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {getPriorityText(ticket.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.assignedToName ? (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-[#002A5C] text-white text-xs">
                              {getInitials(ticket.assignedToName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{ticket.assignedToName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Ej tilldelad</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {new Date(ticket.lastActivity).toLocaleDateString('sv-SE')}
                        <br />
                        {new Date(ticket.lastActivity).toLocaleTimeString('sv-SE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/arenden/${ticket.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visa detaljer
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/arenden/${ticket.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Redigera
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/arenden/${ticket.id}/assign`}>
                              <User className="mr-2 h-4 w-4" />
                              Tilldela
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/kunder/${ticket.customerId}`}>
                              <User className="mr-2 h-4 w-4" />
                              Visa kund
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedTickets.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Inga ärenden hittades</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                  ? 'Prova att ändra dina sökkriterier'
                  : 'Kom igång genom att skapa ditt första ärende'}
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && typeFilter === 'all' && (
                <div className="mt-6">
                  <Link href="/crm/arenden/new">
                    <Button className="bg-[#002A5C] hover:bg-[#001a42]">
                      <Plus className="mr-2 h-4 w-4" />
                      Skapa första ärendet
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}