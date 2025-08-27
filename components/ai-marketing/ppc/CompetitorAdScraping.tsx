'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye,
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Copy,
  Zap,
  Trophy,
  Target,
  Brain,
  Shield,
  BarChart3,
  Clock,
  ArrowUp,
  ArrowRight,
  Sparkles,
  Download,
  FileText,
  Globe,
  Facebook,
  Linkedin
} from 'lucide-react';

interface ScrapedAd {
  id: string;
  competitor: string;
  platform: 'google' | 'meta' | 'bing' | 'linkedin';
  type: 'search' | 'display' | 'video' | 'carousel';
  headline: string;
  description: string;
  cta: string;
  landingPageUrl?: string;
  detectedAt: Date;
  estimatedBudget: number;
  estimatedReach: number;
  targetAudience: string[];
  keywords: string[];
  performance: {
    estimatedCTR: number;
    estimatedConversions: number;
    threatLevel: 'low' | 'medium' | 'high';
  };
  ourResponse?: {
    status: 'pending' | 'created' | 'deployed';
    improvedHeadline: string;
    improvedDescription: string;
    advantages: string[];
    deployedAt?: Date;
  };
}

interface CompetitorProfile {
  name: string;
  domains: string[];
  monthlyBudget: number;
  mainPlatforms: string[];
  strengths: string[];
  weaknesses: string[];
  marketShare: number;
  lastActivity: Date;
}

interface MarketIntelligence {
  trend: string;
  insight: string;
  opportunity: string;
  urgency: 'low' | 'medium' | 'high';
  potentialImpact: number;
}

const CompetitorAdScraping: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [autoCounter, setAutoCounter] = useState(true);
  const [lastScan, setLastScan] = useState(new Date());
  const [activeTab, setActiveTab] = useState('live-ads');

  const [scrapedAds, setScrapedAds] = useState<ScrapedAd[]>([
    {
      id: '1',
      competitor: 'MovingStockholm',
      platform: 'google',
      type: 'search',
      headline: 'Flytta i Stockholm - Billigast Garanterat',
      description: 'Sveriges billigaste flyttfirma. Vi matchar alla priser. Ring nu!',
      cta: 'Få Gratis Offert',
      landingPageUrl: 'movingstockholm.se/billig-flytt',
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      estimatedBudget: 35000,
      estimatedReach: 45000,
      targetAudience: ['Budget-conscious', 'Students', 'Young families'],
      keywords: ['billig flytt stockholm', 'lägsta pris flytt', 'studentflytt'],
      performance: {
        estimatedCTR: 3.2,
        estimatedConversions: 45,
        threatLevel: 'high'
      },
      ourResponse: {
        status: 'deployed',
        improvedHeadline: 'RUT-avdrag Flytt Stockholm - 50% Rabatt Direkt',
        improvedDescription: 'Försäkrat till 2M kr. Inga dolda avgifter. Erfarna sedan 1985.',
        advantages: ['RUT-fokus', 'Försäkring highlight', 'Trust signals'],
        deployedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    },
    {
      id: '2',
      competitor: 'Elite Moving AB',
      platform: 'meta',
      type: 'carousel',
      headline: 'Lyxflytt för Ditt Hem 🏠✨',
      description: 'Premium flyttservice med vita handskar. Specialister på värdefulla föremål.',
      cta: 'Boka Premium Service',
      detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      estimatedBudget: 25000,
      estimatedReach: 32000,
      targetAudience: ['High-income', 'Östermalm residents', 'Art collectors'],
      keywords: ['lyxflytt', 'premium flyttfirma', 'pianoflytt stockholm'],
      performance: {
        estimatedCTR: 2.8,
        estimatedConversions: 28,
        threatLevel: 'medium'
      },
      ourResponse: {
        status: 'created',
        improvedHeadline: 'Östermalms Flyttexperter - Försäkrat till 5M kr',
        improvedDescription: 'Pianoflytt & konsthantering. Klimatkontrollerad transport. Vita handskar standard.',
        advantages: ['Högre försäkring', 'Mer specifik', 'Lokalt fokus']
      }
    },
    {
      id: '3',
      competitor: 'StockholmMove24',
      platform: 'google',
      type: 'search',
      headline: 'Akut Flytt Dygnet Runt - Ring Nu',
      description: '24/7 flyttjour i hela Stockholm. Vi kommer inom 2 timmar!',
      cta: 'Ring Jour Nu',
      landingPageUrl: 'stockholmmove24.se/jour',
      detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      estimatedBudget: 18000,
      estimatedReach: 22000,
      targetAudience: ['Emergency movers', 'Last-minute', 'Businesses'],
      keywords: ['akut flytt', 'flyttjour stockholm', 'flytt idag'],
      performance: {
        estimatedCTR: 4.1,
        estimatedConversions: 34,
        threatLevel: 'high'
      },
      ourResponse: {
        status: 'pending',
        improvedHeadline: 'Akutflytt Stockholm - På Plats inom 90 min',
        improvedDescription: 'Jouröppet 24/7. Fast pris, inga jourpåslag. Försäkrat & tryggt.',
        advantages: ['Snabbare respons', 'Prisfokus', 'Trygghet']
      }
    }
  ]);

  const [competitorProfiles] = useState<CompetitorProfile[]>([
    {
      name: 'MovingStockholm',
      domains: ['movingstockholm.se', 'billigflytt.se'],
      monthlyBudget: 125000,
      mainPlatforms: ['Google Ads', 'Facebook'],
      strengths: ['Prisfokus', 'Bred räckvidd', 'SEO'],
      weaknesses: ['Låg trust', 'Dåliga reviews', 'Ingen RUT-info'],
      marketShare: 15,
      lastActivity: new Date()
    },
    {
      name: 'Elite Moving AB',
      domains: ['elitemoving.se'],
      monthlyBudget: 85000,
      mainPlatforms: ['Google Ads', 'Instagram'],
      strengths: ['Premium image', 'Bra content', 'Influencers'],
      weaknesses: ['Höga priser', 'Liten volym', 'Smal målgrupp'],
      marketShare: 8,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      name: 'StockholmMove24',
      domains: ['stockholmmove24.se', 'flyttjour.se'],
      monthlyBudget: 65000,
      mainPlatforms: ['Google Ads', 'Bing'],
      strengths: ['24/7 tillgänglighet', 'Jour-nisch', 'Snabb respons'],
      weaknesses: ['Begränsad kapacitet', 'Dyra jourpriser', 'Litet team'],
      marketShare: 6,
      lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000)
    }
  ]);

  const [marketIntelligence] = useState<MarketIntelligence[]>([
    {
      trend: 'Vinterflyttar ökar 40%',
      insight: 'Konkurrenter saknar vinterspecifik marknadsföring',
      opportunity: 'Lansera "Snösäker Flytt" kampanj',
      urgency: 'high',
      potentialImpact: 145000
    },
    {
      trend: 'RUT-sökningar upp 65%',
      insight: 'Endast 20% av konkurrenter nämner RUT i annonser',
      opportunity: 'Dominera RUT-relaterade sökord',
      urgency: 'medium',
      potentialImpact: 98000
    },
    {
      trend: 'Pianoflytt-efterfrågan växer',
      insight: 'Elite Moving ensam om premium-positionering',
      opportunity: 'Attackera premium-segmentet med bättre pris',
      urgency: 'medium',
      potentialImpact: 76000
    }
  ]);

  // Auto-scan simulation
  useEffect(() => {
    if (autoCounter) {
      const interval = setInterval(() => {
        performScan();
      }, 60000); // Every minute

      return () => clearInterval(interval);
    }
  }, [autoCounter]);

  const performScan = () => {
    setIsScanning(true);
    setLastScan(new Date());

    // Simulate finding new ads
    setTimeout(() => {
      const newAd: ScrapedAd = {
        id: Date.now().toString(),
        competitor: ['QuickMove AB', 'Nordic Relocation', 'CityFlytt'][Math.floor(Math.random() * 3)],
        platform: ['google', 'meta', 'bing', 'linkedin'][Math.floor(Math.random() * 4)] as any,
        type: 'search',
        headline: 'Ny konkurrent-annons detekterad',
        description: 'AI analyserar och skapar motåtgärd...',
        cta: 'Läs mer',
        detectedAt: new Date(),
        estimatedBudget: Math.floor(Math.random() * 30000) + 10000,
        estimatedReach: Math.floor(Math.random() * 40000) + 10000,
        targetAudience: ['General'],
        keywords: ['flytt stockholm'],
        performance: {
          estimatedCTR: 2 + Math.random() * 3,
          estimatedConversions: Math.floor(Math.random() * 40) + 10,
          threatLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
        }
      };

      setScrapedAds(prev => [newAd, ...prev.slice(0, 9)]);
      setIsScanning(false);
    }, 3000);
  };

  const handleCounterAd = (adId: string) => {
    setScrapedAds(prev => 
      prev.map(ad => {
        if (ad.id === adId && (!ad.ourResponse || ad.ourResponse.status === 'pending')) {
          return {
            ...ad,
            ourResponse: {
              status: 'created',
              improvedHeadline: `Bättre än ${ad.competitor} - Nordflytt Kvalitet`,
              improvedDescription: 'Fullförsäkrat, RUT-avdrag, 100% nöjdgaranti. Erfarna sedan 1985.',
              advantages: ['Starkare USP', 'Bättre trust', 'RUT-fokus']
            }
          };
        }
        return ad;
      })
    );
  };

  const handleDeployCounter = (adId: string) => {
    setScrapedAds(prev => 
      prev.map(ad => {
        if (ad.id === adId && ad.ourResponse?.status === 'created') {
          return {
            ...ad,
            ourResponse: {
              ...ad.ourResponse,
              status: 'deployed',
              deployedAt: new Date()
            }
          };
        }
        return ad;
      })
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google': return <Search className="h-4 w-4" />;
      case 'meta': return <Facebook className="h-4 w-4" />;
      case 'bing': return <Globe className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Competitor Intelligence System</CardTitle>
                <CardDescription>
                  24/7 övervakning av konkurrenters annonser med AI-motåtgärder
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={autoCounter ? 'default' : 'outline'}
                onClick={() => setAutoCounter(!autoCounter)}
              >
                {autoCounter ? (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Auto-counter PÅ
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Manuellt läge
                  </>
                )}
              </Button>
              <Button onClick={performScan} disabled={isScanning}>
                {isScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Skannar...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Skanna nu
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Övervakade konkurrenter</p>
              <p className="text-2xl font-bold">{competitorProfiles.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Detekterade annonser</p>
              <p className="text-2xl font-bold">{scrapedAds.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Motåtgärder deployed</p>
              <p className="text-2xl font-bold text-green-600">
                {scrapedAds.filter(ad => ad.ourResponse?.status === 'deployed').length}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Senaste skanning</p>
              <p className="text-sm font-medium">{lastScan.toLocaleTimeString('sv-SE')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live-ads">Live annonser</TabsTrigger>
          <TabsTrigger value="competitors">Konkurrenter</TabsTrigger>
          <TabsTrigger value="intelligence">Market Intel</TabsTrigger>
          <TabsTrigger value="response-library">Svarsmall</TabsTrigger>
        </TabsList>

        {/* Live Ads Tab */}
        <TabsContent value="live-ads" className="space-y-4">
          {scrapedAds.map((ad) => (
            <Card key={ad.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      {getPlatformIcon(ad.platform)}
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {ad.competitor}
                        <Badge className={getThreatLevelColor(ad.performance.threatLevel)}>
                          {ad.performance.threatLevel} threat
                        </Badge>
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ad.platform} • {ad.type} • {ad.detectedAt.toLocaleTimeString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Est. budget</p>
                    <p className="font-bold">{formatCurrency(ad.estimatedBudget)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original Ad */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Konkurrentens annons:</h4>
                  <p className="font-semibold">{ad.headline}</p>
                  <p className="text-sm text-gray-700 mt-1">{ad.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="outline">{ad.cta}</Badge>
                    {ad.keywords.slice(0, 3).map((keyword, idx) => (
                      <span key={idx} className="text-xs text-gray-500">#{keyword}</span>
                    ))}
                  </div>
                </div>

                {/* Performance Estimates */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-white border rounded">
                    <p className="text-xs text-gray-600">Est. CTR</p>
                    <p className="font-bold">{ad.performance.estimatedCTR}%</p>
                  </div>
                  <div className="text-center p-2 bg-white border rounded">
                    <p className="text-xs text-gray-600">Est. Conv.</p>
                    <p className="font-bold">{ad.performance.estimatedConversions}</p>
                  </div>
                  <div className="text-center p-2 bg-white border rounded">
                    <p className="text-xs text-gray-600">Reach</p>
                    <p className="font-bold">{(ad.estimatedReach / 1000).toFixed(0)}k</p>
                  </div>
                </div>

                {/* Our Response */}
                {ad.ourResponse ? (
                  <div className={`p-4 rounded-lg border ${
                    ad.ourResponse.status === 'deployed' ? 'bg-green-50 border-green-200' :
                    ad.ourResponse.status === 'created' ? 'bg-blue-50 border-blue-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Vår AI-förbättrade version:
                      </h4>
                      <Badge className={
                        ad.ourResponse.status === 'deployed' ? 'bg-green-100 text-green-800' :
                        ad.ourResponse.status === 'created' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {ad.ourResponse.status}
                      </Badge>
                    </div>
                    <p className="font-semibold">{ad.ourResponse.improvedHeadline}</p>
                    <p className="text-sm text-gray-700 mt-1">{ad.ourResponse.improvedDescription}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {ad.ourResponse.advantages.map((adv, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded border">
                          ✓ {adv}
                        </span>
                      ))}
                    </div>
                    {ad.ourResponse.status === 'created' && (
                      <Button size="sm" className="mt-3" onClick={() => handleDeployCounter(ad.id)}>
                        <Zap className="h-3 w-3 mr-1" />
                        Deploy motannons
                      </Button>
                    )}
                    {ad.ourResponse.deployedAt && (
                      <p className="text-xs text-gray-600 mt-2">
                        Deployed: {ad.ourResponse.deployedAt.toLocaleTimeString('sv-SE')}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button onClick={() => handleCounterAd(ad.id)} className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generera AI-motannons
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          {competitorProfiles.map((competitor, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{competitor.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {competitor.domains.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{competitor.marketShare}% marknadsandel</Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      Aktiv {competitor.lastActivity.toLocaleTimeString('sv-SE')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">Styrkor:</h4>
                    <ul className="space-y-1">
                      {competitor.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-red-700">Svagheter:</h4>
                    <ul className="space-y-1">
                      {competitor.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      <strong>Budget:</strong> {formatCurrency(competitor.monthlyBudget)}/mån
                    </span>
                    <span className="text-sm">
                      <strong>Plattformar:</strong> {competitor.mainPlatforms.join(', ')}
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Djupanalys
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Market Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-4">
          <Alert className="bg-purple-50 border-purple-200">
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Market Insights:</strong> Realtidsanalys av marknaden identifierar 
              möjligheter innan konkurrenterna.
            </AlertDescription>
          </Alert>

          {marketIntelligence.map((intel, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      {intel.trend}
                    </h3>
                    <p className="text-gray-700 mt-2">{intel.insight}</p>
                  </div>
                  <Badge className={
                    intel.urgency === 'high' ? 'bg-red-100 text-red-800' :
                    intel.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {intel.urgency} urgency
                  </Badge>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900 mb-1">Rekommenderad åtgärd:</p>
                  <p className="text-blue-800">{intel.opportunity}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-600">
                    Potential värde: {formatCurrency(intel.potentialImpact)}
                  </span>
                  <Button size="sm">
                    <Target className="h-3 w-3 mr-1" />
                    Implementera
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Response Library Tab */}
        <TabsContent value="response-library" className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              AI-genererade svarsmaller baserade på 1000+ framgångsrika motannonser.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prisfokuserad attack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">Mall-rubrik:</p>
                    <p className="text-sm mt-1">RUT ger 50% rabatt - Bättre än [COMPETITOR]</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">Mall-beskrivning:</p>
                    <p className="text-sm mt-1">Fullförsäkrat till 2M. Inga dolda avgifter som hos andra.</p>
                  </div>
                  <Button size="sm" className="w-full">
                    <Copy className="h-3 w-3 mr-1" />
                    Använd mall
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kvalitetsfokuserad försvar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">Mall-rubrik:</p>
                    <p className="text-sm mt-1">Stockholms mest erfarna - Tryggare än [COMPETITOR]</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-medium">Mall-beskrivning:</p>
                    <p className="text-sm mt-1">4.9 stjärnor, 1000+ nöjda. Välj kvalitet före lägsta pris.</p>
                  </div>
                  <Button size="sm" className="w-full">
                    <Copy className="h-3 w-3 mr-1" />
                    Använd mall
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Legal ammunition bank
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Dokumenterade bevis på konkurrenters olagliga klickbedrägerier
                  </p>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportera bevis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitorAdScraping;