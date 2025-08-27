'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Trophy, 
  Clock, 
  Star,
  Target,
  Users,
  Award,
  Activity,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PerformanceTabProps {
  staff: any
  setStaff: (staff: any) => void
}

interface PerformanceData {
  id: string
  name: string
  position: string
  employment_start_date: string
  status: string
  provision_per_hour: number
  total_jobs_completed: number
  total_provision_earned: number
  avg_efficiency: number
  avg_customer_rating: number
  five_star_count: number
  poor_ratings_count: number
  attendance_rate: number
  upsells_sold: number
  performance_score: number
  provision_trend?: 'up' | 'down' | 'stable'
  rating_trend?: 'up' | 'down' | 'stable'
}

interface PerformanceCategory {
  key: string
  color: string
  icon: string
  title: string
  description: string
  bgColor: string
  borderColor: string
  textColor: string
}

export default function PerformanceTab({ staff, setStaff }: PerformanceTabProps) {
  const { toast } = useToast()
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [allEmployeesRanking, setAllEmployeesRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Mock performance data - I realtiy this would come from API
  const mockPerformanceData: PerformanceData = {
    id: staff.id,
    name: staff.name,
    position: staff.position,
    employment_start_date: staff.employment_start_date || '2024-01-15',
    status: staff.status,
    provision_per_hour: staff.id === 'staff-007' ? 145 : Math.floor(Math.random() * 100) + 50,
    total_jobs_completed: staff.id === 'staff-007' ? 47 : Math.floor(Math.random() * 30) + 10,
    total_provision_earned: staff.id === 'staff-007' ? 6815 : Math.floor(Math.random() * 5000) + 1000,
    avg_efficiency: staff.id === 'staff-007' ? 92 : Math.floor(Math.random() * 30) + 70,
    avg_customer_rating: staff.id === 'staff-007' ? 4.7 : Math.random() * 2 + 3,
    five_star_count: staff.id === 'staff-007' ? 31 : Math.floor(Math.random() * 20) + 5,
    poor_ratings_count: staff.id === 'staff-007' ? 2 : Math.floor(Math.random() * 8),
    attendance_rate: staff.id === 'staff-007' ? 96 : Math.floor(Math.random() * 25) + 70,
    upsells_sold: staff.id === 'staff-007' ? 8 : Math.floor(Math.random() * 15),
    performance_score: 0, // Calculated below
    provision_trend: 'up',
    rating_trend: 'up'
  }

  // Calculate performance score
  mockPerformanceData.performance_score = 
    (mockPerformanceData.provision_per_hour * 0.5) +  // Provision/hour (0-150p)
    (mockPerformanceData.avg_customer_rating * 30 * 0.3) +  // Customer rating (0-90p)
    (mockPerformanceData.attendance_rate * 0.2)  // Attendance (0-60p)

  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      setPerformanceData(mockPerformanceData)
      // Mock team ranking
      setAllEmployeesRanking([
        { id: 'staff-001', name: 'Anna Svensson', performance_score: 205, provision_per_hour: 160 },
        { id: 'staff-007', name: staff.name, performance_score: mockPerformanceData.performance_score, provision_per_hour: mockPerformanceData.provision_per_hour },
        { id: 'staff-002', name: 'Erik Johansson', performance_score: 165, provision_per_hour: 125 },
        { id: 'staff-003', name: 'Maria Andersson', performance_score: 142, provision_per_hour: 110 },
        { id: 'staff-004', name: 'Johan Petersson', performance_score: 98, provision_per_hour: 85 },
        { id: 'staff-005', name: 'Lisa Nilsson', performance_score: 87, provision_per_hour: 75 },
        { id: 'staff-006', name: 'David Larsson', performance_score: 65, provision_per_hour: 55 }
      ].sort((a, b) => b.performance_score - a.performance_score))
      setLoading(false)
    }, 1000)
  }, [staff.id])

  const getPerformanceCategory = (score: number): PerformanceCategory => {
    if (score >= 180) {
      return {
        key: 'top_performer',
        color: 'green',
        icon: '🏆',
        title: 'Top Performer',
        description: 'Excellent performance - priority for more jobs and raises',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800'
      }
    }
    if (score >= 120) {
      return {
        key: 'good_performer',
        color: 'blue',
        icon: '👍',
        title: 'Good Performer', 
        description: 'Solid performance - maintain current level',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800'
      }
    }
    if (score >= 80) {
      return {
        key: 'needs_training',
        color: 'yellow',
        icon: '📚',
        title: 'Needs Training',
        description: 'Performance improvement required',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800'
      }
    }
    return {
      key: 'consider_termination',
      color: 'red',
      icon: '⚠️',
      title: 'Performance Issues',
      description: 'Significant improvement needed or consider termination',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    }
  }

  const getTrendIcon = (trend: string | undefined) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Laddar prestanda-data...</p>
        </div>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
        <p>Kunde inte ladda prestanda-data</p>
      </div>
    )
  }

  const employeeRank = allEmployeesRanking.findIndex(emp => emp.id === staff.id) + 1
  const performanceCategory = getPerformanceCategory(performanceData.performance_score)

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <PerformanceOverviewCard 
        data={performanceData}
        rank={employeeRank}
        totalEmployees={allEmployeesRanking.length}
        category={performanceCategory}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Provision/Timme"
          value={`${Math.round(performanceData.provision_per_hour)}kr`}
          subtitle="Senaste 3 månader"
          icon={<DollarSign className="w-5 h-5" />}
          trend={performanceData.provision_trend}
        />
        <MetricCard
          title="Kundbetyg"
          value={`${performanceData.avg_customer_rating.toFixed(1)}⭐`}
          subtitle={`${performanceData.five_star_count} av ${performanceData.total_jobs_completed} (5⭐)`}
          icon={<Star className="w-5 h-5" />}
          trend={performanceData.rating_trend}
        />
        <MetricCard
          title="Närvaro"
          value={`${Math.round(performanceData.attendance_rate)}%`}
          subtitle="Schemalagda pass"
          icon={<Clock className="w-5 h-5" />}
          trend={performanceData.attendance_rate >= 95 ? 'up' : performanceData.attendance_rate >= 85 ? 'stable' : 'down'}
        />
        <MetricCard
          title="Effektivitet"
          value={`${Math.round(performanceData.avg_efficiency)}%`}
          subtitle="Tid vs estimate"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={performanceData.avg_efficiency <= 95 ? 'up' : 'stable'}
        />
      </div>

      {/* Management Insights */}
      <ManagementInsights data={performanceData} category={performanceCategory} />

      {/* Detailed Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceBreakdown data={performanceData} />
        <TeamComparison 
          employee={performanceData}
          ranking={allEmployeesRanking}
          rank={employeeRank}
        />
      </div>
    </div>
  )
}

const PerformanceOverviewCard = ({ data, rank, totalEmployees, category }: {
  data: PerformanceData
  rank: number
  totalEmployees: number
  category: PerformanceCategory
}) => {
  return (
    <Card className={`${category.bgColor} ${category.borderColor} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <CardTitle className={`text-xl ${category.textColor}`}>
                {category.title}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {category.description}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">#{rank}</div>
            <div className="text-sm text-gray-600">av {totalEmployees}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(data.performance_score)}</div>
            <div className="text-xs text-gray-600">Performance Score</div>
            <Progress value={(data.performance_score / 300) * 100} className="mt-2" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.total_jobs_completed}</div>
            <div className="text-xs text-gray-600">Jobb senaste 3 mån</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(data.total_provision_earned)}kr</div>
            <div className="text-xs text-gray-600">Total provision</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const MetricCard = ({ title, value, subtitle, icon, trend }: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  trend?: string
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-gray-600">{icon}</div>
          <div className="flex items-center gap-1">
            {trend === 'up' && <ArrowUp className="h-4 w-4 text-green-600" />}
            {trend === 'down' && <ArrowDown className="h-4 w-4 text-red-600" />}
            {trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
          </div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-gray-600">{subtitle}</div>
      </CardContent>
    </Card>
  )
}

const ManagementInsights = ({ data, category }: {
  data: PerformanceData
  category: PerformanceCategory
}) => {
  const getRecommendations = (category: PerformanceCategory, data: PerformanceData) => {
    switch (category.key) {
      case 'top_performer':
        return {
          actions: [
            '🎯 Ge fler högvärdes-uppdrag',
            '💰 Överväg löneökning (10-15%)',
            '👑 Erbjud team leader-position',
            '📈 Använd som mentor för andra'
          ],
          insights: [
            `Excellenta ${Math.round(data.provision_per_hour)}kr/timme i provision`,
            `Fantastisk ${data.avg_customer_rating.toFixed(1)}⭐ kundbetyg`,
            `${Math.round(data.attendance_rate)}% närvaro visar tillförlitlighet`
          ]
        }
      
      case 'good_performer':
        return {
          actions: [
            '✅ Behåll nuvarande nivå',
            '📊 Övervaka för förbättring',
            '🎯 Sätt specifika provision-mål',
            '⭐ Fokusera på 5-stjärniga betyg'
          ],
          insights: [
            `Bra ${Math.round(data.provision_per_hour)}kr/timme provision`,
            `Godkänt ${data.avg_customer_rating.toFixed(1)}⭐ kundbetyg`,
            'Potential för förbättring finns'
          ]
        }

      case 'needs_training':
        return {
          actions: [
            '📚 Intensiv upsell-träning krävs',
            '👥 Para ihop med top performer',
            '📋 Sätt 30-dagars förbättringsplan',
            '⏰ Veckovis uppföljning'
          ],
          insights: [
            `Låg provision: ${Math.round(data.provision_per_hour)}kr/timme`,
            `Kundbetyg ${data.avg_customer_rating.toFixed(1)}⭐ behöver förbättras`,
            'Risk för lönsamhetsproblem'
          ]
        }

      case 'consider_termination':
        return {
          actions: [
            '🚨 Performance Improvement Plan (PIP)',
            '⚠️ Överväg uppsägning inom 30 dagar',
            '📋 Dokumentera all prestanda',
            '🔄 Ersätt med ny personal'
          ],
          insights: [
            `Kritiskt låg provision: ${Math.round(data.provision_per_hour)}kr/timme`,
            `Dåliga kundbetyg: ${data.avg_customer_rating.toFixed(1)}⭐`,
            `Närvaro problem: ${Math.round(data.attendance_rate)}%`
          ]
        }
      
      default:
        return { actions: [], insights: [] }
    }
  }

  const recommendations = getRecommendations(category, data)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Management Rekommendationer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-blue-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Åtgärder att vidta:
            </h4>
            <ul className="space-y-2">
              {recommendations.actions.map((action, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-green-800 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Key Insights:
            </h4>
            <ul className="space-y-2">
              {recommendations.insights.map((insight, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-green-600 font-bold">→</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PerformanceBreakdown = ({ data }: { data: PerformanceData }) => {
  const metrics = [
    {
      category: 'Lönsamhet (50%)',
      score: (data.provision_per_hour * 0.5),
      maxScore: 150,
      details: [
        `${Math.round(data.provision_per_hour)}kr/timme provision`,
        `${data.total_jobs_completed} jobb slutförda`,
        `${Math.round(data.avg_efficiency)}% effektivitet`
      ]
    },
    {
      category: 'Kvalitet (30%)',
      score: (data.avg_customer_rating * 30 * 0.3),
      maxScore: 90,
      details: [
        `${data.avg_customer_rating.toFixed(1)}⭐ genomsnittligt betyg`,
        `${data.five_star_count} femstjärniga recensioner`,
        `${data.poor_ratings_count} dåliga betyg`
      ]
    },
    {
      category: 'Tillförlitlighet (20%)',
      score: (data.attendance_rate * 0.2),
      maxScore: 60,
      details: [
        `${Math.round(data.attendance_rate)}% närvaro`,
        `${data.upsells_sold} merförsäljningar`,
        'Schemalagd närvaro'
      ]
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{metric.category}</span>
              <span className="text-sm text-gray-600">
                {Math.round(metric.score)}/{metric.maxScore}p
              </span>
            </div>
            <Progress value={(metric.score / metric.maxScore) * 100} className="mb-2" />
            <ul className="text-xs text-gray-600 space-y-1">
              {metric.details.map((detail, detailIndex) => (
                <li key={detailIndex} className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

const TeamComparison = ({ employee, ranking, rank }: {
  employee: PerformanceData
  ranking: any[]
  rank: number
}) => {
  const topPerformers = ranking.slice(0, 3)
  const bottomPerformers = ranking.slice(-3).reverse()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Ranking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current position */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Din position:</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              #{rank} av {ranking.length}
            </Badge>
          </div>
        </div>

        {/* Top 3 */}
        <div>
          <h4 className="font-medium mb-2 text-green-800 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top 3 Performers:
          </h4>
          <div className="space-y-1">
            {topPerformers.map((emp, index) => (
              <div key={emp.id} className={`flex justify-between text-sm p-2 rounded ${
                emp.id === employee.id ? 'bg-green-100 font-medium' : 'bg-gray-50'
              }`}>
                <span>#{index + 1} {emp.name}</span>
                <span className="font-medium">{Math.round(emp.provision_per_hour)}kr/h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 3 */}
        <div>
          <h4 className="font-medium mb-2 text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Behöver Förbättring:
          </h4>
          <div className="space-y-1">
            {bottomPerformers.map((emp, index) => (
              <div key={emp.id} className={`flex justify-between text-sm p-2 rounded ${
                emp.id === employee.id ? 'bg-red-100 font-medium' : 'bg-gray-50'
              }`}>
                <span>#{ranking.length - 2 + index} {emp.name}</span>
                <span className="font-medium">{Math.round(emp.provision_per_hour)}kr/h</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}