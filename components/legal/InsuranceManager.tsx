'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertCircle, FileText, CheckCircle, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface InsuranceClaim {
  id: number;
  dispute_id: number;
  claim_reference: string;
  insurance_provider: string;
  claim_amount: number;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  submitted_date: string;
  response_date?: string;
  payout_amount?: number;
  rejection_reason?: string;
}

export function InsuranceManager() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('active');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/legal/insurance-claims');
      const data = await response.json();
      setClaims(data.claims || []);
    } catch (error) {
      console.error('Error fetching insurance claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitNewClaim = async (disputeId: number) => {
    try {
      const response = await fetch('/api/legal/insurance-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispute_id: disputeId })
      });
      
      if (response.ok) {
        fetchClaims();
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'default',
      submitted: 'secondary',
      under_review: 'warning',
      approved: 'success',
      rejected: 'destructive',
      paid: 'success'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      submitted: <FileText className="w-4 h-4" />,
      under_review: <AlertCircle className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <AlertTriangle className="w-4 h-4" />,
      paid: <DollarSign className="w-4 h-4" />
    };
    return icons[status as keyof typeof icons] || null;
  };

  const activeClaims = claims.filter(c => ['pending', 'submitted', 'under_review'].includes(c.status));
  const resolvedClaims = claims.filter(c => ['approved', 'rejected', 'paid'].includes(c.status));

  const totalClaimAmount = claims.reduce((sum, claim) => sum + claim.claim_amount, 0);
  const totalPayoutAmount = claims.reduce((sum, claim) => sum + (claim.payout_amount || 0), 0);
  const approvalRate = resolvedClaims.length > 0 
    ? (resolvedClaims.filter(c => c.status !== 'rejected').length / resolvedClaims.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Försäkringsärenden
        </h2>
        <p className="text-muted-foreground">Hantera försäkringsanspråk och kommunikation</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Anspråk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClaims.length}</div>
            <p className="text-xs text-muted-foreground">Under behandling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Anspråksbelopp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaimAmount.toLocaleString()} kr</div>
            <p className="text-xs text-muted-foreground">Totalt begärt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Utbetalat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayoutAmount.toLocaleString()} kr</div>
            <p className="text-xs text-muted-foreground">Erhållet från försäkring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Godkännandegrad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRate.toFixed(0)}%</div>
            <Progress value={approvalRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Claims Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Aktiva ({activeClaims.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Avslutade ({resolvedClaims.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeClaims.map((claim) => (
            <Card key={claim.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {claim.insurance_provider} - {claim.claim_reference}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Tvist ID: {claim.dispute_id}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(claim.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(claim.status)}
                      {claim.status === 'pending' && 'Väntar'}
                      {claim.status === 'submitted' && 'Inskickad'}
                      {claim.status === 'under_review' && 'Under granskning'}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Anspråksbelopp</p>
                    <p className="text-lg font-bold">{claim.claim_amount.toLocaleString()} kr</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Inlämnad</p>
                    <p className="text-sm">{new Date(claim.submitted_date).toLocaleDateString('sv-SE')}</p>
                  </div>
                </div>

                {claim.status === 'under_review' && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Ärendet granskas av försäkringsbolaget. Förväntad handläggningstid: 5-10 arbetsdagar.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    Visa detaljer
                  </Button>
                  {claim.status === 'pending' && (
                    <Button size="sm">
                      Skicka in anspråk
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {activeClaims.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Inga aktiva försäkringsanspråk</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedClaims.map((claim) => (
            <Card key={claim.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {claim.insurance_provider} - {claim.claim_reference}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Tvist ID: {claim.dispute_id}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(claim.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(claim.status)}
                      {claim.status === 'approved' && 'Godkänd'}
                      {claim.status === 'rejected' && 'Avvisad'}
                      {claim.status === 'paid' && 'Utbetald'}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Anspråksbelopp</p>
                    <p className="text-lg font-bold">{claim.claim_amount.toLocaleString()} kr</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Utbetalat belopp</p>
                    <p className="text-lg font-bold">
                      {claim.payout_amount ? `${claim.payout_amount.toLocaleString()} kr` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avslutad</p>
                    <p className="text-sm">
                      {claim.response_date ? new Date(claim.response_date).toLocaleDateString('sv-SE') : '-'}
                    </p>
                  </div>
                </div>

                {claim.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">Avslagsorsak:</p>
                    <p className="text-sm text-red-700">{claim.rejection_reason}</p>
                  </div>
                )}

                {claim.status === 'paid' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      Utbetalning genomförd. Beloppet har krediterats företagskontot.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {resolvedClaims.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Inga avslutade försäkringsanspråk</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}