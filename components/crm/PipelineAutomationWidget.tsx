'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Zap,
  Users,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PipelineStage {
  name: string
  count: number
  status: 'active' | 'completed' | 'pending'
  icon: React.ElementType
}

interface AutomationMetric {
  label: string
  value: string
  change: number
  icon: React.ElementType
}

export function PipelineAutomationWidget() {
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([
    { name: 'Leads', count: 24, status: 'active', icon: Users },
    { name: 'Kunder', count: 18, status: 'active', icon: Users },
    { name: 'Offerter', count: 12, status: 'active', icon: DollarSign },
    { name: 'Jobb', count: 8, status: 'active', icon: Clock },
    { name: 'Fakturor', count: 5, status: 'completed', icon: CheckCircle2 }
  ])

  const [metrics, setMetrics] = useState<AutomationMetric[]>([
    { label: 'Automation Rate', value: '68%', change: 12, icon: Zap },
    { label: 'Avg. Pipeline Time', value: '4.2 days', change: -23, icon: Clock },
    { label: 'Conversion Rate', value: '42%', change: 8, icon: TrendingUp },
    { label: 'Revenue/Pipeline', value: '28,500 kr', change: 15, icon: DollarSign }
  ])

  const [isAutomationActive, setIsAutomationActive] = useState(true)

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setPipelineData(prev => prev.map(stage => ({
        ...stage,
        count: Math.max(0, stage.count + Math.floor(Math.random() * 3 - 1))
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const totalInPipeline = pipelineData.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pipeline Automation</CardTitle>
            <CardDescription>
              Automatisk flöde från lead till betalning
            </CardDescription>
          </div>
          <Badge 
            variant={isAutomationActive ? "default" : "secondary"}
            className={cn(
              "px-3 py-1",
              isAutomationActive && "bg-green-100 text-green-800"
            )}
          >
            <Zap className="mr-1 h-3 w-3" />
            {isAutomationActive ? 'Aktiv' : 'Pausad'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline Flow */}
        <div className="relative">
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200" />
          <div className="relative flex justify-between">
            {pipelineData.map((stage, index) => (
              <div key={stage.name} className="flex flex-col items-center">
                <div 
                  className={cn(
                    "relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all",
                    stage.status === 'completed' ? "bg-green-100 text-green-600" :
                    stage.status === 'active' ? "bg-blue-100 text-blue-600" :
                    "bg-gray-100 text-gray-400"
                  )}
                >
                  <stage.icon className="h-6 w-6" />
                  {stage.count > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {stage.count}
                    </span>
                  )}
                </div>
                <span className="mt-2 text-xs font-medium">{stage.name}</span>
                <span className="text-xs text-gray-500">{stage.count} aktiva</span>
                {index < pipelineData.length - 1 && (
                  <ArrowRight className="absolute top-7 left-[calc(50%+32px)] h-5 w-5 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Automation Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="flex items-center space-x-2">
                <metric.icon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{metric.label}</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-semibold">{metric.value}</span>
                <Badge 
                  variant={metric.change > 0 ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    metric.change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}
                >
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Automation Status */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pipeline Efficiency</span>
            <span className="font-medium">68%</span>
          </div>
          <Progress value={68} className="h-2" />
          <p className="text-xs text-gray-500">
            {totalInPipeline} enheter i pipeline • 12 automatiska åtgärder pågår
          </p>
        </div>

        {/* Recent Automations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Senaste automationer</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Lead tilldelad till Anna Andersson</span>
              </div>
              <span className="text-gray-500">2 min sedan</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Offert skickad automatiskt</span>
              </div>
              <span className="text-gray-500">5 min sedan</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Faktura genererad efter slutfört jobb</span>
              </div>
              <span className="text-gray-500">12 min sedan</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}