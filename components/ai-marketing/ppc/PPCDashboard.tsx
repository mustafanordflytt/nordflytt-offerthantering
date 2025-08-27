'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  Shield,
  AlertTriangle,
  Activity,
  DollarSign,
  Sparkles,
  Search,
  Eye,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Target,
  Brain,
  Zap,
  Facebook,
  Globe,
  Linkedin,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  PieChart,
  Users,
  Trophy,
  FlaskConical,
  MessageCircle,
  Clock,
  Hash,
  ThumbsDown,
  Wifi,
  Info,
  HelpCircle,
  TrendingDown,
  CircleDollarSign,
  HandshakeIcon,
  AlertCircle,
  ChevronRight,
  Timer,
  Award,
  ShieldCheck,
  Lightbulb,
  Rocket,
  HeartHandshake,
  MessageSquare,
  Loader2
} from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface PlatformData {
  name: string;
  roas: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  spend: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
  issue?: string;
  opportunity?: string;
}

interface AIRecommendation {
  id: string;
  priority: 'high' | 'critical' | 'medium';
  icon: string;
  title: string;
  description: string;
  impact: string;
  confidence: string;
  action: string;
  platform?: string;
  evidence?: string;
  businessContext?: string;
  risk?: string;
  timeToImplement?: string;
  expectedOutcome?: string;
}

interface LiveCampaign {
  id: string;
  name: string;
  platform: string;
  roas: number;
  todayProfit: number;
  status: 'winning' | 'underperforming' | 'excellent';
  actions: string[];
  issue?: string;
  opportunity?: string;
  businessContext?: string;
}

interface ActionFeedback {
  id: string;
  action: string;
  timestamp: Date;
  status: 'processing' | 'completed' | 'failed';
  result?: string;
  details?: string;
  nextSteps?: string[];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const PPCDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
  const [loading, setLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback[]>([]);
  const [showHelp, setShowHelp] = useState<{[key: string]: boolean}>({});
  const [isLiveData, setIsLiveData] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showSimpleMetrics] = useState(true);

  // Main dashboard data with business context
  const [dashboardData] = useState({
    profit: {
      today: 69150,
      trend: '+23%',
      trendValue: 23,
      forecast: 156000,
      status: 'SAFE' as const,
      context: 'Vinsten är 23% högre än förra onsdagen. Detta beror på ökad efterfrågan från Östermalm.',
      whyItMatters: 'På denna takt når vi månadsmålet 3 dagar tidigare än planerat.'
    },
    roas: {
      overall: 4.2,
      google: 4.2,
      meta: 2.8,
      bing: 5.1,
      linkedin: 3.4,
      context: 'För varje krona du spenderar får du 4.20 kr tillbaka.',
      benchmark: 'Branschsnittet är 3.1x - vi ligger 35% över.'
    },
    fraudProtection: {
      moneySaved: 12450,
      threatsBlocked: 47,
      competitorIPs: 5,
      efficiency: 98,
      context: 'Vi har sparat 12,450 kr denna månad genom att blockera falska klick.',
      whyItMatters: 'Utan detta skydd hade månadens vinst varit 18% lägre.'
    },
    campaigns: {
      active: 8,
      testing: 5,
      paused: 2,
      winning: 6,
      context: '6 av 8 kampanjer är lönsamma just nu.',
      opportunity: '2 underpresterande kampanjer kan optimeras för +15,000 kr/månad.'
    }
  });

  // Platform data with enhanced context
  const [platforms] = useState<PlatformData[]>([
    {
      name: 'Google',
      roas: 4.2,
      status: 'excellent',
      spend: 35000,
      revenue: 147000,
      trend: 'up',
      opportunity: 'Låg konkurrens på "akutflytt" keywords just nu - perfekt tid att öka!'
    },
    {
      name: 'Meta',
      roas: 2.8,
      status: 'warning',
      spend: 25000,
      revenue: 70000,
      trend: 'down',
      issue: 'Samma annonser har visats för länge - målgruppen tröttnar.'
    },
    {
      name: 'Bing',
      roas: 5.1,
      status: 'excellent',
      spend: 8000,
      revenue: 40800,
      trend: 'up',
      opportunity: 'Nästan inga konkurrenter här - vi kan dubblera utan att höja CPC!'
    },
    {
      name: 'LinkedIn',
      roas: 3.4,
      status: 'good',
      spend: 12000,
      revenue: 40800,
      trend: 'stable'
    }
  ]);

  // Enhanced AI Recommendations with business context
  const [recommendations] = useState<AIRecommendation[]>([
    {
      id: '1',
      priority: 'high',
      icon: '💰',
      title: 'Öka Google-budget med 15,000 kr',
      description: '"Pianoflytt Stockholm" söker 340% mer än vanligt',
      impact: '+28,000 kr extra vinst nästa månad',
      confidence: '94% säkerhet baserat på 3 års data',
      action: 'budget_increase',
      platform: 'google',
      businessContext: 'December är högsäsong för pianoflytt pga julkonserter. Vi missade denna möjlighet förra året.',
      risk: 'Låg risk - vi kan alltid pausa om ROAS sjunker under 3.5x',
      timeToImplement: '5 minuter',
      expectedOutcome: '15-20 nya pianoflytt-bokningar'
    },
    {
      id: '2',
      priority: 'critical',
      icon: '🛡️',
      title: 'Blockera MovingStockholm (konkurrent)',
      description: 'De klickar på våra annonser utan att boka - kostar oss 2,000 kr/dag',
      impact: 'Spara 60,000 kr/månad direkt',
      confidence: '99% säker - vi har deras IP-adresser',
      action: 'fraud_block',
      evidence: 'IP: 194.68.123.45 • 47 klick • 0 bokningar • Alltid kl 15-16',
      businessContext: 'MovingStockholm försöker tömma vår budget så vi försvinner från Google.',
      risk: 'Ingen risk - vi blockerar bara deras kontor-IP',
      timeToImplement: '2 minuter',
      expectedOutcome: 'Budget räcker 30% längre varje dag'
    },
    {
      id: '3',
      priority: 'medium',
      icon: '🎯',
      title: 'Starta "Studentflytt-kampanj" på Meta',
      description: 'KTH och SU börjar snart - perfekt timing',
      impact: '+45 studentflyttar = 135,000 kr intäkt',
      confidence: '87% baserat på förra årets succé',
      action: 'new_campaign',
      platform: 'meta',
      businessContext: 'Studenter bokar oftast via mobilen på kvällar. Meta är perfekt för detta.',
      risk: 'Medel risk - studenter är priskänsliga men lojala om nöjda',
      timeToImplement: '30 minuter',
      expectedOutcome: 'Dominera studentflytt-marknaden i 3 månader'
    }
  ]);

  // Load user preference
  useEffect(() => {
    const savedPreference = localStorage.getItem('ppc_view_mode');
    if (savedPreference === 'simple' || savedPreference === 'advanced') {
      setViewMode(savedPreference);
    }
    
    // Simulate live data updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setIsLiveData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Save view mode when it changes
  useEffect(() => {
    localStorage.setItem('ppc_view_mode', viewMode);
  }, [viewMode]);

  // Handle AI actions with detailed feedback
  const handleAIAction = async (action: string, recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;

    const feedbackId = `feedback-${Date.now()}`;
    const newFeedback: ActionFeedback = {
      id: feedbackId,
      action: recommendation.title,
      timestamp: new Date(),
      status: 'processing',
      details: 'Förbereder ändringen...'
    };
    
    setActionFeedback(prev => [newFeedback, ...prev]);
    setProcessingAction(action);

    // Simulate processing
    setTimeout(() => {
      setActionFeedback(prev => prev.map(f => {
        if (f.id === feedbackId) {
          switch (action) {
            case 'budget_increase':
              return {
                ...f,
                status: 'completed',
                result: 'Budget ökat med 15,000 kr på Google Ads',
                details: 'Nya budgeten är aktiv. Kampanjer optimeras automatiskt för pianoflytt-keywords.',
                nextSteps: [
                  'AI övervakar ROAS var 15:e minut',
                  'Du får varning om ROAS sjunker under 3.5x',
                  'Daglig rapport skickas kl 09:00'
                ]
              };
            case 'fraud_block':
              return {
                ...f,
                status: 'completed',
                result: 'MovingStockholm blockerad på alla plattformar',
                details: '5 IP-adresser tillagda i blockeringslistan. Deras klick räknas inte längre.',
                nextSteps: [
                  'AI letar efter nya misstänkta IP-adresser',
                  'Du sparar ~2,000 kr per dag från och med nu',
                  'Månadsrapport visar exakt besparing'
                ]
              };
            case 'new_campaign':
              return {
                ...f,
                status: 'completed',
                result: 'Studentflytt-kampanj skapad och aktiverad',
                details: 'Kampanjen riktar sig till 18-25 åringar nära KTH och SU.',
                nextSteps: [
                  'Första resultaten syns inom 24 timmar',
                  'A/B-test av 3 olika erbjudanden pågår',
                  'AI justerar bud automatiskt baserat på respons'
                ]
              };
            default:
              return f;
          }
        }
        return f;
      }));
      setProcessingAction(null);
    }, 3000);
  };

  // Format currency with context
  const formatCurrency = (amount: number, context?: string) => {
    const formatted = new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    
    return context ? `${formatted} ${context}` : formatted;
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google': return <Globe className="h-4 w-4" />;
      case 'meta': return <Facebook className="h-4 w-4" />;
      case 'bing': return <Search className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Trust Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-600 animate-pulse" />
              <span className="text-sm font-medium">Live data</span>
              <Badge variant="outline" className="text-xs">
                Uppdaterad {lastUpdate.toLocaleTimeString('sv-SE')}
              </Badge>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <Badge className="bg-green-100 text-green-800">
              <ShieldCheck className="h-3 w-3 mr-1" />
              98% datakvalitet
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'simple' ? 'advanced' : 'simple')}
          >
            {viewMode === 'simple' ? 'Avancerad vy' : 'Enkel vy'}
          </Button>
        </div>
      </div>

      {/* Main Stats - Enhanced with context */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Profit */}
        <Card className="hover:shadow-lg transition-all cursor-pointer" 
              onClick={() => setExpandedCard(expandedCard === 'profit' ? null : 'profit')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Dagens vinst
                {viewMode === 'advanced' && (
                  <HelpCircle 
                    className="h-3 w-3 inline-block ml-1 text-gray-400 cursor-help" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHelp({...showHelp, profit: !showHelp.profit});
                    }}
                  />
                )}
              </CardTitle>
              <Badge className={dashboardData.profit.trendValue > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {dashboardData.profit.trend}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{formatCurrency(dashboardData.profit.today)}</p>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              {viewMode === 'advanced' && showHelp.profit && (
                <Alert className="mt-2 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Detta är vinsten efter alla kostnader (annonsering, personal, etc). 
                    Jämfört med samma veckodag förra månaden.
                  </AlertDescription>
                </Alert>
              )}
              {viewMode === 'advanced' && expandedCard === 'profit' && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm text-gray-600">{dashboardData.profit.context}</p>
                  <p className="text-sm font-medium text-blue-600">
                    💡 {dashboardData.profit.whyItMatters}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Timer className="h-3 w-3" />
                    <span>Prognos denna månad: {formatCurrency(dashboardData.profit.forecast)}</span>
                  </div>
                </div>
              )}
              {viewMode === 'simple' && (
                <p className="text-xs text-gray-600 mt-1">
                  {dashboardData.profit.trendValue > 0 ? 'Bra jobbat!' : 'Kolla rekommendationer nedan'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ROAS with context */}
        <Card className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setExpandedCard(expandedCard === 'roas' ? null : 'roas')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                ROAS (avkastning)
                <HelpCircle 
                  className="h-3 w-3 inline-block ml-1 text-gray-400 cursor-help" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHelp({...showHelp, roas: !showHelp.roas});
                  }}
                />
              </CardTitle>
              <Award className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{dashboardData.roas.overall}x</p>
              {showHelp.roas && (
                <Alert className="mt-2 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {dashboardData.roas.context}
                  </AlertDescription>
                </Alert>
              )}
              {expandedCard === 'roas' && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm font-medium text-green-600">
                    ✓ {dashboardData.roas.benchmark}
                  </p>
                  <div className="space-y-1">
                    {Object.entries(dashboardData.roas).filter(([key]) => 
                      !['overall', 'context', 'benchmark'].includes(key)
                    ).map(([platform, value]) => (
                      <div key={platform} className="flex items-center justify-between text-xs">
                        <span className="capitalize flex items-center gap-1">
                          {getPlatformIcon(platform)}
                          {platform}
                        </span>
                        <span className="font-medium">{value}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fraud Protection with impact */}
        <Card className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setExpandedCard(expandedCard === 'fraud' ? null : 'fraud')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bedrägeri-skydd
              </CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">
                +{formatCurrency(dashboardData.fraudProtection.moneySaved)}
              </p>
              <p className="text-xs text-gray-600">sparat denna månad</p>
              {expandedCard === 'fraud' && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm text-gray-600">{dashboardData.fraudProtection.context}</p>
                  <p className="text-sm font-medium text-orange-600">
                    ⚠️ {dashboardData.fraudProtection.whyItMatters}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold">{dashboardData.fraudProtection.threatsBlocked}</p>
                      <p className="text-xs text-gray-600">hot blockerade</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold">{dashboardData.fraudProtection.competitorIPs}</p>
                      <p className="text-xs text-gray-600">konkurrent-IP</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold">{dashboardData.fraudProtection.efficiency}%</p>
                      <p className="text-xs text-gray-600">träffsäkerhet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Status */}
        <Card className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setExpandedCard(expandedCard === 'campaigns' ? null : 'campaigns')}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Kampanjstatus
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{dashboardData.campaigns.winning}</p>
                <span className="text-sm text-gray-600">av {dashboardData.campaigns.active} vinner</span>
              </div>
              {expandedCard === 'campaigns' && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm text-gray-600">{dashboardData.campaigns.context}</p>
                  <p className="text-sm font-medium text-blue-600">
                    💰 {dashboardData.campaigns.opportunity}
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {dashboardData.campaigns.active} aktiva
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {dashboardData.campaigns.testing} testar
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-800">
                      {dashboardData.campaigns.paused} pausade
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations - Enhanced */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <CardTitle>AI-rekommendationer</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">
                <Sparkles className="h-3 w-3 mr-1" />
                3 möjligheter hittade
              </Badge>
            </div>
            {viewMode === 'advanced' && (
              <div className="text-sm text-gray-600">
                Baserat på 3 års data + realtidsanalys
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(viewMode === 'simple' ? recommendations.slice(0, 1) : recommendations).map((rec) => (
              <Card 
                key={rec.id} 
                className={`hover:shadow-md transition-all ${
                  expandedCard === rec.id ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="space-y-1">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    </div>
                    <Badge className={
                      rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {rec.priority === 'critical' ? 'Akut' : 
                       rec.priority === 'high' ? 'Viktig' : 'Normal'}
                    </Badge>
                  </div>

                  {viewMode === 'simple' ? (
                    // Simple view - just show impact and action button
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-semibold text-green-700">{rec.impact}</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleAIAction(rec.action, rec.id)}
                        disabled={processingAction === rec.action}
                      >
                        {processingAction === rec.action ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Genomför...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Genomför nu
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    // Advanced view - show all details
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Förväntad effekt</p>
                          <p className="font-semibold text-green-700">{rec.impact}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Säkerhet</p>
                          <p className="font-semibold text-blue-700">{rec.confidence}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Tid att genomföra</p>
                          <p className="font-semibold text-purple-700">{rec.timeToImplement}</p>
                        </div>
                      </div>

                      {/* Business Context - Only in advanced view */}
                      <div className="space-y-3 mb-4">
                        <Alert className="bg-amber-50 border-amber-200">
                          <Lightbulb className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-sm">
                            <strong>Varför nu:</strong> {rec.businessContext}
                          </AlertDescription>
                        </Alert>

                        {rec.evidence && (
                          <Alert className="bg-gray-50 border-gray-200">
                            <Hash className="h-4 w-4" />
                            <AlertDescription className="text-sm font-mono">
                              {rec.evidence}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>{rec.risk}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Target className="h-4 w-4" />
                            <span>{rec.expectedOutcome}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleAIAction(rec.action, rec.id)}
                          disabled={processingAction === rec.action}
                        >
                          {processingAction === rec.action ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Genomför...
                            </>
                          ) : (
                            <>
                              <Rocket className="h-4 w-4 mr-2" />
                              Genomför nu
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setExpandedCard(expandedCard === rec.id ? null : rec.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Diskutera
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {viewMode === 'simple' && recommendations.length > 1 && (
            <div className="text-center mt-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setViewMode('advanced')}
              >
                Visa fler rekommendationer ({recommendations.length - 1} till)
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Feedback - Only show in advanced mode or if there are recent actions */}
      {(viewMode === 'advanced' || actionFeedback.length > 0) && actionFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Åtgärdshistorik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionFeedback.slice(0, viewMode === 'simple' ? 1 : 3).map((feedback) => (
                <div key={feedback.id} className={`p-4 rounded-lg border ${
                  feedback.status === 'completed' ? 'bg-green-50 border-green-200' :
                  feedback.status === 'failed' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {feedback.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : feedback.status === 'processing' ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <h4 className="font-semibold">{feedback.action}</h4>
                    </div>
                    <span className="text-xs text-gray-500">
                      {feedback.timestamp.toLocaleTimeString('sv-SE')}
                    </span>
                  </div>
                  
                  {feedback.result && (
                    <p className="text-sm font-medium mb-2">{feedback.result}</p>
                  )}
                  
                  {viewMode === 'advanced' && (
                    <>
                      {feedback.details && (
                        <p className="text-sm text-gray-600 mb-3">{feedback.details}</p>
                      )}
                      
                      {feedback.nextSteps && (
                        <div className="bg-white bg-opacity-50 rounded p-3">
                          <p className="text-xs font-medium mb-2">Vad händer nu:</p>
                          <ul className="space-y-1">
                            {feedback.nextSteps.map((step, idx) => (
                              <li key={idx} className="text-xs flex items-center gap-2">
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Performance - Show simplified in simple mode */}
      {viewMode === 'simple' ? (
        <Card>
          <CardHeader>
            <CardTitle>Snabböversikt plattformar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(platform.name)}
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      ROAS: <span className="font-bold">{platform.roas}x</span>
                    </span>
                    {platform.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : platform.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Advanced view - Full platform cards */
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plattformsprestanda</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>Klicka för detaljer</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => (
              <Card 
                key={platform.name} 
                className={`hover:shadow-md transition-all cursor-pointer ${
                  platform.status === 'excellent' ? 'border-green-200' :
                  platform.status === 'warning' ? 'border-yellow-200' :
                  platform.status === 'critical' ? 'border-red-200' :
                  'border-gray-200'
                }`}
                onClick={() => setExpandedCard(expandedCard === platform.name ? null : platform.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(platform.name)}
                      <h4 className="font-semibold">{platform.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        platform.status === 'excellent' ? 'bg-green-100 text-green-800' :
                        platform.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        ROAS: {platform.roas}x
                      </Badge>
                      {platform.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : platform.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Spenderat</p>
                      <p className="font-semibold">{formatCurrency(platform.spend)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Intäkt</p>
                      <p className="font-semibold text-green-600">{formatCurrency(platform.revenue)}</p>
                    </div>
                  </div>

                  {(platform.issue || platform.opportunity) && (
                    <Alert className={platform.issue ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
                      <AlertDescription className="text-sm">
                        {platform.issue ? (
                          <>
                            <AlertTriangle className="h-4 w-4 inline mr-1 text-red-600" />
                            <strong>Problem:</strong> {platform.issue}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 inline mr-1 text-green-600" />
                            <strong>Möjlighet:</strong> {platform.opportunity}
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {expandedCard === platform.name && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <Button size="sm" className="w-full" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Visa detaljerad rapport
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Advanced View Only - Additional Analytics */}
      {viewMode === 'advanced' && (
        <>
          {/* Campaign Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Kampanjprestanda (Live)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Kampanj</th>
                      <th className="text-left p-2">Platform</th>
                      <th className="text-right p-2">Klick</th>
                      <th className="text-right p-2">CTR</th>
                      <th className="text-right p-2">CPC</th>
                      <th className="text-right p-2">Konv.</th>
                      <th className="text-right p-2">ROAS</th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">Piano Östermalm</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>Google</span>
                        </div>
                      </td>
                      <td className="text-right p-2">1,245</td>
                      <td className="text-right p-2">4.8%</td>
                      <td className="text-right p-2">12 kr</td>
                      <td className="text-right p-2">42</td>
                      <td className="text-right p-2 font-bold text-green-600">5.2x</td>
                      <td className="text-center p-2">
                        <Badge className="bg-green-100 text-green-800">Vinnare</Badge>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">Studentflytt KTH</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Facebook className="h-3 w-3" />
                          <span>Meta</span>
                        </div>
                      </td>
                      <td className="text-right p-2">892</td>
                      <td className="text-right p-2">2.1%</td>
                      <td className="text-right p-2">28 kr</td>
                      <td className="text-right p-2">15</td>
                      <td className="text-right p-2 font-bold text-yellow-600">2.8x</td>
                      <td className="text-center p-2">
                        <Badge className="bg-yellow-100 text-yellow-800">Optimerar</Badge>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">Kontorsflytt B2B</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Linkedin className="h-3 w-3" />
                          <span>LinkedIn</span>
                        </div>
                      </td>
                      <td className="text-right p-2">445</td>
                      <td className="text-right p-2">1.2%</td>
                      <td className="text-right p-2">45 kr</td>
                      <td className="text-right p-2">8</td>
                      <td className="text-right p-2 font-bold text-green-600">4.1x</td>
                      <td className="text-center p-2">
                        <Badge className="bg-green-100 text-green-800">Stabil</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* A/B Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Aktiva A/B-tester
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Piano Headlines Test</h4>
                    <Badge>94% signifikans</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">"Säker pianoflytt med försäkring"</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">CTR: 4.8%</span>
                        <Badge className="bg-green-100 text-green-800">Vinnare</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">"Professionell pianotransport"</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">CTR: 3.2%</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="mt-3 w-full">
                    <Trophy className="h-4 w-4 mr-2" />
                    Implementera vinnare
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competitor Activity Monitor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Konkurrentaktivitet (Senaste 24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">MovingStockholm</p>
                    <p className="text-sm text-gray-600">47 klick från IP 194.68.123.45</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-800">Blockerad</Badge>
                    <p className="text-sm text-gray-600 mt-1">Sparat: 1,410 kr</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">StockholmMove AB</p>
                    <p className="text-sm text-gray-600">Höjt bud på "pianoflytt" med 40%</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-yellow-100 text-yellow-800">Övervakar</Badge>
                    <p className="text-sm text-gray-600 mt-1">Vi ligger fortfarande #1</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Trust Footer */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Alla data krypterad</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartHandshake className="h-4 w-4 text-blue-600" />
              <span>100% transparent</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-purple-600" />
              <span>Google Premier Partner</span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Få hjälp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PPCDashboard;