'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  Brain,
  BarChart3,
  LineChart,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface Prediction {
  metric: string;
  current: number;
  predicted: number;
  change: number;
  confidence: number;
  icon: React.ElementType;
}

export function PredictiveAnalyticsWidget() {
  const [predictions] = useState<Prediction[]>([
    { 
      metric: 'Intäkter nästa månad', 
      current: 850000, 
      predicted: 920000, 
      change: 8.2,
      confidence: 0.85,
      icon: DollarSign 
    },
    { 
      metric: 'Nya kunder', 
      current: 45, 
      predicted: 52, 
      change: 15.6,
      confidence: 0.78,
      icon: Users 
    },
    { 
      metric: 'Jobbtillgänglighet', 
      current: 82, 
      predicted: 88, 
      change: 7.3,
      confidence: 0.82,
      icon: Calendar 
    },
    { 
      metric: 'Efterfrågan', 
      current: 100, 
      predicted: 115, 
      change: 15,
      confidence: 0.75,
      icon: Target 
    }
  ])

  const [revenueData] = useState([
    { month: 'Jan', actual: 750000, predicted: 760000 },
    { month: 'Feb', actual: 820000, predicted: 815000 },
    { month: 'Mar', actual: 890000, predicted: 895000 },
    { month: 'Apr', actual: 850000, predicted: 848000 },
    { month: 'Maj', actual: null, predicted: 920000 },
    { month: 'Jun', actual: null, predicted: 980000 },
    { month: 'Jul', actual: null, predicted: 1050000 }
  ])

  const [demandPatterns] = useState([
    { day: 'Mån', current: 85, predicted: 88 },
    { day: 'Tis', current: 92, predicted: 95 },
    { day: 'Ons', current: 88, predicted: 92 },
    { day: 'Tor', current: 90, predicted: 94 },
    { day: 'Fre', current: 95, predicted: 98 },
    { day: 'Lör', current: 78, predicted: 82 },
    { day: 'Sön', current: 45, predicted: 48 }
  ])

  const [riskFactors] = useState([
    { factor: 'Personal', value: 75, optimal: 90 },
    { factor: 'Kapacitet', value: 82, optimal: 85 },
    { factor: 'Marknad', value: 68, optimal: 80 },
    { factor: 'Säsong', value: 92, optimal: 95 },
    { factor: 'Konkurrens', value: 70, optimal: 75 }
  ])

  const [alerts] = useState([
    { 
      type: 'warning',
      message: 'Hög efterfrågan förväntas vecka 23-24',
      action: 'Överväg temporär personal'
    },
    { 
      type: 'opportunity',
      message: '15% ökning i företagsflytt-segment',
      action: 'Fokusera marknadsföring'
    },
    { 
      type: 'risk',
      message: 'Potentiell kapacitetsbrist i juni',
      action: 'Börja rekrytering nu'
    }
  ])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Brain className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Predictions Overview */}
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription>
                AI-drivna förutsägelser för kommande 30 dagar
              </CardDescription>
            </div>
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {predictions.map((pred) => (
              <div key={pred.metric} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <pred.icon className="h-5 w-5 text-gray-400" />
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      pred.confidence > 0.8 ? "border-green-300 text-green-700" : "border-yellow-300 text-yellow-700"
                    )}
                  >
                    {Math.round(pred.confidence * 100)}% säkerhet
                  </Badge>
                </div>
                <h4 className="text-sm font-medium text-gray-700">{pred.metric}</h4>
                <div className="mt-2 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">Nu:</span>
                    <span className="text-sm font-medium">
                      {pred.metric.includes('kr') || pred.metric.includes('Intäkt') 
                        ? `${pred.current.toLocaleString('sv-SE')} kr`
                        : pred.current
                      }
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">Prognos:</span>
                    <span className="text-lg font-semibold">
                      {pred.metric.includes('kr') || pred.metric.includes('Intäkt')
                        ? `${pred.predicted.toLocaleString('sv-SE')} kr`
                        : pred.predicted
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    {pred.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      pred.change > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {pred.change > 0 ? '+' : ''}{pred.change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Intäktsprognos</CardTitle>
          <CardDescription>Faktisk vs förutsedd</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any) => `${(value/1000).toFixed(0)}k kr`}
                labelStyle={{ fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                strokeWidth={2}
                name="Faktisk"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Prognos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Demand Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Efterfrågemönster</CardTitle>
          <CardDescription>Per veckodag</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={demandPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelStyle={{ fontSize: 12 }} />
              <Bar dataKey="current" fill="#94a3b8" name="Nuvarande" />
              <Bar dataKey="predicted" fill="#3b82f6" name="Förutsedd" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riskanalys</CardTitle>
          <CardDescription>Affärsfaktorer</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={riskFactors}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Nuvarande"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Radar
                name="Optimal"
                dataKey="optimal"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Insikter & Varningar</CardTitle>
          <CardDescription>Åtgärdsbara rekommendationer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div 
                key={index}
                className={cn(
                  "p-3 rounded-lg border",
                  alert.type === 'warning' && "bg-yellow-50 border-yellow-200",
                  alert.type === 'opportunity' && "bg-green-50 border-green-200",
                  alert.type === 'risk' && "bg-red-50 border-red-200"
                )}
              >
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Rekommendation:</strong> {alert.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              AI-modellen uppdateras var 6:e timme med nya data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}