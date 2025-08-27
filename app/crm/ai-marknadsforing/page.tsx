'use client';

// =============================================================================
// NORDFLYTT AI MARKETING & SEO REVOLUTION - CRM DASHBOARD
// Revolutionary marketing automation with 200+ leads/month target
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { SEOStockholmDashboard } from '@/components/ai-marketing/seo-stockholm';
import { PPCDashboard } from '@/components/ai-marketing/ppc';
import { 
  TrendingUp, 
  Target, 
  Mail, 
  Search, 
  Map, 
  Brain, 
  Zap, 
  DollarSign,
  Users,
  BarChart3,
  MessageSquare,
  Calendar,
  Award,
  Lightbulb,
  Rocket,
  Globe,
  MapPin,
  Building,
  Eye,
  MousePointer,
  PhoneCall,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Clock,
  Settings,
  Download,
  RefreshCw,
  AlertTriangle,
  Star,
  Sparkles,
  Crown,
  Heart,
  ThumbsUp,
  Smartphone,
  Megaphone,
  Camera,
  PieChart,
  LineChart,
  Activity,
  Filter,
  Search as SearchIcon
} from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface CampaignData {
  id: number;
  name: string;
  type: 'idraw_postcards' | 'seo_content' | 'social_media' | 'email_automation';
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  roi: number;
  leads: number;
  revenue: number;
  conversionRate: number;
  nordflyttVoiceScore: number;
  stockholmRelevance: number;
  createdAt: string;
  launchedAt?: string;
}

interface SEOPerformance {
  keyword: string;
  position: number;
  change: number;
  traffic: number;
  leads: number;
  revenue: number;
  stockholmRelevance: number;
}

interface iDrawCampaign {
  id: number;
  name: string;
  postcardsDesigned: number;
  postcardsSent: number;
  cost: number;
  leadsGenerated: number;
  responseRate: number;
  roi: number;
  status: string;
  stockholmArea: string;
}

interface MarketingIntelligence {
  id: number;
  type: string;
  title: string;
  description: string;
  confidence: number;
  stockholmImpact: number;
  expectedROI: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'reviewed' | 'implemented';
  discoveredAt: string;
}

interface LeadAttribution {
  id: number;
  campaignName: string;
  leadSource: string;
  customerName: string;
  stockholmArea: string;
  propertyType: string;
  leadScore: number;
  estimatedValue: number;
  actualRevenue: number;
  status: 'new' | 'qualified' | 'converted' | 'lost';
  followUpPriority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AIMarketingDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [seoPerformance, setSeoPerformance] = useState<SEOPerformance[]>([]);
  const [iDrawCampaigns, setIDrawCampaigns] = useState<iDrawCampaign[]>([]);
  const [marketingIntelligence, setMarketingIntelligence] = useState<MarketingIntelligence[]>([]);
  const [leadAttribution, setLeadAttribution] = useState<LeadAttribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalLeads: 0,
    totalRevenue: 0,
    avgROI: 0,
    stockholmMarketShare: 0,
    activeCampaigns: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
    leadsToTarget: 200,
    brandAwareness: 0,
    competitorGap: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual endpoints
      await Promise.all([
        loadCampaignData(),
        loadSEOPerformance(),
        loadIDrawCampaigns(),
        loadMarketingIntelligence(),
        loadLeadAttribution()
      ]);
      
      calculateSummaryMetrics();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignData = async () => {
    // Mock data - replace with actual API call
    const mockCampaigns: CampaignData[] = [
      {
        id: 1,
        name: 'Stockholm Vinterflyttning 2025',
        type: 'idraw_postcards',
        status: 'active',
        budget: 25000,
        spent: 18500,
        roi: 156.8,
        leads: 47,
        revenue: 118000,
        conversionRate: 0.28,
        nordflyttVoiceScore: 0.92,
        stockholmRelevance: 0.95,
        createdAt: '2025-01-01',
        launchedAt: '2025-01-05'
      },
      {
        id: 2,
        name: 'Stockholm SEO Domination',
        type: 'seo_content',
        status: 'active',
        budget: 35000,
        spent: 28000,
        roi: 189.3,
        leads: 89,
        revenue: 224000,
        conversionRate: 0.31,
        nordflyttVoiceScore: 0.88,
        stockholmRelevance: 0.98,
        createdAt: '2024-12-15',
        launchedAt: '2024-12-20'
      },
      {
        id: 3,
        name: 'Hemnet Ägarfokus',
        type: 'idraw_postcards',
        status: 'active',
        budget: 18000,
        spent: 12000,
        roi: 145.6,
        leads: 32,
        revenue: 87000,
        conversionRate: 0.35,
        nordflyttVoiceScore: 0.95,
        stockholmRelevance: 0.92,
        createdAt: '2025-01-10',
        launchedAt: '2025-01-12'
      }
    ];
    setCampaigns(mockCampaigns);
  };

  const loadSEOPerformance = async () => {
    // Mock data - replace with actual API call
    const mockSEO: SEOPerformance[] = [
      {
        keyword: 'flyttfirma stockholm',
        position: 3,
        change: 2,
        traffic: 450,
        leads: 12,
        revenue: 48000,
        stockholmRelevance: 0.98
      },
      {
        keyword: 'flytt stockholm',
        position: 7,
        change: 1,
        traffic: 280,
        leads: 8,
        revenue: 32000,
        stockholmRelevance: 0.95
      },
      {
        keyword: 'bästa flyttfirma stockholm',
        position: 2,
        change: 1,
        traffic: 180,
        leads: 6,
        revenue: 24000,
        stockholmRelevance: 0.92
      }
    ];
    setSeoPerformance(mockSEO);
  };

  const loadIDrawCampaigns = async () => {
    // Mock data - replace with actual API call
    const mockIDrawCampaigns: iDrawCampaign[] = [
      {
        id: 1,
        name: 'Östermalm Vinterflyttning',
        postcardsDesigned: 150,
        postcardsSent: 150,
        cost: 5250,
        leadsGenerated: 12,
        responseRate: 0.08,
        roi: 145.7,
        status: 'completed',
        stockholmArea: 'Östermalm'
      },
      {
        id: 2,
        name: 'Södermalm Hemnet Focus',
        postcardsDesigned: 200,
        postcardsSent: 180,
        cost: 6300,
        leadsGenerated: 15,
        responseRate: 0.083,
        roi: 167.5,
        status: 'active',
        stockholmArea: 'Södermalm'
      }
    ];
    setIDrawCampaigns(mockIDrawCampaigns);
  };

  const loadMarketingIntelligence = async () => {
    // Mock data - replace with actual API call
    const mockIntelligence: MarketingIntelligence[] = [
      {
        id: 1,
        type: 'market_trend',
        title: 'Ökning av vinterflyttningar',
        description: '23% ökning av flyttningar i januari-februari jämfört med föregående år',
        confidence: 0.87,
        stockholmImpact: 0.92,
        expectedROI: 15.6,
        priority: 'high',
        status: 'new',
        discoveredAt: '2025-01-15'
      },
      {
        id: 2,
        type: 'seo_opportunity',
        title: 'Akutflytt Stockholm - låg konkurrens',
        description: 'Keyword "akutflytt stockholm" har 320 månatliga sökningar med låg konkurrens',
        confidence: 0.91,
        stockholmImpact: 0.89,
        expectedROI: 22.3,
        priority: 'high',
        status: 'new',
        discoveredAt: '2025-01-14'
      },
      {
        id: 3,
        type: 'competitor_analysis',
        title: 'Konkurrerande företag saknar helgtjänst',
        description: 'Stockholm Flyttar AB och 2 andra konkurrenter erbjuder inte helgtjänster',
        confidence: 0.82,
        stockholmImpact: 0.78,
        expectedROI: 8.9,
        priority: 'medium',
        status: 'reviewed',
        discoveredAt: '2025-01-13'
      }
    ];
    setMarketingIntelligence(mockIntelligence);
  };

  const loadLeadAttribution = async () => {
    // Mock data - replace with actual API call
    const mockLeads: LeadAttribution[] = [
      {
        id: 1,
        campaignName: 'Stockholm Vinterflyttning 2025',
        leadSource: 'idraw_postcard',
        customerName: 'Maria Johansson',
        stockholmArea: 'Östermalm',
        propertyType: 'apartment',
        leadScore: 0.89,
        estimatedValue: 15000,
        actualRevenue: 15000,
        status: 'converted',
        followUpPriority: 'high',
        createdAt: '2025-01-14'
      },
      {
        id: 2,
        campaignName: 'Stockholm SEO Domination',
        leadSource: 'seo_organic',
        customerName: 'Lars Nilsson',
        stockholmArea: 'Södermalm',
        propertyType: 'house',
        leadScore: 0.76,
        estimatedValue: 25000,
        actualRevenue: 0,
        status: 'qualified',
        followUpPriority: 'medium',
        createdAt: '2025-01-13'
      },
      {
        id: 3,
        campaignName: 'Hemnet Ägarfokus',
        leadSource: 'idraw_postcard',
        customerName: 'Karin Eriksson',
        stockholmArea: 'Vasastan',
        propertyType: 'apartment',
        leadScore: 0.93,
        estimatedValue: 18000,
        actualRevenue: 18000,
        status: 'converted',
        followUpPriority: 'high',
        createdAt: '2025-01-12'
      }
    ];
    setLeadAttribution(mockLeads);
  };

  const calculateSummaryMetrics = () => {
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const avgROI = campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const avgConversionRate = campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length;

    setSummaryMetrics({
      totalLeads,
      totalRevenue,
      avgROI,
      stockholmMarketShare: 0.0234, // 2.34%
      activeCampaigns,
      conversionRate: avgConversionRate,
      monthlyGrowth: 18.5,
      leadsToTarget: 200 - totalLeads,
      brandAwareness: 0.67,
      competitorGap: 12.3
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold">Laddar AI-Marknadsföring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🚀 AI-Marknadsföring</h1>
          <p className="text-gray-600 mt-2">
            Revolutionerande marknadsföringsautomation med iDraw + Hemnet integration
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => loadDashboardData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportera rapport
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Totala leads</p>
                <p className="text-2xl font-bold text-blue-900">{summaryMetrics.totalLeads}</p>
                <p className="text-sm text-blue-600">
                  {summaryMetrics.leadsToTarget} till 200-målsättning
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <Progress 
                value={(summaryMetrics.totalLeads / 200) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Intäkter</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(summaryMetrics.totalRevenue)}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {summaryMetrics.monthlyGrowth}% denna månad
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Genomsnittlig ROI</p>
                <p className="text-2xl font-bold text-purple-900">
                  {summaryMetrics.avgROI.toFixed(1)}%
                </p>
                <p className="text-sm text-purple-600">
                  {summaryMetrics.activeCampaigns} aktiva kampanjer
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Stockholm marknadsandel</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatPercent(summaryMetrics.stockholmMarketShare)}
                </p>
                <p className="text-sm text-orange-600">
                  {formatPercent(summaryMetrics.brandAwareness)} varumärkeskännedom
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="campaigns">Kampanjer</TabsTrigger>
          <TabsTrigger value="seo">SEO Stockholm</TabsTrigger>
          <TabsTrigger value="ppc">PPC</TabsTrigger>
          <TabsTrigger value="idraw">iDraw vykort</TabsTrigger>
          <TabsTrigger value="intelligence">AI-insikter</TabsTrigger>
          <TabsTrigger value="attribution">Lead-spårning</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Kampanjprestanda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-600">{campaign.leads} leads • {formatCurrency(campaign.revenue)}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <p className="text-sm font-medium text-green-600 mt-1">
                          {campaign.roi.toFixed(1)}% ROI
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stockholm SEO Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Stockholm SEO-prestanda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seoPerformance.map((seo, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{seo.keyword}</p>
                        <p className="text-sm text-gray-600">{seo.traffic} besökare • {seo.leads} leads</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">#{seo.position}</span>
                          {seo.change > 0 ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : seo.change < 0 ? (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          ) : null}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatPercent(seo.stockholmRelevance)} Stockholm-relevans
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Marketing Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-marknadsföringsinsikter
              </CardTitle>
              <CardDescription>
                Realtids-AI-analys av marknaden och konkurrenter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {marketingIntelligence.slice(0, 3).map((intelligence) => (
                  <div key={intelligence.id} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getPriorityColor(intelligence.priority)}>
                        {intelligence.priority}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {(intelligence.confidence * 100).toFixed(0)}% säkerhet
                      </span>
                    </div>
                    <h3 className="font-medium mb-2">{intelligence.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{intelligence.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600">
                        {intelligence.expectedROI.toFixed(1)}% förväntad ROI
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {intelligence.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Kampanjhantering</h2>
            <Button>
              <Rocket className="h-4 w-4 mr-2" />
              Ny kampanj
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    {campaign.type === 'idraw_postcards' && <Mail className="h-4 w-4" />}
                    {campaign.type === 'seo_content' && <Search className="h-4 w-4" />}
                    {campaign.type === 'social_media' && <MessageSquare className="h-4 w-4" />}
                    {campaign.type === 'email_automation' && <Mail className="h-4 w-4" />}
                    {campaign.type.replace('_', ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Budget</span>
                      <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                    </div>
                    <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Leads</p>
                      <p className="text-xl font-bold">{campaign.leads}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">ROI</p>
                      <p className="text-xl font-bold text-green-600">{campaign.roi.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Konvertering</p>
                      <p className="text-xl font-bold">{formatPercent(campaign.conversionRate)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Intäkter</p>
                      <p className="text-xl font-bold">{formatCurrency(campaign.revenue)}</p>
                    </div>
                  </div>

                  {/* Nordflytt Voice Score */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Nordflytt röst-poäng</span>
                      <span>{(campaign.nordflyttVoiceScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={campaign.nordflyttVoiceScore * 100} className="h-2" />
                  </div>

                  {/* Stockholm Relevance */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Stockholm-relevans</span>
                      <span>{(campaign.stockholmRelevance * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={campaign.stockholmRelevance * 100} className="h-2" />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Redigera
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analys
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <SEOStockholmDashboard />
        </TabsContent>

        {/* PPC Tab */}
        <TabsContent value="ppc" className="space-y-6">
          <PPCDashboard />
        </TabsContent>

        {/* iDraw Tab */}
        <TabsContent value="idraw" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">iDraw Vykortskampanjer</h2>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Ny vykortskampanj
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {iDrawCampaigns.map((campaign) => (
              <Card key={campaign.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{campaign.name}</span>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {campaign.stockholmArea}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Vykort skickade</span>
                      <span>{campaign.postcardsSent} / {campaign.postcardsDesigned}</span>
                    </div>
                    <Progress 
                      value={(campaign.postcardsSent / campaign.postcardsDesigned) * 100} 
                      className="h-2" 
                    />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Svarsfrekevens</p>
                      <p className="text-xl font-bold">{formatPercent(campaign.responseRate)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Leads</p>
                      <p className="text-xl font-bold">{campaign.leadsGenerated}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Kostnad</p>
                      <p className="text-xl font-bold">{formatCurrency(campaign.cost)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">ROI</p>
                      <p className="text-xl font-bold text-green-600">{campaign.roi.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Visa design
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analys
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hemnet Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Hemnet-integration
              </CardTitle>
              <CardDescription>Automatisk data från sålda bostäder för målgruppering</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Datahämtning</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    156 nya säljare identifierade senaste veckan
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Målgruppering</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    89% matchning med flyttpotential
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Automation</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Automatiska kampanjer inom 24h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">AI-marknadsföringsinsikter</h2>
            <Button>
              <Brain className="h-4 w-4 mr-2" />
              Generera ny analys
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {marketingIntelligence.map((intelligence) => (
              <Card key={intelligence.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getPriorityColor(intelligence.priority)}>
                      {intelligence.priority}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {(intelligence.confidence * 100).toFixed(0)}% säkerhet
                    </span>
                  </div>
                  <CardTitle className="text-lg">{intelligence.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {intelligence.type === 'market_trend' && <TrendingUp className="h-4 w-4" />}
                    {intelligence.type === 'seo_opportunity' && <Search className="h-4 w-4" />}
                    {intelligence.type === 'competitor_analysis' && <Users className="h-4 w-4" />}
                    {intelligence.type.replace('_', ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{intelligence.description}</p>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Stockholm-påverkan</p>
                      <p className="text-xl font-bold">{formatPercent(intelligence.stockholmImpact)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Förväntad ROI</p>
                      <p className="text-xl font-bold text-green-600">{intelligence.expectedROI.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline" className="text-xs">
                      {intelligence.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Visa detaljer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Attribution Tab */}
        <TabsContent value="attribution" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Lead-attribution & spårning</h2>
            <Button>
              <Filter className="h-4 w-4 mr-2" />
              Filtrera leads
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {leadAttribution.map((lead) => (
              <Card key={lead.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{lead.customerName}</CardTitle>
                    <Badge className={
                      lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                      lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {lead.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {lead.stockholmArea} • {lead.propertyType}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lead Source */}
                  <div className="flex items-center gap-2">
                    {lead.leadSource === 'idraw_postcard' && <Mail className="h-4 w-4" />}
                    {lead.leadSource === 'seo_organic' && <Search className="h-4 w-4" />}
                    {lead.leadSource === 'social_media' && <MessageSquare className="h-4 w-4" />}
                    <span className="text-sm font-medium">Källa: {lead.leadSource}</span>
                  </div>
                  
                  {/* Campaign */}
                  <div className="text-sm text-gray-600">
                    Kampanj: {lead.campaignName}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">AI-poäng</p>
                      <p className="text-xl font-bold">{(lead.leadScore * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Värde</p>
                      <p className="text-xl font-bold">
                        {lead.actualRevenue > 0 ? 
                          formatCurrency(lead.actualRevenue) : 
                          formatCurrency(lead.estimatedValue)
                        }
                      </p>
                    </div>
                  </div>

                  {/* Follow-up Priority */}
                  <div className="flex items-center justify-between">
                    <Badge className={getPriorityColor(lead.followUpPriority)}>
                      {lead.followUpPriority} prioritet
                    </Badge>
                    <Button size="sm" variant="outline">
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Kontakta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}