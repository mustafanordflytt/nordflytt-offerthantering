'use client'

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Video,
  Brain,
  Award,
  ChevronRight,
  Clock,
  CheckCircle,
  Bot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LowisaChat from '@/components/recruitment/LowisaChat';

interface CandidateDetailModalProps {
  candidate: any;
  isOpen: boolean;
  onClose: () => void;
  onEmailClick: (candidate: any) => void;
  onRefresh?: () => void;
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

export default function CandidateDetailModal({
  candidate,
  isOpen,
  onClose,
  onEmailClick,
  onRefresh
}: CandidateDetailModalProps) {
  const { toast } = useToast();
  const [candidateData, setCandidateData] = useState(candidate);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    if (candidate?.id) {
      setCandidateData(candidate);
      setActiveView('overview');
    }
  }, [candidate]);

  const advanceStage = async () => {
    setLoading(true);
    try {
      const stageOrder = Object.keys(STAGE_LABELS);
      const currentIndex = stageOrder.indexOf(candidateData.current_stage);
      const nextStage = stageOrder[currentIndex + 1];
      
      if (nextStage) {
        const response = await fetch('/api/recruitment/advance-stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: candidateData.id,
            newStage: nextStage
          })
        });

        if (response.ok) {
          setCandidateData({
            ...candidateData,
            current_stage: nextStage,
            updated_at: new Date().toISOString()
          });
          
          toast({
            title: 'Steg avancerat',
            description: `Kandidaten har flyttats till ${STAGE_LABELS[nextStage].label}`,
          });
          
          if (onRefresh) onRefresh();
        }
      }
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte avancera kandidaten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleInterview = () => {
    toast({
      title: 'Kommer snart',
      description: 'Intervjubokning kommer att implementeras.',
    });
  };

  if (!candidateData) return null;

  const stageInfo = STAGE_LABELS[candidateData.current_stage] || STAGE_LABELS.cv_screening;
  const stageProgress = (Object.keys(STAGE_LABELS).indexOf(candidateData.current_stage) + 1) / Object.keys(STAGE_LABELS).length * 100;

  const tabButtons = [
    { id: 'overview', label: 'Översikt', icon: null },
    { id: 'lowisa-chat', label: 'Lowisa', icon: <Bot className="h-4 w-4" /> },
    { id: 'ai-analysis', label: 'AI Analys', icon: null },
    { id: 'communication', label: 'Kommunikation', icon: null },
    { id: 'timeline', label: 'Tidslinje', icon: null }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setActiveView('overview');
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {candidateData.first_name} {candidateData.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Rekryteringsprocess</span>
              <span>{Math.round(stageProgress)}% slutfört</span>
            </div>
            <Progress value={stageProgress} className="h-2" />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">Nuvarande steg:</span>
              <Badge className={stageInfo.color}>
                {stageInfo.icon}
                <span className="ml-1">{stageInfo.label}</span>
              </Badge>
              <span className="ml-auto text-sm font-medium">
                Score: <span className={
                  candidateData.overall_score >= 0.8 ? 'text-green-600' :
                  candidateData.overall_score >= 0.6 ? 'text-yellow-600' :
                  'text-red-600'
                }>
                  {candidateData.overall_score ? (candidateData.overall_score * 100).toFixed(0) : 0}%
                </span>
              </span>
            </div>
          </div>

          {/* Custom Tab Navigation */}
          <div className="border-b">
            <nav className="-mb-px flex space-x-4">
              {tabButtons.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`
                    py-2 px-3 border-b-2 font-medium text-sm flex items-center gap-1
                    ${activeView === tab.id 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeView === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Kontaktinformation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{candidateData.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{candidateData.phone || 'Ej angiven'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{candidateData.geographic_preference || 'Stockholm'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Jobbinformation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{POSITION_LABELS[candidateData.desired_position]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Tillgänglig: {candidateData.availability_date 
                            ? new Date(candidateData.availability_date).toLocaleDateString('sv-SE')
                            : 'Omgående'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Löneanspråk: {candidateData.salary_expectation 
                            ? `${candidateData.salary_expectation.toLocaleString()} SEK` 
                            : 'Ej angiven'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Ansökningsdatum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {new Date(candidateData.application_date).toLocaleDateString('sv-SE')} 
                        {' '}({Math.floor((Date.now() - new Date(candidateData.application_date).getTime()) / (1000 * 60 * 60 * 24))} dagar sedan)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === 'lowisa-chat' && (
              <div className="h-[500px]">
                <LowisaChat
                  key={`lowisa-${candidateData.id}`}
                  candidateId={candidateData.id}
                  candidateName={`${candidateData.first_name}`}
                  position={POSITION_LABELS[candidateData.desired_position] || candidateData.desired_position}
                  initialContext={candidateData}
                  onInformationComplete={(candidateId) => {
                    toast({
                      title: 'Information komplett! ✅',
                      description: 'Kandidaten har fått länk till Typeform-formuläret.',
                    });
                    if (onRefresh) onRefresh();
                  }}
                />
              </div>
            )}

            {activeView === 'ai-analysis' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Bedömningar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">AI-analys kommer snart...</p>
                </CardContent>
              </Card>
            )}

            {activeView === 'communication' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Kommunikationshistorik</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-8">
                    Ingen kommunikation ännu. Klicka på "Skicka Email" för att starta.
                  </p>
                </CardContent>
              </Card>
            )}

            {activeView === 'timeline' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Händelselogg</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="w-0.5 h-16 bg-gray-200"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Ansökan mottagen</p>
                        <p className="text-xs text-gray-500">
                          {new Date(candidateData.application_date).toLocaleString('sv-SE')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={advanceStage}
              disabled={loading || candidateData.current_stage === 'onboarding'}
              className="flex items-center gap-2"
            >
              Nästa Steg
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => onEmailClick(candidateData)}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Skicka Email
            </Button>
            <Button 
              variant="outline"
              onClick={scheduleInterview}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Boka Intervju
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}