'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useDashboard, useCustomers, useLeads, useJobs, useIssues, useNotifications } from '@/lib/store'
import Link from 'next/link'

// Import new enhanced components
import { 
  EnhancedMetricCard,
  AIPerformanceSection, 
  EnhancedFinancialSection,
  TeamOperationsSection,
  LiveStatusIndicator 
} from '@/components/crm/DashboardEnhancements'

export default function EnhancedDashboardPage() {
  const { stats, isLoading, fetchDashboardStats } = useDashboard()
  const { customers, fetchCustomers } = useCustomers()
  const { leads, fetchLeads } = useLeads()
  const { jobs, fetchJobs } = useJobs()
  const { issues, fetchIssues } = useIssues()
  const { notifications, unreadCount, fetchNotifications } = useNotifications()
  
  // New state for enhanced metrics
  const [enhancedMetrics, setEnhancedMetrics] = useState<any>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch enhanced metrics
  const fetchEnhancedMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/enhanced-metrics')
      const data = await response.json()
      if (data.success) {
        setEnhancedMetrics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch enhanced metrics:', error)
    }
  }

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardStats()
        fetchEnhancedMetrics()
        setLastRefresh(new Date())
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    fetchDashboardStats()
    fetchCustomers()
    fetchLeads()
    fetchJobs()
    fetchIssues()
    fetchNotifications()
    fetchEnhancedMetrics()
  }, [])

  // Use stats from API if available, otherwise fall back to store data
  const displayStats = stats || {
    totalCustomers: customers.length,
    totalLeads: leads.length,
    activeJobs: jobs.filter((job: any) => job.status === 'scheduled' || job.status === 'in_progress').length,
    completedJobsThisMonth: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    conversionRate: 0,
    avgJobValue: 0,
    upcomingJobs: [],
    recentActivities: [],
    criticalIssues: [],
    notifications: []
  }

  const upcomingJobs = stats?.upcomingJobs || jobs
    .filter((job: any) => job.status === 'scheduled')
    .sort((a: any, b: any) => new Date(a.moveDate).getTime() - new Date(b.moveDate).getTime())
    .slice(0, 5)

  const criticalIssues = stats?.criticalIssues || issues.filter((issue: any) => issue.priority === 'critical' && issue.status === 'open')

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C] mx-auto"></div>
            <p className="mt-2 text-gray-600">Laddar dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header with Live Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Översikt över din verksamhet</p>
        </div>
        <div className="flex items-center space-x-4">
          <LiveStatusIndicator status={enhancedMetrics?.systemStatus?.overall || 'operational'} />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unreadCount} olästa meddelanden
            </Badge>
          )}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => {
                fetchDashboardStats()
                fetchEnhancedMetrics()
                setLastRefresh(new Date())
              }} 
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Uppdatera
            </Button>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
            >
              Auto-refresh {autoRefresh ? 'PÅ' : 'AV'}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced KPI Cards - Preserving existing + adding new metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Existing cards with enhanced styling */}
        <EnhancedMetricCard
          title="Totalt antal kunder"
          value={displayStats.totalCustomers}
          subtitle="Aktiva kunder"
          icon={<Users className="h-4 w-4" />}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        
        <EnhancedMetricCard
          title="Aktiva leads"
          value={displayStats.totalLeads}
          subtitle={`${leads.filter((l: any) => l.status === 'qualified').length} kvalificerade`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="bg-gradient-to-r from-green-500 to-green-600"
          trend="up"
          trendValue="+12%"
        />
        
        <EnhancedMetricCard
          title="Pågående uppdrag"
          value={displayStats.activeJobs}
          subtitle="Pågående flyttar"
          icon={<Package className="h-4 w-4" />}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
        />
        
        <EnhancedMetricCard
          title="Omsättning"
          value={`${displayStats.totalRevenue.toLocaleString('sv-SE')} kr`}
          subtitle={`Denna månad: ${displayStats.revenueThisMonth.toLocaleString('sv-SE')} kr`}
          icon={<DollarSign className="h-4 w-4" />}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          additionalInfo={
            enhancedMetrics?.financialDetails ? {
              "Utestående": enhancedMetrics.financialDetails.outstanding + " kr",
              "Försenade": enhancedMetrics.financialDetails.overdue + " kr",
              "RUT-besparingar": enhancedMetrics.financialDetails.rutSavings + " kr"
            } : undefined
          }
        />
      </div>

      {/* NEW: AI Performance Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">AI & Automation</h2>
        <AIPerformanceSection data={enhancedMetrics?.aiPerformance} />
      </div>

      {/* NEW: Enhanced Financial Section */}
      <EnhancedFinancialSection data={enhancedMetrics?.financialDetails} />

      {/* Existing Additional Stats - preserved as is */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prestanda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Konverteringsgrad</span>
                <span>{displayStats.conversionRate.toFixed(1)}%</span>
              </div>
              <Progress value={displayStats.conversionRate} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Genomsnittligt uppdragsvärde</span>
                <span>{displayStats.avgJobValue.toLocaleString('sv-SE')} kr</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Avslutade uppdrag denna månad</span>
                <span>{displayStats.completedJobsThisMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kommande Uppdrag</CardTitle>
            <CardDescription>
              Närmaste 5 bokningarna
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingJobs.length === 0 ? (
              <p className="text-sm text-gray-500">Inga kommande uppdrag</p>
            ) : (
              <div className="space-y-2">
                {upcomingJobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{job.customerName}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(job.moveDate).toLocaleDateString('sv-SE')} {job.moveTime}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {job.totalPrice.toLocaleString('sv-SE')} kr
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kritiska Ärenden</CardTitle>
            <CardDescription>
              Ärenden som kräver omedelbar uppmärksamhet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {criticalIssues.length === 0 ? (
              <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">Inga kritiska ärenden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {criticalIssues.map((issue: any) => (
                  <div key={issue.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(issue.createdAt).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    </div>
                    <Link href={`/crm/arenden/${issue.id}`}>
                      <Button size="sm" variant="outline">
                        Visa
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NEW: Team & Operations Section */}
      <TeamOperationsSection data={enhancedMetrics?.operations} />

      {/* Quick Actions - preserved as is */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Snabbåtgärder</CardTitle>
          <CardDescription>
            Vanliga uppgifter för att hålla verksamheten igång
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/crm/kunder/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Ny Kund
              </Button>
            </Link>
            <Link href="/crm/leads/new">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Ny Lead
              </Button>
            </Link>
            <Link href="/crm/uppdrag/new">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Nytt Uppdrag
              </Button>
            </Link>
            <Link href="/crm/arenden/new">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Nytt Ärende
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications - preserved as is */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Senaste Meddelanden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map(notification => (
                <div key={notification.id} className={`flex items-start space-x-3 p-2 rounded ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                  <div className="mt-1">
                    {notification.type === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                    {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                    {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {notification.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString('sv-SE')}
                    </p>
                  </div>
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs">
                      Ny
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer with last refresh time */}
      <div className="text-xs text-gray-500 text-center">
        Senast uppdaterad: {lastRefresh.toLocaleTimeString('sv-SE')}
      </div>
    </div>
  )
}