'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  DollarSign,
  Users,
  ArrowUp,
  ArrowDown,
  Clock,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Rocket,
  Globe,
  MapPin,
  Eye,
  MousePointer,
  Zap,
  Trophy,
  Phone,
  Calendar,
  ChevronRight,
  BarChart3,
  Activity,
  Settings,
  Brain
} from 'lucide-react';
import RealSEODashboard from './RealSEODashboard';
import TodaysFocusPanel from './TodaysFocusPanel';
import RevenueImpactCards from './RevenueImpactCards';
import MobileCEOMode from './MobileCEOMode';
import LiveCompetitorTracker from './LiveCompetitorTracker';
import ConversionOpportunities from './ConversionOpportunities';
import ConversionOpportunitiesExtended from './ConversionOpportunitiesExtended';
import LocalAreaDomination from './LocalAreaDomination';
import WordPressIntegration from './WordPressIntegration';
import CompetitiveWarfareMap from './CompetitiveWarfareMap';
import PredictiveInsights from './PredictiveInsights';
import SEOStockholmSimplified from './SEOStockholmSimplified';
import AIAssistant from './AIAssistant';
import OneClickActions from './OneClickActions';
import SmartNotifications from './SmartNotifications';

interface SEOMetric {
  id: string;
  name: string;
  currentValue: number;
  previousValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  revenueImpact: number;
}

interface OpportunityAlert {
  id: string;
  type: 'urgent' | 'high-value' | 'quick-win' | 'strategic';
  title: string;
  description: string;
  potentialRevenue: number;
  effortLevel: 'low' | 'medium' | 'high';
  timeToImplement: string;
  action: string;
  createdAt: Date;
}

interface LocalAreaPerformance {
  area: string;
  visibility: number;
  leads: number;
  revenue: number;
  growthRate: number;
  competitorPresence: 'low' | 'medium' | 'high';
  opportunities: number;
}

const SEOStockholmDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [simplifiedView, setSimplifiedView] = useState(false); // Changed to show real dashboard by default
  const [showAssistant, setShowAssistant] = useState(true);
  const [showRealData, setShowRealData] = useState(true); // New state for toggling between real and demo data
  
  // Mock data for demo
  const [metrics, setMetrics] = useState<SEOMetric[]>([
    {
      id: '1',
      name: 'Nya leads från Google',
      currentValue: 12,
      previousValue: 8,
      targetValue: 15,
      unit: 'leads',
      trend: 'up',
      impact: 'high',
      revenueImpact: 48000
    },
    {
      id: '2',
      name: 'Lokala sökningar',
      currentValue: 324,
      previousValue: 285,
      targetValue: 400,
      unit: 'sökningar',
      trend: 'up',
      impact: 'high',
      revenueImpact: 35000
    },
    {
      id: '3',
      name: 'Konverteringsgrad',
      currentValue: 3.2,
      previousValue: 2.8,
      targetValue: 4.0,
      unit: '%',
      trend: 'up',
      impact: 'medium',
      revenueImpact: 25000
    }
  ]);

  const [opportunities, setOpportunities] = useState<OpportunityAlert[]>([
    {
      id: '1',
      type: 'urgent',
      title: '5 obesvarade recensioner på Google',
      description: 'Potentiella kunder läser recensioner. Svara inom 24h för bästa intryck.',
      potentialRevenue: 25000,
      effortLevel: 'low',
      timeToImplement: '30 min',
      action: 'Svara nu',
      createdAt: new Date()
    },
    {
      id: '2',
      type: 'high-value',
      title: 'Rankar #4 för "Flyttfirma Östermalm"',
      description: 'Med små justeringar kan vi ta position #1 och få 3x mer trafik.',
      potentialRevenue: 85000,
      effortLevel: 'medium',
      timeToImplement: '2 dagar',
      action: 'Optimera nu',
      createdAt: new Date()
    },
    {
      id: '3',
      type: 'quick-win',
      title: 'Saknar öppettider på Google My Business',
      description: 'Företag med fullständig information får 70% fler samtal.',
      potentialRevenue: 15000,
      effortLevel: 'low',
      timeToImplement: '5 min',
      action: 'Uppdatera',
      createdAt: new Date()
    }
  ]);

  const [areaPerformance, setAreaPerformance] = useState<LocalAreaPerformance[]>([
    {
      area: 'Östermalm',
      visibility: 82,
      leads: 18,
      revenue: 115000,
      growthRate: 22,
      competitorPresence: 'high',
      opportunities: 5
    },
    {
      area: 'Södermalm',
      visibility: 75,
      leads: 15,
      revenue: 98000,
      growthRate: 15,
      competitorPresence: 'medium',
      opportunities: 8
    },
    {
      area: 'Vasastan',
      visibility: 68,
      leads: 12,
      revenue: 78000,
      growthRate: 18,
      competitorPresence: 'low',
      opportunities: 12
    }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getOpportunityIcon = (type: OpportunityAlert['type']) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high-value': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'quick-win': return <Zap className="h-5 w-5 text-green-500" />;
      case 'strategic': return <Target className="h-5 w-5 text-blue-500" />;
    }
  };

  const getOpportunityBadgeColor = (type: OpportunityAlert['type']) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high-value': return 'bg-yellow-100 text-yellow-800';
      case 'quick-win': return 'bg-green-100 text-green-800';
      case 'strategic': return 'bg-blue-100 text-blue-800';
    }
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setViewMode(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render mobile CEO mode if on mobile
  if (viewMode === 'mobile') {
    return <MobileCEOMode />;
  }

  // Show real SEO dashboard if enabled
  if (showRealData) {
    return (
      <div className="relative">
        {/* Toggle button for demo view */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">Real SEO Data Active</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRealData(false)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visa Demo
          </Button>
        </div>
        
        {/* Real SEO Dashboard */}
        <RealSEODashboard />
      </div>
    );
  }

  // Show simplified view if enabled
  if (simplifiedView) {
    return (
      <div className="relative">
        {/* Smart Notifications */}
        <SmartNotifications position="top-right" />
        
        {/* Toggle buttons */}
        <div className="flex justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRealData(true)}
          >
            <Brain className="h-4 w-4 mr-2" />
            Verklig Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimplifiedView(false)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Avancerad vy
          </Button>
        </div>
        
        {/* Simplified Dashboard */}
        <SEOStockholmSimplified />
        
        {/* AI Assistant */}
        {showAssistant && (
          <AIAssistant onClose={() => setShowAssistant(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Notifications */}
      <SmartNotifications position="top-right" />
      
      {/* Header with Quick Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SEO Stockholm - Demo</h2>
          <p className="text-gray-600">Mockdata för demonstration</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowRealData(true)}
          >
            <Brain className="h-4 w-4 mr-2" />
            Visa Verklig Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimplifiedView(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Förenklad vy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLoading(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
          <Button size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Ring SEO-expert
          </Button>
        </div>
      </div>

      {/* Today's Focus Panel */}
      <TodaysFocusPanel />

      {/* Revenue Impact Cards */}
      <RevenueImpactCards metrics={metrics} />

      {/* Opportunity Alerts */}
      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            Affärsmöjligheter just nu
          </CardTitle>
          <CardDescription>
            Åtgärder som direkt kan öka era intäkter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div key={opp.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getOpportunityIcon(opp.type)}
                    <div className="flex-1">
                      <h3 className="font-medium">{opp.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{opp.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-green-600 font-medium">
                          +{formatCurrency(opp.potentialRevenue)} potential
                        </span>
                        <span className="text-sm text-gray-500">
                          {opp.timeToImplement}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {opp.effortLevel} insats
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="ml-4">
                    {opp.action}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="actions">Snabbåtgärder</TabsTrigger>
          <TabsTrigger value="areas">Områden</TabsTrigger>
          <TabsTrigger value="competitors">Konkurrenter</TabsTrigger>
          <TabsTrigger value="conversions">Konvertering</TabsTrigger>
          <TabsTrigger value="predictions">AI Insights</TabsTrigger>
          <TabsTrigger value="wordpress">WordPress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveCompetitorTracker />
            <ConversionOpportunities />
          </div>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-4">
          <OneClickActions />
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <LocalAreaDomination areas={areaPerformance} />
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <CompetitiveWarfareMap />
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <ConversionOpportunitiesExtended />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictiveInsights />
        </TabsContent>

        <TabsContent value="wordpress" className="space-y-4">
          <WordPressIntegration />
        </TabsContent>
      </Tabs>
      
      {/* AI Assistant */}
      {showAssistant && (
        <AIAssistant onClose={() => setShowAssistant(false)} />
      )}
    </div>
  );
};

export default SEOStockholmDashboard;