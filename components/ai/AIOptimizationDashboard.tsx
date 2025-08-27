'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Brain, 
  Map, 
  Users, 
  Clock, 
  AlertTriangle,
  Cloud,
  Truck,
  BarChart3,
  MapPin,
  Activity,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Navigation,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface OptimizationMetrics {
  geographic_efficiency: number
  team_efficiency: number
  route_efficiency: number
  congestion_tax_cost: number
  weather_impact: string
  total_jobs: number
  total_teams: number
  estimated_completion_time: string
  optimization_score: number
}

interface JobCluster {
  id: string
  center_lat: number
  center_lng: number
  jobs: any[]
  team_assigned: string
  estimated_duration: number
  efficiency_score: number
}

export default function AIOptimizationDashboard() {
  const { toast } = useToast()
  const [optimization, setOptimization] = useState<OptimizationMetrics | null>(null)
  const [clusters, setClusters] = useState<JobCluster[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [weatherData, setWeatherData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock optimization data - in production this would come from API
  const mockOptimization: OptimizationMetrics = {
    geographic_efficiency: 92,
    team_efficiency: 88,
    route_efficiency: 90,
    congestion_tax_cost: 15980,
    weather_impact: 'Optimala förhållanden - inga väderjusteringar',
    total_jobs: 24,
    total_teams: 6,
    estimated_completion_time: '17:30',
    optimization_score: 89
  }

  // Mock cluster data
  const mockClusters: JobCluster[] = [
    {
      id: 'cluster-1',
      center_lat: 59.3293,
      center_lng: 18.0686,
      jobs: [
        { id: '1', address: 'Drottninggatan 45', volume: 20, floors: 3 },
        { id: '2', address: 'Kungsgatan 12', volume: 15, floors: 2 },
        { id: '3', address: 'Vasagatan 8', volume: 25, floors: 4 }
      ],
      team_assigned: 'Team Alpha',
      estimated_duration: 180,
      efficiency_score: 94
    },
    {
      id: 'cluster-2',
      center_lat: 59.3326,
      center_lng: 18.0649,
      jobs: [
        { id: '4', address: 'Östermalm 23', volume: 18, floors: 2 },
        { id: '5', address: 'Strandvägen 45', volume: 30, floors: 5 }
      ],
      team_assigned: 'Team Beta',
      estimated_duration: 150,
      efficiency_score: 88
    }
  ]

  // Mock weather data - Summer conditions
  const mockWeatherData = {
    temperature: 16,
    precipitation: 0,
    snow_depth: 0,
    wind_speed: 5,
    condition: 'Molnigt',
    difficulty_multiplier: 1.0,
    extra_time_minutes: 0
  }

  useEffect(() => {
    // Simulate initial data load
    setTimeout(() => {
      setOptimization(mockOptimization)
      setClusters(mockClusters)
      setWeatherData(mockWeatherData)
    }, 1000)
  }, [])

  const handleOptimize = async () => {
    setIsOptimizing(true)
    
    toast({
      title: "🤖 AI-optimering startar...",
      description: "Analyserar jobb, väder och trafikdata"
    })

    // Simulate optimization process
    setTimeout(() => {
      setOptimization({
        ...mockOptimization,
        geographic_efficiency: 95,
        team_efficiency: 91,
        route_efficiency: 93,
        optimization_score: 93
      })
      
      setIsOptimizing(false)
      
      toast({
        title: "✅ Optimering klar!",
        description: "Effektivitet ökad från 89% till 93% - perfekta väderförhållanden!"
      })
    }, 3000)
  }

  const getEfficiencyColor = (value: number) => {
    if (value >= 90) return 'text-green-600'
    if (value >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getWeatherIcon = () => {
    if (weatherData?.condition === 'Snöfall') return <Cloud className="h-5 w-5 text-blue-500" />
    if (weatherData?.condition === 'Molnigt') return <Cloud className="h-5 w-5 text-gray-400" />
    if (weatherData?.precipitation > 0) return <Cloud className="h-5 w-5 text-gray-500" />
    if (weatherData?.temperature > 25) return <Cloud className="h-5 w-5 text-orange-500" />
    return <Cloud className="h-5 w-5 text-yellow-500" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI-Optimering
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent schemaläggning med ML, DBSCAN och VRP
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <Button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Optimerar...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Kör AI-Optimering
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Weather Alert */}
      {weatherData && (weatherData.condition === 'Snöfall' || weatherData.temperature > 30 || weatherData.precipitation > 20) && (
        <Alert className={weatherData.temperature > 30 ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50"}>
          <AlertTriangle className={weatherData.temperature > 30 ? "h-4 w-4 text-orange-600" : "h-4 w-4 text-blue-600"} />
          <AlertTitle>Vädervarning</AlertTitle>
          <AlertDescription>
            {weatherData.temperature > 30 
              ? `Värmevarning: ${weatherData.temperature}°C. Extra pauser rekommenderas för personalen.`
              : weatherData.precipitation > 20
              ? `Kraftigt regn väntas (${weatherData.precipitation}mm). Skyddsutrustning rekommenderas.`
              : `${weatherData.condition} väntas idag. Extra tid (+${weatherData.extra_time_minutes} min) har lagts till för alla jobb.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Map className="h-5 w-5 text-blue-600" />}
          title="Geografisk Effektivitet"
          value={optimization ? `${optimization.geographic_efficiency}%` : 'Beräknar...'}
          subtitle="DBSCAN-klustring"
          trend={optimization?.geographic_efficiency >= 90 ? 'up' : 'down'}
        />
        <MetricCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          title="Teamallokering"
          value={optimization ? `${optimization.team_efficiency}%` : 'Beräknar...'}
          subtitle="ML-optimerad"
          trend={optimization?.team_efficiency >= 85 ? 'up' : 'down'}
        />
        <MetricCard
          icon={<Navigation className="h-5 w-5 text-blue-600" />}
          title="Ruttoptimering"
          value={optimization ? `${optimization.route_efficiency}%` : 'Beräknar...'}
          subtitle="VRP-algoritm"
          trend={optimization?.route_efficiency >= 88 ? 'up' : 'down'}
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5 text-orange-600" />}
          title="Trängselskatt"
          value={optimization ? `${optimization.congestion_tax_cost.toLocaleString()} kr` : 'Beräknar...'}
          subtitle="Beräknad kostnad"
          trend="none"
        />
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="clusters">Geografisk Vy</TabsTrigger>
          <TabsTrigger value="teams">Teamschema</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Dagens Optimering</span>
                <Badge 
                  variant="secondary" 
                  className={`${getEfficiencyColor(optimization?.optimization_score || 0)} bg-opacity-10`}
                >
                  {optimization?.optimization_score}% Total Effektivitet
                </Badge>
              </CardTitle>
              <CardDescription>
                {selectedDate} - {optimization?.total_jobs} jobb, {optimization?.total_teams} team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Beräknad färdigtid:</span>
                    <span className="font-medium">{optimization?.estimated_completion_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Väderpåverkan:</span>
                    <span className="font-medium flex items-center gap-1">
                      {getWeatherIcon()}
                      {optimization?.weather_impact}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total körsträcka:</span>
                    <span className="font-medium">142 km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CO2-besparing:</span>
                    <span className="font-medium text-green-600">-23%</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Optimeringsframsteg</span>
                  <span className="text-sm text-gray-600">
                    {optimization?.optimization_score}% av 95% mål
                  </span>
                </div>
                <Progress 
                  value={(optimization?.optimization_score || 0) / 95 * 100} 
                  className="h-3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Algorithm Status */}
          <Card>
            <CardHeader>
              <CardTitle>Algoritm-status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AlgorithmStatus 
                  name="DBSCAN Geografisk Klustring"
                  status="success"
                  message="5 kluster identifierade"
                />
                <AlgorithmStatus 
                  name="VRP Ruttoptimering"
                  status="success"
                  message="Optimal rutt beräknad"
                />
                <AlgorithmStatus 
                  name="ML Teamstorlek"
                  status="success"
                  message="Random Forest modell uppdaterad"
                />
                <AlgorithmStatus 
                  name="Väderintegration (SMHI)"
                  status="warning"
                  message="Snövarning aktiv"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clusters Tab */}
        <TabsContent value="clusters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geografiska Kluster (DBSCAN)</CardTitle>
              <CardDescription>
                Optimerade jobgrupper baserat på geografisk närhet och väderfaktorer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clusters.map((cluster) => (
                  <ClusterCard key={cluster.id} cluster={cluster} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teamschema</CardTitle>
              <CardDescription>
                ML-optimerad teamallokering med hänsyn till kompetens och kapacitet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TeamScheduleCard 
                  teamName="Team Alpha"
                  members={3}
                  jobs={5}
                  startTime="08:00"
                  endTime="16:30"
                  efficiency={94}
                />
                <TeamScheduleCard 
                  teamName="Team Beta"
                  members={2}
                  jobs={4}
                  startTime="08:30"
                  endTime="16:00"
                  efficiency={88}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prestandaanalys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Effektivitetsökning</h4>
                    <div className="text-3xl font-bold text-green-600">+21%</div>
                    <p className="text-sm text-gray-600">Från 72% till 93%</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Tidsbesparingar</h4>
                    <div className="text-3xl font-bold text-blue-600">-2.5h</div>
                    <p className="text-sm text-gray-600">Per team och dag</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const MetricCard = ({ icon, title, value, subtitle, trend }: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  trend?: 'up' | 'down' | 'none'
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          {icon}
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const AlgorithmStatus = ({ name, status, message }: {
  name: string
  status: 'success' | 'warning' | 'error'
  message: string
}) => {
  const getIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        {getIcon()}
        <span className="font-medium">{name}</span>
      </div>
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  )
}

const ClusterCard = ({ cluster }: { cluster: JobCluster }) => {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span className="font-medium">Kluster {cluster.id.split('-')[1]}</span>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {cluster.efficiency_score}% effektivitet
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">
          {cluster.jobs.length} jobb • {cluster.estimated_duration} min • {cluster.team_assigned}
        </div>
        <div className="text-xs text-gray-500">
          {cluster.jobs.map(j => j.address).join(' → ')}
        </div>
      </div>
    </div>
  )
}

const TeamScheduleCard = ({ teamName, members, jobs, startTime, endTime, efficiency }: {
  teamName: string
  members: number
  jobs: number
  startTime: string
  endTime: string
  efficiency: number
}) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium">{teamName}</h4>
          <p className="text-sm text-gray-600">{members} personer</p>
        </div>
        <Badge variant="secondary" className={efficiency >= 90 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
          {efficiency}% effektivitet
        </Badge>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Schema:</span>
          <span>{startTime} - {endTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Antal jobb:</span>
          <span>{jobs}</span>
        </div>
      </div>
    </div>
  )
}

// Fix for TrendUp/TrendDown import
const TrendUp = () => <span className="text-green-500">↑</span>
const TrendDown = () => <span className="text-red-500">↓</span>