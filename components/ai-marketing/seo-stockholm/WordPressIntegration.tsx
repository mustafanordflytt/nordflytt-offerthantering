'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Settings,
  Rocket,
  Activity,
  Code,
  Sparkles,
  Link,
  Loader2,
  Play,
  Pause,
  Eye,
  Edit,
  Upload,
  Download,
  ChevronRight,
  Terminal,
  Gauge,
  TrendingUp
} from 'lucide-react';

interface WordPressSite {
  id: string;
  url: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: Date;
  pages: number;
  posts: number;
  optimizationScore: number;
  autoOptimize: boolean;
  sslEnabled: boolean;
}

interface OptimizationTask {
  id: string;
  type: 'meta' | 'content' | 'schema' | 'speed' | 'image';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedRevenue: number;
  timeToComplete: string;
}

const WordPressIntegration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  
  // Mock connected site
  const [connectedSite, setConnectedSite] = useState<WordPressSite | null>({
    id: '1',
    url: 'https://nordflytt.se',
    name: 'Nordflytt Huvudsajt',
    status: 'connected',
    lastSync: new Date(),
    pages: 23,
    posts: 145,
    optimizationScore: 78,
    autoOptimize: true,
    sslEnabled: true
  });

  const [optimizationTasks, setOptimizationTasks] = useState<OptimizationTask[]>([
    {
      id: '1',
      type: 'meta',
      title: 'Optimera meta-beskrivningar för 12 sidor',
      description: 'AI-genererade beskrivningar som ökar klickfrekvensen med 35%',
      impact: 'high',
      status: 'pending',
      estimatedRevenue: 45000,
      timeToComplete: '15 min'
    },
    {
      id: '2',
      type: 'schema',
      title: 'Lägg till LocalBusiness schema',
      description: 'Hjälper Google förstå er verksamhet bättre',
      impact: 'high',
      status: 'pending',
      estimatedRevenue: 25000,
      timeToComplete: '5 min'
    },
    {
      id: '3',
      type: 'content',
      title: 'Uppdatera innehåll på "Flytthjälp Stockholm"',
      description: 'Lägg till områdesspecifikt innehåll för bättre lokal ranking',
      impact: 'medium',
      status: 'completed',
      estimatedRevenue: 18000,
      timeToComplete: '20 min'
    },
    {
      id: '4',
      type: 'speed',
      title: 'Optimera bildstorlekar',
      description: '23 bilder kan komprimeras för 2.3s snabbare laddning',
      impact: 'medium',
      status: 'pending',
      estimatedRevenue: 12000,
      timeToComplete: '10 min'
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

  const getTaskIcon = (type: OptimizationTask['type']) => {
    switch (type) {
      case 'meta': return <Edit className="h-4 w-4" />;
      case 'content': return <Code className="h-4 w-4" />;
      case 'schema': return <Terminal className="h-4 w-4" />;
      case 'speed': return <Gauge className="h-4 w-4" />;
      case 'image': return <Upload className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: OptimizationTask['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Klart</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">Pågår</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Väntar</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Misslyckades</Badge>;
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    // Simulate API connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    setShowApiSetup(false);
    setLoading(false);
  };

  const handleOptimize = async (taskId: string) => {
    setOptimizationTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'in_progress' }
          : task
      )
    );

    // Simulate optimization
    await new Promise(resolve => setTimeout(resolve, 3000));

    setOptimizationTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed' }
          : task
      )
    );
  };

  const totalRevenuePotential = optimizationTasks
    .filter(task => task.status === 'pending')
    .reduce((sum, task) => sum + task.estimatedRevenue, 0);

  if (!connectedSite || showApiSetup) {
    return (
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Anslut WordPress
          </CardTitle>
          <CardDescription>
            Få automatiska SEO-förbättringar direkt på er hemsida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-medium mb-4">Vad ingår?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Automatisk innehållsoptimering</p>
                    <p className="text-sm text-gray-600">AI skriver om texter för bättre ranking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Realtidsövervakning</p>
                    <p className="text-sm text-gray-600">Se förändringar direkt när de händer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Säker anslutning</p>
                    <p className="text-sm text-gray-600">Ingen påverkan på sajthastighet</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="siteUrl">WordPress URL</Label>
                <Input 
                  id="siteUrl"
                  placeholder="https://nordflytt.se"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="apiKey">API-nyckel (valfritt)</Label>
                <Input 
                  id="apiKey"
                  type="password"
                  placeholder="wp_xxxxxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Lämna tom för att använda WordPress.com OAuth
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleConnect}
                disabled={!siteUrl || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ansluter...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Anslut WordPress
                  </>
                )}
              </Button>
              {connectedSite && (
                <Button variant="outline" onClick={() => setShowApiSetup(false)}>
                  Avbryt
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Site Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                {connectedSite.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Ansluten
                </span>
                • Senast synkad: {new Date(connectedSite.lastSync).toLocaleString('sv-SE')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowApiSetup(true)}>
                <Settings className="h-4 w-4 mr-1" />
                Inställningar
              </Button>
              <Button 
                variant={autoMode ? "default" : "outline"} 
                size="sm"
                onClick={() => setAutoMode(!autoMode)}
              >
                {autoMode ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pausad auto
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Aktivera auto
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Optimeringspoäng</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-bold">{connectedSite.optimizationScore}%</p>
                <TrendingUp className="h-5 w-5 text-green-600 mb-1" />
              </div>
              <Progress value={connectedSite.optimizationScore} className="mt-2" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Sidor</p>
              <p className="text-2xl font-bold mt-1">{connectedSite.pages}</p>
              <p className="text-xs text-green-600">Alla indexerade</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Blogginlägg</p>
              <p className="text-2xl font-bold mt-1">{connectedSite.posts}</p>
              <p className="text-xs text-gray-600">12 behöver uppdatering</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Intäktspotential</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenuePotential)}</p>
              <p className="text-xs text-green-600">+15% denna månad</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Optimization Alert */}
      {autoMode && (
        <Alert className="border-green-200 bg-green-50">
          <Zap className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium">Automatisk optimering aktiv</span>
              <p className="text-sm text-gray-600 mt-1">
                AI optimerar innehåll i realtid baserat på sökbeteende
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                3 optimeringar idag
              </Badge>
              <Button size="sm" variant="outline">
                Se logg
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Optimization Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            Optimeringsmöjligheter
          </CardTitle>
          <CardDescription>
            AI har identifierat {optimizationTasks.filter(t => t.status === 'pending').length} åtgärder värda {formatCurrency(totalRevenuePotential)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {optimizationTasks.map((task) => (
              <div 
                key={task.id} 
                className={`border rounded-lg p-4 transition-all ${
                  task.status === 'completed' ? 'bg-gray-50 opacity-75' : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      task.impact === 'high' ? 'bg-red-100' : 
                      task.impact === 'medium' ? 'bg-yellow-100' : 
                      'bg-gray-100'
                    }`}>
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.title}</h4>
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-green-600 font-medium">
                          +{formatCurrency(task.estimatedRevenue)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {task.timeToComplete}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={
                            task.impact === 'high' ? 'text-red-600 border-red-300' :
                            task.impact === 'medium' ? 'text-yellow-600 border-yellow-300' :
                            'text-gray-600 border-gray-300'
                          }
                        >
                          {task.impact === 'high' ? 'Hög påverkan' : 
                           task.impact === 'medium' ? 'Medel påverkan' : 
                           'Låg påverkan'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {task.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleOptimize(task.id)}
                      >
                        Optimera nu
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button size="sm" disabled>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Optimerar...
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Button size="sm" variant="outline" disabled>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Klart
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Optimera allt på en gång</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Spara tid genom att köra alla optimeringar automatiskt
                </p>
              </div>
              <Button>
                <Rocket className="h-4 w-4 mr-2" />
                Kör alla ({optimizationTasks.filter(t => t.status === 'pending').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Realtidsaktivitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Meta-beskrivning uppdaterad</p>
                <p className="text-xs text-gray-600">Sidan "Kontorsflytt Stockholm" - för 2 min sedan</p>
              </div>
              <Badge className="bg-green-100 text-green-800">+2.3% CTR</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Schema markup tillagt</p>
                <p className="text-xs text-gray-600">LocalBusiness för alla kontaktsidor - för 5 min sedan</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Synlighet +15%</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium">Analyserar innehåll</p>
                <p className="text-xs text-gray-600">AI letar efter optimeringmöjligheter...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WordPressIntegration;