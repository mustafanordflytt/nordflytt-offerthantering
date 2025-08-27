'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Shield,
  Activity
} from 'lucide-react';

interface Props {
  googleRoas: number;
  metaRoas: number;
  fraudSavings: number;
}

interface PlatformData {
  name: string;
  roas: number;
  status: 'good' | 'warning' | 'critical';
  spend: number;
  revenue: number;
  icon: string;
}

const PlatformOverview: React.FC<Props> = ({ googleRoas, metaRoas, fraudSavings }) => {
  const platforms: PlatformData[] = [
    {
      name: 'Google',
      roas: googleRoas,
      status: googleRoas >= 4 ? 'good' : googleRoas >= 3 ? 'warning' : 'critical',
      spend: 35000,
      revenue: 35000 * googleRoas,
      icon: '🔍'
    },
    {
      name: 'Meta',
      roas: metaRoas,
      status: metaRoas >= 4 ? 'good' : metaRoas >= 3 ? 'warning' : 'critical',
      spend: 25000,
      revenue: 25000 * metaRoas,
      icon: '📱'
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'good':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'BRA',
          badge: '🟢'
        };
      case 'warning':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'ÖVERVAKAR',
          badge: '🟡'
        };
      case 'critical':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'KRITISK',
          badge: '🔴'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: <Activity className="h-4 w-4" />,
          text: 'OKÄND',
          badge: '⚪'
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalSpend = platforms.reduce((sum, p) => sum + p.spend, 0);
  const totalRevenue = platforms.reduce((sum, p) => sum + p.revenue, 0);
  const overallRoas = totalRevenue / totalSpend;

  return (
    <Card className="platform-overview bg-gradient-to-br from-gray-50 to-gray-100">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Plattformsöversikt</span>
          <Badge variant="outline" className="text-sm">
            Total ROAS: {overallRoas.toFixed(2)}x
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Rows */}
        {platforms.map((platform) => {
          const statusConfig = getStatusConfig(platform.status);
          
          return (
            <div 
              key={platform.name}
              className={`platform-row flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${statusConfig.color}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{platform.name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>Spend: {formatCurrency(platform.spend)}</span>
                    <span>→</span>
                    <span className="font-medium text-gray-900">
                      Revenue: {formatCurrency(platform.revenue)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold">{platform.roas}x</p>
                  <p className="text-sm">ROAS</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{statusConfig.badge}</span>
                  <span className="font-medium">{statusConfig.text}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Additional Platforms Teaser */}
        <div className="flex gap-2 opacity-50">
          <div className="flex-1 p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-500">
            <span className="text-lg mr-1">🔷</span> Bing: Kommer snart
          </div>
          <div className="flex-1 p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-500">
            <span className="text-lg mr-1">💼</span> LinkedIn: Kommer snart
          </div>
        </div>

        {/* Fraud Protection Summary */}
        <div className="fraud-summary mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Bedrägeriskydd</p>
                <p className="text-sm text-green-700">AI blockerar hot i realtid</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-900">{formatCurrency(fraudSavings)}</p>
              <p className="text-sm text-green-700">sparat idag</p>
            </div>
          </div>
          
          {/* Protection Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Skyddsnivå</span>
              <span>98% effektivt</span>
            </div>
            <Progress value={98} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformOverview;