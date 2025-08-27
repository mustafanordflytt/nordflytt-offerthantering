'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Bell, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react'
import { useRealtimeJobs, useRealtimeLeads, useRealtimeNotifications } from '@/hooks/use-realtime'
import { RealtimeStatus } from './RealtimeStatus'
import { toast } from 'sonner'

interface LiveDashboardProps {
  userId: string
  userType: 'staff' | 'customer' | 'admin'
  className?: string
}

interface DashboardStats {
  activeJobs: number
  pendingJobs: number
  completedToday: number
  newLeads: number
  upcomingJobs: number
  overdueJobs: number
}

export function LiveDashboard({ userId, userType, className }: LiveDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    pendingJobs: 0,
    completedToday: 0,
    newLeads: 0,
    upcomingJobs: 0,
    overdueJobs: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Real-time subscriptions
  const { jobs, loading: jobsLoading, isConnected: jobsConnected } = useRealtimeJobs()
  const { leads, loading: leadsLoading } = useRealtimeLeads()
  const { notifications, unreadCount } = useRealtimeNotifications(userId, userType)

  // Update stats when data changes
  useEffect(() => {
    if (!jobsLoading && jobs.length >= 0) {
      updateStats(jobs, leads)
      setLastUpdated(new Date())
    }
  }, [jobs, leads, jobsLoading, leadsLoading])

  // Track recent activity
  useEffect(() => {
    // Add new jobs to recent activity
    jobs.forEach(job => {
      if (new Date(job.created_at) > new Date(Date.now() - 5 * 60 * 1000)) { // Last 5 minutes
        addActivity({
          id: job.id,
          type: 'job_created',
          message: `Nytt uppdrag skapades: ${job.job_number}`,
          timestamp: job.created_at,
          icon: Briefcase,
          color: 'blue'
        })
      }
    })

    // Add new leads to recent activity
    leads.forEach(lead => {
      if (new Date(lead.created_at) > new Date(Date.now() - 5 * 60 * 1000)) {
        addActivity({
          id: lead.id,
          type: 'lead_created',
          message: `Ny lead: ${lead.name}`,
          timestamp: lead.created_at,
          icon: Users,
          color: 'green'
        })
      }
    })
  }, [jobs, leads])

  const updateStats = (jobsData: any[], leadsData: any[]) => {
    const today = new Date().toISOString().split('T')[0]
    
    const newStats: DashboardStats = {
      activeJobs: jobsData.filter(job => 
        ['assigned', 'in_progress', 'on_route'].includes(job.status)
      ).length,
      
      pendingJobs: jobsData.filter(job => 
        job.status === 'pending'
      ).length,
      
      completedToday: jobsData.filter(job => 
        job.status === 'completed' && 
        new Date(job.completed_at).toISOString().split('T')[0] === today
      ).length,
      
      upcomingJobs: jobsData.filter(job => 
        new Date(job.scheduled_date) > new Date() &&
        new Date(job.scheduled_date).toISOString().split('T')[0] === today
      ).length,
      
      overdueJobs: jobsData.filter(job => 
        new Date(job.scheduled_date) < new Date() && 
        !['completed', 'cancelled'].includes(job.status)
      ).length,
      
      newLeads: leadsData.filter(lead => 
        new Date(lead.created_at).toISOString().split('T')[0] === today
      ).length
    }

    setStats(newStats)
  }

  const addActivity = (activity: any) => {
    setRecentActivity(prev => {
      // Avoid duplicates
      if (prev.some(a => a.id === activity.id && a.type === activity.type)) {
        return prev
      }
      
      // Keep only last 10 activities
      return [activity, ...prev.slice(0, 9)]
    })
  }

  const refreshData = async () => {
    toast.info('Uppdaterar dashboard...')
    // This would trigger a manual refresh if needed
    setLastUpdated(new Date())
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just nu'
    if (diffInMinutes < 60) return `${diffInMinutes}m sedan`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h sedan`
    return past.toLocaleDateString('sv-SE')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'pending': return 'bg-yellow-500'
      case 'overdue': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (jobsLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Dashboard</h2>
          <p className="text-muted-foreground">
            Senast uppdaterad: {lastUpdated.toLocaleTimeString('sv-SE')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeStatus />
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={!jobsConnected}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktiva</p>
                <p className="text-2xl font-bold">{stats.activeJobs}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Väntande</p>
                <p className="text-2xl font-bold">{stats.pendingJobs}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Klara idag</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kommande</p>
                <p className="text-2xl font-bold">{stats.upcomingJobs}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Försenade</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueJobs}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nya leads</p>
                <p className="text-2xl font-bold text-green-600">{stats.newLeads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Senaste aktivitet
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time uppdateringar från systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Icon className={`h-4 w-4 mt-1 text-${activity.color}-500`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <RealtimeStatus showDetails className="mt-6" />
      )}
    </div>
  )
}