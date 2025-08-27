'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Bot,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Send,
  Clock,
  TrendingUp,
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface AIResponse {
  id: number;
  case_number: string;
  dispute_type: string;
  confidence_score: number;
  generated_at: string;
  content: string;
  status: 'pending_review' | 'approved' | 'edited' | 'rejected' | 'sent';
  effectiveness_score?: number;
  template_used?: string;
}

interface Template {
  id: number;
  title: string;
  usage_count: number;
  effectiveness: number;
  last_updated: string;
  category: string;
}

export function AIResponsesManager() {
  const [aiResponses, setAiResponses] = useState<AIResponse[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGenerated: 156,
    acceptanceRate: 89,
    averageQuality: 4.2,
    timeSavings: 85
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Mock data
      const mockResponses: AIResponse[] = [
        {
          id: 1,
          case_number: 'CASE-2025-001',
          dispute_type: 'damage_claim',
          confidence_score: 0.92,
          generated_at: '2025-01-16T10:30:00',
          content: 'Hej Anders Andersson,\n\nTack för er kontakt angående skadeanmälan...',
          status: 'pending_review'
        },
        {
          id: 2,
          case_number: 'CASE-2025-002',
          dispute_type: 'service_complaint',
          confidence_score: 0.87,
          generated_at: '2025-01-15T14:20:00',
          content: 'Hej Eva Svensson,\n\nVi beklagar verkligen att ni upplevt problem...',
          status: 'approved',
          effectiveness_score: 0.88
        },
        {
          id: 3,
          case_number: 'CASE-2025-003',
          dispute_type: 'pricing_dispute',
          confidence_score: 0.95,
          generated_at: '2025-01-14T09:15:00',
          content: 'Hej Karl Johansson,\n\nTack för att ni kontaktat oss angående faktureringen...',
          status: 'sent',
          effectiveness_score: 0.91
        }
      ];

      const mockTemplates: Template[] = [
        {
          id: 1,
          title: 'Skadeanmälan - Stark Position',
          usage_count: 34,
          effectiveness: 0.92,
          last_updated: '2025-01-10',
          category: 'damage_claim'
        },
        {
          id: 2,
          title: 'Serviceklagomål - Försonande',
          usage_count: 28,
          effectiveness: 0.87,
          last_updated: '2025-01-08',
          category: 'service_complaint'
        },
        {
          id: 3,
          title: 'Prisförklaring - Detaljerad',
          usage_count: 19,
          effectiveness: 0.91,
          last_updated: '2025-01-05',
          category: 'pricing_dispute'
        }
      ];

      setAiResponses(mockResponses);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveResponse = async (id: number) => {
    console.log('Approve response:', id);
    // Update response status
  };

  const editResponse = (id: number) => {
    console.log('Edit response:', id);
    // Open edit modal
  };

  const rejectResponse = async (id: number) => {
    console.log('Reject response:', id);
    // Update response status
  };

  const sendResponse = async (id: number) => {
    console.log('Send response:', id);
    // Send to customer
  };

  const getDisputeTypeLabel = (type: string) => {
    const types = {
      damage_claim: 'Skadeanmälan',
      service_complaint: 'Serviceklagomål',
      pricing_dispute: 'Priskonflikt',
      contract_breach: 'Avtalsbrott',
      delay_complaint: 'Förseningsklagomål',
      payment_dispute: 'Betalningskonflikt'
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_review: { label: 'Väntar granskning', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Godkänd', color: 'bg-green-100 text-green-800' },
      edited: { label: 'Redigerad', color: 'bg-blue-100 text-blue-800' },
      rejected: { label: 'Avvisad', color: 'bg-red-100 text-red-800' },
      sent: { label: 'Skickad', color: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredResponses = aiResponses.filter(response => {
    if (activeTab === 'pending') return response.status === 'pending_review';
    if (activeTab === 'approved') return response.status === 'approved' || response.status === 'sent';
    if (activeTab === 'rejected') return response.status === 'rejected';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          AI-Genererade Juridiska Svar
        </h2>
        <p className="text-muted-foreground">Granska och hantera automatiskt genererade svar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Svar Genererade</p>
                <p className="text-2xl font-bold">{stats.totalGenerated}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +23 denna vecka
                </p>
              </div>
              <Bot className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acceptansgrad</p>
                <p className="text-2xl font-bold">{stats.acceptanceRate}%</p>
                <Progress value={stats.acceptanceRate} className="h-1 mt-2" />
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Genomsnittlig Kvalitet</p>
                <p className="text-2xl font-bold">{stats.averageQuality}/5</p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.floor(stats.averageQuality)
                          ? 'bg-yellow-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tidsbesparing</p>
                <p className="text-2xl font-bold">{stats.timeSavings}%</p>
                <p className="text-xs text-muted-foreground mt-1">≈ 25h/vecka</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📋 Mest Använda AI-Mallar</span>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Uppdatera Mallar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="border-2">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">{template.title}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Användningar:</span>
                      <span className="font-medium">{template.usage_count} gånger</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effektivitet:</span>
                      <span className="font-medium">{(template.effectiveness * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uppdaterad:</span>
                      <span className="font-medium">
                        {new Date(template.last_updated).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  </div>
                  <Progress value={template.effectiveness * 100} className="h-2 mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <CardTitle>AI Svar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Väntar granskning ({aiResponses.filter(r => r.status === 'pending_review').length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Godkända ({aiResponses.filter(r => r.status === 'approved' || r.status === 'sent').length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Avvisade ({aiResponses.filter(r => r.status === 'rejected').length})
              </TabsTrigger>
              <TabsTrigger value="all">Alla</TabsTrigger>
            </TabsList>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ärende</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>AI Konfidensgrad</TableHead>
                  <TableHead>Genererat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Förhandsvisning</TableHead>
                  <TableHead>Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">
                      {response.case_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDisputeTypeLabel(response.dispute_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={response.confidence_score * 100} 
                          className="h-2 w-20"
                        />
                        <span className="text-sm">
                          {(response.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(response.generated_at).toLocaleDateString('sv-SE')}
                        <div className="text-xs text-muted-foreground">
                          {new Date(response.generated_at).toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(response.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {response.content.substring(0, 50)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('View:', response.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {response.status === 'pending_review' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveResponse(response.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editResponse(response.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rejectResponse(response.id)}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {response.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendResponse(response.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}