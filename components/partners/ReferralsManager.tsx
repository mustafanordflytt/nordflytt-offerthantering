'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  MoreHorizontal,
  Star,
  MessageSquare,
  FileText,
  ArrowRight,
  Target,
  Award,
  Handshake,
  Building2,
  Settings,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ReferralAttributionEngine } from '@/lib/partners/ReferralAttributionEngine'
import { DynamicKickbackEngine } from '@/lib/partners/DynamicKickbackEngine'

interface Referral {
  id: number
  referralCode: string
  partnerName: string
  partnerCategory: string
  partnerTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  agentName?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  moveFrom: string
  moveTo: string
  moveDate: Date
  moveType: 'residential' | 'office' | 'storage' | 'cleaning' | 'dödsbo'
  referralSource: 'website' | 'phone' | 'email' | 'in_person' | 'social_media'
  referralDate: Date
  firstContactDate?: Date
  quoteSentDate?: Date
  quoteAmount?: number
  estimatedValue: number
  actualValue?: number
  servicesIncluded: string[]
  conversionStatus: 'pending' | 'contacted' | 'quoted' | 'converted' | 'lost' | 'cancelled'
  conversionDate?: Date
  lossReason?: string
  kickbackAmount: number
  kickbackCalculated: boolean
  paymentStatus: 'pending' | 'calculated' | 'approved' | 'paid'
  paymentDate?: Date
  customerSatisfaction?: number
  customerFeedback?: string
  aiConversionProbability: number
  qualityScore: number
  followUpRequired: boolean
  lastFollowUpDate?: Date
  nextFollowUpDate?: Date
  notes?: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
}

interface ReferralMetrics {
  totalReferrals: number
  activeReferrals: number
  conversionRate: number
  avgDealValue: number
  totalRevenue: number
  pendingKickbacks: number
  avgConversionTime: number
  topPerformingPartner: string
}

interface ReferralsManagerProps {
  initialReferrals?: Referral[]
  onReferralsChange?: (referrals: Referral[]) => void
}

export function ReferralsManager({ initialReferrals = [], onReferralsChange }: ReferralsManagerProps) {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals)
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([])
  const [metrics, setMetrics] = useState<ReferralMetrics>({
    totalReferrals: 0,
    activeReferrals: 0,
    conversionRate: 0,
    avgDealValue: 0,
    totalRevenue: 0,
    pendingKickbacks: 0,
    avgConversionTime: 0,
    topPerformingPartner: ''
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPartner, setSelectedPartner] = useState('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof Referral>('referralDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  const [attributionEngine] = useState(new ReferralAttributionEngine())
  const [kickbackEngine] = useState(new DynamicKickbackEngine())

  const conversionStages = [
    { id: 'pending', name: 'Väntande', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'contacted', name: 'Kontaktad', color: 'bg-blue-100 text-blue-800' },
    { id: 'quoted', name: 'Offert skickad', color: 'bg-purple-100 text-purple-800' },
    { id: 'converted', name: 'Konverterad', color: 'bg-green-100 text-green-800' },
    { id: 'lost', name: 'Förlorad', color: 'bg-red-100 text-red-800' },
    { id: 'cancelled', name: 'Avbruten', color: 'bg-gray-100 text-gray-800' }
  ]

  const urgencyLevels = [
    { id: 'low', name: 'Låg', color: 'bg-green-100 text-green-800' },
    { id: 'medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'high', name: 'Hög', color: 'bg-orange-100 text-orange-800' },
    { id: 'urgent', name: 'Akut', color: 'bg-red-100 text-red-800' }
  ]

  // Mock data for demonstration
  useEffect(() => {
    if (initialReferrals.length === 0) {
      const mockReferrals: Referral[] = [
        {
          id: 1,
          referralCode: 'MÄK001REF',
          partnerName: 'Svensk Fastighetsförmedling Stockholm',
          partnerCategory: 'mäklare',
          partnerTier: 'gold',
          agentName: 'Anna Carlsson',
          customerName: 'Gustav Andersson',
          customerEmail: 'gustav.andersson@email.com',
          customerPhone: '+46 70 123 45 67',
          moveFrom: 'Södermalm, Stockholm',
          moveTo: 'Östermalm, Stockholm',
          moveDate: new Date('2025-02-15'),
          moveType: 'residential',
          referralSource: 'website',
          referralDate: new Date('2025-01-15'),
          firstContactDate: new Date('2025-01-15'),
          quoteSentDate: new Date('2025-01-16'),
          quoteAmount: 8500,
          estimatedValue: 8500,
          servicesIncluded: ['Flytthjälp', 'Emballage', 'Städning'],
          conversionStatus: 'quoted',
          kickbackAmount: 850,
          kickbackCalculated: true,
          paymentStatus: 'calculated',
          aiConversionProbability: 0.85,
          qualityScore: 8,
          followUpRequired: true,
          nextFollowUpDate: new Date('2025-01-18'),
          urgencyLevel: 'medium',
          tags: ['Privatflyttning', 'Stockholm']
        },
        {
          id: 2,
          referralCode: 'MÄK002REF',
          partnerName: 'Svensk Fastighetsförmedling Stockholm',
          partnerCategory: 'mäklare',
          partnerTier: 'gold',
          agentName: 'Anna Carlsson',
          customerName: 'Sarah Johnson',
          customerEmail: 'sarah.johnson@email.com',
          customerPhone: '+46 70 234 56 78',
          moveFrom: 'Gamla Stan, Stockholm',
          moveTo: 'Vasastan, Stockholm',
          moveDate: new Date('2025-02-28'),
          moveType: 'residential',
          referralSource: 'phone',
          referralDate: new Date('2025-01-12'),
          firstContactDate: new Date('2025-01-12'),
          quoteSentDate: new Date('2025-01-13'),
          quoteAmount: 12000,
          estimatedValue: 12000,
          actualValue: 12000,
          servicesIncluded: ['Flytthjälp', 'Emballage', 'Städning', 'Montering'],
          conversionStatus: 'converted',
          conversionDate: new Date('2025-01-14'),
          kickbackAmount: 1200,
          kickbackCalculated: true,
          paymentStatus: 'paid',
          paymentDate: new Date('2025-01-15'),
          customerSatisfaction: 5,
          customerFeedback: 'Fantastisk service, mycket nöjd!',
          aiConversionProbability: 0.92,
          qualityScore: 9,
          followUpRequired: false,
          urgencyLevel: 'high',
          tags: ['Privatflyttning', 'Stockholm', 'Konverterad']
        },
        {
          id: 3,
          referralCode: 'BEG001REF',
          partnerName: 'Fonus Stockholm',
          partnerCategory: 'begravningsbyråer',
          partnerTier: 'platinum',
          agentName: 'Maria Lindqvist',
          customerName: 'Familjen Svensson',
          customerEmail: 'erik.svensson@email.com',
          customerPhone: '+46 70 345 67 89',
          moveFrom: 'Bromma, Stockholm',
          moveTo: 'Dödsbo clearing',
          moveDate: new Date('2025-02-10'),
          moveType: 'dödsbo',
          referralSource: 'in_person',
          referralDate: new Date('2025-01-10'),
          firstContactDate: new Date('2025-01-11'),
          estimatedValue: 18000,
          servicesIncluded: ['Dödsbo tömning', 'Städning', 'Värdering'],
          conversionStatus: 'contacted',
          kickbackAmount: 2160,
          kickbackCalculated: false,
          paymentStatus: 'pending',
          aiConversionProbability: 0.78,
          qualityScore: 7,
          followUpRequired: true,
          nextFollowUpDate: new Date('2025-01-17'),
          urgencyLevel: 'high',
          tags: ['Dödsbo', 'Känslig', 'Stockholm']
        },
        {
          id: 4,
          referralCode: 'BAN001REF',
          partnerName: 'Handelsbanken Private Banking',
          partnerCategory: 'bankRådgivare',
          partnerTier: 'silver',
          agentName: 'Karin Nilsson',
          customerName: 'Mikael Lindström',
          customerEmail: 'mikael.lindstrom@email.com',
          customerPhone: '+46 70 456 78 90',
          moveFrom: 'Sollentuna',
          moveTo: 'Danderyd',
          moveDate: new Date('2025-03-05'),
          moveType: 'residential',
          referralSource: 'email',
          referralDate: new Date('2025-01-08'),
          firstContactDate: new Date('2025-01-09'),
          estimatedValue: 9200,
          servicesIncluded: ['Flytthjälp', 'Emballage'],
          conversionStatus: 'contacted',
          kickbackAmount: 552,
          kickbackCalculated: true,
          paymentStatus: 'calculated',
          aiConversionProbability: 0.75,
          qualityScore: 8,
          followUpRequired: true,
          nextFollowUpDate: new Date('2025-01-16'),
          urgencyLevel: 'medium',
          tags: ['Privatflyttning', 'Bank referral']
        },
        {
          id: 5,
          referralCode: 'STÄ001REF',
          partnerName: 'Stockholm Städservice',
          partnerCategory: 'flyttstädning',
          partnerTier: 'bronze',
          agentName: 'Johan Petersson',
          customerName: 'Anna Petersson',
          customerEmail: 'anna.petersson@email.com',
          customerPhone: '+46 70 567 89 01',
          moveFrom: 'Nacka',
          moveTo: 'Täby',
          moveDate: new Date('2025-02-20'),
          moveType: 'residential',
          referralSource: 'website',
          referralDate: new Date('2025-01-05'),
          estimatedValue: 7800,
          servicesIncluded: ['Flytthjälp', 'Städning'],
          conversionStatus: 'pending',
          kickbackAmount: 780,
          kickbackCalculated: false,
          paymentStatus: 'pending',
          aiConversionProbability: 0.81,
          qualityScore: 8,
          followUpRequired: true,
          nextFollowUpDate: new Date('2025-01-16'),
          urgencyLevel: 'low',
          tags: ['Privatflyttning', 'Städning']
        },
        {
          id: 6,
          referralCode: 'MÄK003REF',
          partnerName: 'Hemnet Mäkleri AB',
          partnerCategory: 'mäklare',
          partnerTier: 'platinum',
          agentName: 'Erik Johansson',
          customerName: 'Linda Andersson',
          customerEmail: 'linda.andersson@email.com',
          customerPhone: '+46 70 678 90 12',
          moveFrom: 'Östermalm, Stockholm',
          moveTo: 'Djursholm',
          moveDate: new Date('2025-03-15'),
          moveType: 'residential',
          referralSource: 'phone',
          referralDate: new Date('2025-01-03'),
          firstContactDate: new Date('2025-01-04'),
          estimatedValue: 15000,
          servicesIncluded: ['Flytthjälp', 'Emballage', 'Städning', 'Montering', 'Förvaring'],
          conversionStatus: 'lost',
          conversionDate: new Date('2025-01-10'),
          lossReason: 'Valde billigare alternativ',
          kickbackAmount: 0,
          kickbackCalculated: false,
          paymentStatus: 'pending',
          aiConversionProbability: 0.65,
          qualityScore: 6,
          followUpRequired: false,
          urgencyLevel: 'medium',
          tags: ['Privatflyttning', 'Förlorad', 'Pris']
        }
      ]
      setReferrals(mockReferrals)
    }
  }, [initialReferrals])

  // Calculate metrics
  useEffect(() => {
    if (referrals.length > 0) {
      const totalReferrals = referrals.length
      const activeReferrals = referrals.filter(r => 
        ['pending', 'contacted', 'quoted'].includes(r.conversionStatus)
      ).length
      const convertedReferrals = referrals.filter(r => r.conversionStatus === 'converted')
      const conversionRate = convertedReferrals.length / totalReferrals
      const avgDealValue = convertedReferrals.reduce((sum, r) => sum + (r.actualValue || 0), 0) / convertedReferrals.length || 0
      const totalRevenue = convertedReferrals.reduce((sum, r) => sum + (r.actualValue || 0), 0)
      const pendingKickbacks = referrals.filter(r => r.paymentStatus === 'pending').reduce((sum, r) => sum + r.kickbackAmount, 0)
      
      // Calculate average conversion time
      const avgConversionTime = convertedReferrals.reduce((sum, r) => {
        if (r.conversionDate && r.referralDate) {
          return sum + (r.conversionDate.getTime() - r.referralDate.getTime()) / (1000 * 60 * 60 * 24)
        }
        return sum
      }, 0) / convertedReferrals.length || 0

      // Find top performing partner
      const partnerRevenue = referrals.reduce((acc, r) => {
        if (r.conversionStatus === 'converted') {
          acc[r.partnerName] = (acc[r.partnerName] || 0) + (r.actualValue || 0)
        }
        return acc
      }, {} as Record<string, number>)
      
      const topPerformingPartner = Object.entries(partnerRevenue).reduce((a, b) => 
        a[1] > b[1] ? a : b
      )?.[0] || ''

      setMetrics({
        totalReferrals,
        activeReferrals,
        conversionRate,
        avgDealValue,
        totalRevenue,
        pendingKickbacks,
        avgConversionTime,
        topPerformingPartner
      })
    }
  }, [referrals])

  // Filter referrals
  useEffect(() => {
    let filtered = referrals.filter(referral => {
      const matchesSearch = referral.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           referral.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           referral.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || referral.conversionStatus === selectedStatus
      const matchesPartner = selectedPartner === 'all' || referral.partnerName === selectedPartner
      
      // Filter by timeframe
      let matchesTimeframe = true
      if (selectedTimeframe !== 'all') {
        const now = new Date()
        const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 0
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        matchesTimeframe = referral.referralDate >= cutoff
      }
      
      return matchesSearch && matchesStatus && matchesPartner && matchesTimeframe
    })

    // Sort referrals
    filtered = filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime()
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

    setFilteredReferrals(filtered)
  }, [referrals, searchTerm, selectedStatus, selectedPartner, selectedTimeframe, sortField, sortDirection])

  // Notify parent component of changes
  useEffect(() => {
    if (onReferralsChange) {
      onReferralsChange(referrals)
    }
  }, [referrals, onReferralsChange])

  const handleSort = (field: keyof Referral) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleStatusUpdate = async (referralId: number, newStatus: Referral['conversionStatus']) => {
    setIsLoading(true)
    try {
      setReferrals(referrals.map(r => 
        r.id === referralId 
          ? { 
              ...r, 
              conversionStatus: newStatus,
              conversionDate: newStatus === 'converted' ? new Date() : r.conversionDate
            }
          : r
      ))
    } catch (error) {
      console.error('Error updating referral status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (referral: Referral) => {
    setSelectedReferral(referral)
    setIsDetailsModalOpen(true)
  }

  const handleEditReferral = (referral: Referral) => {
    setSelectedReferral(referral)
    setIsEditModalOpen(true)
  }

  const handleUpdateReferral = async (updatedReferral: Referral) => {
    setIsLoading(true)
    try {
      setReferrals(referrals.map(r => r.id === updatedReferral.id ? updatedReferral : r))
      setIsEditModalOpen(false)
      setSelectedReferral(null)
    } catch (error) {
      console.error('Error updating referral:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateKickback = async (referral: Referral) => {
    try {
      const calculation = await kickbackEngine.calculateMonthlyKickback(referral.id)
      console.log('Kickback calculation:', calculation)
      // In real implementation, update referral with calculated kickback
    } catch (error) {
      console.error('Error calculating kickback:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const stage = conversionStages.find(s => s.id === status)
    return stage ? stage.color : 'bg-gray-100 text-gray-800'
  }

  const getUrgencyColor = (urgency: string) => {
    const level = urgencyLevels.find(l => l.id === urgency)
    return level ? level.color : 'bg-gray-100 text-gray-800'
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'bronze': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPriorityReferrals = () => {
    return filteredReferrals.filter(r => 
      r.followUpRequired && 
      r.nextFollowUpDate && 
      r.nextFollowUpDate <= new Date()
    ).slice(0, 5)
  }

  const getHighValueReferrals = () => {
    return filteredReferrals.filter(r => r.estimatedValue > 12000).slice(0, 5)
  }

  const getUniquePartners = () => {
    const partners = Array.from(new Set(referrals.map(r => r.partnerName)))
    return [{ id: 'all', name: 'Alla partners' }, ...partners.map(p => ({ id: p, name: p }))]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Referrals</h2>
          <p className="text-gray-600">Hantera och optimera referral-pipeline</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')}>
            {viewMode === 'table' ? 'Kanban vy' : 'Tabell vy'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Referrals</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeReferrals} aktiva
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.conversionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              ⌀ {metrics.avgConversionTime.toFixed(1)} dagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Omsättning</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              ⌀ {formatCurrency(metrics.avgDealValue)} per deal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Väntande Kickbacks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.pendingKickbacks)}</div>
            <p className="text-xs text-muted-foreground">
              Att betala ut
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Alla referrals</TabsTrigger>
          <TabsTrigger value="priority">Prioritera</TabsTrigger>
          <TabsTrigger value="high-value">Högt värde</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Sök referrals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla statusar</SelectItem>
                  {conversionStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getUniquePartners().map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dagar</SelectItem>
                  <SelectItem value="30d">30 dagar</SelectItem>
                  <SelectItem value="90d">90 dagar</SelectItem>
                  <SelectItem value="all">Alla</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Referrals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Referrals ({filteredReferrals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('referralDate')}>
                      Datum {sortField === 'referralDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('customerName')}>
                      Kund {sortField === 'customerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('partnerName')}>
                      Partner {sortField === 'partnerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('estimatedValue')}>
                      Värde {sortField === 'estimatedValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('conversionStatus')}>
                      Status {sortField === 'conversionStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Brådska</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Kickback</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>{formatDate(referral.referralDate)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referral.customerName}</div>
                          <div className="text-sm text-gray-500">{referral.moveFrom} → {referral.moveTo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referral.partnerName}</div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge variant="outline" className="text-xs">{referral.partnerCategory}</Badge>
                            <Badge className={getTierColor(referral.partnerTier)}>{referral.partnerTier}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(referral.estimatedValue)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(referral.conversionStatus)}>
                          {conversionStages.find(s => s.id === referral.conversionStatus)?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(referral.urgencyLevel)}>
                          {urgencyLevels.find(l => l.id === referral.urgencyLevel)?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${referral.aiConversionProbability * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {(referral.aiConversionProbability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCurrency(referral.kickbackAmount)}</div>
                          <div className="text-xs text-gray-500">{referral.paymentStatus}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(referral)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visa detaljer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditReferral(referral)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Redigera
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => calculateKickback(referral)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Beräkna kickback
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(referral.id, 'converted')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Markera som konverterad
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(referral.id, 'lost')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Markera som förlorad
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prioritera uppföljningar</CardTitle>
              <CardDescription>
                Referrals som behöver omedelbar uppföljning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getPriorityReferrals().map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <div>
                        <div className="font-medium">{referral.customerName}</div>
                        <div className="text-sm text-gray-500">{referral.partnerName}</div>
                        <div className="text-xs text-gray-400">
                          Uppföljning: {formatDate(referral.nextFollowUpDate!)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getUrgencyColor(referral.urgencyLevel)}>
                        {urgencyLevels.find(l => l.id === referral.urgencyLevel)?.name}
                      </Badge>
                      <Button size="sm" onClick={() => handleViewDetails(referral)}>
                        Visa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Högt värde referrals</CardTitle>
              <CardDescription>
                Referrals med högst potential värde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getHighValueReferrals().map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <div>
                        <div className="font-medium">{referral.customerName}</div>
                        <div className="text-sm text-gray-500">{referral.partnerName}</div>
                        <div className="text-xs text-gray-400">
                          {formatCurrency(referral.estimatedValue)} • {referral.moveType}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(referral.conversionStatus)}>
                        {conversionStages.find(s => s.id === referral.conversionStatus)?.name}
                      </Badge>
                      <Button size="sm" onClick={() => handleViewDetails(referral)}>
                        Visa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Konvertering per Partner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getUniquePartners().slice(1, 6).map((partner) => {
                    const partnerReferrals = referrals.filter(r => r.partnerName === partner.name)
                    const converted = partnerReferrals.filter(r => r.conversionStatus === 'converted')
                    const rate = partnerReferrals.length > 0 ? converted.length / partnerReferrals.length * 100 : 0
                    
                    return (
                      <div key={partner.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{partner.name}</span>
                          <span>{rate.toFixed(0)}%</span>
                        </div>
                        <Progress value={rate} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referrals per Månad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-2xl font-bold">{referrals.length}</div>
                  <div className="text-sm text-gray-500">Totalt denna månad</div>
                  <div className="text-sm text-green-600 mt-2">
                    +{Math.round((referrals.length / 20) * 100)}% från föregående månad
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Referral Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Referral detaljer</DialogTitle>
            <DialogDescription>
              Fullständig information om referral
            </DialogDescription>
          </DialogHeader>
          {selectedReferral && (
            <ReferralDetailsView referral={selectedReferral} />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Referral Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redigera referral</DialogTitle>
            <DialogDescription>
              Uppdatera referral information
            </DialogDescription>
          </DialogHeader>
          {selectedReferral && (
            <EditReferralForm 
              referral={selectedReferral} 
              onSubmit={handleUpdateReferral} 
              isLoading={isLoading} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Referral Details View Component
function ReferralDetailsView({ referral }: { referral: Referral }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kundinformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Namn</Label>
              <p className="text-sm text-gray-600">{referral.customerName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">E-post</Label>
              <p className="text-sm text-gray-600">{referral.customerEmail}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Telefon</Label>
              <p className="text-sm text-gray-600">{referral.customerPhone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Flytt från</Label>
              <p className="text-sm text-gray-600">{referral.moveFrom}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Flytt till</Label>
              <p className="text-sm text-gray-600">{referral.moveTo}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Flyttdatum</Label>
              <p className="text-sm text-gray-600">{formatDate(referral.moveDate)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partner & Referral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Partner</Label>
              <p className="text-sm text-gray-600">{referral.partnerName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Agent</Label>
              <p className="text-sm text-gray-600">{referral.agentName || 'Ingen agent'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Referral kod</Label>
              <p className="text-sm text-gray-600">{referral.referralCode}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Referral datum</Label>
              <p className="text-sm text-gray-600">{formatDate(referral.referralDate)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Källa</Label>
              <p className="text-sm text-gray-600">{referral.referralSource}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Brådska</Label>
              <p className="text-sm text-gray-600">{referral.urgencyLevel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle>Finansiell information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(referral.estimatedValue)}</div>
              <div className="text-sm text-gray-500">Uppskattat värde</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(referral.actualValue || 0)}</div>
              <div className="text-sm text-gray-500">Faktiskt värde</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(referral.kickbackAmount)}</div>
              <div className="text-sm text-gray-500">Kickback</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{(referral.aiConversionProbability * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-500">AI sannolikhet</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Tjänster inkluderade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {referral.servicesIncluded.map((service, index) => (
              <Badge key={index} variant="outline">{service}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tidslinje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div>
                <div className="font-medium">Referral mottagen</div>
                <div className="text-sm text-gray-500">{formatDate(referral.referralDate)}</div>
              </div>
            </div>
            {referral.firstContactDate && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <div className="font-medium">Första kontakt</div>
                  <div className="text-sm text-gray-500">{formatDate(referral.firstContactDate)}</div>
                </div>
              </div>
            )}
            {referral.quoteSentDate && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div>
                  <div className="font-medium">Offert skickad</div>
                  <div className="text-sm text-gray-500">{formatDate(referral.quoteSentDate)}</div>
                </div>
              </div>
            )}
            {referral.conversionDate && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <div>
                  <div className="font-medium">Konverterad</div>
                  <div className="text-sm text-gray-500">{formatDate(referral.conversionDate)}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes and Feedback */}
      {(referral.notes || referral.customerFeedback) && (
        <Card>
          <CardHeader>
            <CardTitle>Anteckningar & Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referral.notes && (
              <div>
                <Label className="text-sm font-medium">Anteckningar</Label>
                <p className="text-sm text-gray-600">{referral.notes}</p>
              </div>
            )}
            {referral.customerFeedback && (
              <div>
                <Label className="text-sm font-medium">Kundfeedback</Label>
                <p className="text-sm text-gray-600">{referral.customerFeedback}</p>
                {referral.customerSatisfaction && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < referral.customerSatisfaction!
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{referral.customerSatisfaction}/5</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Edit Referral Form Component
function EditReferralForm({ referral, onSubmit, isLoading }: { 
  referral: Referral; 
  onSubmit: (data: Referral) => void; 
  isLoading: boolean 
}) {
  const [formData, setFormData] = useState(referral)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const conversionStages = [
    { id: 'pending', name: 'Väntande' },
    { id: 'contacted', name: 'Kontaktad' },
    { id: 'quoted', name: 'Offert skickad' },
    { id: 'converted', name: 'Konverterad' },
    { id: 'lost', name: 'Förlorad' },
    { id: 'cancelled', name: 'Avbruten' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerName">Kundnamn</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="conversionStatus">Status</Label>
          <Select 
            value={formData.conversionStatus} 
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, conversionStatus: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conversionStages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimatedValue">Uppskattat värde</Label>
          <Input
            id="estimatedValue"
            type="number"
            value={formData.estimatedValue}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: parseInt(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="actualValue">Faktiskt värde</Label>
          <Input
            id="actualValue"
            type="number"
            value={formData.actualValue || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, actualValue: parseInt(e.target.value) || undefined }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Anteckningar</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Uppdaterar...' : 'Uppdatera referral'}
        </Button>
      </div>
    </form>
  )
}