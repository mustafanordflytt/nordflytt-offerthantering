'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Eye, 
  Search, 
  Filter,
  FileText,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileEdit
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import OffertCreationModal from '@/components/crm/OffertCreationModal'
import OffertViewerModal from '@/components/crm/OffertViewerModal'

// Status badge configurations
const statusConfig = {
  draft: { label: 'Utkast', variant: 'secondary' as const, icon: FileEdit },
  sent: { label: 'Skickad', variant: 'default' as const, icon: Send },
  accepted: { label: 'Accepterad', variant: 'success' as const, icon: CheckCircle },
  rejected: { label: 'Avvisad', variant: 'destructive' as const, icon: XCircle },
  expired: { label: 'Utgången', variant: 'outline' as const, icon: Clock }
}

interface Quote {
  id: string
  quote_number: string
  customer_id: string
  customer_name: string
  title: string
  total_amount: number
  status: keyof typeof statusConfig
  valid_until: string
  created_at: string
  customer_email?: string
  customer_phone?: string
}

export default function CRMOfferterPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewerModal, setShowViewerModal] = useState(false)
  const [selectedOffertId, setSelectedOffertId] = useState<string | null>(null)

  // Fetch quotes from real API
  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/offers')
      if (response.ok) {
        const data = await response.json()
        // Handle both formats: direct array or { offers: [...] }
        if (Array.isArray(data)) {
          setQuotes(data)
        } else if (data.offers && Array.isArray(data.offers)) {
          // Transform offers to match the Quote interface
          const transformedQuotes = data.offers.map((offer: any) => ({
            id: offer.id,
            quote_number: offer.reference || `NF-${offer.id?.slice(0, 8)}`,
            customer_name: offer.customerName || 'Unknown',
            customer_email: offer.customerEmail || '',
            customer_phone: offer.customerPhone || '',
            customer_type: 'private',
            title: `Flytt ${offer.movingDate || ''}`,
            description: offer.notes || `Flytt från ${offer.from} till ${offer.to}`,
            service_types: offer.services || ['moving'],
            from_address: offer.from || '',
            to_address: offer.to || '',
            move_date: offer.movingDate || '',
            items: offer.services?.map((service: string) => ({
              id: service,
              description: service,
              quantity: 1,
              unit_price: 0,
              total_price: 0
            })) || [],
            subtotal: offer.totalPrice || 0,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: offer.totalPrice || 0,
            status: offer.status === 'pending' ? 'draft' : offer.status,
            sent_at: offer.status !== 'draft' ? offer.createdAt : null,
            expires_at: null,
            accepted_at: offer.status === 'accepted' ? offer.createdAt : null,
            rejected_at: offer.status === 'rejected' ? offer.createdAt : null,
            created_at: offer.createdAt || new Date().toISOString(),
            updated_at: offer.createdAt || new Date().toISOString(),
            notes: offer.notes || ''
          }))
          setQuotes(transformedQuotes)
        } else {
          console.error('API did not return expected format:', data)
          setQuotes([])
        }
      } else {
        console.error('API error:', response.status, response.statusText)
        setQuotes([])
      }
    } catch (error) {
      console.error('Error fetching quotes:', error)
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort quotes
  const filteredQuotes = quotes
    .filter(quote => {
      const matchesSearch = 
        (quote.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.quote_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return (b.total_amount || 0) - (a.total_amount || 0)
        case 'customer':
          return (a.customer_name || '').localeCompare(b.customer_name || '')
        case 'date':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
    })

  // Calculate statistics
  const stats = {
    total: quotes.length,
    totalValue: quotes.reduce((sum, q) => sum + q.total_amount, 0),
    accepted: quotes.filter(q => q.status === 'accepted').length,
    pending: quotes.filter(q => q.status === 'sent').length
  }

  const conversionRate = stats.total > 0 
    ? Math.round((stats.accepted / stats.total) * 100) 
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offerter</h1>
          <p className="text-muted-foreground">
            Hantera och spåra alla offerter från ett ställe
          </p>
        </div>
        
        {/* Open modal instead of external link */}
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Skapa ny offert
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totalt antal offerter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} väntande
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totalt värde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0
              }).format(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Inklusive moms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepterade offerter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">
              {conversionRate}% konvertering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Genomsnittligt värde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0
              }).format(stats.total > 0 ? stats.totalValue / stats.total : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per offert
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Alla offerter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Sök på kund, offertnummer eller titel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrera status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="draft">Utkast</SelectItem>
                <SelectItem value="sent">Skickade</SelectItem>
                <SelectItem value="accepted">Accepterade</SelectItem>
                <SelectItem value="rejected">Avvisade</SelectItem>
                <SelectItem value="expired">Utgångna</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sortera efter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Datum (nyast först)</SelectItem>
                <SelectItem value="amount">Belopp (högst först)</SelectItem>
                <SelectItem value="customer">Kund (A-Ö)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quotes Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Laddar offerter...
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Inga offerter hittades
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offertnummer</TableHead>
                    <TableHead>Kund</TableHead>
                    <TableHead>Titel</TableHead>
                    <TableHead>Belopp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Giltig till</TableHead>
                    <TableHead>Skapad</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => {
                    const status = quote.status || 'draft';
                    const config = statusConfig[status] || statusConfig.draft;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">
                          {quote.quote_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{quote.customer_name}</div>
                            {quote.customer_email && (
                              <div className="text-sm text-muted-foreground">
                                {quote.customer_email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{quote.title}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK',
                            minimumFractionDigits: 0
                          }).format(quote.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {quote.valid_until ? 
                            format(new Date(quote.valid_until), 'dd MMM yyyy', { locale: sv }) :
                            'Ej angiven'
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(quote.created_at), 'dd MMM yyyy', { locale: sv })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Open modal instead of external link */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOffertId(quote.id)
                                setShowViewerModal(true)
                              }}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              Visa
                            </Button>
                            
                            {/* Link to customer details */}
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/crm/kunder/${quote.customer_id}`}>
                                <User className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modals */}
      <OffertCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOffertCreated={(newOffert) => {
          // Refresh quotes list
          fetchQuotes()
          setShowCreateModal(false)
        }}
      />
      
      {selectedOffertId && (
        <OffertViewerModal
          isOpen={showViewerModal}
          onClose={() => {
            setShowViewerModal(false)
            setSelectedOffertId(null)
          }}
          offertId={selectedOffertId}
          onOffertUpdated={fetchQuotes}
        />
      )}
    </div>
  )
}