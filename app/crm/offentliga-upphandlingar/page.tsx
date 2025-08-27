'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Target, 
  FileText, 
  Calendar, 
  Award,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  MapPin,
  Euro,
  Brain,
  Zap,
  Shield
} from 'lucide-react';

interface ProcurementOpportunity {
  id: number;
  tenderId: string;
  title: string;
  entityName: string;
  entityType: 'kommun' | 'region' | 'myndighet';
  estimatedValue: number;
  deadline: string;
  winProbability: number;
  status: 'identified' | 'analyzing' | 'offer_ready' | 'submitted' | 'awarded' | 'lost';
  strategicImportance: 'critical' | 'high' | 'medium' | 'low';
  aiAnalysis: {
    summary: string;
    advantages: string[];
    challenges: string[];
  };
  category: string;
  subcategory: string;
}

interface AIGeneratedOffer {
  id: number;
  opportunityId: number;
  opportunityTitle: string;
  totalPrice: number;
  aiConfidenceScore: number;
  estimatedWinProbability: number;
  status: 'draft' | 'review' | 'approved' | 'submitted';
  competitiveAdvantages: string[];
  pricingBreakdown: {
    personnelCosts: number;
    transportCosts: number;
    aiOptimizationSavings: number;
  };
  documentPaths: {
    executiveSummary: string;
    technicalProposal: string;
    fullProposal: string;
  };
  generationTimeSeconds: number;
  createdAt: string;
}

interface PublicEntity {
  id: number;
  entityName: string;
  entityType: 'kommun' | 'region' | 'myndighet';
  annualMovingBudget: number;
  relationshipStatus: 'prospective' | 'contacted' | 'engaged' | 'client';
  aiPriorityScore: number;
  marketValuePotential: number;
  lastContact?: string;
  keyContacts: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, description }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && <p className="text-sm text-green-600">{trend}</p>}
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProcurementOverview: React.FC = () => {
  const [overviewData, setOverviewData] = useState({
    totalOpportunities: 24,
    activeOffers: 8,
    wonContracts: 3,
    totalPipelineValue: 47200000,
    averageWinRate: 73,
    aiConfidenceScore: 89
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Aktiva Upphandlingar"
          value={overviewData.totalOpportunities}
          trend="+12% från förra månaden"
          icon={<Target />}
          description="Stockholm-fokuserade möjligheter"
        />
        <MetricCard
          title="AI-Genererade Offerter"
          value={overviewData.activeOffers}
          trend="+3 nya denna vecka"
          icon={<Brain />}
          description="Automatiskt genererade med 89% konfidenshållning"
        />
        <MetricCard
          title="Vunna Kontrakt"
          value={overviewData.wonContracts}
          trend="73% win rate"
          icon={<Award />}
          description="Överträffar branschgenomsnittet"
        />
        <MetricCard
          title="Pipeline Värde"
          value={`${(overviewData.totalPipelineValue / 1000000).toFixed(1)}M SEK`}
          trend="+25% YoY"
          icon={<TrendingUp />}
          description="Total kontraktspotential"
        />
        <MetricCard
          title="AI Win Prediction"
          value={`${overviewData.averageWinRate}%`}
          trend="Genomsnittlig sannolikhet"
          icon={<Zap />}
          description="AI-driven vinstsannolikhet"
        />
        <MetricCard
          title="System Konfidenshållning"
          value={`${overviewData.aiConfidenceScore}%`}
          trend="Hög precision"
          icon={<Shield />}
          description="AI-systemets självförtroende"
        />
      </div>

      {/* Stockholm Market Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Stockholm Marknadsöversikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Prioriterade Aktörer</h4>
              <div className="space-y-3">
                {[
                  { name: "Stockholms Stad", value: 20000000, status: "prospective", priority: "critical" },
                  { name: "Region Stockholm", value: 15000000, status: "contacted", priority: "critical" },
                  { name: "Solna Kommun", value: 3000000, status: "engaged", priority: "high" },
                  { name: "Sundbyberg Kommun", value: 1500000, status: "prospective", priority: "high" }
                ].map((entity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{entity.name}</div>
                      <div className="text-sm text-gray-600">{(entity.value / 1000000).toFixed(1)}M SEK potential</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={entity.priority === 'critical' ? 'destructive' : 'default'}>
                        {entity.priority}
                      </Badge>
                      <Badge variant={entity.status === 'prospective' ? 'outline' : 'secondary'}>
                        {entity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">AI Marknadsanalys</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Marknadsgenomträngning</span>
                    <span>23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Konkurrensfördel</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Relationskvalitet</span>
                    <span>64%</span>
                  </div>
                  <Progress value={64} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>AI Adoption Readiness</span>
                    <span>91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                  <Brain className="h-4 w-4" />
                  AI Rekommendation
                </div>
                <p className="text-sm text-blue-700">
                  Fokusera på Solna och Sundbyberg för snabba wins. Stockholm Stad kräver mer relationship building.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto flex-col py-4" variant="outline">
              <Search className="h-6 w-6 mb-2" />
              <span className="text-sm">Scanna Nya Upphandlingar</span>
            </Button>
            <Button className="h-auto flex-col py-4" variant="outline">
              <Brain className="h-6 w-6 mb-2" />
              <span className="text-sm">Generera AI-Offerter</span>
            </Button>
            <Button className="h-auto flex-col py-4" variant="outline">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Uppdatera Relationer</span>
            </Button>
            <Button className="h-auto flex-col py-4" variant="outline">
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-sm">Skapa Rapporter</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OpportunitiesManager: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ProcurementOpportunity[]>([
    {
      id: 1,
      tenderId: "STHLM-2025-001",
      title: "Ramavtal kontorsflyttar Stockholms Stad",
      entityName: "Stockholms Stad",
      entityType: "kommun",
      estimatedValue: 5000000,
      deadline: "2025-03-15T14:00:00Z",
      winProbability: 0.75,
      status: "offer_ready",
      strategicImportance: "critical",
      aiAnalysis: {
        summary: "Hög potential med AI-fördelar",
        advantages: ["AI optimization", "Cost efficiency", "Local presence"],
        challenges: ["Large scale", "Multiple stakeholders", "Established relationships"]
      },
      category: "flyttjänster",
      subcategory: "kontorsflytt"
    },
    {
      id: 2,
      tenderId: "RSTHLM-2025-001", 
      title: "Sjukhusflyttar Region Stockholm",
      entityName: "Region Stockholm",
      entityType: "region",
      estimatedValue: 3500000,
      deadline: "2025-02-28T12:00:00Z",
      winProbability: 0.65,
      status: "analyzing",
      strategicImportance: "high",
      aiAnalysis: {
        summary: "Specialiserade krav, AI-fördelar tydliga",
        advantages: ["Specialized equipment handling", "24/7 availability", "Security protocols"],
        challenges: ["Security requirements", "Complex logistics", "Healthcare regulations"]
      },
      category: "flyttjänster",
      subcategory: "sjukhusflytt"
    },
    {
      id: 3,
      tenderId: "SOLNA-2025-001",
      title: "Skolflyttar Solna Kommun sommaren 2025",
      entityName: "Solna Kommun", 
      entityType: "kommun",
      estimatedValue: 800000,
      deadline: "2025-04-10T16:00:00Z",
      winProbability: 0.80,
      status: "submitted",
      strategicImportance: "high",
      aiAnalysis: {
        summary: "Utmärkt match för AI-kapacitet",
        advantages: ["Summer schedule flexibility", "School specialization", "Local presence"],
        challenges: ["Time constraints", "Sensitive equipment", "Multiple locations"]
      },
      category: "flyttjänster", 
      subcategory: "skolflyttar"
    }
  ]);

  const [filters, setFilters] = useState({
    entityType: 'all',
    valueRange: 'all',
    deadline: 'all',
    status: 'all'
  });

  const getStatusColor = (status: string) => {
    const colors = {
      'identified': 'bg-gray-100 text-gray-800',
      'analyzing': 'bg-blue-100 text-blue-800',
      'offer_ready': 'bg-green-100 text-green-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'awarded': 'bg-emerald-100 text-emerald-800',
      'lost': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.identified;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'identified': <Search className="h-4 w-4" />,
      'analyzing': <Brain className="h-4 w-4" />,
      'offer_ready': <FileText className="h-4 w-4" />,
      'submitted': <CheckCircle className="h-4 w-4" />,
      'awarded': <Award className="h-4 w-4" />,
      'lost': <AlertCircle className="h-4 w-4" />
    };
    return icons[status] || icons.identified;
  };

  const getDeadlineUrgency = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 7) return 'urgent';
    if (daysUntil < 30) return 'soon';
    return 'normal';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleScanOpportunities = async () => {
    console.log('🔍 Scanning for new procurement opportunities...');
    // Simulate AI scanning
    setTimeout(() => {
      console.log('✅ Found 3 new opportunities');
    }, 2000);
  };

  const handleGenerateOffer = async (opportunityId: number) => {
    console.log(`🤖 Generating AI offer for opportunity ${opportunityId}...`);
    // Simulate AI offer generation
    setTimeout(() => {
      console.log('✅ AI offer generated successfully');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🎯 Upphandlingsmöjligheter</h2>
        <div className="flex gap-2">
          <Button onClick={handleScanOpportunities} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Scanna Nya Upphandlingar
          </Button>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            Generera AI-Offerter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Aktörstyp</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.entityType}
                onChange={(e) => setFilters({...filters, entityType: e.target.value})}
              >
                <option value="all">Alla Aktörer</option>
                <option value="kommun">Kommuner</option>
                <option value="region">Regioner</option>
                <option value="myndighet">Myndigheter</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Värdeintervall</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.valueRange}
                onChange={(e) => setFilters({...filters, valueRange: e.target.value})}
              >
                <option value="all">Alla Värden</option>
                <option value="small">100k - 500k SEK</option>
                <option value="medium">500k - 2M SEK</option>
                <option value="large">2M+ SEK</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Deadline</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.deadline}
                onChange={(e) => setFilters({...filters, deadline: e.target.value})}
              >
                <option value="all">Alla Deadlines</option>
                <option value="urgent">Inom 7 dagar</option>
                <option value="soon">Inom 30 dagar</option>
                <option value="later">Mer än 30 dagar</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">Alla Status</option>
                <option value="identified">Identifierad</option>
                <option value="analyzing">Analys</option>
                <option value="offer_ready">Offert Klar</option>
                <option value="submitted">Inlämnad</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium">Upphandling</th>
                  <th className="text-left p-4 font-medium">Aktör</th>
                  <th className="text-left p-4 font-medium">Värde</th>
                  <th className="text-left p-4 font-medium">Deadline</th>
                  <th className="text-left p-4 font-medium">Vinstsannolikhet</th>
                  <th className="text-left p-4 font-medium">AI-Analys</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{opportunity.title}</div>
                        <div className="text-sm text-gray-600">{opportunity.category}</div>
                        <Badge 
                          variant={opportunity.strategicImportance === 'critical' ? 'destructive' : 'secondary'}
                          className="mt-1"
                        >
                          {opportunity.strategicImportance}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{opportunity.entityName}</div>
                          <div className="text-sm text-gray-600 capitalize">{opportunity.entityType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {(opportunity.estimatedValue / 1000).toFixed(0)}k SEK
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm">{formatDate(opportunity.deadline)}</div>
                          <Badge 
                            variant={getDeadlineUrgency(opportunity.deadline) === 'urgent' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {getDeadlineUrgency(opportunity.deadline)}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Win Rate</span>
                          <span>{(opportunity.winProbability * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={opportunity.winProbability * 100} className="h-2" />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{opportunity.aiAnalysis.summary}</div>
                        <div className="text-xs text-green-600">
                          ✅ {opportunity.aiAnalysis.advantages.length} fördelar
                        </div>
                        <div className="text-xs text-orange-600">
                          ⚠️ {opportunity.aiAnalysis.challenges.length} utmaningar
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(opportunity.status)}`}>
                        {getStatusIcon(opportunity.status)}
                        {opportunity.status === 'identified' && 'Identifierad'}
                        {opportunity.status === 'analyzing' && 'AI-Analys'}
                        {opportunity.status === 'offer_ready' && 'Offert Klar'}
                        {opportunity.status === 'submitted' && 'Inlämnad'}
                        {opportunity.status === 'awarded' && 'Vunnen'}
                        {opportunity.status === 'lost' && 'Förlorad'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          👁️ Visa
                        </Button>
                        {opportunity.winProbability > 0.6 && opportunity.status !== 'submitted' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleGenerateOffer(opportunity.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            🤖 AI-Offert
                          </Button>
                        )}
                        {opportunity.status === 'offer_ready' && (
                          <Button size="sm" variant="default">
                            🚀 Skicka
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AIOffersManager: React.FC = () => {
  const [offers, setOffers] = useState<AIGeneratedOffer[]>([
    {
      id: 1,
      opportunityId: 1,
      opportunityTitle: "Ramavtal kontorsflyttar Stockholms Stad",
      totalPrice: 3750000,
      aiConfidenceScore: 0.89,
      estimatedWinProbability: 0.75,
      status: "approved",
      competitiveAdvantages: [
        "60% kostnadsbesparing genom AI-automation",
        "99% precision i planering och genomförande",
        "Real-time transparens med fullständig spårbarhet",
        "Automatisk LOU-efterlevnad"
      ],
      pricingBreakdown: {
        personnelCosts: 2200000,
        transportCosts: 800000,
        aiOptimizationSavings: -1250000
      },
      documentPaths: {
        executiveSummary: "/offers/1/executive-summary.pdf",
        technicalProposal: "/offers/1/technical-proposal.pdf", 
        fullProposal: "/offers/1/complete-proposal.pdf"
      },
      generationTimeSeconds: 180,
      createdAt: "2025-01-15T10:30:00Z"
    },
    {
      id: 2,
      opportunityId: 2,
      opportunityTitle: "Sjukhusflyttar Region Stockholm",
      totalPrice: 2450000,
      aiConfidenceScore: 0.85,
      estimatedWinProbability: 0.65,
      status: "review",
      competitiveAdvantages: [
        "Specialiserad sjukhusflyttskompetens",
        "24/7 tillgänglighet för akuta behov",
        "Säkerhetsprotokoll för känslig utrustning",
        "AI-optimerad logistik"
      ],
      pricingBreakdown: {
        personnelCosts: 1800000,
        transportCosts: 950000,
        aiOptimizationSavings: -300000
      },
      documentPaths: {
        executiveSummary: "/offers/2/executive-summary.pdf",
        technicalProposal: "/offers/2/technical-proposal.pdf",
        fullProposal: "/offers/2/complete-proposal.pdf"
      },
      generationTimeSeconds: 210,
      createdAt: "2025-01-14T14:15:00Z"
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🤖 AI-Genererade Offerter</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrera
          </Button>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            Generera Ny Offert
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Genererade Offerter"
          value={offers.length}
          icon={<FileText />}
          description="Total antal AI-offerter"
        />
        <MetricCard
          title="Genomsnittlig Win Rate"
          value="70%"
          icon={<Target />}
          description="AI-predikterad framgång"
        />
        <MetricCard
          title="AI-Konfidenshållning"
          value="87%"
          icon={<Brain />}
          description="Systemets självförtroende"
        />
        <MetricCard
          title="Avg. Generationstid"
          value="3.2 min"
          icon={<Zap />}
          description="Snabbare än manuell process"
        />
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {offers.map((offer) => (
          <Card key={offer.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{offer.opportunityTitle}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={offer.status === 'approved' ? 'default' : 'secondary'}>
                      {offer.status === 'draft' && '📝 Utkast'}
                      {offer.status === 'review' && '👀 Granskning'}
                      {offer.status === 'approved' && '✅ Godkänd'}
                      {offer.status === 'submitted' && '🚀 Skickad'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Genererad på {offer.generationTimeSeconds}s
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {(offer.totalPrice / 1000).toFixed(0)}k SEK
                  </div>
                  <div className="text-sm text-gray-600">
                    {(offer.estimatedWinProbability * 100).toFixed(0)}% win rate
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* AI Confidence */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>AI-Konfidenshållning</span>
                  <span>{(offer.aiConfidenceScore * 100).toFixed(0)}%</span>
                </div>
                <Progress value={offer.aiConfidenceScore * 100} className="h-2" />
              </div>

              {/* Competitive Advantages */}
              <div>
                <h4 className="font-semibold mb-2">🎯 Konkurrensfördelar</h4>
                <div className="space-y-1">
                  {offer.competitiveAdvantages.slice(0, 3).map((advantage, index) => (
                    <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {advantage}
                    </div>
                  ))}
                  {offer.competitiveAdvantages.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{offer.competitiveAdvantages.length - 3} fler fördelar...
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div>
                <h4 className="font-semibold mb-2">💰 Prisstruktur</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Personal:</span>
                    <span>{(offer.pricingBreakdown.personnelCosts / 1000).toFixed(0)}k SEK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport:</span>
                    <span>{(offer.pricingBreakdown.transportCosts / 1000).toFixed(0)}k SEK</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>AI-Besparingar:</span>
                    <span>{(offer.pricingBreakdown.aiOptimizationSavings / 1000).toFixed(0)}k SEK</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{(offer.totalPrice / 1000).toFixed(0)}k SEK</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  📋 Granska
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
                {offer.status === 'approved' && (
                  <Button size="sm" className="flex-1">
                    🚀 Skicka
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default function PublicProcurementDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const procurementTabs = [
    { id: 'overview', label: 'Översikt', icon: '📊' },
    { id: 'opportunities', label: 'Upphandlingar', icon: '💔' },
    { id: 'entities', label: 'Offentliga Aktörer', icon: '🏛️' },
    { id: 'offers', label: 'AI-Offerter', icon: '📝' },
    { id: 'relationships', label: 'Relationer', icon: '🤝' },
    { id: 'projects', label: 'Pågående Projekt', icon: '🚀' },
    { id: 'compliance', label: 'Compliance', icon: '✅' },
    { id: 'intelligence', label: 'Marknadsanalys', icon: '🔍' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏛️ Offentliga Upphandlingar
          </h1>
          <p className="text-gray-600">
            AI-powered Stockholm public sector procurement domination
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-8">
            {procurementTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-xs lg:text-sm p-2 lg:p-3"
              >
                <span className="hidden lg:inline">{tab.icon} {tab.label}</span>
                <span className="lg:hidden">{tab.icon}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview">
            <ProcurementOverview />
          </TabsContent>

          <TabsContent value="opportunities">
            <OpportunitiesManager />
          </TabsContent>

          <TabsContent value="entities">
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Offentliga Aktörer</h3>
              <p className="text-gray-600">Stockholm entities management kommer här</p>
            </div>
          </TabsContent>

          <TabsContent value="offers">
            <AIOffersManager />
          </TabsContent>

          <TabsContent value="relationships">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Stakeholder Relations</h3>
              <p className="text-gray-600">Relationship management system kommer här</p>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pågående Projekt</h3>
              <p className="text-gray-600">Active public sector projects kommer här</p>
            </div>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Compliance Management</h3>
              <p className="text-gray-600">LOU compliance och audit trails kommer här</p>
            </div>
          </TabsContent>

          <TabsContent value="intelligence">
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Marknadsanalys</h3>
              <p className="text-gray-600">Market intelligence och competitive analysis kommer här</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}