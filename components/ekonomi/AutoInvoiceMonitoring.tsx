'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';

interface AutoInvoiceError {
  id: string;
  jobId: string;
  customerName: string;
  errorType: string;
  errorMessage: string;
  retryCount: number;
  createdAt: string;
  resolvedAt?: string;
  status: 'pending' | 'retrying' | 'resolved' | 'failed';
}

interface MonitoringStats {
  totalErrors: number;
  resolvedErrors: number;
  pendingErrors: number;
  avgResolutionTime: number;
  errorsByType: {
    [key: string]: number;
  };
  recentErrors: AutoInvoiceError[];
}

export function AutoInvoiceMonitoring() {
  const [stats, setStats] = useState<MonitoringStats>({
    totalErrors: 12,
    resolvedErrors: 10,
    pendingErrors: 2,
    avgResolutionTime: 4.5,
    errorsByType: {
      'fortnox_connection': 3,
      'invalid_customer_data': 4,
      'rut_calculation': 2,
      'staff_data_missing': 3
    },
    recentErrors: [
      {
        id: '1',
        jobId: 'job_12346',
        customerName: 'Erik Andersson',
        errorType: 'fortnox_connection',
        errorMessage: 'Failed to connect to Fortnox API',
        retryCount: 2,
        createdAt: '2025-01-21T10:30:00Z',
        status: 'retrying'
      },
      {
        id: '2',
        jobId: 'job_12347',
        customerName: 'Maria Nilsson',
        errorType: 'invalid_customer_data',
        errorMessage: 'Missing personal number for RUT application',
        retryCount: 0,
        createdAt: '2025-01-21T09:15:00Z',
        status: 'pending'
      }
    ]
  });

  const [loading, setLoading] = useState(false);

  const refreshStats = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const retryInvoice = async (errorId: string) => {
    console.log('Retrying invoice for error:', errorId);
    // Implement retry logic
  };

  const getErrorTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'fortnox_connection': 'Fortnox-anslutning',
      'invalid_customer_data': 'Ogiltig kunddata',
      'rut_calculation': 'RUT-beräkning',
      'staff_data_missing': 'Saknar personaldata'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Löst</Badge>;
      case 'retrying':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Försöker igen</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Misslyckades</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Väntar</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Monitoring Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Totala fel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalErrors}</div>
            <p className="text-xs text-muted-foreground">Senaste 30 dagarna</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Lösta fel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvedErrors}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.resolvedErrors / stats.totalErrors) * 100)}% upplösningsgrad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Väntande fel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingErrors}</div>
            <p className="text-xs text-muted-foreground">Kräver åtgärd</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Genomsnittlig lösningstid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolutionTime}h</div>
            <p className="text-xs text-muted-foreground">Från fel till löst</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feltyper</CardTitle>
          <CardDescription>Fördelning av fel per typ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.errorsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium">{getErrorTypeLabel(type)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{count} fel</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / stats.totalErrors) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Senaste fel</CardTitle>
              <CardDescription>Auto-fakturering fel som kräver uppmärksamhet</CardDescription>
            </div>
            <Button 
              onClick={refreshStats} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Uppdatera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentErrors.map((error) => (
              <div key={error.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{error.customerName}</h4>
                      {getStatusBadge(error.status)}
                      <Badge variant="outline" className="text-xs">
                        {error.jobId}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-600 mb-2">{error.errorMessage}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Typ: {getErrorTypeLabel(error.errorType)}</span>
                      <span>Försök: {error.retryCount}</span>
                      <span>{new Date(error.createdAt).toLocaleString('sv-SE')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {error.status === 'pending' && (
                      <Button 
                        onClick={() => retryInvoice(error.id)}
                        size="sm"
                        variant="outline"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Försök igen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}