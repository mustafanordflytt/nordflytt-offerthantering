'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Phone, Mail, User, Building2, Search, Download } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  customerType: 'private' | 'business'
  bookingCount: number
  totalValue: number
  status: string
  createdAt: string
}

export default function CustomersPageSimple() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('crm-token') || ''
      
      const response = await fetch('/api/crm/customers', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Fetched customers:', data)
      
      if (data.success && data.customers) {
        setCustomers(data.customers)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
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
          <p className="text-gray-600">Hantera dina kunder ({customers.length} st)</p>
        </div>
        <Link href="/crm/kunder/new">
          <Button className="bg-[#002A5C] hover:bg-[#001a42]">
            <Plus className="mr-2 h-4 w-4" />
            Ny Kund
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt</p>
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
                <p className="text-sm font-medium text-gray-600">Företag</p>
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
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Privat</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.customerType === 'private').length}
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
                <p className="text-sm font-medium text-gray-600">Total värde</p>
                <p className="text-2xl font-bold">
                  {customers.reduce((sum, c) => sum + c.totalValue, 0).toLocaleString('sv-SE')} kr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sök och filtrera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök på namn, email eller telefon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kundtyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla typer</SelectItem>
                <SelectItem value="private">Privat</SelectItem>
                <SelectItem value="business">Företag</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Kundlista</CardTitle>
            <Button onClick={fetchCustomers} variant="outline" size="sm">
              Uppdatera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namn</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Bokningar</TableHead>
                <TableHead>Värde</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers
                .filter(customer => {
                  const matchesSearch = searchTerm === '' || 
                    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer.phone.includes(searchTerm)
                  
                  const matchesType = typeFilter === 'all' || customer.customerType === typeFilter
                  const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
                  
                  return matchesSearch && matchesType && matchesStatus
                })
                .map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/crm/kunder/${customer.id}`}>
                  <TableCell>
                    <Link href={`/crm/kunder/${customer.id}`} className="text-blue-600 hover:underline">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <Badge variant={customer.customerType === 'business' ? 'default' : 'secondary'}>
                      {customer.customerType === 'business' ? 'Företag' : 'Privat'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{customer.bookingCount}</TableCell>
                  <TableCell className="text-right">{customer.totalValue.toLocaleString('sv-SE')} kr</TableCell>
                  <TableCell>
                    <Badge 
                      variant={customer.status === 'active' ? 'default' : 'secondary'}
                      className={customer.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.location.href = `tel:${customer.phone}`}
                        disabled={!customer.phone}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.location.href = `mailto:${customer.email}`}
                        disabled={!customer.email}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {customers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Inga kunder hittades</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}