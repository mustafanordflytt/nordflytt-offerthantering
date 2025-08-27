'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Lock,
  Calendar,
  User,
  Globe,
  DollarSign,
  BarChart3,
  Fingerprint,
  Camera,
  Hash,
  Clock,
  Gavel,
  Database,
  Zap,
  XCircle
} from 'lucide-react';

interface FraudEvidence {
  id: string;
  type: 'click_fraud' | 'competitor_attack' | 'bot_traffic' | 'policy_violation';
  perpetrator: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  clickPattern: string;
  estimatedDamage: number;
  evidence: {
    screenshots: string[];
    logs: string[];
    patterns: string[];
  };
  legalStatus: 'documented' | 'verified' | 'submitted' | 'accepted';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface LegalCase {
  id: string;
  competitor: string;
  totalDamage: number;
  evidenceCount: number;
  startDate: Date;
  status: 'building' | 'ready' | 'submitted' | 'in_progress' | 'won';
  strength: number; // 0-100
  recommendedAction: string;
}

interface ComplianceCheck {
  area: string;
  status: 'compliant' | 'warning' | 'violation';
  lastChecked: Date;
  details: string;
  action?: string;
}

const LegalEvidenceCompilation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('evidence');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  const [fraudEvidence] = useState<FraudEvidence[]>([
    {
      id: '1',
      type: 'click_fraud',
      perpetrator: 'MovingStockholm (suspected)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: '194.68.123.45',
      userAgent: 'Mozilla/5.0 (automated)',
      clickPattern: '47 clicks in 3 minutes, no conversions',
      estimatedDamage: 2350,
      evidence: {
        screenshots: ['fraud-1.png', 'fraud-2.png'],
        logs: ['server-log-2024-11-15.txt'],
        patterns: ['Repeated clicks on "Pianoflytt Östermalm"', 'Always between 15:00-16:00 Fridays']
      },
      legalStatus: 'verified',
      severity: 'high'
    },
    {
      id: '2',
      type: 'competitor_attack',
      perpetrator: 'StockholmMove AB',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      ipAddress: '185.45.67.89',
      userAgent: 'Chrome/119.0 (Windows NT)',
      clickPattern: 'Systematic budget draining on high-value keywords',
      estimatedDamage: 8900,
      evidence: {
        screenshots: ['attack-evidence-1.png', 'attack-evidence-2.png', 'attack-evidence-3.png'],
        logs: ['detailed-click-log.csv', 'ip-trace.txt'],
        patterns: ['Targets our top 5 keywords', 'Stops when daily budget hits 80%', 'Uses rotating IPs from same subnet']
      },
      legalStatus: 'documented',
      severity: 'critical'
    },
    {
      id: '3',
      type: 'bot_traffic',
      perpetrator: 'Unknown (Eastern Europe)',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      ipAddress: '92.114.XX.XX',
      userAgent: 'Python-urllib/3.9',
      clickPattern: 'Automated script clicking ads',
      estimatedDamage: 3200,
      evidence: {
        screenshots: ['bot-pattern.png'],
        logs: ['bot-detection.log'],
        patterns: ['1-second intervals', 'No mouse movement', 'Direct traffic only']
      },
      legalStatus: 'documented',
      severity: 'medium'
    }
  ]);

  const [legalCases] = useState<LegalCase[]>([
    {
      id: 'CASE-2024-001',
      competitor: 'MovingStockholm',
      totalDamage: 156000,
      evidenceCount: 234,
      startDate: new Date('2024-01-15'),
      status: 'ready',
      strength: 92,
      recommendedAction: 'File formal complaint with Google & initiate legal proceedings'
    },
    {
      id: 'CASE-2024-002',
      competitor: 'StockholmMove AB',
      totalDamage: 89000,
      evidenceCount: 145,
      startDate: new Date('2024-03-22'),
      status: 'building',
      strength: 78,
      recommendedAction: 'Continue evidence collection for 30 more days'
    },
    {
      id: 'CASE-2023-012',
      competitor: 'Nordic Movers',
      totalDamage: 234000,
      evidenceCount: 456,
      startDate: new Date('2023-08-10'),
      status: 'won',
      strength: 98,
      recommendedAction: 'Case won - 180,000 SEK compensation received'
    }
  ]);

  const [complianceChecks] = useState<ComplianceCheck[]>([
    {
      area: 'Google Ads Policies',
      status: 'compliant',
      lastChecked: new Date(),
      details: 'All ads comply with current policies including insurance verification'
    },
    {
      area: 'GDPR Data Collection',
      status: 'compliant',
      lastChecked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      details: 'Cookie consent and data handling fully compliant'
    },
    {
      area: 'RUT-avdrag Claims',
      status: 'warning',
      lastChecked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      details: 'Some ads need updated RUT percentage after new regulations',
      action: 'Update 3 campaigns with new 50% RUT limit'
    },
    {
      area: 'Competitor Comparison Claims',
      status: 'compliant',
      lastChecked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      details: 'All comparative advertising follows Swedish marketing law'
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'violation': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleGenerateReport = (caseId: string) => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      alert(`Legal report for ${caseId} generated and ready for download!`);
    }, 3000);
  };

  const handleSubmitEvidence = (evidenceId: string) => {
    alert(`Evidence ${evidenceId} submitted to legal team and platform providers.`);
  };

  const totalDamage = fraudEvidence.reduce((sum, e) => sum + e.estimatedDamage, 0);
  const verifiedEvidence = fraudEvidence.filter(e => e.legalStatus === 'verified').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 rounded-full">
                <Shield className="h-8 w-8 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Legal Evidence & Compliance Center</CardTitle>
                <CardDescription>
                  Dokumentation av bedrägeri och regelefterlevnad för rättsliga åtgärder
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total dokumenterad skada</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDamage)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Bevisfall</p>
              <p className="text-2xl font-bold">{fraudEvidence.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Verifierade</p>
              <p className="text-2xl font-bold text-green-600">{verifiedEvidence}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Aktiva ärenden</p>
              <p className="text-2xl font-bold">{legalCases.filter(c => c.status !== 'won').length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Vunna fall</p>
              <p className="text-2xl font-bold text-green-600">
                {legalCases.filter(c => c.status === 'won').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evidence">Bedrägeri-bevis</TabsTrigger>
          <TabsTrigger value="cases">Rättsfall</TabsTrigger>
          <TabsTrigger value="compliance">Regelefterlevnad</TabsTrigger>
          <TabsTrigger value="tools">Verktyg</TabsTrigger>
        </TabsList>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-4">
          {fraudEvidence.map((evidence) => (
            <Card key={evidence.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded">
                      {evidence.type === 'click_fraud' ? <XCircle className="h-5 w-5 text-red-600" /> :
                       evidence.type === 'competitor_attack' ? <AlertTriangle className="h-5 w-5 text-red-600" /> :
                       <Shield className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{evidence.perpetrator}</h3>
                      <p className="text-sm text-gray-600">
                        {evidence.timestamp.toLocaleString('sv-SE')} • {evidence.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(evidence.severity)}>
                      {evidence.severity}
                    </Badge>
                    <Badge variant="outline">
                      {evidence.legalStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Technical Details */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium mb-1">IP Address:</p>
                    <p className="text-sm font-mono">{evidence.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">User Agent:</p>
                    <p className="text-sm font-mono truncate">{evidence.userAgent}</p>
                  </div>
                </div>

                {/* Click Pattern */}
                <div className="p-3 bg-red-50 rounded">
                  <p className="text-sm font-medium text-red-900 mb-1">Klickmönster:</p>
                  <p className="text-sm text-red-800">{evidence.clickPattern}</p>
                </div>

                {/* Evidence Files */}
                <div>
                  <p className="text-sm font-medium mb-2">Bevismaterial:</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Screenshots ({evidence.evidence.screenshots.length})</p>
                      <div className="space-y-1">
                        {evidence.evidence.screenshots.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            <span className="text-xs truncate">{file}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Loggar ({evidence.evidence.logs.length})</p>
                      <div className="space-y-1">
                        {evidence.evidence.logs.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span className="text-xs truncate">{file}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Mönster ({evidence.evidence.patterns.length})</p>
                      <div className="space-y-1">
                        {evidence.evidence.patterns.slice(0, 2).map((pattern, idx) => (
                          <p key={idx} className="text-xs">{pattern}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Impact */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <span className="font-medium">Uppskattat skada:</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(evidence.estimatedDamage)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Visa detaljer
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Ladda ner bevis
                  </Button>
                  {evidence.legalStatus === 'verified' && (
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleSubmitEvidence(evidence.id)}
                    >
                      <Gavel className="h-3 w-3 mr-1" />
                      Skicka till rättsfall
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          {legalCases.map((legalCase) => (
            <Card key={legalCase.id} className={
              legalCase.status === 'won' ? 'border-green-200 bg-green-50' : ''
            }>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gavel className="h-5 w-5" />
                      {legalCase.id}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      vs. {legalCase.competitor} • Startad {legalCase.startDate.toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <Badge className={
                    legalCase.status === 'won' ? 'bg-green-100 text-green-800' :
                    legalCase.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                    legalCase.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {legalCase.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Case Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600">Total skada</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(legalCase.totalDamage)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600">Bevis</p>
                    <p className="text-xl font-bold">{legalCase.evidenceCount}</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600">Styrka</p>
                    <p className="text-xl font-bold text-green-600">{legalCase.strength}%</p>
                  </div>
                </div>

                {/* Case Strength */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ärendets styrka</span>
                    <span className="font-medium">{legalCase.strength}%</span>
                  </div>
                  <Progress value={legalCase.strength} className="h-3" />
                </div>

                {/* Recommendation */}
                <Alert className={
                  legalCase.status === 'won' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Rekommendation:</strong> {legalCase.recommendedAction}
                  </AlertDescription>
                </Alert>

                {/* Actions */}
                {legalCase.status !== 'won' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGenerateReport(legalCase.id)}
                      disabled={isGeneratingReport}
                    >
                      {isGeneratingReport ? (
                        <>
                          <Database className="h-3 w-3 mr-1 animate-pulse" />
                          Genererar...
                        </>
                      ) : (
                        <>
                          <FileText className="h-3 w-3 mr-1" />
                          Generera rapport
                        </>
                      )}
                    </Button>
                    {legalCase.status === 'ready' && (
                      <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                        <Gavel className="h-3 w-3 mr-1" />
                        Inled rättsprocess
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Success Story */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Framgångshistorik
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    3 vunna fall, totalt återvunnet: {formatCurrency(580000)}
                  </p>
                </div>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Visa alla fall
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200 mb-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatisk övervakning:</strong> AI-systemet kontrollerar kontinuerligt 
              att alla kampanjer följer gällande regler och policies.
            </AlertDescription>
          </Alert>

          {complianceChecks.map((check, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(check.status)}`}>
                      {check.status === 'compliant' ? <CheckCircle className="h-5 w-5" /> :
                       check.status === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                       <XCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold">{check.area}</h4>
                      <p className="text-sm text-gray-600">
                        Senast kontrollerad: {check.lastChecked.toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(check.status)}>
                    {check.status}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 mb-3">{check.details}</p>

                {check.action && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Åtgärd krävs:</strong> {check.action}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Visa detaljer
                  </Button>
                  {check.status === 'warning' && (
                    <Button size="sm">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Åtgärda nu
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  IP & Click Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Avancerad AI som identifierar och dokumenterar misstänkta klickmönster
                  med rättslig bevisstyrka.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Blockchain-verifierad tidsstämpel</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Screenshot med metadata</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Automatisk pattern recognition</span>
                  </div>
                </div>
                <Button className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Aktivera övervakning
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Legal Report Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Generera professionella rättsliga rapporter färdiga för advokater
                  och domstolar.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Svensk & engelsk version</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Inkluderar alla bevis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Juridiskt granskad mall</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Skapa rapport
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Evidence Vault
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Säker lagring av alla bevis med kryptering och versionshantering
                  för rättslig integritet.
                </p>
                <div className="grid grid-cols-2 gap-3 text-center mb-4">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold">847</p>
                    <p className="text-xs text-gray-600">Lagrade bevis</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold">2.3GB</p>
                    <p className="text-xs text-gray-600">Total storlek</p>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Öppna valv
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Compliance Scanner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Skannar alla aktiva kampanjer mot senaste regler från Google,
                  Meta och svenska lagar.
                </p>
                <div className="space-y-2 mb-4">
                  <Progress value={78} className="h-2" />
                  <p className="text-xs text-gray-600 text-center">
                    Senaste skanning: 78% klar
                  </p>
                </div>
                <Button className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Kör full skanning
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contact */}
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Juridisk jour:</strong> Vid akut bedrägeri, kontakta vår advokat 
              på +46 8 123 456 (24/7) • juridik@nordflytt.se
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalEvidenceCompilation;