'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  Phone,
  MapPin,
  Activity,
  BarChart3
} from 'lucide-react';

interface SEOMetric {
  id: string;
  name: string;
  currentValue: number;
  previousValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  revenueImpact: number;
}

interface Props {
  metrics: SEOMetric[];
}

const RevenueImpactCards: React.FC<Props> = ({ metrics }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    return value.toString();
  };

  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const getMetricIcon = (name: string) => {
    if (name.toLowerCase().includes('lead')) return <Users className="h-5 w-5" />;
    if (name.toLowerCase().includes('sök')) return <Eye className="h-5 w-5" />;
    if (name.toLowerCase().includes('konvertering')) return <MousePointer className="h-5 w-5" />;
    if (name.toLowerCase().includes('samtal')) return <Phone className="h-5 w-5" />;
    if (name.toLowerCase().includes('besök')) return <Activity className="h-5 w-5" />;
    return <BarChart3 className="h-5 w-5" />;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Calculate total revenue impact
  const totalRevenueImpact = metrics.reduce((sum, metric) => sum + metric.revenueImpact, 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total intäktspåverkan</p>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(totalRevenueImpact)}</p>
              <p className="text-sm text-green-700 mt-1">Från SEO-förbättringar denna vecka</p>
            </div>
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const change = calculateChange(metric.currentValue, metric.previousValue);
          const progressPercentage = (metric.currentValue / metric.targetValue) * 100;
          
          return (
            <Card key={metric.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-1 ${metric.impact === 'high' ? 'bg-red-500' : metric.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getImpactColor(metric.impact)}`}>
                      {getMetricIcon(metric.name)}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{metric.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {metric.impact} påverkan
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Main Value */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatValue(metric.currentValue, metric.unit)}
                    </span>
                    <span className="text-sm text-gray-500">{metric.unit !== '%' ? metric.unit : ''}</span>
                  </div>
                  
                  {/* Change Indicator */}
                  <div className={`flex items-center gap-1 mt-1 ${getTrendColor(metric.trend)}`}>
                    {metric.trend === 'up' ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : metric.trend === 'down' ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : null}
                    <span className="text-sm font-medium">
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500">från igår</span>
                  </div>
                </div>

                {/* Progress to Target */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Mål: {formatValue(metric.targetValue, metric.unit)} {metric.unit !== '%' ? metric.unit : ''}</span>
                    <span>{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Revenue Impact */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Intäktspåverkan</span>
                    <span className="text-sm font-bold text-green-600">
                      +{formatCurrency(metric.revenueImpact)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions Based on Metrics */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Rekommenderad åtgärd</p>
                <p className="text-sm text-gray-600">
                  Fokusera på "Nya leads från Google" - störst intäktspotential just nu
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              +{formatCurrency(48000)} potential
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueImpactCards;