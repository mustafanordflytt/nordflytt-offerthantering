'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Users, 
  Target,
  Award,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadGrade {
  grade: string
  count: number
  percentage: number
  color: string
}

interface ScoringMetric {
  label: string
  value: string
  icon: React.ElementType
  trend: number
}

export function LeadScoringWidget() {
  const [gradeDistribution, setGradeDistribution] = useState<LeadGrade[]>([
    { grade: 'A', count: 12, percentage: 15, color: 'bg-green-500' },
    { grade: 'B', count: 20, percentage: 25, color: 'bg-blue-500' },
    { grade: 'C', count: 28, percentage: 35, color: 'bg-yellow-500' },
    { grade: 'D', count: 16, percentage: 20, color: 'bg-orange-500' },
    { grade: 'F', count: 4, percentage: 5, color: 'bg-red-500' }
  ])

  const [metrics] = useState<ScoringMetric[]>([
    { label: 'Avg Score', value: '62.5', icon: Target, trend: 5 },
    { label: 'Model Accuracy', value: '84%', icon: Brain, trend: 2 },
    { label: 'Conversion Rate', value: '42%', icon: TrendingUp, trend: 8 },
    { label: 'Auto-Assigned', value: '156', icon: Zap, trend: 12 }
  ])

  const [recentScores, setRecentScores] = useState([
    { 
      name: 'Anna Företag AB', 
      score: 85, 
      grade: 'A', 
      probability: 0.75,
      time: '2 min sedan',
      assignedTo: 'Erik Eriksson'
    },
    { 
      name: 'Bengt Bengtsson', 
      score: 72, 
      grade: 'B', 
      probability: 0.45,
      time: '5 min sedan',
      assignedTo: 'Anna Andersson'
    },
    { 
      name: 'Carina Café', 
      score: 58, 
      grade: 'C', 
      probability: 0.28,
      time: '12 min sedan',
      assignedTo: 'Maria Svensson'
    }
  ])

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Update recent scores
      setRecentScores(prev => {
        const names = ['Tech Startup AB', 'Familjen Svensson', 'Restaurang Roma', 'Advokat Andersson'];
        const newScore = {
          name: names[Math.floor(Math.random() * names.length)],
          score: Math.floor(Math.random() * 40) + 60,
          grade: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          probability: Math.random() * 0.5 + 0.3,
          time: 'Just nu',
          assignedTo: ['Erik Eriksson', 'Anna Andersson', 'Maria Svensson'][Math.floor(Math.random() * 3)]
        };
        
        return [newScore, ...prev.slice(0, 2)];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [])

  const getGradeColor = (grade: string) => {
    const colors = {
      'A': 'bg-green-100 text-green-800 border-green-300',
      'B': 'bg-blue-100 text-blue-800 border-blue-300',
      'C': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'D': 'bg-orange-100 text-orange-800 border-orange-300',
      'F': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[grade as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Lead Scoring</CardTitle>
            <CardDescription>
              Intelligent prioritering och tilldelning
            </CardDescription>
          </div>
          <Brain className="h-5 w-5 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="flex items-center space-x-1">
                <metric.icon className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-600">{metric.label}</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-semibold">{metric.value}</span>
                <span className={cn(
                  "text-xs",
                  metric.trend > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {metric.trend > 0 ? '+' : ''}{metric.trend}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Grade Distribution */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Betygsfördelning</h4>
          <div className="flex space-x-1">
            {gradeDistribution.map((grade) => (
              <div 
                key={grade.grade}
                className="flex-1 space-y-1"
              >
                <div className="flex justify-center">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs font-bold border",
                      getGradeColor(grade.grade)
                    )}
                  >
                    {grade.grade}
                  </Badge>
                </div>
                <div 
                  className={cn(
                    "h-20 rounded-t flex items-end justify-center text-xs font-medium text-white",
                    grade.color
                  )}
                  style={{ height: `${grade.percentage * 0.8}px` }}
                >
                  {grade.count}
                </div>
                <div className="text-center text-xs text-gray-500">
                  {grade.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent AI Scores */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Senaste AI-bedömningar</h4>
          <div className="space-y-2">
            {recentScores.map((lead, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs font-bold border",
                        getGradeColor(lead.grade)
                      )}
                    >
                      {lead.grade}
                    </Badge>
                    <span className="text-xs text-gray-500 mt-1">{lead.score}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span>{lead.assignedTo}</span>
                      <span>•</span>
                      <span>{Math.round(lead.probability * 100)}% sannolikhet</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {lead.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">AI Rekommendationer</h4>
          <div className="space-y-1">
            <div className="flex items-start space-x-2 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
              <span>15 high-value leads (A/B) tilldelade till top performers</span>
            </div>
            <div className="flex items-start space-x-2 text-xs">
              <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5" />
              <span>8 leads behöver snabb uppföljning (inom 2 timmar)</span>
            </div>
            <div className="flex items-start space-x-2 text-xs">
              <Zap className="h-3 w-3 text-blue-500 mt-0.5" />
              <span>Modellen har lärt sig nya mönster från senaste veckans data</span>
            </div>
          </div>
        </div>

        {/* Model Performance */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">AI Model Performance</span>
            <span className="font-medium">84%</span>
          </div>
          <Progress value={84} className="h-2" />
          <p className="text-xs text-gray-500">
            Träffar rätt i 84% av fallen • Förbättring med 2% senaste månaden
          </p>
        </div>
      </CardContent>
    </Card>
  )
}