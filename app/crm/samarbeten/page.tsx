'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Plus, 
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  Phone,
  Mail,
  BarChart3,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Handshake
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { SmartPartnerOnboarding } from '@/lib/partners/SmartPartnerOnboarding'
import { DynamicKickbackEngine } from '@/lib/partners/DynamicKickbackEngine'
import { ReferralAttributionEngine } from '@/lib/partners/ReferralAttributionEngine'
import { PartnersManagerSimple } from '@/components/partners/PartnersManagerSimple'
import { ReferralsManagerSimple } from '@/components/partners/ReferralsManagerSimple'
import { KickbacksManager } from '@/components/partners/KickbacksManager'

interface PartnerMetrics {
  totalPartners: number
  activePartners: number
  monthlyReferrals: number
  totalRevenue: number
  avgConversionRate: number
  topPerformingCategory: string
}

interface PartnerOrganization {
  id: number
  name: string
  category: string
  status: 'active' | 'pending' | 'negotiating' | 'inactive'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  monthlyReferrals: number
  conversionRate: number
  totalRevenue: number
  kickbackRate: number
  lastActivity: Date
  contactPerson: string
  email: string
  phone: string
}

interface RecentReferral {
  id: number
  partnerName: string
  customerName: string
  moveValue: number
  status: 'pending' | 'contacted' | 'quoted' | 'converted' | 'lost'
  referralDate: Date
  kickbackAmount: number
}

export default function SamarbetenDashboard() {
  const [metrics, setMetrics] = useState<PartnerMetrics>({
    totalPartners: 0,
    activePartners: 0,
    monthlyReferrals: 0,
    totalRevenue: 0,
    avgConversionRate: 0,
    topPerformingCategory: ''
  })
  
  const [partners, setPartners] = useState<PartnerOrganization[]>([])
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const [onboardingEngine] = useState(new SmartPartnerOnboarding())
  const [kickbackEngine] = useState(new DynamicKickbackEngine())
  const [attributionEngine] = useState(new ReferralAttributionEngine())

  const partnerCategories = [
    { id: 'all', name: 'Alla kategorier', count: 0 },
    { id: 'mäklare', name: 'Mäklare', count: 0 },
    { id: 'begravningsbyråer', name: 'Begravningsbyråer', count: 0 },
    { id: 'fastighetsförvaltare', name: 'Fastighetsförvaltare', count: 0 },
    { id: 'bankRådgivare', name: 'Bankrådgivare', count: 0 },
    { id: 'flyttstädning', name: 'Flyttstädning', count: 0 },
    { id: 'inredningsbutiker', name: 'Inredningsbutiker', count: 0 }
  ]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    
    try {
      // Mock data - in real implementation, fetch from API
      const mockMetrics: PartnerMetrics = {
        totalPartners: 47,
        activePartners: 42,
        monthlyReferrals: 156,
        totalRevenue: 1247500,
        avgConversionRate: 0.78,
        topPerformingCategory: 'Mäklare'
      }

      const mockPartners: PartnerOrganization[] = [
        {
          id: 1,
          name: 'Svensk Fastighetsförmedling Stockholm',
          category: 'mäklare',
          status: 'active',
          tier: 'gold',
          monthlyReferrals: 28,
          conversionRate: 0.85,
          totalRevenue: 238000,
          kickbackRate: 0.10,
          lastActivity: new Date('2025-01-15'),
          contactPerson: 'Anna Carlsson',
          email: 'anna.carlsson@svenskfast.se',
          phone: '+46 8 123 45 67'
        },
        {
          id: 2,
          name: 'Fonus Stockholm',
          category: 'begravningsbyråer',
          status: 'active',
          tier: 'platinum',
          monthlyReferrals: 15,
          conversionRate: 0.92,
          totalRevenue: 216000,
          kickbackRate: 0.12,
          lastActivity: new Date('2025-01-14'),
          contactPerson: 'Maria Lindqvist',
          email: 'maria.lindqvist@fonus.se',
          phone: '+46 8 345 67 89'
        },
        {
          id: 3,
          name: 'Stockholmshem',
          category: 'fastighetsförvaltare',
          status: 'negotiating',
          tier: 'silver',
          monthlyReferrals: 22,
          conversionRate: 0.71,
          totalRevenue: 165000,
          kickbackRate: 0.08,
          lastActivity: new Date('2025-01-13'),
          contactPerson: 'Lars Andersson',
          email: 'lars.andersson@stockholmshem.se',
          phone: '+46 8 456 78 90'
        },
        {
          id: 4,
          name: 'Handelsbanken Private Banking',
          category: 'bankRådgivare',
          status: 'active',
          tier: 'silver',
          monthlyReferrals: 18,
          conversionRate: 0.76,
          totalRevenue: 129600,
          kickbackRate: 0.06,
          lastActivity: new Date('2025-01-12'),
          contactPerson: 'Karin Nilsson',
          email: 'karin.nilsson@handelsbanken.se',
          phone: '+46 8 567 89 01'
        },
        {
          id: 5,
          name: 'Stockholm Städservice',
          category: 'flyttstädning',
          status: 'active',
          tier: 'bronze',
          monthlyReferrals: 12,
          conversionRate: 0.68,
          totalRevenue: 97200,
          kickbackRate: 0.10,
          lastActivity: new Date('2025-01-11'),
          contactPerson: 'Johan Petersson',
          email: 'johan.petersson@stockholmstäd.se',
          phone: '+46 8 678 90 12'
        }
      ]

      const mockReferrals: RecentReferral[] = [
        {
          id: 1,
          partnerName: 'Svensk Fastighetsförmedling Stockholm',
          customerName: 'Gustav Andersson',
          moveValue: 12500,
          status: 'quoted',
          referralDate: new Date('2025-01-15'),
          kickbackAmount: 1250
        },
        {
          id: 2,
          partnerName: 'Fonus Stockholm',
          customerName: 'Familjen Svensson',
          moveValue: 18000,
          status: 'converted',
          referralDate: new Date('2025-01-14'),
          kickbackAmount: 2160
        },
        {
          id: 3,
          partnerName: 'Handelsbanken Private Banking',
          customerName: 'Mikael Lindström',
          moveValue: 9200,
          status: 'contacted',
          referralDate: new Date('2025-01-13'),
          kickbackAmount: 552
        },
        {
          id: 4,
          partnerName: 'Stockholm Städservice',
          customerName: 'Anna Petersson',
          moveValue: 7800,
          status: 'pending',
          referralDate: new Date('2025-01-12'),
          kickbackAmount: 780
        }
      ]

      setMetrics(mockMetrics)
      setPartners(mockPartners)
      setRecentReferrals(mockReferrals)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || partner.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'negotiating': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
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

  const getReferralStatusColor = (status: string) => {
    switch (status) {
      case 'converted': return 'bg-green-100 text-green-800'
      case 'quoted': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'lost': return 'bg-red-100 text-red-800'
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Samarbeten</h1>
          <p className="text-gray-600 mt-1">
            Hantera partners och optimera referral-nätverk för maximal lönsamhet
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportera rapport
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ny partner
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPartners}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activePartners} aktiva partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månatliga Referrals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.monthlyReferrals}</div>
            <p className="text-xs text-muted-foreground">
              +12% från föregående månad
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
              +8% från föregående månad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.avgConversionRate * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Genomsnitt för alla partners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="kickbacks">Kickbacks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Partner Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Partner Prestanda</CardTitle>
                <CardDescription>
                  Topp 5 partners baserat på omsättning denna månad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partners.slice(0, 5).map((partner, index) => (
                    <div key={partner.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{partner.name}</p>
                          <p className="text-xs text-gray-500">{partner.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(partner.totalRevenue)}</p>
                        <p className="text-xs text-gray-500">{partner.monthlyReferrals} referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Senaste Aktivitet</CardTitle>
                <CardDescription>
                  Nya referrals och partners de senaste dagarna
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReferrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Handshake className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{referral.customerName}</p>
                          <p className="text-xs text-gray-500">{referral.partnerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getReferralStatusColor(referral.status)}>
                          {referral.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(referral.referralDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <PartnersManagerSimple />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <ReferralsManagerSimple />
        </TabsContent>

        <TabsContent value="kickbacks" className="space-y-4">
          <KickbacksManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kategori Prestanda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mäklare</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Begravningsbyråer</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fastighetsförvaltare</span>
                    <span className="text-sm font-medium">71%</span>
                  </div>
                  <Progress value={71} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kickback Analys</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Totalt utbetalt</span>
                    <span className="text-sm font-medium">{formatCurrency(124750)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Snitt per referral</span>
                    <span className="text-sm font-medium">{formatCurrency(800)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Högsta kickback</span>
                    <span className="text-sm font-medium">{formatCurrency(2160)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Måluppfyllelse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Månatligt mål</span>
                    <span className="text-sm font-medium">125%</span>
                  </div>
                  <Progress value={125} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kvartals mål</span>
                    <span className="text-sm font-medium">108%</span>
                  </div>
                  <Progress value={108} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Årsmål</span>
                    <span className="text-sm font-medium">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}