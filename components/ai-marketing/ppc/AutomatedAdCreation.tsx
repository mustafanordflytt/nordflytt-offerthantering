'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  Sparkles,
  Copy,
  Image,
  Video,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Play,
  Eye,
  Download,
  Zap,
  Crown,
  Users,
  MapPin,
  Clock,
  BarChart3,
  Award
} from 'lucide-react';

interface GeneratedAd {
  id: string;
  platform: 'google' | 'meta' | 'bing';
  type: 'search' | 'display' | 'video' | 'carousel';
  headlines: string[];
  descriptions: string[];
  images?: string[];
  targetArea: string;
  targetService: string;
  performance?: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    roas: number;
  };
  status: 'draft' | 'testing' | 'winner' | 'paused';
  createdAt: Date;
  aiScore: number;
  competitorInspired?: string;
}

interface AdTemplate {
  id: string;
  name: string;
  successRate: number;
  avgROAS: number;
  category: string;
}

interface CompetitorAd {
  competitor: string;
  platform: string;
  headline: string;
  description: string;
  detectedAt: Date;
  estimatedBudget: number;
  ourResponse?: string;
}

const AutomatedAdCreation: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('generated');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');

  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([
    {
      id: '1',
      platform: 'google',
      type: 'search',
      headlines: [
        'Pianoflytt Östermalm - Stockholms Lyxspecialister',
        'Försäkrat till 2M - Pianoflytt Stockholm',
        'Ring Nu: Samma Dag - Pianoflytt Östermalm',
        'Vita Handskar Standard - Premium Pianoflytt',
        '500+ Nöjda Kunder - Östermalm Flyttexperter'
      ],
      descriptions: [
        'Specialister på Östermalms smala gatar. Fullförsäkrat till 2M kr. Gratis hembesök.',
        'Premium pianoflytt med vita handskar. 24/7 jour för akuta behov. Ring nu!',
        'Erfarna pianomontörer. Klimatkontrollerad transport. 100% nöjd-garanti.',
        'Stockholms mest anlitade för lyxflyttar. Diskret & professionell service.'
      ],
      targetArea: 'Östermalm',
      targetService: 'Pianoflytt',
      performance: {
        impressions: 4521,
        clicks: 189,
        ctr: 4.2,
        conversions: 12,
        roas: 5.8
      },
      status: 'winner',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      aiScore: 94,
      competitorInspired: 'Elite Moving Stockholm'
    },
    {
      id: '2',
      platform: 'meta',
      type: 'carousel',
      headlines: [
        '🚚 Stressfri Flytt i Vinter',
        'Boka Nu - Spara 2000 kr',
        'Stockholms Bästa Flyttfirma'
      ],
      descriptions: [
        'Låt proffsen sköta din vinterflytt. RUT-avdrag direkt på fakturan.',
        'Över 1000 nöjda kunder i Stockholm. Försäkrat & tryggt.',
        'Från packhjälp till färdig flytt. Vi fixar allt!'
      ],
      images: ['/ad-image-1.jpg', '/ad-image-2.jpg', '/ad-image-3.jpg'],
      targetArea: 'Hela Stockholm',
      targetService: 'Privatflytt',
      performance: {
        impressions: 12450,
        clicks: 423,
        ctr: 3.4,
        conversions: 28,
        roas: 3.2
      },
      status: 'testing',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      aiScore: 87
    }
  ]);

  const [adTemplates] = useState<AdTemplate[]>([
    {
      id: '1',
      name: 'Akut-flytt urgency',
      successRate: 89,
      avgROAS: 4.5,
      category: 'Tidskänslig'
    },
    {
      id: '2',
      name: 'Lokalt förtroende',
      successRate: 92,
      avgROAS: 3.8,
      category: 'Områdesspecifik'
    },
    {
      id: '3',
      name: 'Premium service',
      successRate: 78,
      avgROAS: 5.2,
      category: 'Lyxsegment'
    },
    {
      id: '4',
      name: 'Priskampanj RUT',
      successRate: 85,
      avgROAS: 3.5,
      category: 'Erbjudande'
    }
  ]);

  const [competitorAds] = useState<CompetitorAd[]>([
    {
      competitor: 'MovingStockholm',
      platform: 'Google Ads',
      headline: 'Billigast i Stockholm - Flytt',
      description: 'Sveriges billigaste flyttfirma. Boka idag!',
      detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      estimatedBudget: 45000,
      ourResponse: 'Kvalitet & Försäkring fokus'
    },
    {
      competitor: 'StockholmMove AB',
      platform: 'Facebook',
      headline: 'Flash Sale - 30% rabatt',
      description: 'Bara denna vecka! Boka din flytt nu.',
      detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      estimatedBudget: 25000,
      ourResponse: 'RUT-avdrag ger mer rabatt'
    }
  ]);

  const stockholmAreas = [
    'Östermalm', 'Vasastan', 'Södermalm', 'Kungsholmen', 
    'Norrmalm', 'Gamla Stan', 'Djurgården', 'Bromma'
  ];

  const services = [
    'Privatflytt', 'Kontorsflytt', 'Pianoflytt', 'Bohagsflytt',
    'Studentflytt', 'Seniorservice', 'Packhjälp', 'Magasinering'
  ];

  const generateNewAds = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newAd: GeneratedAd = {
      id: Date.now().toString(),
      platform: 'google',
      type: 'search',
      headlines: [
        `${selectedService} ${selectedArea} - Nordflytt Experter`,
        `Trygg ${selectedService} - Fullförsäkrat Stockholm`,
        `Ring Nu: ${selectedService} ${selectedArea} Idag`,
        `RUT-avdrag ${selectedService} - Boka Direkt`,
        `24/7 Jour - ${selectedService} Stockholm`
      ],
      descriptions: [
        `Specialister på ${selectedService.toLowerCase()} i ${selectedArea}. Försäkrat & tryggt.`,
        `Erfarna flyttproffs för ${selectedService.toLowerCase()}. Kostnadsfri offert samma dag.`,
        `${selectedArea}s mest anlitade för ${selectedService.toLowerCase()}. Ring nu!`,
        `Diskret & professionell ${selectedService.toLowerCase()}. RUT-avdrag på fakturan.`
      ],
      targetArea: selectedArea,
      targetService: selectedService,
      status: 'draft',
      createdAt: new Date(),
      aiScore: Math.floor(Math.random() * 20) + 80
    };
    
    setGeneratedAds(prev => [newAd, ...prev]);
    setIsGenerating(false);
  };

  const handleTestAd = (adId: string) => {
    setGeneratedAds(prev => 
      prev.map(ad => ad.id === adId ? { ...ad, status: 'testing' } : ad)
    );
  };

  const handlePromoteToWinner = (adId: string) => {
    setGeneratedAds(prev => 
      prev.map(ad => ad.id === adId ? { ...ad, status: 'winner' } : ad)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI Annons-skapare</CardTitle>
                <CardDescription>
                  Genererar högpresterande annonser baserat på data & konkurrentanalys
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Annonser skapade idag</p>
              <p className="text-3xl font-bold text-blue-900">47</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Generation Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tjänst</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="all">Alla tjänster</option>
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Område</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="all">Hela Stockholm</option>
                {stockholmAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full"
                onClick={generateNewAds}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generera annonser
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generated">Genererade annonser</TabsTrigger>
          <TabsTrigger value="templates">AI-mallar</TabsTrigger>
          <TabsTrigger value="competitors">Konkurrentbevakning</TabsTrigger>
          <TabsTrigger value="performance">Prestanda</TabsTrigger>
        </TabsList>

        {/* Generated Ads Tab */}
        <TabsContent value="generated" className="space-y-4">
          {generatedAds.map((ad) => (
            <Card key={ad.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={
                      ad.status === 'winner' ? 'bg-green-100 text-green-800' :
                      ad.status === 'testing' ? 'bg-blue-100 text-blue-800' :
                      ad.status === 'paused' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {ad.status}
                    </Badge>
                    <div>
                      <h3 className="font-semibold">
                        {ad.targetService} - {ad.targetArea}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ad.platform} • {ad.type} • AI-poäng: {ad.aiScore}%
                      </p>
                    </div>
                  </div>
                  {ad.performance && (
                    <div className="text-right">
                      <p className="text-2xl font-bold">{ad.performance.roas}x</p>
                      <p className="text-sm text-gray-600">ROAS</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Headlines */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Rubriker ({ad.headlines.length})
                  </h4>
                  <div className="space-y-1">
                    {ad.headlines.slice(0, 3).map((headline, idx) => (
                      <p key={idx} className="text-sm bg-gray-50 p-2 rounded">
                        {headline}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                {ad.performance && (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Visningar</p>
                      <p className="font-bold">{ad.performance.impressions.toLocaleString('sv-SE')}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Klick</p>
                      <p className="font-bold">{ad.performance.clicks}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">CTR</p>
                      <p className="font-bold">{ad.performance.ctr}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Conv.</p>
                      <p className="font-bold">{ad.performance.conversions}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {ad.status === 'draft' && (
                    <>
                      <Button size="sm" onClick={() => handleTestAd(ad.id)}>
                        <Play className="h-3 w-3 mr-1" />
                        Starta test
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Förhandsgranska
                      </Button>
                    </>
                  )}
                  {ad.status === 'testing' && ad.performance && ad.performance.roas > 3 && (
                    <Button size="sm" onClick={() => handlePromoteToWinner(ad.id)}>
                      <Award className="h-3 w-3 mr-1" />
                      Gör till vinnare
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Exportera
                  </Button>
                </div>

                {/* Competitor Inspiration */}
                {ad.competitorInspired && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Inspirerad av {ad.competitorInspired} men 23% bättre optimerad
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Framgångsgrad</p>
                      <p className="text-xl font-bold">{template.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Genomsnitt ROAS</p>
                      <p className="text-xl font-bold">{template.avgROAS}x</p>
                    </div>
                  </div>
                  <Progress value={template.successRate} className="h-2 mb-4" />
                  <Button size="sm" className="w-full">
                    <Zap className="h-3 w-3 mr-1" />
                    Använd mall
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>AI övervakar konkurrenter 24/7</strong> och skapar automatiskt 
              bättre versioner av deras framgångsrika annonser.
            </AlertDescription>
          </Alert>

          {competitorAds.map((ad, idx) => (
            <Card key={idx} className="border-2 border-orange-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{ad.competitor}</h3>
                    <p className="text-sm text-gray-600">{ad.platform}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-orange-100 text-orange-800">
                      Budget: {formatCurrency(ad.estimatedBudget)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{ad.headline}</p>
                  <p className="text-sm text-gray-600 mt-1">{ad.description}</p>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-sm font-medium text-green-900 mb-1">Vår AI-respons:</p>
                  <p className="text-sm text-green-700">{ad.ourResponse}</p>
                </div>
                <p className="text-xs text-gray-500">
                  Upptäckt {ad.detectedAt.toLocaleTimeString('sv-SE')}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="h-8 w-8 text-green-600" />
                  <Badge className="bg-green-100 text-green-800">Vinnare</Badge>
                </div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-gray-600">Högpresterande annonser</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-800">Testing</Badge>
                </div>
                <p className="text-3xl font-bold">28</p>
                <p className="text-sm text-gray-600">Under A/B-testning</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <Badge className="bg-purple-100 text-purple-800">ROI</Badge>
                </div>
                <p className="text-3xl font-bold">4.8x</p>
                <p className="text-sm text-gray-600">Genomsnittlig ROAS</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const Trophy = ({ className }: { className?: string }) => (
  <Crown className={className} />
);

export default AutomatedAdCreation;