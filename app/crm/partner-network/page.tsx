'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  FileText,
  Calculator,
  Award,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  Star,
  Briefcase
} from 'lucide-react';

// =============================================================================
// PARTNER NETWORK DASHBOARD
// =============================================================================

export default function PartnerNetworkPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // State för data
  const [dashboardData, setDashboardData] = useState({
    overview: {
      total_partners: 0,
      active_partners: 0,
      pending_applications: 0,
      total_revenue: 0,
      average_rating: 0,
      completion_rate: 0
    },
    partners: [],
    onboarding: [],
    jobs: [],
    financials: [],
    contracts: []
  });

  // Ladda data vid mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data för utveckling
      const mockData = {
        overview: {
          total_partners: 48,
          active_partners: 35,
          pending_applications: 8,
          total_revenue: 2450000,
          average_rating: 4.3,
          completion_rate: 89.2
        },
        partners: [
          {
            id: 1,
            name: 'Johan Andersson',
            company_name: 'Andersons Flytthjälp AB',
            partner_type: 'company',
            phone: '+46701234567',
            email: 'johan@anderssonsflyttjalp.se',
            city: 'Stockholm',
            specializations: ['moving', 'packing'],
            service_areas: ['stockholm'],
            capacity_level: 'medium',
            status: 'active',
            quality_rating: 4.5,
            completed_jobs: 25,
            total_revenue: 125000,
            onboarding_progress: 100,
            created_at: '2024-12-01T10:00:00Z'
          },
          {
            id: 2,
            name: 'Maria Svensson',
            partner_type: 'individual',
            phone: '+46709876543',
            email: 'maria.svensson@gmail.com',
            city: 'Stockholm',
            specializations: ['cleaning', 'packing'],
            service_areas: ['stockholm'],
            capacity_level: 'small',
            status: 'active',
            quality_rating: 4.8,
            completed_jobs: 15,
            total_revenue: 45000,
            onboarding_progress: 100,
            created_at: '2024-11-15T14:30:00Z'
          },
          {
            id: 3,
            name: 'Erik Pettersson',
            company_name: 'Stockholms Expressflytt',
            partner_type: 'company',
            phone: '+46708765432',
            email: 'erik@stockholmsexpressflytt.se',
            city: 'Stockholm',
            specializations: ['moving', 'transport', 'storage'],
            service_areas: ['stockholm'],
            capacity_level: 'large',
            status: 'active',
            quality_rating: 4.2,
            completed_jobs: 45,
            total_revenue: 280000,
            onboarding_progress: 100,
            created_at: '2024-10-20T09:00:00Z'
          },
          {
            id: 4,
            name: 'Anna Lindqvist',
            partner_type: 'individual',
            phone: '+46707654321',
            email: 'anna.lindqvist@outlook.com',
            city: 'Göteborg',
            specializations: ['cleaning'],
            service_areas: ['goteborg'],
            capacity_level: 'small',
            status: 'pending',
            quality_rating: 0,
            completed_jobs: 0,
            total_revenue: 0,
            onboarding_progress: 35,
            created_at: '2025-01-05T10:00:00Z'
          }
        ],
        onboarding: [
          {
            id: 4,
            name: 'Anna Lindqvist',
            email: 'anna.lindqvist@outlook.com',
            current_step: 'Dokumentverifiering',
            progress: 35,
            days_in_process: 3,
            status: 'in_progress'
          },
          {
            id: 5,
            name: 'Lars Nilsson',
            email: 'lars.nilsson@gmail.com',
            current_step: 'Intervju och bedömning',
            progress: 60,
            days_in_process: 7,
            status: 'in_progress'
          }
        ],
        jobs: [
          {
            id: 1,
            partner_name: 'Johan Andersson',
            booking_id: 123,
            job_type: 'primary',
            status: 'completed',
            start_date: '2025-01-01',
            estimated_hours: 8,
            actual_hours: 7.5,
            quality_score: 4.5,
            customer_rating: 4.8,
            payment: 3500
          },
          {
            id: 2,
            partner_name: 'Maria Svensson',
            booking_id: 124,
            job_type: 'support',
            status: 'in_progress',
            start_date: '2025-01-06',
            estimated_hours: 4,
            actual_hours: null,
            quality_score: null,
            customer_rating: null,
            payment: 2000
          }
        ],
        financials: [
          {
            id: 1,
            partner_name: 'Johan Andersson',
            period: 'December 2024',
            total_jobs: 8,
            total_hours: 62.5,
            gross_payment: 31250,
            net_payment: 21875,
            status: 'paid',
            paid_date: '2025-01-05'
          },
          {
            id: 2,
            partner_name: 'Maria Svensson',
            period: 'December 2024',
            total_jobs: 5,
            total_hours: 28,
            gross_payment: 14000,
            net_payment: 9800,
            status: 'pending',
            paid_date: null
          }
        ],
        contracts: [
          {
            id: 1,
            partner_name: 'Johan Andersson',
            contract_type: 'service_agreement',
            title: 'Serviceavtal för Nordflytt Partners',
            status: 'active',
            start_date: '2024-12-01',
            end_date: '2025-11-30',
            signed_date: '2024-11-28'
          },
          {
            id: 2,
            partner_name: 'Maria Svensson',
            contract_type: 'service_agreement',
            title: 'Serviceavtal för Nordflytt Partners',
            status: 'active',
            start_date: '2024-11-15',
            end_date: '2025-11-14',
            signed_date: '2024-11-12'
          }
        ]
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error('Fel vid laddning av dashboard-data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter partners baserat på search och status
  const filteredPartners = dashboardData.partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (partner.company_name && partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || partner.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'suspended': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Network</h1>
          <p className="text-gray-600 mt-1">
            Hantera partners, onboarding och finansiell avräkning
          </p>
        </div>
        <Button className="bg-[#002A5C] hover:bg-[#001a3d] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Ny Partner
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="jobs">Jobb</TabsTrigger>
          <TabsTrigger value="financials">Ekonomi</TabsTrigger>
          <TabsTrigger value="contracts">Kontrakt</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totalt Partners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.total_partners}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.overview.active_partners} aktiva
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Väntande Ansökningar</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.pending_applications}</div>
                <p className="text-xs text-muted-foreground">
                  Kräver granskning
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Omsättning</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.total_revenue.toLocaleString()} kr</div>
                <p className="text-xs text-muted-foreground">
                  Via partnernätverket
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Genomsnittlig Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.average_rating}</div>
                <p className="text-xs text-muted-foreground">
                  Baserat på kundrecensioner
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Slutförandegraden</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.completion_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  Jobb slutförda i tid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tillväxttakt</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+23%</div>
                <p className="text-xs text-muted-foreground">
                  Nya partners senaste månaden
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Senaste Aktivitet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Johan Andersson slutförde jobb #123</p>
                    <p className="text-xs text-gray-500">Kvalitetspoäng: 4.5/5 • 2 timmar sedan</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Anna Lindqvist skickade dokumentation</p>
                    <p className="text-xs text-gray-500">Onboarding steg 2/6 • 4 timmar sedan</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Betalning till Maria Svensson godkänd</p>
                    <p className="text-xs text-gray-500">9,800 kr • 6 timmar sedan</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Sök partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Alla status</option>
              <option value="active">Aktiva</option>
              <option value="pending">Väntande</option>
              <option value="suspended">Suspenderade</option>
            </select>
          </div>

          {/* Partners List */}
          <div className="grid gap-4">
            {filteredPartners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[#002A5C] rounded-full flex items-center justify-center text-white font-bold">
                        {partner.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">{partner.name}</h3>
                          <Badge className={getStatusColor(partner.status)}>
                            {getStatusIcon(partner.status)}
                            <span className="ml-1 capitalize">{partner.status}</span>
                          </Badge>
                        </div>
                        {partner.company_name && (
                          <p className="text-sm text-gray-600 mb-2">{partner.company_name}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{partner.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{partner.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{partner.city}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {partner.specializations.map(spec => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{partner.quality_rating}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {partner.completed_jobs} jobb • {partner.total_revenue.toLocaleString()} kr
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pågående Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.onboarding.map((applicant) => (
                  <div key={applicant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{applicant.name}</h3>
                        <p className="text-sm text-gray-600">{applicant.email}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {applicant.current_step}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{applicant.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#002A5C] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${applicant.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {applicant.days_in_process} dagar i process
                      </span>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Visa
                        </Button>
                        <Button size="sm" className="bg-[#002A5C] hover:bg-[#001a3d]">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Slutför Steg
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Jobb</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.jobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{job.partner_name}</h3>
                        <p className="text-sm text-gray-600">Booking #{job.booking_id}</p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Typ:</span>
                        <p className="font-medium capitalize">{job.job_type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Startdatum:</span>
                        <p className="font-medium">{job.start_date}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Timmar:</span>
                        <p className="font-medium">
                          {job.actual_hours || job.estimated_hours}h
                          {job.actual_hours && ` / ${job.estimated_hours}h`}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Betalning:</span>
                        <p className="font-medium">{job.payment.toLocaleString()} kr</p>
                      </div>
                    </div>
                    {job.quality_score && (
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">Kvalitet: {job.quality_score}/5</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">Kundrating: {job.customer_rating}/5</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Finansiell Avräkning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.financials.map((financial) => (
                  <div key={financial.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{financial.partner_name}</h3>
                        <p className="text-sm text-gray-600">{financial.period}</p>
                      </div>
                      <Badge className={getStatusColor(financial.status)}>
                        {financial.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Jobb:</span>
                        <p className="font-medium">{financial.total_jobs}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Timmar:</span>
                        <p className="font-medium">{financial.total_hours}h</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Brutto:</span>
                        <p className="font-medium">{financial.gross_payment.toLocaleString()} kr</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Netto:</span>
                        <p className="font-medium text-green-600">{financial.net_payment.toLocaleString()} kr</p>
                      </div>
                    </div>
                    {financial.paid_date && (
                      <div className="mt-3 text-sm text-green-600">
                        Betald: {financial.paid_date}
                      </div>
                    )}
                    <div className="mt-3 flex space-x-2">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" />
                        Visa Faktura
                      </Button>
                      {financial.status === 'pending' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Godkänn Betalning
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Kontrakt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.contracts.map((contract) => (
                  <div key={contract.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{contract.partner_name}</h3>
                        <p className="text-sm text-gray-600">{contract.title}</p>
                      </div>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Typ:</span>
                        <p className="font-medium capitalize">{contract.contract_type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Giltighetsperiod:</span>
                        <p className="font-medium">{contract.start_date} - {contract.end_date}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Signerad:</span>
                        <p className="font-medium">{contract.signed_date}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" />
                        Visa Kontrakt
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Redigera
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}