'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  MessageCircle,
  Twitter,
  TrendingUp,
  Users,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  BookOpen,
  Target,
  Heart,
  ThumbsDown,
  Filter,
  Hash,
  BarChart3,
  Activity,
  Sparkles,
  Award
} from 'lucide-react';

interface SocialInsight {
  id: string;
  platform: 'reddit' | 'twitter';
  type: 'tip' | 'complaint' | 'question' | 'trend';
  content: string;
  author: string;
  timestamp: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number; // 0-100
  tags: string[];
  actionable?: {
    insight: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  };
}

interface ExpertProfile {
  username: string;
  platform: string;
  expertise: string[];
  trustScore: number;
  totalInsights: number;
  successfulTips: number;
}

interface TrendAnalysis {
  topic: string;
  momentum: number;
  sentiment: 'positive' | 'negative' | 'mixed';
  volumeChange: number;
  topPosts: string[];
  opportunity?: string;
}

interface CustomerPainPoint {
  issue: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  platforms: string[];
  suggestedAction: string;
  examples: string[];
}

const ExpertLearningSystem: React.FC = () => {
  const [isLearning, setIsLearning] = useState(false);
  const [autoLearn, setAutoLearn] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [socialInsights, setSocialInsights] = useState<SocialInsight[]>([
    {
      id: '1',
      platform: 'reddit',
      type: 'tip',
      content: 'Pro tip: Always use SKAGs (Single Keyword Ad Groups) for Stockholm local searches. My CTR went from 2% to 5.8% targeting "flyttfirma östermalm" separately.',
      author: 'u/PPCexpertSE',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      engagement: { likes: 145, comments: 23, shares: 8 },
      sentiment: 'positive',
      relevance: 95,
      tags: ['SKAGs', 'local-seo', 'stockholm', 'ctr-optimization'],
      actionable: {
        insight: 'SKAGs dramatiskt förbättrar CTR för lokala sökningar',
        recommendation: 'Implementera SKAGs för alla Stockholm-områden',
        priority: 'high'
      }
    },
    {
      id: '2',
      platform: 'twitter',
      type: 'complaint',
      content: 'Flyttfirman jag bokade genom Google ads ljög om RUT-avdraget. Sa att det gällde allt men sen bara hälften??? 😡 #flyttfiasko',
      author: '@StockholmMamma',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      engagement: { likes: 89, comments: 34, shares: 12 },
      sentiment: 'negative',
      relevance: 88,
      tags: ['rut-avdrag', 'trust-issue', 'competitor-fail'],
      actionable: {
        insight: 'Kunder förvirrade om RUT-avdrag omfattning',
        recommendation: 'Tydligare RUT-kommunikation i alla annonser',
        priority: 'high'
      }
    },
    {
      id: '3',
      platform: 'reddit',
      type: 'question',
      content: 'Anyone know good PPC strategies for moving companies in winter? My conversions drop 40% Dec-Feb every year.',
      author: 'u/DigitalMarketerSthlm',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      engagement: { likes: 67, comments: 19, shares: 3 },
      sentiment: 'neutral',
      relevance: 92,
      tags: ['seasonal', 'winter-strategy', 'conversion-optimization'],
      actionable: {
        insight: 'Vinter-konverteringar är branschutmaning',
        recommendation: 'Lansera "Vinter-flytt garanti" kampanj',
        priority: 'medium'
      }
    },
    {
      id: '4',
      platform: 'twitter',
      type: 'trend',
      content: 'Google just updated their moving services ads policy. Now requiring insurance verification for all ads. This will kill small competitors 🎯',
      author: '@PPCInsiderEU',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      engagement: { likes: 234, comments: 45, shares: 67 },
      sentiment: 'positive',
      relevance: 98,
      tags: ['policy-update', 'competitive-advantage', 'google-ads'],
      actionable: {
        insight: 'Ny Google policy ger konkurrensfördel',
        recommendation: 'Framhäv försäkring i alla annonser NU',
        priority: 'high'
      }
    }
  ]);

  const [expertProfiles] = useState<ExpertProfile[]>([
    {
      username: 'PPCexpertSE',
      platform: 'Reddit',
      expertise: ['Local SEO', 'Service businesses', 'Swedish market'],
      trustScore: 94,
      totalInsights: 234,
      successfulTips: 189
    },
    {
      username: 'DigitalNomadSthlm',
      platform: 'Twitter',
      expertise: ['Google Ads', 'Facebook Ads', 'E-commerce'],
      trustScore: 87,
      totalInsights: 456,
      successfulTips: 312
    },
    {
      username: 'MovingIndustryPro',
      platform: 'Reddit',
      expertise: ['Moving industry', 'Customer psychology', 'Pricing'],
      trustScore: 91,
      totalInsights: 123,
      successfulTips: 98
    }
  ]);

  const [trendAnalysis] = useState<TrendAnalysis[]>([
    {
      topic: 'RUT-avdrag förvirring',
      momentum: 85,
      sentiment: 'negative',
      volumeChange: 156,
      topPosts: ['Hur fungerar RUT egentligen?', 'Flyttfirma lurade mig på RUT'],
      opportunity: 'Skapa tydlig RUT-kalkylator och dominera sökningen'
    },
    {
      topic: 'Pianoflytt Stockholm',
      momentum: 72,
      sentiment: 'positive',
      volumeChange: 89,
      topPosts: ['Best piano movers Stockholm?', 'Steinway transport tips'],
      opportunity: 'Nisch-kampanj för pianoflytt med premium pricing'
    },
    {
      topic: 'Student-flytt sommar',
      momentum: 64,
      sentiment: 'mixed',
      volumeChange: 234,
      topPosts: ['Billig flytt för studenter?', 'CSN-vänlig flyttfirma'],
      opportunity: 'Studentkampanj med flexibel betalning'
    }
  ]);

  const [customerPainPoints] = useState<CustomerPainPoint[]>([
    {
      issue: 'Otydliga priser',
      frequency: 145,
      severity: 'high',
      platforms: ['Reddit', 'Twitter', 'Facebook'],
      suggestedAction: 'Implementera transparent priskalkylator i annonser',
      examples: [
        'Flyttfirman sa 5000 kr, blev 12000 kr',
        'Dolda avgifter överallt!'
      ]
    },
    {
      issue: 'Dålig kommunikation',
      frequency: 98,
      severity: 'medium',
      platforms: ['Twitter', 'Trustpilot'],
      suggestedAction: 'SMS-uppdateringar var 30:e minut på flyttdagen',
      examples: [
        'Kom 3 timmar sent utan att meddela',
        'Svarar aldrig på mejl'
      ]
    },
    {
      issue: 'Försäkringstvivel',
      frequency: 67,
      severity: 'medium',
      platforms: ['Reddit', 'Facebook groups'],
      suggestedAction: 'Försäkringsbevis direkt i annons + landningssida',
      examples: [
        'Är de verkligen försäkrade?',
        'Vad täcker försäkringen egentligen?'
      ]
    }
  ]);

  // Simulate continuous learning
  useEffect(() => {
    if (autoLearn) {
      const interval = setInterval(() => {
        performLearning();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoLearn]);

  const performLearning = () => {
    setIsLearning(true);

    setTimeout(() => {
      // Simulate finding new insight
      const newInsight: SocialInsight = {
        id: Date.now().toString(),
        platform: Math.random() > 0.5 ? 'reddit' : 'twitter',
        type: ['tip', 'complaint', 'question', 'trend'][Math.floor(Math.random() * 4)] as any,
        content: 'Ny insight från sociala medier...',
        author: '@NewUser',
        timestamp: new Date(),
        engagement: {
          likes: Math.floor(Math.random() * 200),
          comments: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 20)
        },
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
        relevance: 70 + Math.floor(Math.random() * 30),
        tags: ['new-insight']
      };

      setSocialInsights(prev => [newInsight, ...prev.slice(0, 19)]);
      setIsLearning(false);
    }, 3000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="h-4 w-4" />;
      case 'complaint': return <ThumbsDown className="h-4 w-4" />;
      case 'question': return <MessageCircle className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredInsights = selectedFilter === 'all' 
    ? socialInsights 
    : socialInsights.filter(i => i.type === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Brain className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Expert Learning System</CardTitle>
                <CardDescription>
                  AI-driven kunskapsinhämtning från Reddit, Twitter & branschexperter
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={autoLearn ? 'default' : 'outline'}
                onClick={() => setAutoLearn(!autoLearn)}
              >
                {autoLearn ? (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Auto-learning PÅ
                  </>
                ) : (
                  'Manuellt läge'
                )}
              </Button>
              <Button onClick={performLearning} disabled={isLearning}>
                {isLearning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Lär sig...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Lär nu
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Insights idag</p>
              <p className="text-2xl font-bold">47</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Actionable</p>
              <p className="text-2xl font-bold text-green-600">23</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Experts tracked</p>
              <p className="text-2xl font-bold">{expertProfiles.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Avg relevance</p>
              <p className="text-2xl font-bold">89%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Social Insights</TabsTrigger>
          <TabsTrigger value="trends">Trendanalys</TabsTrigger>
          <TabsTrigger value="pain-points">Kundproblem</TabsTrigger>
          <TabsTrigger value="experts">Experter</TabsTrigger>
        </TabsList>

        {/* Social Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('all')}
            >
              Alla
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === 'tip' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('tip')}
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Tips
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === 'complaint' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('complaint')}
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
              Klagomål
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === 'trend' ? 'default' : 'outline'}
              onClick={() => setSelectedFilter('trend')}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Trender
            </Button>
          </div>

          {filteredInsights.map((insight) => (
            <Card key={insight.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getSentimentColor(insight.sentiment)}`}>
                      {getTypeIcon(insight.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {insight.platform === 'reddit' ? 'Reddit' : 'Twitter'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {insight.author} • {insight.timestamp.toLocaleTimeString('sv-SE')}
                        </span>
                      </div>
                      <p className="text-gray-800">{insight.content}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-indigo-100 text-indigo-800">
                      {insight.relevance}% relevant
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Engagement Metrics */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {insight.engagement.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {insight.engagement.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Twitter className="h-3 w-3" />
                    {insight.engagement.shares}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {insight.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Actionable Insight */}
                {insight.actionable && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI-rekommendation
                      </h4>
                      <Badge className={
                        insight.actionable.priority === 'high' ? 'bg-red-100 text-red-800' :
                        insight.actionable.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {insight.actionable.priority} prio
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-800 font-medium">
                      {insight.actionable.insight}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      → {insight.actionable.recommendation}
                    </p>
                    <Button size="sm" className="mt-3">
                      <Zap className="h-3 w-3 mr-1" />
                      Implementera
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {trendAnalysis.map((trend, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Hash className="h-5 w-5 text-blue-600" />
                      {trend.topic}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={getSentimentColor(trend.sentiment)}>
                        {trend.sentiment}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        +{trend.volumeChange}% volymökning
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">{trend.momentum}</p>
                    <p className="text-sm text-gray-600">Momentum</p>
                  </div>
                </div>

                {/* Trend Progress */}
                <Progress value={trend.momentum} className="h-2 mb-4" />

                {/* Top Posts */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Populära inlägg:</p>
                  <div className="space-y-1">
                    {trend.topPosts.map((post, idx) => (
                      <p key={idx} className="text-sm text-gray-600 pl-4">
                        • {post}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Opportunity */}
                {trend.opportunity && (
                  <Alert className="bg-green-50 border-green-200">
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Möjlighet:</strong> {trend.opportunity}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Pain Points Tab */}
        <TabsContent value="pain-points" className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Kundinsikter:</strong> Verkliga problem från 1000+ sociala inlägg 
              analyserade av AI för att förbättra våra annonser.
            </AlertDescription>
          </Alert>

          {customerPainPoints.map((painPoint, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{painPoint.issue}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      painPoint.severity === 'high' ? 'bg-red-100 text-red-800' :
                      painPoint.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {painPoint.severity} severity
                    </Badge>
                    <Badge variant="outline">
                      {painPoint.frequency} omnämnanden
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Exempel från kunder:</p>
                    <div className="space-y-1">
                      {painPoint.examples.map((example, idx) => (
                        <p key={idx} className="text-sm text-gray-600 italic pl-4">
                          "{example}"
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Plattformar:</span>
                    {painPoint.platforms.map((platform, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Rekommenderad åtgärd:
                    </p>
                    <p className="text-sm text-blue-800">{painPoint.suggestedAction}</p>
                  </div>

                  <Button size="sm" className="w-full">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Åtgärda i nästa kampanj
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Experts Tab */}
        <TabsContent value="experts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expertProfiles.map((expert, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {expert.username}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{expert.platform}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{expert.trustScore}%</p>
                      <p className="text-xs text-gray-600">Trust score</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Expertområden:</p>
                      <div className="flex flex-wrap gap-1">
                        {expert.expertise.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Total insights</p>
                        <p className="font-bold">{expert.totalInsights}</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Lyckade tips</p>
                        <p className="font-bold text-green-600">{expert.successfulTips}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Badge className="bg-green-100 text-green-800">
                        <Award className="h-3 w-3 mr-1" />
                        Verifierad expert
                      </Badge>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Se historik
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Learning Status
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Systemet lär sig kontinuerligt från experter och implementerar framgångsrika strategier
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-900">147</p>
                  <p className="text-sm text-gray-600">Strategier implementerade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpertLearningSystem;