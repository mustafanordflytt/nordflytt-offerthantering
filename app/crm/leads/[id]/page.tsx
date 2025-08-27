'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  User, 
  Target,
  UserCheck
} from 'lucide-react'
import { useLeads } from '@/lib/store'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

// Pipeline stages mapping
const PIPELINE_STAGES = {
  'new': { label: 'Nya Leads', color: 'bg-gray-100 text-gray-800' },
  'contacted': { label: 'Kontaktade', color: 'bg-blue-100 text-blue-800' },
  'qualified': { label: 'Kvalificerade', color: 'bg-purple-100 text-purple-800' },
  'proposal': { label: 'Offert Skickad', color: 'bg-yellow-100 text-yellow-800' },
  'negotiation': { label: 'Förhandling', color: 'bg-orange-100 text-orange-800' },
  'closed_won': { label: 'Vunna', color: 'bg-green-100 text-green-800' },
  'closed_lost': { label: 'Förlorade', color: 'bg-red-100 text-red-800' }
}

const SOURCE_LABELS = {
  'website': 'Webbplats',
  'referral': 'Referens',
  'marketing': 'Marknadsföring',
  'cold_call': 'Kall Kontakt',
  'other': 'Annat'
}

const PRIORITY_LABELS = {
  'low': 'Låg',
  'medium': 'Medium',
  'high': 'Hög'
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { leads, getLead, deleteLead, convertToCustomer, isLoading } = useLeads()
  const [lead, setLead] = useState<any>(null)

  const leadId = params.id as string

  useEffect(() => {
    const foundLead = getLead(leadId)
    if (foundLead) {
      setLead(foundLead)
    } else {
      // Try to fetch from API
      fetchLeadFromAPI()
    }
  }, [leadId, leads])

  const fetchLeadFromAPI = async () => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`)
      if (response.ok) {
        const data = await response.json()
        setLead(data)
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
    }
  }

  const handleCall = () => {
    if (lead?.phone) {
      window.location.href = `tel:${lead.phone}`
    }
  }

  const handleEmail = () => {
    if (lead?.email) {
      window.location.href = `mailto:${lead.email}`
    }
  }

  const handleDelete = async () => {
    if (confirm('Är du säker på att du vill ta bort denna lead?')) {
      try {
        await deleteLead(leadId)
        toast({
          title: "Lead borttagen",
          description: "Leaden har tagits bort från systemet.",
        })
        router.push('/crm/leads')
      } catch (error) {
        toast({
          title: "Error",
          description: "Kunde inte ta bort leaden. Försök igen.",
          variant: "destructive",
        })
      }
    }
  }

  const handleConvert = async () => {
    if (confirm('Konvertera denna lead till en kund?')) {
      try {
        await convertToCustomer(leadId)
        
        // Call API to convert
        const response = await fetch(`/api/crm/leads/${leadId}/convert`, {
          method: 'POST'
        })
        
        if (response.ok) {
          toast({
            title: "Lead konverterad",
            description: "Leaden har konverterats till en kund.",
          })
          router.push('/crm/kunder')
        } else {
          throw new Error('Failed to convert lead')
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Kunde inte konvertera leaden. Försök igen.",
          variant: "destructive",
        })
      }
    }
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar lead...</p>
          </div>
        </div>
      </div>
    )
  }

  const stage = PIPELINE_STAGES[lead.status as keyof typeof PIPELINE_STAGES]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/crm/leads">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till Leads
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-600">Lead Detaljer</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={handleCall} variant="outline" size="sm">
            <Phone className="mr-2 h-4 w-4" />
            Ring
          </Button>
          <Button onClick={handleEmail} variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Link href={`/crm/leads/${leadId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Redigera
            </Button>
          </Link>
          <Button onClick={handleConvert} className="bg-[#002A5C] hover:bg-[#001a42]" size="sm">
            <UserCheck className="mr-2 h-4 w-4" />
            Konvertera till Kund
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Namn</label>
                  <p className="text-lg font-semibold">{lead.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{lead.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefon</label>
                  <p className="text-lg">{lead.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Källa</label>
                  <p className="text-lg">{SOURCE_LABELS[lead.source as keyof typeof SOURCE_LABELS]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Detaljer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={stage?.color}>{stage?.label}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Prioritet</label>
                  <p className="text-lg font-semibold">
                    {PRIORITY_LABELS[lead.priority as keyof typeof PRIORITY_LABELS]}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Uppskattat Värde</label>
                  <p className="text-lg font-semibold">
                    {lead.estimatedValue?.toLocaleString('sv-SE')} kr
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tilldelad Till</label>
                  <p className="text-lg">{lead.assignedTo}</p>
                </div>
                {lead.expectedCloseDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Förväntat Avslut</label>
                    <p className="text-lg">
                      {new Date(lead.expectedCloseDate).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                )}
              </div>
              
              {lead.notes && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-500">Anteckningar</label>
                  <p className="mt-2 text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Snabb Översikt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-[#002A5C]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Uppskattat Värde</p>
                  <p className="text-xl font-bold">{lead.estimatedValue?.toLocaleString('sv-SE')} kr</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-[#002A5C]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Skapad</p>
                  <p className="text-lg font-semibold">
                    {new Date(lead.createdAt).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <User className="h-8 w-8 text-[#002A5C]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tilldelad</p>
                  <p className="text-lg font-semibold">{lead.assignedTo}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Target className="h-8 w-8 text-[#002A5C]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Prioritet</p>
                  <p className="text-lg font-semibold">
                    {PRIORITY_LABELS[lead.priority as keyof typeof PRIORITY_LABELS]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Åtgärder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleCall} className="w-full justify-start" variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                Ring Kund
              </Button>
              <Button onClick={handleEmail} className="w-full justify-start" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Skicka Email
              </Button>
              <Link href={`/crm/leads/${leadId}/edit`} className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Redigera Lead
                </Button>
              </Link>
              <Button 
                onClick={handleConvert} 
                className="w-full justify-start bg-[#002A5C] hover:bg-[#001a42]"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Konvertera till Kund
              </Button>
              <Button 
                onClick={handleDelete} 
                className="w-full justify-start" 
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Ta Bort Lead
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}