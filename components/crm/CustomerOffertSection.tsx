'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText,
  Eye,
  ExternalLink,
  Plus,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Send,
  FileEdit,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import OffertCreationModal from '@/components/crm/OffertCreationModal'
import OffertViewerModal from '@/components/crm/OffertViewerModal'

// Reuse status config from offerter page
const statusConfig = {
  draft: { label: 'Utkast', variant: 'secondary' as const, icon: FileEdit },
  sent: { label: 'Skickad', variant: 'default' as const, icon: Send },
  accepted: { label: 'Accepterad', variant: 'success' as const, icon: CheckCircle },
  rejected: { label: 'Avvisad', variant: 'destructive' as const, icon: XCircle },
  expired: { label: 'Utgången', variant: 'outline' as const, icon: Clock }
}

interface CustomerQuote {
  id: string
  quote_number: string
  title: string
  total_amount: number
  status: keyof typeof statusConfig
  valid_until: string
  created_at: string
}

interface CustomerOffertSectionProps {
  customerId: string
  customerName?: string
}

export default function CustomerOffertSection({ 
  customerId, 
  customerName = 'denna kund' 
}: CustomerOffertSectionProps) {
  const [quotes, setQuotes] = useState<CustomerQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewerModal, setShowViewerModal] = useState(false)
  const [selectedOffertId, setSelectedOffertId] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomerQuotes()
  }, [customerId])

  const fetchCustomerQuotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/offers?customerId=${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setQuotes(data)
      }
    } catch (error) {
      console.error('Error fetching customer quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate customer statistics
  const stats = {
    total: quotes.length,
    totalValue: quotes.reduce((sum, q) => sum + q.total_amount, 0),
    accepted: quotes.filter(q => q.status === 'accepted').length,
    pending: quotes.filter(q => q.status === 'sent').length,
    avgValue: quotes.length > 0 
      ? quotes.reduce((sum, q) => sum + q.total_amount, 0) / quotes.length 
      : 0
  }

  const conversionRate = stats.total > 0 
    ? Math.round((stats.accepted / stats.total) * 100) 
    : 0

  return (
    <div className="space-y-4">
      {/* Header with statistics */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Offerter</h3>
        
        {/* Create offer button with modal */}
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Skapa offert
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Totalt</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Accepterade</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Konvertering</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{conversionRate}%</p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Totalt värde</span>
          </div>
          <p className="text-lg font-bold">
            {new Intl.NumberFormat('sv-SE', {
              notation: 'compact',
              maximumFractionDigits: 0
            }).format(stats.totalValue)} kr
          </p>
        </div>
      </div>

      {/* Quotes list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Laddar offerter...
            </div>
          ) : quotes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Inga offerter ännu</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setShowCreateModal(true)}
              >
                Skapa första offerten
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {quotes.slice(0, 5).map((quote) => {
                const StatusIcon = statusConfig[quote.status].icon
                return (
                  <div 
                    key={quote.id} 
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {quote.quote_number}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {quote.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(quote.created_at), 'dd MMM yyyy', { locale: sv })}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {new Intl.NumberFormat('sv-SE', {
                            style: 'currency',
                            currency: 'SEK',
                            minimumFractionDigits: 0
                          }).format(quote.total_amount)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant={statusConfig[quote.status].variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[quote.status].label}
                      </Badge>
                      
                      {/* View offer button with modal */}
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
                    </div>
                  </div>
                )
              })}
              
              {quotes.length > 5 && (
                <div className="p-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <Link href={`/crm/offerter?customerId=${customerId}`}>
                      Visa alla {quotes.length} offerter
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modals */}
      <OffertCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        customerId={customerId}
        customerData={{
          id: customerId,
          name: customerName
        }}
        onOffertCreated={(newOffert) => {
          fetchCustomerQuotes() // Refresh list
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
          onOffertUpdated={fetchCustomerQuotes}
        />
      )}
    </div>
  )
}