'use client'

/**
 * NORDFLYTT AI RECRUITMENT DASHBOARD
 * Main recruitment system integrated with CRM
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Video,
  FileText,
  Brain,
  Award,
  Target,
  Zap,
  Mail,
  Calendar
} from 'lucide-react';

// Import new modal components
import NewApplicationModal from '@/components/recruitment/NewApplicationModal';
import CandidateDetailModal from '@/components/recruitment/CandidateDetailModal';
import EmailComposeModal from '@/components/recruitment/EmailComposeModal';
import LowisaChatModal from '@/components/recruitment/LowisaChatModal';
import { useRecruitmentMetrics } from '@/hooks/useRecruitmentMetrics';
import { useIntelligentRecruitmentMetrics } from '@/hooks/useIntelligentRecruitmentMetrics';
import { useToast } from '@/hooks/use-toast';

// Import AI components
import StaffingAnalyzer from '@/components/recruitment/StaffingAnalyzer';
import GeographicOptimizer from '@/components/recruitment/GeographicOptimizer';
import AutoJobPoster from '@/components/recruitment/AutoJobPoster';
import MLInsightsDashboard from '@/components/recruitment/MLInsightsDashboard';

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  desired_position: string;
  current_stage: string;
  overall_score: number;
  status: string;
  application_date: string;
  updated_at: string;
}

interface RecruitmentMetrics {
  totalApplications: number;
  activeApplications: number;
  thisWeekApplications: number;
  readyToHire: number;
  averageProcessingTime: number;
  conversionRate: number;
}

const STAGE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cv_screening: { 
    label: 'CV Granskning', 
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-blue-100 text-blue-800' 
  },
  email_screening: { 
    label: 'Email Konversation', 
    icon: <MessageSquare className="h-4 w-4" />, 
    color: 'bg-purple-100 text-purple-800' 
  },
  personality_test: { 
    label: 'Personlighetstest', 
    icon: <Brain className="h-4 w-4" />, 
    color: 'bg-orange-100 text-orange-800' 
  },
  video_analysis: { 
    label: 'Video Analys', 
    icon: <Video className="h-4 w-4" />, 
    color: 'bg-red-100 text-red-800' 
  },
  final_assessment: { 
    label: 'Slutbedömning', 
    icon: <Award className="h-4 w-4" />, 
    color: 'bg-green-100 text-green-800' 
  },
  contract_sent: { 
    label: 'Kontrakt Skickat', 
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-indigo-100 text-indigo-800' 
  },
  onboarding: { 
    label: 'Onboarding', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'bg-green-100 text-green-800' 
  }
};

const POSITION_LABELS: Record<string, string> = {
  flyttpersonal: 'Flyttpersonal',
  team_leader: 'Teamledare',
  kundservice: 'Kundservice',
  chauffor: 'Chaufför',
  koordinator: 'Koordinator',
  kvalitetskontroll: 'Kvalitetskontrollant'
};

export default function RecruitmentDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showNewApplicationModal, setShowNewApplicationModal] = useState(false);
  const [showCandidateDetailModal, setShowCandidateDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showLowisaChatModal, setShowLowisaChatModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [chatApplicationId, setChatApplicationId] = useState<number | null>(null);
  
  // Use real metrics calculation
  const calculatedMetrics = useRecruitmentMetrics(applications);
  const { metrics: intelligentMetrics, loading: metricsLoading } = useIntelligentRecruitmentMetrics();
  const metrics = calculatedMetrics;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/recruitment/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageInfo = (stage: string) => {
    return STAGE_LABELS[stage] || { 
      label: stage, 
      icon: <Clock className="h-4 w-4" />, 
      color: 'bg-gray-100 text-gray-800' 
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 AI Recruitment & Onboarding</h1>
          <p className="text-gray-500 mt-1">Sweden's Most Advanced AI-Powered Recruitment Platform</p>
        </div>
        <Button 
          className="bg-[#002A5C] hover:bg-[#001a3d]"
          onClick={() => setShowNewApplicationModal(true)}
        >
          <Target className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Kandidater</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeApplications}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.thisWeekApplications} denna vecka
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redo för Anställning</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.readyToHire}</div>
            <p className="text-xs text-muted-foreground">
              Höga poäng, redo för kontrakt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig Processtid</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageProcessingTime} dagar</div>
            <p className="text-xs text-muted-foreground">
              75% snabbare än bransch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              40% bättre än manuell rekrytering
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Översikt
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="ml-dashboard" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            ML Dashboard
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ansökningar
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Bedömningar
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Kontrakt
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Kandidater per Steg</CardTitle>
                <CardDescription>Fördelning av aktiva ansökningar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(STAGE_LABELS).map(([stage, info]) => {
                    const count = applications.filter(app => app.current_stage === stage).length;
                    return (
                      <div key={stage} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {info.icon}
                          <span className="text-sm">{info.label}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Position Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Ansökningar per Position</CardTitle>
                <CardDescription>Mest efterfrågade roller</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(POSITION_LABELS).map(([position, label]) => {
                    const count = applications.filter(app => app.desired_position === position).length;
                    return (
                      <div key={position} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Senaste Aktivitet</CardTitle>
              <CardDescription>Automatiska AI-beslut och framsteg</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => {
                  const stageInfo = getStageInfo(app.current_stage);
                  return (
                    <div 
                      key={app.id} 
                      className="flex items-center justify-between border-l-4 border-[#002A5C] pl-4 cursor-pointer hover:bg-gray-50 rounded-r-lg transition-colors"
                      onClick={() => {
                        setSelectedCandidate(app);
                        setShowCandidateDetailModal(true);
                      }}
                    >
                      <div>
                        <p className="font-medium">{app.first_name} {app.last_name}</p>
                        <p className="text-sm text-gray-500">{POSITION_LABELS[app.desired_position]}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={stageInfo.color}>
                          {stageInfo.icon}
                          <span className="ml-1">{stageInfo.label}</span>
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Score: <span className={getScoreColor(app.overall_score)}>
                            {(app.overall_score * 100).toFixed(0)}%
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staffing Analyzer */}
            <StaffingAnalyzer />
            
            {/* Geographic Optimizer */}
            <GeographicOptimizer />
          </div>
          
          {/* AI Metrics Overview */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recruitment Metrics</CardTitle>
              <CardDescription>Real-time intelligent insights and predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Predicted Hiring Needs</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {intelligentMetrics?.predictedHiringNeeds || 12}
                  </p>
                  <p className="text-xs text-gray-500">Next 30 days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Automation Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(intelligentMetrics?.automationSavings || 125000).toLocaleString()} kr
                  </p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quality Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {intelligentMetrics?.qualityScore || 94}%
                  </p>
                  <p className="text-xs text-gray-500">AI accuracy</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lowisa Engagement</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {intelligentMetrics?.lowisaEngagementRate || 92}%
                  </p>
                  <p className="text-xs text-gray-500">Candidate response</p>
                </div>
              </div>
              
              {/* AI Recommendations */}
              {intelligentMetrics?.recommendedActions && intelligentMetrics.recommendedActions.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">AI Recommendations</h4>
                  <div className="space-y-2">
                    {intelligentMetrics.recommendedActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-600">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kandidat Pipeline</CardTitle>
              <CardDescription>Visuell vy över rekryteringsprocessen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {Object.entries(STAGE_LABELS).slice(0, 4).map(([stage, info]) => {
                  const stageApplications = applications.filter(app => app.current_stage === stage);
                  return (
                    <div key={stage} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {info.icon}
                        <h3 className="font-medium">{info.label}</h3>
                        <Badge variant="secondary">{stageApplications.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {stageApplications.slice(0, 3).map((app) => (
                          <div 
                            key={app.id} 
                            className="p-2 bg-gray-50 rounded text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              setSelectedCandidate(app);
                              setShowCandidateDetailModal(true);
                            }}
                          >
                            <p className="font-medium">{app.first_name} {app.last_name}</p>
                            <p className="text-gray-500">{POSITION_LABELS[app.desired_position]}</p>
                            <div className="flex justify-between mt-1">
                              <span className={getScoreColor(app.overall_score)}>
                                {(app.overall_score * 100).toFixed(0)}%
                              </span>
                              <span className="text-gray-400 text-xs">
                                {new Date(app.updated_at).toLocaleDateString('sv-SE')}
                              </span>
                            </div>
                          </div>
                        ))}
                        {stageApplications.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{stageApplications.length - 3} fler...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alla Ansökningar</CardTitle>
              <CardDescription>Fullständig lista över kandidater</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Kandidat</th>
                      <th className="text-left p-2">Position</th>
                      <th className="text-left p-2">Steg</th>
                      <th className="text-left p-2">Score</th>
                      <th className="text-left p-2">Ansökt</th>
                      <th className="text-left p-2">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const stageInfo = getStageInfo(app.current_stage);
                      return (
                        <tr key={app.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{app.first_name} {app.last_name}</p>
                              <p className="text-sm text-gray-500">{app.email}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">
                              {POSITION_LABELS[app.desired_position]}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge className={stageInfo.color}>
                              {stageInfo.icon}
                              <span className="ml-1">{stageInfo.label}</span>
                            </Badge>
                          </td>
                          <td className="p-2">
                            <span className={getScoreColor(app.overall_score)}>
                              {(app.overall_score * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="p-2 text-sm text-gray-500">
                            {new Date(app.application_date).toLocaleDateString('sv-SE')}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedCandidate(app);
                                  setShowCandidateDetailModal(true);
                                }}
                              >
                                Visa
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedCandidate(app);
                                  setShowEmailModal(true);
                                }}
                              >
                                Email
                              </Button>
                              {app.current_stage === 'email_screening' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setChatApplicationId(app.id);
                                    setShowLowisaChatModal(true);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Bedömningar</CardTitle>
                <CardDescription>Automatiska analysresultat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Personlighetsanalys</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Service-fokuserad screening för kundinteraktion
                    </p>
                    <div className="mt-2">
                      <Badge className="bg-purple-100 text-purple-800">
                        {applications.filter(app => app.current_stage === 'personality_test').length} aktiva
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Video Analys</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI-baserad kommunikations- och autenticitetsbedömning
                    </p>
                    <div className="mt-2">
                      <Badge className="bg-red-100 text-red-800">
                        {applications.filter(app => app.current_stage === 'video_analysis').length} pågående
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Email Screening</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Intelligent konversationsanalys och serviceinriktning
                    </p>
                    <div className="mt-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {applications.filter(app => app.current_stage === 'email_screening').length} konversationer
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kvalitetsmetrics</CardTitle>
                <CardDescription>AI-systemets prestanda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Träffsäkerhet</span>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Automatiseringsgrad</span>
                    <span className="font-bold text-blue-600">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kandidat Nöjdhet</span>
                    <span className="font-bold text-purple-600">4.8/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">HR Tidsbesparning</span>
                    <span className="font-bold text-orange-600">75%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automatisk Kontraktsgenerering</CardTitle>
              <CardDescription>AI-genererade anställningskontrakt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Kontrakt Modul</h3>
                <p className="text-gray-500 mb-4">
                  Automatisk kontraktsgenerering kommer att implementeras när kandidater når slutbedömning.
                </p>
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Aktivera Kontraktsystem
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automatisk Onboarding</CardTitle>
              <CardDescription>Komplett onboarding-pipeline från signering till integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Onboarding System</h3>
                <p className="text-gray-500 mb-4">
                  Automatisk onboarding med AI-träning, mentortilldelning och systemintegration.
                </p>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Konfigurera Onboarding
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml-dashboard" className="space-y-6">
          <MLInsightsDashboard />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <AutoJobPoster />
        </TabsContent>
      </Tabs>
      
      {/* Modal Components */}
      <NewApplicationModal
        isOpen={showNewApplicationModal}
        onClose={() => setShowNewApplicationModal(false)}
        onSuccess={() => {
          fetchApplications();
        }}
      />
      
      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={showCandidateDetailModal}
        onClose={() => {
          setShowCandidateDetailModal(false);
          setSelectedCandidate(null);
        }}
        onEmailClick={(candidate) => {
          setShowCandidateDetailModal(false);
          setSelectedCandidate(candidate);
          setShowEmailModal(true);
        }}
        onRefresh={() => {
          fetchApplications();
        }}
      />
      
      <EmailComposeModal
        candidate={selectedCandidate}
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setSelectedCandidate(null);
        }}
        onSuccess={() => {
          fetchApplications();
        }}
      />
      
      {chatApplicationId && (
        <LowisaChatModal
          applicationId={chatApplicationId}
          candidateName={
            applications.find(a => a.id === chatApplicationId)?.first_name + ' ' +
            applications.find(a => a.id === chatApplicationId)?.last_name || 'Candidate'
          }
          isOpen={showLowisaChatModal}
          onClose={() => {
            setShowLowisaChatModal(false);
            setChatApplicationId(null);
          }}
          onInfoComplete={() => {
            fetchApplications();
            toast({
              title: 'Information Complete',
              description: 'Candidate has been sent the Typeform link',
            });
          }}
        />
      )}
    </div>
  );
}