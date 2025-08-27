'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';

interface AutoInvoiceMetrics {
  totalAutoInvoices: number;
  successRate: number;
  pendingRUTApplications: number;
  totalStaffHours: number;
  failedAttempts: number;
  avgProcessingTime: number;
  todayCount: number;
  monthlyGrowth: number;
}

interface AutoInvoiceCardProps {
  metrics: AutoInvoiceMetrics;
  onRefresh?: () => void;
  loading?: boolean;
}

export function AutoInvoiceCard({ metrics, onRefresh, loading = false }: AutoInvoiceCardProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Success Rate Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-full -mr-16 -mt-16" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-600" />
            Auto-Invoice Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600">{metrics.successRate}%</span>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{metrics.monthlyGrowth}%
              </Badge>
            </div>
            <Progress value={metrics.successRate} className="h-2 bg-green-100" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{metrics.totalAutoInvoices} total</span>
              <span>{metrics.todayCount} idag</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RUT Applications Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-16 -mt-16" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            RUT Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.pendingRUTApplications}</div>
                <p className="text-xs text-muted-foreground">Väntar godkännande</p>
              </div>
              {metrics.pendingRUTApplications > 0 && (
                <Badge variant="outline" className="animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Aktiv
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Automatisk inlämning aktiverad</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Hours Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -mr-16 -mt-16" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Staff Hours Tracked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{metrics.totalStaffHours.toLocaleString()}h</div>
              <p className="text-xs text-muted-foreground">Denna månad</p>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">RUT-berättigade:</span>
                <span className="font-medium">{Math.floor(metrics.totalStaffHours * 0.85).toLocaleString()}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Genomsnitt/jobb:</span>
                <span className="font-medium">{Math.floor(metrics.totalStaffHours / metrics.totalAutoInvoices)}h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing & Errors Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full -mr-16 -mt-16" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-orange-600" />
            Processing Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Snitt tid:</span>
                </div>
                <div className="font-medium">{formatTime(metrics.avgProcessingTime)}</div>
              </div>
              {metrics.failedAttempts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {metrics.failedAttempts} fel
                </Badge>
              )}
            </div>
            {onRefresh && (
              <Button 
                onClick={onRefresh} 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Uppdatera status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}