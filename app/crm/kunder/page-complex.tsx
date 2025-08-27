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
  Phone, 
  Mail, 
  User, 
  Building2,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import { useCustomers } from '@/lib/store'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function CustomersPage() {
  const { customers, isLoading, error, fetchCustomers } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'bookings' | 'value'>('created')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Filter and sort customers
  const filteredAndSortedCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone.includes(searchTerm)
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
      const matchesType = typeFilter === 'all' || customer.customerType === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'bookings':
          comparison = a.bookingCount - b.bookingCount
          break
        case 'value':
          comparison = a.totalValue - b.totalValue
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'blacklisted': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCallCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleEmailCustomer = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar kunder...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error: {error}</p>
            <Button onClick={fetchCustomers} className="mt-4">
              Försök igen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kunder</h1>
          <p className="text-gray-600">Hantera dina kunder och deras bokningshistorik</p>
        </div>
        <Link href="/crm/kunder/new">
          <Button className="bg-[#002A5C] hover:bg-[#001a42]">
            <Plus className="mr-2 h-4 w-4" />
            Ny Kund
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt Kunder</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Företagskunder</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.customerType === 'business').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Badge className="h-8 w-8 text-[#002A5C] bg-green-100" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktiva Kunder</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-[#002A5C] rounded-full flex items-center justify-center text-white font-bold">
                kr
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Kundvärde</p>
                <p className="text-2xl font-bold">
                  {customers.reduce((sum, c) => sum + c.totalValue, 0).toLocaleString('sv-SE')} kr
                </p>
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
                <SelectItem value="all">Alla Statusar</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="blacklisted">Blacklistad</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Kundtyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Typer</SelectItem>
                <SelectItem value="private">Privat</SelectItem>
                <SelectItem value="business">Företag</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Kundlista ({filteredAndSortedCustomers.length} kunder)
            </CardTitle>
            <Button onClick={fetchCustomers} variant="outline" size="sm">
              Uppdatera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kund</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-semibold"
                    >
                      Namn
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('bookings')}
                      className="h-auto p-0 font-semibold"
                    >
                      Bokningar
                      {sortBy === 'bookings' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('value')}
                      className="h-auto p-0 font-semibold"
                    >
                      Kundvärde
                      {sortBy === 'value' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('created')}
                      className="h-auto p-0 font-semibold"
                    >
                      Skapad
                      {sortBy === 'created' && (
                        sortOrder === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-[#002A5C] text-white">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link 
                            href={`/crm/kunder/${customer.id}`}
                            className="font-medium hover:text-[#002A5C] hover:underline"
                          >
                            {customer.name}
                          </Link>
                          {customer.customerType === 'business' && (
                            <Building2 className="inline ml-2 h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/crm/kunder/${customer.id}`}
                        className="hover:text-[#002A5C] hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-sm font-medium">{customer.bookingCount}</div>
                        {customer.lastBooking && (
                          <div className="text-xs text-gray-500">
                            Senast: {customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString('sv-SE') : '-'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <div className="font-medium">{(customer.totalValue || 0).toLocaleString('sv-SE')} kr</div>
                        {(customer.bookingCount || 0) > 0 && (
                          <div className="text-xs text-gray-500">
                            Snitt: {Math.round((customer.totalValue || 0) / (customer.bookingCount || 1)).toLocaleString('sv-SE')} kr
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status === 'active' ? 'Aktiv' : 
                         customer.status === 'inactive' ? 'Inaktiv' : 'Blacklistad'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('sv-SE') : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCallCustomer(customer.phone)}
                          className="h-8 w-8 p-0"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEmailCustomer(customer.email)}
                          className="h-8 w-8 p-0"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/crm/kunder/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visa detaljer
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/crm/kunder/${customer.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Redigera
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/crm/uppdrag/new?customer=${customer.id}`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nytt uppdrag
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedCustomers.length === 0 && (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Inga kunder hittades</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Prova att ändra dina sökkriterier'
                  : 'Kom igång genom att skapa din första kund'}
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <div className="mt-6">
                  <Link href="/crm/kunder/new">
                    <Button className="bg-[#002A5C] hover:bg-[#001a42]">
                      <Plus className="mr-2 h-4 w-4" />
                      Skapa första kunden
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