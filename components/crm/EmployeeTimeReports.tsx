'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Calendar, TrendingUp } from 'lucide-react'
import { getEmployeeWorkTime, getTodaysWorkTime } from '@/lib/staff-employee-sync'
import { format, formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

interface TimeReport {
  id: string
  employee_id: string
  employee_name: string
  job_id: string
  booking_number: string
  customer_name: string
  service_type: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  overtime_minutes: number
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  start_address?: string
  end_address?: string
}

interface EmployeeTimeReportsProps {
  employeeId: string
  employeeName: string
}

export default function EmployeeTimeReports({ employeeId, employeeName }: EmployeeTimeReportsProps) {
  const [timeReports, setTimeReports] = useState<TimeReport[]>([])
  const [todaysReports, setTodaysReports] = useState<TimeReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<TimeReport | null>(null)

  useEffect(() => {
    loadTimeReports()
    // Refresh every 30 seconds if there's an active job
    const interval = setInterval(() => {
      if (activeJob) {
        loadTimeReports()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [employeeId, activeJob])

  const loadTimeReports = async () => {
    try {
      // Get all reports
      const allReports = await getEmployeeWorkTime(employeeId) as TimeReport[]
      setTimeReports(allReports)
      
      // Get today's reports
      const todaysData = await getTodaysWorkTime(employeeId) as TimeReport[]
      setTodaysReports(todaysData)
      
      // Check for active job
      const active = todaysData.find(r => r.status === 'active')
      setActiveJob(active || null)
    } catch (error) {
      console.error('Error loading time reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalHoursToday = () => {
    return todaysReports.reduce((total, report) => {
      return total + (report.duration_minutes || 0)
    }, 0)
  }

  const getTotalOvertimeToday = () => {
    return todaysReports.reduce((total, report) => {
      return total + (report.overtime_minutes || 0)
    }, 0)
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'completed': return 'bg-gray-500'
      case 'paused': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Pågående'
      case 'completed': return 'Slutförd'
      case 'paused': return 'Pausad'
      case 'cancelled': return 'Avbruten'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dagens översikt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Arbetstid idag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMinutes(getTotalHoursToday())}
            </div>
            {activeJob && (
              <p className="text-sm text-green-600 mt-1">
                Pågående sedan {format(new Date(activeJob.start_time), 'HH:mm')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Övertid idag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMinutes(getTotalOvertimeToday())}
            </div>
            {getTotalOvertimeToday() > 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Behöver rapporteras
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Uppdrag idag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todaysReports.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {todaysReports.filter(r => r.status === 'completed').length} slutförda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aktiv/Senaste jobb */}
      {activeJob && (
        <Card className="border-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pågående uppdrag</CardTitle>
              <Badge className={getStatusColor(activeJob.status)}>
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(activeJob.start_time), { 
                  locale: sv, 
                  addSuffix: false 
                })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kund:</span>
                <span className="font-medium">{activeJob.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bokningsnr:</span>
                <span className="font-mono text-sm">{activeJob.booking_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tjänst:</span>
                <span>{activeJob.service_type}</span>
              </div>
              {activeJob.start_address && (
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-600">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    Plats:
                  </span>
                  <span className="text-sm text-right">{activeJob.start_address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tidsrapporter lista */}
      <Card>
        <CardHeader>
          <CardTitle>Alla tidsrapporter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeReports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Inga tidsrapporter ännu
              </p>
            ) : (
              timeReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{report.customer_name}</h4>
                      <p className="text-sm text-gray-600">
                        {report.booking_number} • {report.service_type}
                      </p>
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {getStatusText(report.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Start:</span>{' '}
                      {format(new Date(report.start_time), 'dd MMM HH:mm', { locale: sv })}
                    </div>
                    {report.end_time && (
                      <div>
                        <span className="text-gray-600">Slut:</span>{' '}
                        {format(new Date(report.end_time), 'HH:mm')}
                      </div>
                    )}
                    {report.duration_minutes && (
                      <div>
                        <span className="text-gray-600">Arbetstid:</span>{' '}
                        {formatMinutes(report.duration_minutes)}
                      </div>
                    )}
                    {report.overtime_minutes > 0 && (
                      <div className="text-orange-600">
                        <span className="text-gray-600">Övertid:</span>{' '}
                        {formatMinutes(report.overtime_minutes)}
                      </div>
                    )}
                  </div>
                  
                  {(report.start_address || report.end_address) && (
                    <div className="mt-2 text-sm text-gray-600">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {report.start_address || report.end_address}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}