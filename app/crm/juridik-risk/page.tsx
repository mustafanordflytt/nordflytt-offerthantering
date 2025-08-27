'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  FileText,
  Bot,
  Building,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Eye,
  MessageSquare,
  Upload,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DisputesManager } from '@/components/legal/DisputesManager';
import { AIResponsesManager } from '@/components/legal/AIResponsesManager';
import { InsuranceManager } from '@/components/legal/InsuranceManager';
import { RiskAnalysisManager } from '@/components/legal/RiskAnalysisManager';
import { LegalCostsManager } from '@/components/legal/LegalCostsManager';
import { LegalTemplatesManager } from '@/components/legal/LegalTemplatesManager';

interface RiskMetrics {
  activeDisputes: number;
  aiResolvedCases: number;
  averageResolutionTime: number;
  monthlyLegalCost: number;
  riskScore: number;
  disputesTrend: number;
  costSavings: number;
}

export default function RiskManagementDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<RiskMetrics>({
    activeDisputes: 0,
    aiResolvedCases: 0,
    averageResolutionTime: 0,
    monthlyLegalCost: 0,
    riskScore: 0,
    disputesTrend: 0,
    costSavings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentDisputes, setRecentDisputes] = useState<any[]>([]);
  const [highRiskAlerts, setHighRiskAlerts] = useState<any[]>([]);

  const riskTabs = [
    { id: 'overview', label: 'Översikt', icon: '📊' },
    { id: 'disputes', label: 'Aktiva Tvister', icon: '⚖️' },
    { id: 'ai_responses', label: 'AI Svar', icon: '🤖' },
    { id: 'insurance', label: 'Försäkringsärenden', icon: '🛡️' },
    { id: 'risk_analysis', label: 'Riskanalys', icon: '📈' },
    { id: 'legal_costs', label: 'Juridiska Kostnader', icon: '💰' },
    { id: 'templates', label: 'Mallar', icon: '📋' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load metrics
      await loadMetrics();
      await loadRecentDisputes();
      await loadHighRiskAlerts();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    // In production, these would be real database queries
    setMetrics({
      activeDisputes: 8,
      aiResolvedCases: 45,
      averageResolutionTime: 3.2,
      monthlyLegalCost: 8500,
      riskScore: 72,
      disputesTrend: -15,
      costSavings: 45
    });
  };

  const loadRecentDisputes = async () => {
    // Mock data - would fetch from database
    setRecentDisputes([
      {
        id: 1,
        case_number: 'CASE-2025-001',
        customer_name: 'Anders Andersson',
        type: 'damage_claim',
        severity: 'high',
        status: 'investigating',
        created_at: new Date('2025-01-15')
      },
      {
        id: 2,
        case_number: 'CASE-2025-002',
        customer_name: 'Eva Svensson',
        type: 'service_complaint',
        severity: 'medium',
        status: 'responding',
        created_at: new Date('2025-01-14')
      }
    ]);
  };

  const loadHighRiskAlerts = async () => {
    // Mock data - would fetch from database
    setHighRiskAlerts([
      {
        id: 1,
        type: 'high_value_job',
        description: 'Flytt med gods värde över 500,000 SEK',
        risk_score: 85,
        date: new Date('2025-01-20')
      },
      {
        id: 2,
        type: 'difficult_customer',
        description: 'Kund med 3+ tidigare tvister',
        risk_score: 78,
        date: new Date('2025-01-18')
      }
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'responding': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-600" />
                Risk Management & Legal AI
              </h1>
              <p className="text-gray-600 mt-1">
                Skydda Nordflytt med intelligent juridisk AI och riskhantering
              </p>
            </div>
            <Button 
              onClick={() => {}} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Rapportera Tvist
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktiva Tvister</CardTitle>
              <Scale className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeDisputes}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">{Math.abs(metrics.disputesTrend)}%</span>
                <span className="ml-1">från förra månaden</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Lösta Ärenden</CardTitle>
              <Bot className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.aiResolvedCases}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span>+12 denna månad</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomsnittlig Lösningstid</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageResolutionTime} dagar</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                <span>-1.1 dagar från förra månaden</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Månadskostnad Juridik</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyLegalCost)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">{metrics.costSavings}%</span>
                <span className="ml-1">besparing</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Score Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Övergripande Riskpoäng</span>
              <Badge className={metrics.riskScore > 80 ? 'bg-red-500' : metrics.riskScore > 60 ? 'bg-orange-500' : 'bg-green-500'}>
                {metrics.riskScore}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={metrics.riskScore} className="h-4 mb-4" />
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Juridisk Risk:</span>
                <span className="ml-2 font-medium">Medium</span>
              </div>
              <div>
                <span className="text-muted-foreground">Finansiell Risk:</span>
                <span className="ml-2 font-medium">Låg</span>
              </div>
              <div>
                <span className="text-muted-foreground">Operationell Risk:</span>
                <span className="ml-2 font-medium">Medium</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ryktesrisk:</span>
                <span className="ml-2 font-medium">Låg</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            {riskTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                <span className="sm:hidden">{tab.icon}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Disputes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Senaste Tvister</span>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('disputes')}>
                      Visa alla <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentDisputes.map((dispute) => (
                      <div key={dispute.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{dispute.case_number}</div>
                          <div className="text-xs text-muted-foreground">{dispute.customer_name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(dispute.severity)}>
                            {dispute.severity}
                          </Badge>
                          <Badge className={getStatusColor(dispute.status)}>
                            {dispute.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* High Risk Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Högriskvarningar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {highRiskAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm text-orange-900">{alert.type}</div>
                            <div className="text-xs text-orange-700 mt-1">{alert.description}</div>
                          </div>
                          <Badge className="bg-orange-600 text-white">
                            Risk: {alert.risk_score}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Performance */}
            <Card>
              <CardHeader>
                <CardTitle>AI System Prestanda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Automatiseringsgrad</div>
                    <Progress value={85} className="h-2 mb-1" />
                    <div className="text-xs text-right">85%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">AI Träffsäkerhet</div>
                    <Progress value={92} className="h-2 mb-1" />
                    <div className="text-xs text-right">92%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Kundnöjdhet AI-svar</div>
                    <Progress value={88} className="h-2 mb-1" />
                    <div className="text-xs text-right">88%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <DisputesManager />
          </TabsContent>

          <TabsContent value="ai_responses">
            <AIResponsesManager />
          </TabsContent>

          <TabsContent value="insurance">
            <InsuranceManager />
          </TabsContent>

          <TabsContent value="risk_analysis">
            <RiskAnalysisManager />
          </TabsContent>

          <TabsContent value="legal_costs">
            <LegalCostsManager />
          </TabsContent>

          <TabsContent value="templates">
            <LegalTemplatesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}