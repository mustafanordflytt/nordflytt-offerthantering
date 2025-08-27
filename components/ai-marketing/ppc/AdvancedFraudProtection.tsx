'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield,
  AlertTriangle,
  Ban,
  Eye,
  Activity,
  TrendingUp,
  DollarSign,
  Users,
  MapPin,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Info,
  ShieldCheck,
  Siren,
  Target,
  Brain
} from 'lucide-react';

interface CompetitorAttack {
  id: string;
  competitor: string;
  ipAddress: string;
  clickCount: number;
  estimatedDamage: number;
  detectedAt: Date;
  status: 'blocked' | 'monitoring' | 'analyzing';
  confidence: number;
  evidence: string[];
}

interface FraudMetrics {
  totalSaved: number;
  threatsBlocked: number;
  activeMonitoring: number;
  protectionEfficiency: number;
  competitorActivity: 'low' | 'medium' | 'high' | 'critical';
}

const AdvancedFraudProtection: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [fraudMetrics, setFraudMetrics] = useState<FraudMetrics>({
    totalSaved: 45670,
    threatsBlocked: 234,
    activeMonitoring: 12,
    protectionEfficiency: 98.2,
    competitorActivity: 'medium'
  });

  const [recentAttacks, setRecentAttacks] = useState<CompetitorAttack[]>([
    {
      id: '1',
      competitor: 'MovingStockholm',
      ipAddress: '194.68.123.45',
      clickCount: 47,
      estimatedDamage: 3525,
      detectedAt: new Date(Date.now() - 30 * 60 * 1000),
      status: 'blocked',
      confidence: 99,
      evidence: ['Known competitor IP', 'Rapid clicking pattern', 'No mouse movement', 'Same user agent']
    },
    {
      id: '2',
      competitor: 'StockholmMove',
      ipAddress: '193.12.67.89',
      clickCount: 23,
      estimatedDamage: 1725,
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'monitoring',
      confidence: 87,
      evidence: ['Suspicious pattern', 'Office hours clicking', 'Geographic match']
    }
  ]);

  const [legalEvidence, setLegalEvidence] = useState({
    totalIncidents: 847,
    documentedDamage: 423500,
    readyForLegal: true,
    lastCompiled: new Date()
  });

  // Real-time scanning animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 2000);
      
      // Simulate finding new threats
      if (Math.random() > 0.7) {
        const newThreat: CompetitorAttack = {
          id: Date.now().toString(),
          competitor: Math.random() > 0.5 ? 'MovingStockholm' : 'StockholmMove',
          ipAddress: `194.68.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          clickCount: Math.floor(Math.random() * 50) + 10,
          estimatedDamage: Math.floor(Math.random() * 3000) + 500,
          detectedAt: new Date(),
          status: 'analyzing',
          confidence: Math.floor(Math.random() * 20) + 80,
          evidence: ['Pattern matching', 'IP reputation', 'Click velocity']
        };
        
        setRecentAttacks(prev => [newThreat, ...prev.slice(0, 4)]);
        setFraudMetrics(prev => ({
          ...prev,
          threatsBlocked: prev.threatsBlocked + 1,
          totalSaved: prev.totalSaved + newThreat.estimatedDamage
        }));
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'blocked': return <Ban className="h-4 w-4 text-red-600" />;
      case 'monitoring': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'analyzing': return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleBlockAll = () => {
    setRecentAttacks(prev => 
      prev.map(attack => ({ ...attack, status: 'blocked' }))
    );
  };

  const handleCompileLegalEvidence = () => {
    // In production, this would generate a legal document
    alert('Legal evidence package compiled and ready for download');
  };

  return (
    <div className="space-y-6">
      {/* Main Protection Status */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI Bedrägeri-skydd</CardTitle>
                <CardDescription>
                  Realtidsövervakning av alla klick och konkurrentaktivitet
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-900">{formatCurrency(fraudMetrics.totalSaved)}</p>
              <p className="text-sm text-blue-700">sparat denna månad</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Protection Efficiency */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Skyddseffektivitet</span>
              <span className="text-sm font-bold">{fraudMetrics.protectionEfficiency}%</span>
            </div>
            <Progress value={fraudMetrics.protectionEfficiency} className="h-3" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hot blockerade</p>
                  <p className="text-2xl font-bold">{fraudMetrics.threatsBlocked}</p>
                </div>
                <Ban className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktiv övervakning</p>
                  <p className="text-2xl font-bold">{fraudMetrics.activeMonitoring}</p>
                </div>
                <Eye className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Konkurrentaktivitet</p>
                  <Badge className={`${getActivityColor(fraudMetrics.competitorActivity)} mt-1`}>
                    {fraudMetrics.competitorActivity.toUpperCase()}
                  </Badge>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Legal evidence</p>
                  <p className="text-2xl font-bold">{legalEvidence.totalIncidents}</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Threat Detection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-red-600" />
              Realtids hotdetektering
              {isScanning && (
                <Badge variant="outline" className="animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Skannar...
                </Badge>
              )}
            </CardTitle>
            <Button 
              variant="destructive"
              onClick={handleBlockAll}
            >
              <Ban className="h-4 w-4 mr-2" />
              Blockera alla hot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttacks.map((attack) => (
              <div 
                key={attack.id}
                className={`border rounded-lg p-4 transition-all ${
                  attack.status === 'blocked' ? 'bg-red-50 border-red-200' :
                  attack.status === 'monitoring' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200 animate-pulse'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(attack.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{attack.competitor}</h4>
                        <Badge variant="outline" className="text-xs">
                          {attack.confidence}% säkerhet
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        IP: {attack.ipAddress} • {attack.clickCount} klick • {formatCurrency(attack.estimatedDamage)} skada
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {attack.evidence.map((evidence, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {evidence}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(attack.detectedAt).toLocaleTimeString('sv-SE')}
                    </p>
                    {attack.status === 'analyzing' && (
                      <Button size="sm" variant="outline" className="mt-2">
                        <Ban className="h-3 w-3 mr-1" />
                        Blockera
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Konkurrentintelligens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">MovingStockholm</h4>
                  <Badge className="bg-red-100 text-red-800">Högriskkärrent</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Kända IP-ranges:</span>
                    <p className="font-mono">194.68.x.x, 185.45.x.x</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Attack-mönster:</span>
                    <p>Fredagar 14-17</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total skada:</span>
                    <p className="font-semibold text-red-600">{formatCurrency(267000)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p>Under juridisk granskning</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">StockholmMove</h4>
                  <Badge className="bg-yellow-100 text-yellow-800">Mediumrisk</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Kända IP-ranges:</span>
                    <p className="font-mono">193.12.x.x</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Attack-mönster:</span>
                    <p>Bot-liknande klick</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total skada:</span>
                    <p className="font-semibold text-orange-600">{formatCurrency(156500)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p>Övervakas aktivt</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Action Center */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Juridisk åtgärdscenter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>Redo för juridisk åtgärd!</strong><br />
                  {legalEvidence.totalIncidents} dokumenterade incidenter med {formatCurrency(legalEvidence.documentedDamage)} i bevisad skada.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">IP-loggar</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Klickmönster-analys</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Ekonomisk skada beräknad</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Konkurrentverifiering</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>

              <Button 
                className="w-full"
                onClick={handleCompileLegalEvidence}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Kompilera juridiskt bevispaket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedFraudProtection;