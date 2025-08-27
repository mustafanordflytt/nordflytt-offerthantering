'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  Building2, 
  Calendar,
  TrendingUp,
  Users,
  Target,
  Award,
  Settings,
  MoreHorizontal,
  ExternalLink,
  FileText,
  DollarSign,
  UserCheck,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SmartPartnerOnboarding } from '@/lib/partners/SmartPartnerOnboarding'
import { DynamicKickbackEngine } from '@/lib/partners/DynamicKickbackEngine'

interface Partner {
  id: number
  name: string
  orgNumber: string
  category: string
  status: 'active' | 'pending' | 'negotiating' | 'inactive' | 'suspended'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  contactPerson: string
  email: string
  phone: string
  website?: string
  address?: string
  kickbackRate: number
  monthlyReferrals: number
  totalReferrals: number
  conversionRate: number
  totalRevenue: number
  lastActivity: Date
  contractDate?: Date
  notes?: string
  onboardingStage?: string
  performance: {
    monthlyTarget: number
    achievementRate: number
    qualityScore: number
    customerSatisfaction: number
  }
}

interface PartnersManagerProps {
  initialPartners?: Partner[]
  onPartnersChange?: (partners: Partner[]) => void
}

export function PartnersManager({ initialPartners = [], onPartnersChange }: PartnersManagerProps) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners)
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof Partner>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isLoading, setIsLoading] = useState(false)

  const [onboardingEngine] = useState(new SmartPartnerOnboarding())
  const [kickbackEngine] = useState(new DynamicKickbackEngine())

  const categories = [
    { id: 'all', name: 'Alla kategorier' },
    { id: 'mäklare', name: 'Mäklare' },
    { id: 'begravningsbyråer', name: 'Begravningsbyråer' },
    { id: 'fastighetsförvaltare', name: 'Fastighetsförvaltare' },
    { id: 'bankRådgivare', name: 'Bankrådgivare' },
    { id: 'flyttstädning', name: 'Flyttstädning' },
    { id: 'inredningsbutiker', name: 'Inredningsbutiker' }
  ]

  const statuses = [
    { id: 'all', name: 'Alla statusar' },
    { id: 'active', name: 'Aktiv' },
    { id: 'pending', name: 'Väntande' },
    { id: 'negotiating', name: 'Förhandlar' },
    { id: 'inactive', name: 'Inaktiv' },
    { id: 'suspended', name: 'Pausad' }
  ]

  const tiers = [
    { id: 'all', name: 'Alla tiers' },
    { id: 'bronze', name: 'Bronze' },
    { id: 'silver', name: 'Silver' },
    { id: 'gold', name: 'Gold' },
    { id: 'platinum', name: 'Platinum' }
  ]

  // Mock data for demonstration
  useEffect(() => {
    if (initialPartners.length === 0) {
      const mockPartners: Partner[] = [
        {
          id: 1,
          name: 'Svensk Fastighetsförmedling Stockholm',
          orgNumber: '556188-8888',
          category: 'mäklare',
          status: 'active',
          tier: 'gold',
          contactPerson: 'Anna Carlsson',
          email: 'anna.carlsson@svenskfast.se',
          phone: '+46 8 123 45 67',
          website: 'svenskfast.se',
          address: 'Stureplan 4, 114 35 Stockholm',
          kickbackRate: 0.10,
          monthlyReferrals: 28,
          totalReferrals: 168,
          conversionRate: 0.85,
          totalRevenue: 238000,
          lastActivity: new Date('2025-01-15'),
          contractDate: new Date('2024-06-15'),
          notes: 'Topp partner med konsistent prestanda.',
          onboardingStage: 'completed',
          performance: {
            monthlyTarget: 25,
            achievementRate: 1.12,
            qualityScore: 8.5,
            customerSatisfaction: 4.6
          }
        },
        {
          id: 2,
          name: 'Fonus Stockholm',
          orgNumber: '556077-7777',
          category: 'begravningsbyråer',
          status: 'active',
          tier: 'platinum',
          contactPerson: 'Maria Lindqvist',
          email: 'maria.lindqvist@fonus.se',
          phone: '+46 8 345 67 89',
          website: 'fonus.se',
          address: 'Upplandsgatan 15, 113 23 Stockholm',
          kickbackRate: 0.12,
          monthlyReferrals: 15,
          totalReferrals: 92,
          conversionRate: 0.92,
          totalRevenue: 216000,
          lastActivity: new Date('2025-01-14'),
          contractDate: new Date('2024-08-01'),
          notes: 'Högsta konverteringsgrad i nätverket.',
          onboardingStage: 'completed',
          performance: {
            monthlyTarget: 12,
            achievementRate: 1.25,
            qualityScore: 9.2,
            customerSatisfaction: 4.8
          }
        },
        {
          id: 3,
          name: 'Stockholmshem',
          orgNumber: '556366-6666',
          category: 'fastighetsförvaltare',
          status: 'negotiating',
          tier: 'silver',
          contactPerson: 'Lars Andersson',
          email: 'lars.andersson@stockholmshem.se',
          phone: '+46 8 456 78 90',
          website: 'stockholmshem.se',
          address: 'Hamngatan 12, 111 47 Stockholm',
          kickbackRate: 0.08,
          monthlyReferrals: 22,
          totalReferrals: 89,
          conversionRate: 0.71,
          totalRevenue: 165000,
          lastActivity: new Date('2025-01-13'),
          contractDate: new Date('2024-09-10'),
          notes: 'Förhandlar om förbättrade villkor.',
          onboardingStage: 'negotiation',
          performance: {
            monthlyTarget: 20,
            achievementRate: 1.10,
            qualityScore: 7.8,
            customerSatisfaction: 4.2
          }
        },
        {
          id: 4,
          name: 'Handelsbanken Private Banking',
          orgNumber: '556455-5555',
          category: 'bankRådgivare',
          status: 'active',
          tier: 'silver',
          contactPerson: 'Karin Nilsson',
          email: 'karin.nilsson@handelsbanken.se',
          phone: '+46 8 567 89 01',
          website: 'handelsbanken.se',
          address: 'Kungsträdgårdsgatan 2, 106 70 Stockholm',
          kickbackRate: 0.06,
          monthlyReferrals: 18,
          totalReferrals: 124,
          conversionRate: 0.76,
          totalRevenue: 129600,
          lastActivity: new Date('2025-01-12'),
          contractDate: new Date('2024-05-20'),
          notes: 'Stabil partner med god kvalitet.',
          onboardingStage: 'completed',
          performance: {
            monthlyTarget: 15,
            achievementRate: 1.20,
            qualityScore: 8.1,
            customerSatisfaction: 4.4
          }
        },
        {
          id: 5,
          name: 'Stockholm Städservice',
          orgNumber: '556544-4444',
          category: 'flyttstädning',
          status: 'pending',
          tier: 'bronze',
          contactPerson: 'Johan Petersson',
          email: 'johan.petersson@stockholmstäd.se',
          phone: '+46 8 678 90 12',
          website: 'stockholmstäd.se',
          address: 'Södermalmsallén 36, 118 28 Stockholm',
          kickbackRate: 0.10,
          monthlyReferrals: 12,
          totalReferrals: 45,
          conversionRate: 0.68,
          totalRevenue: 97200,
          lastActivity: new Date('2025-01-11'),
          contractDate: new Date('2024-11-15'),
          notes: 'Ny partner, väntar på systemintegration.',
          onboardingStage: 'system_integration',
          performance: {
            monthlyTarget: 15,
            achievementRate: 0.80,
            qualityScore: 6.9,
            customerSatisfaction: 4.1
          }
        }
      ]
      setPartners(mockPartners)
    }
  }, [initialPartners])

  // Filter and sort partners
  useEffect(() => {
    let filtered = partners.filter(partner => {
      const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           partner.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || partner.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || partner.status === selectedStatus
      const matchesTier = selectedTier === 'all' || partner.tier === selectedTier
      
      return matchesSearch && matchesCategory && matchesStatus && matchesTier
    })

    // Sort partners
    filtered = filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

    setFilteredPartners(filtered)
  }, [partners, searchTerm, selectedCategory, selectedStatus, selectedTier, sortField, sortDirection])

  // Notify parent component of changes
  useEffect(() => {
    if (onPartnersChange) {
      onPartnersChange(partners)
    }
  }, [partners]) // Remove onPartnersChange from dependencies to prevent infinite loop

  const handleSort = (field: keyof Partner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleAddPartner = async (partnerData: Partial<Partner>) => {
    setIsLoading(true)
    try {
      const newPartner: Partner = {
        id: Date.now(),
        name: partnerData.name || '',
        orgNumber: partnerData.orgNumber || '',
        category: partnerData.category || 'mäklare',
        status: 'pending',
        tier: 'bronze',
        contactPerson: partnerData.contactPerson || '',
        email: partnerData.email || '',
        phone: partnerData.phone || '',
        website: partnerData.website,
        address: partnerData.address,
        kickbackRate: 0.08,
        monthlyReferrals: 0,
        totalReferrals: 0,
        conversionRate: 0,
        totalRevenue: 0,
        lastActivity: new Date(),
        notes: partnerData.notes,
        onboardingStage: 'initial_contact',
        performance: {
          monthlyTarget: 10,
          achievementRate: 0,
          qualityScore: 0,
          customerSatisfaction: 0
        }
      }

      // Initiate AI-powered onboarding
      await onboardingEngine.initiatePartnerOnboarding(newPartner.category, {
        name: newPartner.name,
        orgNumber: newPartner.orgNumber,
        contactPerson: newPartner.contactPerson,
        email: newPartner.email,
        phone: newPartner.phone,
        size: 'medium',
        estimatedMonthlyReferrals: 10
      })

      setPartners([...partners, newPartner])
      setIsAddModalOpen(false)
    } catch (error) {
      console.error('Error adding partner:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartner(partner)
    setIsEditModalOpen(true)
  }

  const handleUpdatePartner = async (updatedPartner: Partner) => {
    setIsLoading(true)
    try {
      setPartners(partners.map(p => p.id === updatedPartner.id ? updatedPartner : p))
      setIsEditModalOpen(false)
      setSelectedPartner(null)
    } catch (error) {
      console.error('Error updating partner:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePartner = async (partnerId: number) => {
    if (window.confirm('Är du säker på att du vill ta bort denna partner?')) {
      setIsLoading(true)
      try {
        setPartners(partners.filter(p => p.id !== partnerId))
      } catch (error) {
        console.error('Error deleting partner:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleViewDetails = (partner: Partner) => {
    setSelectedPartner(partner)
    setIsDetailsModalOpen(true)
  }

  const calculateKickback = async (partner: Partner) => {
    try {
      const calculation = await kickbackEngine.calculateMonthlyKickback(partner.id)
      console.log('Kickback calculation:', calculation)
      // In real implementation, show calculation in modal or update partner data
    } catch (error) {
      console.error('Error calculating kickback:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'negotiating': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const getPerformanceIcon = (achievementRate: number) => {
    if (achievementRate >= 1.1) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (achievementRate >= 0.9) return <CheckCircle className="w-4 h-4 text-blue-600" />
    return <AlertCircle className="w-4 h-4 text-red-600" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partners</h2>
          <p className="text-gray-600">Hantera och optimera ditt partnernätverk</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Ny partner
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sök partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tiers.map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>
                  {tier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partners ({filteredPartners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  Partner {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('tier')}>
                  Tier {sortField === 'tier' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('monthlyReferrals')}>
                  Referrals {sortField === 'monthlyReferrals' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('conversionRate')}>
                  Konvertering {sortField === 'conversionRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('totalRevenue')}>
                  Omsättning {sortField === 'totalRevenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Prestanda</TableHead>
                <TableHead>Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{partner.name}</div>
                      <div className="text-sm text-gray-500">{partner.contactPerson}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(partner.status)}>
                      {partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierColor(partner.tier)}>
                      {partner.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{partner.monthlyReferrals}</span>
                      <span className="text-xs text-gray-500">/{partner.performance.monthlyTarget}</span>
                    </div>
                  </TableCell>
                  <TableCell>{(partner.conversionRate * 100).toFixed(0)}%</TableCell>
                  <TableCell>{formatCurrency(partner.totalRevenue)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(partner.performance.achievementRate)}
                      <span className="text-sm">
                        {(partner.performance.achievementRate * 100).toFixed(0)}%
                      </span>
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
                        <DropdownMenuItem onClick={() => handleViewDetails(partner)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visa detaljer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditPartner(partner)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Redigera
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => calculateKickback(partner)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Beräkna kickback
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePartner(partner.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Ta bort
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

      {/* Add Partner Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lägg till ny partner</DialogTitle>
            <DialogDescription>
              Skapa en ny partner och starta AI-powered onboarding
            </DialogDescription>
          </DialogHeader>
          <AddPartnerForm onSubmit={handleAddPartner} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      {/* Edit Partner Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redigera partner</DialogTitle>
            <DialogDescription>
              Uppdatera partnerinformation och inställningar
            </DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <EditPartnerForm 
              partner={selectedPartner} 
              onSubmit={handleUpdatePartner} 
              isLoading={isLoading} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Partner Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Partner detaljer</DialogTitle>
            <DialogDescription>
              Fullständig information och prestanda för partner
            </DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <PartnerDetailsView partner={selectedPartner} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add Partner Form Component
function AddPartnerForm({ onSubmit, isLoading }: { onSubmit: (data: Partial<Partner>) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    orgNumber: '',
    category: 'mäklare',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Organisationsnamn</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="orgNumber">Organisationsnummer</Label>
          <Input
            id="orgNumber"
            value={formData.orgNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, orgNumber: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Kategori</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mäklare">Mäklare</SelectItem>
            <SelectItem value="begravningsbyråer">Begravningsbyråer</SelectItem>
            <SelectItem value="fastighetsförvaltare">Fastighetsförvaltare</SelectItem>
            <SelectItem value="bankRådgivare">Bankrådgivare</SelectItem>
            <SelectItem value="flyttstädning">Flyttstädning</SelectItem>
            <SelectItem value="inredningsbutiker">Inredningsbutiker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPerson">Kontaktperson</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="website">Webbsida</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Adress</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="notes">Anteckningar</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setFormData({
          name: '',
          orgNumber: '',
          category: 'mäklare',
          contactPerson: '',
          email: '',
          phone: '',
          website: '',
          address: '',
          notes: ''
        })}>
          Rensa
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Skapar...' : 'Skapa partner'}
        </Button>
      </div>
    </form>
  )
}

// Edit Partner Form Component
function EditPartnerForm({ partner, onSubmit, isLoading }: { 
  partner: Partner; 
  onSubmit: (data: Partner) => void; 
  isLoading: boolean 
}) {
  const [formData, setFormData] = useState(() => ({ ...partner }))

  useEffect(() => {
    setFormData({ ...partner })
  }, [partner])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Organisationsnamn</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="pending">Väntande</SelectItem>
              <SelectItem value="negotiating">Förhandlar</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
              <SelectItem value="suspended">Pausad</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tier">Tier</Label>
          <Select value={formData.tier} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tier: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bronze">Bronze</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="kickbackRate">Kickback Rate (%)</Label>
          <Input
            id="kickbackRate"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.kickbackRate}
            onChange={(e) => setFormData(prev => ({ ...prev, kickbackRate: parseFloat(e.target.value) }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPerson">Kontaktperson</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
          {isLoading ? 'Uppdaterar...' : 'Uppdatera partner'}
        </Button>
      </div>
    </form>
  )
}

// Partner Details View Component
function PartnerDetailsView({ partner }: { partner: Partner }) {
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
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grundinformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Organisationsnamn</Label>
              <p className="text-sm text-gray-600">{partner.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Organisationsnummer</Label>
              <p className="text-sm text-gray-600">{partner.orgNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Kategori</Label>
              <p className="text-sm text-gray-600">{partner.category}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Kontraktsdatum</Label>
              <p className="text-sm text-gray-600">
                {partner.contractDate ? formatDate(partner.contractDate) : 'Inget kontrakt'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontaktinformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Kontaktperson</Label>
              <p className="text-sm text-gray-600">{partner.contactPerson}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">E-post</Label>
              <p className="text-sm text-gray-600">{partner.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Telefon</Label>
              <p className="text-sm text-gray-600">{partner.phone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Webbsida</Label>
              <p className="text-sm text-gray-600">{partner.website}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Prestanda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{partner.monthlyReferrals}</div>
              <div className="text-sm text-gray-500">Månatliga referrals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{(partner.conversionRate * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-500">Konverteringsgrad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(partner.totalRevenue)}</div>
              <div className="text-sm text-gray-500">Total omsättning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{partner.performance.qualityScore}</div>
              <div className="text-sm text-gray-500">Kvalitetspoäng</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {partner.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Anteckningar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{partner.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}