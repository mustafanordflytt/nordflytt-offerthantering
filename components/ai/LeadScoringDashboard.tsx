'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Mail, 
  Phone, 
  Calendar,
  Sparkles,
  Bot,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  ai_score: number;
  ai_confidence: number;
  ai_value: number;
  ai_insights: string;
  created_at: string;
}

export function LeadScoringDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeadScores = async () => {
    try {
      const response = await fetch('/api/ai/lead-scoring');
      if (!response.ok) throw new Error('Failed to load lead scores');
      
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Failed to load AI lead scores:', error);
      toast({
        title: '❌ Fel vid laddning',
        description: 'Kunde inte ladda lead scores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeadScores();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadLeadScores, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeadScores();
  };

  const handleAutoFollowUp = async (leadId: string) => {
    try {
      const response = await fetch('/api/ai/auto-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      });
      
      if (!response.ok) throw new Error('Failed to create follow-up');
      
      toast({
        title: '✅ Uppföljning schemalagd',
        description: 'AI har schemalagt automatisk uppföljning',
      });
    } catch (error) {
      console.error('Failed to create auto follow-up:', error);
      toast({
        title: '❌ Fel',
        description: 'Kunde inte skapa uppföljning',
        variant: 'destructive',
      });
    }
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            AI Lead Scoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Bot className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">AI analyserar leads...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-30" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            AI Lead Scoring
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.ai_score >= 80).length}</p>
            <p className="text-sm text-muted-foreground">Hot Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{leads.filter(l => l.ai_score >= 60 && l.ai_score < 80).length}</p>
            <p className="text-sm text-muted-foreground">Warm Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{leads.filter(l => l.ai_score < 60).length}</p>
            <p className="text-sm text-muted-foreground">Cold Leads</p>
          </div>
        </div>

        {/* Lead List */}
        <div className="space-y-3">
          {leads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Inga leads att visa</p>
            </div>
          ) : (
            leads.map((lead) => (
              <div 
                key={lead.id} 
                className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{lead.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* AI Score */}
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white font-bold ${getScoreColor(lead.ai_score)}`}>
                        <Bot className="h-4 w-4" />
                        {lead.ai_score}/100
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lead.ai_confidence}% säkerhet
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={lead.ai_score} className="h-2" />

                  {/* Value and Insights */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">AI Insights</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{lead.ai_insights}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-muted-foreground">Potentiellt värde</p>
                      <p className="font-semibold text-green-600">{formatValue(lead.ai_value)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(lead.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/crm/leads/${lead.id}`}
                      >
                        Visa detaljer
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleAutoFollowUp(lead.id)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        <Bot className="h-3 w-3 mr-1" />
                        AI Uppföljning
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              AI Lead Scoring aktivt • {leads.length} leads analyserade
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Senast uppdaterad {new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}