'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
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
  TrendingUp,
  Filter,
  DollarSign,
  Target,
  Award,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  User,
  GripVertical
} from 'lucide-react'
import { useLeads } from '@/lib/store'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { getAuthHeaders } from '@/lib/auth/token-helper'
import { toast } from '@/hooks/use-toast'
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  DragOverEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Pipeline stages
const PIPELINE_STAGES = [
  { id: 'new', label: 'Nya Leads', color: 'bg-gray-100 text-gray-800' },
  { id: 'contacted', label: 'Kontaktade', color: 'bg-blue-100 text-blue-800' },
  { id: 'qualified', label: 'Kvalificerade', color: 'bg-purple-100 text-purple-800' },
  { id: 'proposal', label: 'Offert Skickad', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'negotiation', label: 'Förhandling', color: 'bg-orange-100 text-orange-800' },
  { id: 'closed_won', label: 'Vunna', color: 'bg-green-100 text-green-800' },
  { id: 'closed_lost', label: 'Förlorade', color: 'bg-red-100 text-red-800' }
]

// Demo leads for fallback
function getDemoLeads() {
  return [
    {
      id: '1',
      name: 'Anna Andersson',
      email: 'anna@example.com',
      phone: '070-123-4567',
      source: 'website',
      status: 'new',
      priority: 'high',
      estimatedValue: 15000,
      expectedCloseDate: undefined,
      assignedTo: undefined,
      notes: 'Flytt från 3:a i Stockholm till Göteborg',
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-20'),
      activities: []
    },
    {
      id: '2',
      name: 'Företaget AB',
      email: 'info@foretaget.se',
      phone: '08-123-4567',
      source: 'referral',
      status: 'contacted',
      priority: 'medium',
      estimatedValue: 45000,
      expectedCloseDate: new Date('2025-02-15'),
      assignedTo: 'Johan Svensson',
      notes: 'Kontorsflytt, ca 20 arbetsplatser',
      createdAt: new Date('2025-01-18'),
      updatedAt: new Date('2025-01-19'),
      activities: [
        {
          id: '1',
          type: 'call' as const,
          title: 'Första kontakt',
          description: 'Diskuterade behov och tidplan',
          completed: true,
          date: new Date('2025-01-19')
        }
      ]
    },
    {
      id: '3',
      name: 'Maria Johansson',
      email: 'maria.j@gmail.com',
      phone: '073-555-1234',
      source: 'other',
      status: 'qualified',
      priority: 'high',
      estimatedValue: 22000,
      expectedCloseDate: new Date('2025-02-01'),
      assignedTo: undefined,
      notes: 'Lead från Flytta.se. 2:a på 65 kvm.',
      createdAt: new Date('2025-01-21'),
      updatedAt: new Date('2025-01-21'),
      activities: []
    }
  ]
}

// Draggable Lead Card Component with memoization
const DraggableLeadCard = React.memo(function DraggableLeadCard({ 
  lead, 
  handleCallLead, 
  handleEmailLead, 
  getSourceLabel, 
  getPriorityColor 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={cn(
        "cursor-move transition-all duration-200 ease-in-out",
        isDragging 
          ? "shadow-2xl ring-2 ring-blue-500 ring-opacity-50 rotate-2 scale-105" 
          : "hover:shadow-md hover:scale-[1.02]"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center flex-1">
              <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
              <Link href={`/crm/leads/${lead.id}`} className="font-medium hover:text-[#002A5C] flex-1">
                {lead.name}
              </Link>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCallLead(lead.phone)}>
                  <Phone className="mr-2 h-4 w-4" />
                  Ring
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEmailLead(lead.email)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/crm/leads/${lead.id}/edit`}>
                    Redigera
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/crm/leads/${lead.id}/convert`}>
                    Konvertera till kund
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-3 w-3 mr-1" />
              {lead.estimatedValue?.toLocaleString('sv-SE')} kr
            </div>
            <div className="flex items-center text-gray-600">
              <User className="h-3 w-3 mr-1" />
              {lead.assignedTo}
            </div>
            {lead.expectedCloseDate && (
              <div className="flex items-center text-gray-600">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(lead.expectedCloseDate).toLocaleDateString('sv-SE')}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <Badge variant="outline" className="text-xs">
              {getSourceLabel(lead.source)}
            </Badge>
            <div className={cn("text-xs font-medium", getPriorityColor(lead.priority))}>
              {lead.priority === 'high' ? 'Hög' : lead.priority === 'medium' ? 'Medium' : 'Låg'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

// Droppable Column Component with memoization
const DroppableColumn = React.memo(function DroppableColumn({ 
  status, 
  children 
}: { 
  status: string, 
  children: React.ReactNode 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status}`,
  })

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "space-y-3 min-h-[200px] p-3 rounded-lg transition-all duration-200 ease-in-out",
        isOver 
          ? "bg-blue-50 ring-2 ring-blue-500 ring-opacity-50 shadow-lg scale-[1.02]" 
          : "bg-gray-50 hover:bg-gray-100"
      )}
    >
      {children}
    </div>
  )
})

export default function LeadsPage() {
  const { leads, isLoading, error, fetchLeads, updateLead } = useLeads()
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [assignedFilter, setAssignedFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchLeadsFromAPI()
  }, [])

  const fetchLeadsFromAPI = async () => {
    try {
      const headers = await getAuthHeaders()
      
      // Add dev token if no auth header present
      if (!headers.Authorization && process.env.NODE_ENV === 'development') {
        headers.Authorization = 'Bearer dev-token'
      }
      
      const response = await fetch('/api/crm/leads', { 
        headers,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Validate response structure
      if (!data || !Array.isArray(data.leads)) {
        throw new Error('Invalid response format from server')
      }
      
      // Update store with proper error handling
      useLeads.setState({ 
        leads: data.leads,
        isLoading: false,
        error: null
      })
      
    } catch (error: any) {
      console.error('Error fetching leads from API:', error)
      
      // If API fails, use demo data
      const demoLeads = getDemoLeads()
      useLeads.setState({ 
        leads: demoLeads,
        isLoading: false,
        error: null
      })
      
      // Show user-friendly error message
      toast({
        title: 'Kunde inte hämta leads',
        description: 'Visar demo-data för testning',
        variant: 'default'
      })
    }
  }

  // Group leads by status for pipeline view - memoized for performance
  const leadsByStatus = useMemo(() => {
    return PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage.id] = leads.filter(lead => lead.status === stage.id)
      return acc
    }, {} as Record<string, typeof leads>)
  }, [leads])

  // Calculate KPIs - memoized to avoid recalculation on every render
  const kpis = useMemo(() => {
    const totalLeads = leads.length
    const qualifiedLeads = leads.filter(l => ['qualified', 'proposal', 'negotiation', 'closed_won'].includes(l.status)).length
    const totalPipelineValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
    const wonDeals = leads.filter(l => l.status === 'closed_won').length
    const conversionRate = totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0
    
    return {
      totalLeads,
      qualifiedLeads,
      totalPipelineValue,
      wonDeals,
      conversionRate
    }
  }, [leads])

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm)
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
    const matchesAssigned = assignedFilter === 'all' || lead.assignedTo === assignedFilter
    
    return matchesSearch && matchesSource && matchesAssigned
  })

  const getSourceLabel = useCallback((source: string) => {
    const labels: Record<string, string> = {
      website: 'Webbplats',
      referral: 'Referens',
      marketing: 'Marknadsföring',
      cold_call: 'Kall Kontakt',
      other: 'Annat'
    }
    return labels[source] || source
  }, [])

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }, [])

  const handleCallLead = useCallback((phone: string) => {
    window.location.href = `tel:${phone}`
  }, [])

  const handleEmailLead = useCallback((email: string) => {
    window.location.href = `mailto:${email}`
  }, [])

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLead(leadId, { status: newStatus })
      
      toast({
        title: 'Success',
        description: 'Lead status updated successfully',
      })
    } catch (error: any) {
      console.error('Error updating lead status:', error)
      
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive'
      })
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string
    
    // Find which lead was dragged
    const draggedLead = leads.find(lead => lead.id === activeId)
    if (!draggedLead) {
      setActiveId(null)
      return
    }
    
    // Check if it's a status column (starts with 'status-')
    if (overId.startsWith('status-')) {
      const newStatus = overId.replace('status-', '')
      
      // Update lead status
      await updateLead(activeId, { status: newStatus })
      
      // Update API
      try {
        const headers = await getAuthHeaders()
        const response = await fetch(`/api/crm/leads/${activeId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: newStatus })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update lead status')
        }
        
        toast({
          title: 'Success',
          description: 'Lead moved successfully',
        })
      } catch (error) {
        console.error('Error updating lead status:', error)
        
        // Revert the change in UI
        await fetchLeadsFromAPI()
        
        toast({
          title: 'Error',
          description: 'Failed to move lead. Please try again.',
          variant: 'destructive'
        })
      }
    }
    
    setActiveId(null)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar leads...</p>
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
            <Button onClick={fetchLeads} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Hantera dina leads genom försäljningsprocessen</p>
        </div>
        <Link href="/crm/leads/new">
          <Button className="bg-[#002A5C] hover:bg-[#001a42]">
            <Plus className="mr-2 h-4 w-4" />
            Ny Lead
          </Button>
        </Link>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totala Leads</p>
                <p className="text-2xl font-bold">{kpis.totalLeads}</p>
                <p className="text-xs text-green-600 mt-1">+12% från förra månaden</p>
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs">Aktiva: {leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kvalificerade</p>
                <p className="text-2xl font-bold">{kpis.qualifiedLeads}</p>
                <p className="text-xs text-blue-600 mt-1">{kpis.totalLeads > 0 ? ((kpis.qualifiedLeads / kpis.totalLeads) * 100).toFixed(1) : 0}% av totala</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pipeline Värde</p>
                <p className="text-2xl font-bold">{kpis.totalPipelineValue.toLocaleString('sv-SE')} kr</p>
                <p className="text-xs text-gray-600 mt-1">Snitt: {kpis.totalLeads > 0 ? (kpis.totalPipelineValue / kpis.totalLeads).toLocaleString('sv-SE') : 0} kr</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-[#002A5C]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vunna Affärer</p>
                <p className="text-2xl font-bold">{kpis.wonDeals}</p>
                <p className="text-xs text-green-600 mt-1">Värde: {leads.filter(l => l.status === 'closed_won').reduce((sum, l) => sum + l.estimatedValue, 0).toLocaleString('sv-SE')} kr</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-[#002A5C] rounded-full flex items-center justify-center text-white font-bold">
                %
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Konvertering</p>
                <p className="text-2xl font-bold">{kpis.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 mt-1">Branschsnitt: 18%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                !
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hög Prioritet</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.priority === 'high').length}</p>
                <p className="text-xs text-red-600 mt-1">Behöver uppmärksamhet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Filtrera & Sök</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'pipeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('pipeline')}
              >
                Pipeline
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Lista
              </Button>
            </div>
          </div>
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
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Källa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Källor</SelectItem>
                <SelectItem value="website">Webbplats</SelectItem>
                <SelectItem value="referral">Referens</SelectItem>
                <SelectItem value="marketing">Marknadsföring</SelectItem>
                <SelectItem value="cold_call">Kall Kontakt</SelectItem>
                <SelectItem value="other">Annat</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tilldelad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={searchTerm ? 'filtered' : 'all'} onValueChange={(value) => {
              if (value === 'high_priority') {
                setSearchTerm('')
                setSourceFilter('all')
                setAssignedFilter('all')
                // Show only high priority leads
              } else if (value === 'closing_soon') {
                setSearchTerm('')
                // Show leads closing within 7 days
              } else if (value === 'stale') {
                setSearchTerm('')
                // Show leads not updated in 7 days
              }
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Snabbfilter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla Leads</SelectItem>
                <SelectItem value="high_priority">🔴 Hög Prioritet</SelectItem>
                <SelectItem value="closing_soon">📅 Stänger Snart</SelectItem>
                <SelectItem value="stale">⏰ Behöver Uppdatering</SelectItem>
                <SelectItem value="new_today">🆕 Nya Idag</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pipeline Analys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {kpis.totalLeads > 0 ? Math.round(leads.filter(l => ['new', 'contacted'].includes(l.status)).length / kpis.totalLeads * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Tidiga leads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {kpis.totalLeads > 0 ? Math.round(leads.filter(l => ['qualified', 'proposal'].includes(l.status)).length / kpis.totalLeads * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Kvalificerade</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {kpis.totalLeads > 0 ? Math.round(leads.filter(l => ['negotiation', 'closed_won'].includes(l.status)).length / kpis.totalLeads * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Avslutande</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Källfördelning</h4>
                <div className="space-y-2">
                  {['website', 'referral', 'marketing', 'cold_call', 'other'].map(source => {
                    const count = leads.filter(l => l.source === source).length
                    const percentage = kpis.totalLeads > 0 ? (count / kpis.totalLeads) * 100 : 0
                    return (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{getSourceLabel(source)}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                source === 'website' ? 'bg-blue-500' :
                                source === 'referral' ? 'bg-green-500' :
                                source === 'marketing' ? 'bg-purple-500' :
                                source === 'cold_call' ? 'bg-orange-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Månadens Mål
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Nya Leads</span>
                  <span className="text-sm text-gray-600">{leads.filter(l => l.status === 'new').length}/15</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (leads.filter(l => l.status === 'new').length / 15) * 100)}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Kvalificerade</span>
                  <span className="text-sm text-gray-600">{kpis.qualifiedLeads}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${Math.min(100, (kpis.qualifiedLeads / 10) * 100)}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Avslutade</span>
                  <span className="text-sm text-gray-600">{kpis.wonDeals}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, (kpis.wonDeals / 5) * 100)}%` }} />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Intäktsmål</p>
                <p className="text-2xl font-bold text-green-600">
                  {leads.filter(l => l.status === 'closed_won').reduce((sum, l) => sum + l.estimatedValue, 0).toLocaleString('sv-SE')} kr
                </p>
                <p className="text-xs text-gray-600">av 100 000 kr</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4 min-w-max">
              {PIPELINE_STAGES.map((stage) => (
                <div key={stage.id} className="w-72">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                      <Badge className={stage.color}>
                        {leadsByStatus[stage.id]?.length || 0}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {leadsByStatus[stage.id]?.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0).toLocaleString('sv-SE')} kr
                    </p>
                  </div>
                  
                  <DroppableColumn status={stage.id}>
                    <SortableContext
                      items={leadsByStatus[stage.id]?.map(lead => lead.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      {leadsByStatus[stage.id]?.map((lead) => (
                        <DraggableLeadCard
                          key={lead.id}
                          lead={lead}
                          handleCallLead={handleCallLead}
                          handleEmailLead={handleEmailLead}
                          getSourceLabel={getSourceLabel}
                          getPriorityColor={getPriorityColor}
                        />
                      ))}
                      
                      {(!leadsByStatus[stage.id] || leadsByStatus[stage.id].length === 0) && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-white">
                          <p className="text-sm text-gray-500">Inga leads i denna fas</p>
                        </div>
                      )}
                    </SortableContext>
                  </DroppableColumn>
                </div>
              ))}
            </div>
          </div>
          
          <DragOverlay>
            {activeId ? (
              <Card className="cursor-move shadow-2xl ring-2 ring-blue-500 ring-opacity-70 rotate-3 scale-110 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <GripVertical className="h-4 w-4 text-blue-500 mr-2" />
                    <div className="font-medium text-blue-900">
                      {leads.find(l => l.id === activeId)?.name}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <DollarSign className="h-3 w-3 inline mr-1" />
                      {leads.find(l => l.id === activeId)?.estimatedValue?.toLocaleString('sv-SE')} kr
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Flyttar...
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Namn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Värde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Källa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tilldelad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/crm/leads/${lead.id}`} className="font-medium hover:text-[#002A5C]">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={PIPELINE_STAGES.find(s => s.id === lead.status)?.color}>
                          {PIPELINE_STAGES.find(s => s.id === lead.status)?.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.estimatedValue?.toLocaleString('sv-SE')} kr
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSourceLabel(lead.source)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.assignedTo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCallLead(lead.phone)}
                            className="h-8 w-8 p-0"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEmailLead(lead.email)}
                            className="h-8 w-8 p-0"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Link href={`/crm/leads/${lead.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredLeads.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Inga leads hittades</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || sourceFilter !== 'all' || assignedFilter !== 'all'
                    ? 'Prova att ändra dina sökkriterier'
                    : 'Kom igång genom att skapa din första lead'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}