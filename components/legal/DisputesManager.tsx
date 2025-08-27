'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus,
  Search,
  Filter,
  Eye,
  Bot,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
  Scale
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LegalDisputeResolution } from '@/lib/legal/LegalDisputeResolution';

interface Dispute {
  id: number;
  case_number: string;
  customer_name: string;
  customer_id: number;
  uppdrag_id: number;
  category: string;
  urgency_level: string;
  status: string;
  assigned_to?: number;
  assigned_to_name?: string;
  reported_date: string;
  ai_analysis?: {
    legal_strength: number;
    estimated_cost: number;
    confidence_score: number;
    generated_response?: string;
    escalation_recommended?: boolean;
  };
}

export function DisputesManager() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDisputeModal, setShowNewDisputeModal] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [statusFilter, severityFilter]);

  const loadDisputes = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production would fetch from database
      const mockDisputes: Dispute[] = [
        {
          id: 1,
          case_number: 'CASE-2025-001',
          customer_name: 'Anders Andersson',
          customer_id: 1,
          uppdrag_id: 101,
          category: 'damage_claim',
          urgency_level: 'high',
          status: 'investigating',
          reported_date: '2025-01-15',
          ai_analysis: {
            legal_strength: 0.75,
            estimated_cost: 5000,
            confidence_score: 0.85,
            generated_response: 'AI-genererat svar finns',
            escalation_recommended: false
          }
        },
        {
          id: 2,
          case_number: 'CASE-2025-002',
          customer_name: 'Eva Svensson',
          customer_id: 2,
          uppdrag_id: 102,
          category: 'service_complaint',
          urgency_level: 'medium',
          status: 'responding',
          assigned_to_name: 'Maria Larsson',
          reported_date: '2025-01-14',
          ai_analysis: {
            legal_strength: 0.45,
            estimated_cost: 2000,
            confidence_score: 0.92,
            generated_response: 'AI-genererat svar finns',
            escalation_recommended: false
          }
        },
        {
          id: 3,
          case_number: 'CASE-2025-003',
          customer_name: 'Karl Johansson',
          customer_id: 3,
          uppdrag_id: 103,
          category: 'pricing_dispute',
          urgency_level: 'low',
          status: 'new',
          reported_date: '2025-01-16',
          ai_analysis: {
            legal_strength: 0.82,
            estimated_cost: 1000,
            confidence_score: 0.88,
            generated_response: 'AI-genererat svar finns',
            escalation_recommended: false
          }
        }
      ];

      setDisputes(mockDisputes);
    } catch (error) {
      console.error('Error loading disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'low': return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case 'medium': return <div className="w-3 h-3 bg-yellow-500 rounded-full" />;
      case 'high': return <div className="w-3 h-3 bg-orange-500 rounded-full" />;
      case 'critical': return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: '🆕 Ny', color: 'bg-blue-100 text-blue-800' },
      investigating: { label: '🔍 Utreder', color: 'bg-yellow-100 text-yellow-800' },
      responding: { label: '💬 Svarar', color: 'bg-purple-100 text-purple-800' },
      resolved: { label: '✅ Löst', color: 'bg-green-100 text-green-800' },
      escalated: { label: '⬆️ Eskalerad', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      damage_claim: 'Skadeanmälan',
      service_complaint: 'Serviceklagomål',
      pricing_dispute: 'Priskonflikt',
      contract_breach: 'Avtalsbrott',
      delay_complaint: 'Förseningsklagomål',
      payment_dispute: 'Betalningskonflikt'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const viewDispute = (disputeId: number) => {
    // Navigate to dispute details
    console.log('View dispute:', disputeId);
  };

  const reviewAIResponse = (disputeId: number) => {
    // Show AI response modal
    console.log('Review AI response:', disputeId);
  };

  const escalateDispute = (disputeId: number) => {
    // Escalate to human lawyer
    console.log('Escalate dispute:', disputeId);
  };

  const closeDispute = (disputeId: number) => {
    // Close/resolve dispute
    console.log('Close dispute:', disputeId);
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || dispute.urgency_level === severityFilter;
    const matchesSearch = searchTerm === '' || 
      dispute.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSeverity && matchesSearch;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">⚖️ Aktiva Tvister & Ärenden</h2>
          <p className="text-muted-foreground">Hantera juridiska tvister med AI-stöd</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowNewDisputeModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nytt Ärende
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generera Rapport
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totalt Aktiva</p>
                <p className="text-2xl font-bold">{disputes.filter(d => d.status !== 'resolved').length}</p>
              </div>
              <Scale className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Hanterar</p>
                <p className="text-2xl font-bold">{disputes.filter(d => !d.assigned_to).length}</p>
              </div>
              <Bot className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kritiska</p>
                <p className="text-2xl font-bold">{disputes.filter(d => d.urgency_level === 'critical').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lösta denna vecka</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sök ärende eller kund..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Alla Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla Status</SelectItem>
            <SelectItem value="new">Nya</SelectItem>
            <SelectItem value="investigating">Under Utredning</SelectItem>
            <SelectItem value="responding">Svarar</SelectItem>
            <SelectItem value="resolved">Lösta</SelectItem>
            <SelectItem value="escalated">Eskalerade</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Alla Nivåer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla Nivåer</SelectItem>
            <SelectItem value="low">Låg</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">Hög</SelectItem>
            <SelectItem value="critical">Kritisk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ärendenummer</TableHead>
                <TableHead>Kund</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Allvarlighet</TableHead>
                <TableHead>AI Bedömning</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Handläggare</TableHead>
                <TableHead>Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{dispute.case_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(dispute.reported_date).toLocaleDateString('sv-SE')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{dispute.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Uppdrag: #{dispute.uppdrag_id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryLabel(dispute.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(dispute.urgency_level)}
                      <span className="text-sm capitalize">{dispute.urgency_level}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dispute.ai_analysis && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Styrka:</span>
                          <span className="text-xs font-medium">
                            {(dispute.ai_analysis.legal_strength * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Kostnad:</span>
                          <span className="text-xs font-medium">
                            {dispute.ai_analysis.estimated_cost.toLocaleString()} SEK
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">AI:</span>
                          <span className="text-xs font-medium">
                            {(dispute.ai_analysis.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(dispute.status)}
                  </TableCell>
                  <TableCell>
                    {dispute.assigned_to_name ? (
                      <span className="text-sm">{dispute.assigned_to_name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        AI Hanterar
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDispute(dispute.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {dispute.ai_analysis?.generated_response && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reviewAIResponse(dispute.id)}
                        >
                          <Bot className="w-4 h-4" />
                        </Button>
                      )}
                      {dispute.ai_analysis?.escalation_recommended && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => escalateDispute(dispute.id)}
                          className="text-orange-600"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => closeDispute(dispute.id)}
                        className="text-green-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}