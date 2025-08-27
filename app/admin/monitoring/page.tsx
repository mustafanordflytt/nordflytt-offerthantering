"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Zap
} from 'lucide-react'

// Mock data - in production, this would come from your analytics APIs
const mockData = {
  overview: {
    totalVisitors: 1234,
    conversionRate: 3.4,
    avgLoadTime: 1.2,
    errorRate: 0.5,
    activeUsers: 42,
  },
  webVitals: {
    lcp: { value: 2.1, rating: 'good' },
    fid: { value: 95, rating: 'good' },
    cls: { value: 0.08, rating: 'good' },
    fcp: { value: 1.5, rating: 'good' },
    ttfb: { value: 0.7, rating: 'good' },
    inp: { value: 180, rating: 'good' },
  },
  conversions: {
    funnel: [
      { stage: 'Landing Page', users: 1000, rate: 100 },
      { stage: 'Form Start', users: 450, rate: 45 },
      { stage: 'Customer Info', users: 380, rate: 38 },
      { stage: 'Move Details', users: 320, rate: 32 },
      { stage: 'Service Selection', users: 280, rate: 28 },
      { stage: 'Summary', users: 150, rate: 15 },
      { stage: 'Booking Complete', users: 34, rate: 3.4 },
    ],
    todayBookings: 12,
    todayRevenue: 45600,
  },
  errors: [
    { id: 1, message: 'Failed to load Google Maps', count: 3, lastSeen: '2 minutes ago' },
    { id: 2, message: 'Credit check timeout', count: 1, lastSeen: '1 hour ago' },
  ],
  performance: {
    apiLatency: 145,
    dbQueries: 23,
    cacheHitRate: 87,
  }
}

export default function MonitoringDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState(mockData)

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Monitoring Dashboard</h1>
        <p className="text-gray-600">Real-time system performance and analytics</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex gap-2">
          {['1h', '24h', '7d', '30d'].map(range => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-4 py-2 rounded-md ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.3%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgLoadTime}s</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-200ms</span> improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.errors.length} active issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Google's metrics for measuring user experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(data.webVitals).map(([key, metric]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium uppercase">{key}</span>
                      <Badge className={getRatingColor(metric.rating)}>
                        {metric.rating}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {metric.value}{key === 'cls' ? '' : key === 'lcp' || key === 'fcp' || key === 'ttfb' ? 's' : 'ms'}
                    </div>
                    <Progress 
                      value={metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 60 : 30} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Average Latency</span>
                    <span className="text-sm font-medium">{data.performance.apiLatency}ms</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Database Queries</span>
                    <span className="text-sm font-medium">{data.performance.dbQueries}/request</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="text-sm font-medium">{data.performance.cacheHitRate}%</span>
                  </div>
                  <Progress value={data.performance.cacheHitRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User journey from landing to booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.conversions.funnel.map((step, index) => (
                  <div key={step.stage} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{step.stage}</span>
                      <span className="font-medium">{step.users} ({step.rate}%)</span>
                    </div>
                    <Progress value={step.rate} className="h-3" />
                    {index < data.conversions.funnel.length - 1 && (
                      <div className="text-xs text-red-600 text-right">
                        -{data.conversions.funnel[index].users - data.conversions.funnel[index + 1].users} drop-off
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Bookings</span>
                    </div>
                    <span className="text-2xl font-bold">{data.conversions.todayBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Revenue</span>
                    </div>
                    <span className="text-2xl font-bold">{data.conversions.todayRevenue.toLocaleString()} kr</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          {data.errors.length > 0 ? (
            <div className="space-y-4">
              {data.errors.map(error => (
                <Alert key={error.id} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{error.message}</p>
                        <p className="text-sm mt-1">Occurred {error.count} times • Last seen {error.lastSeen}</p>
                      </div>
                      <Badge variant="destructive">{error.count}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">No errors detected</p>
                  <p className="text-sm text-gray-600 mt-1">System is running smoothly</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Activity</CardTitle>
              <CardDescription>Live system status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm">System operational</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{data.overview.activeUsers}</p>
                    <p className="text-xs text-gray-600">Active Now</p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <p className="text-2xl font-bold">98.5%</p>
                    <p className="text-xs text-gray-600">Uptime</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{data.performance.apiLatency}ms</p>
                    <p className="text-xs text-gray-600">Response Time</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">All</p>
                    <p className="text-xs text-gray-600">Services OK</p>
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