'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  Calendar, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Coffee
} from 'lucide-react'
import { getTimeEntriesForJob, getTotalWorkTime, TimeEntry } from '../../lib/time-tracking'

interface MyHoursModalProps {
  isOpen: boolean
  onClose: () => void
  staffId: string
}

interface DailyHoursSummary {
  date: string
  totalHours: number
  totalMinutes: number
  jobs: number
  overtime: number
  earnings: number
  entries: TimeEntry[]
}

export default function MyHoursModal({ isOpen, onClose, staffId }: MyHoursModalProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    if (isOpen) {
      loadTimeEntries()
    }
  }, [isOpen])

  const loadTimeEntries = () => {
    // Load all time entries from localStorage
    const allEntries: TimeEntry[] = JSON.parse(localStorage.getItem('time_entries') || '[]')
    setTimeEntries(allEntries)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateEarnings = (minutes: number, isOvertime = false) => {
    const hourlyRate = 280 // SEK per timme (exempel)
    const overtimeRate = hourlyRate * 1.5
    const rate = isOvertime ? overtimeRate : hourlyRate
    return Math.round((minutes / 60) * rate)
  }

  const getDailyHoursSummary = (): DailyHoursSummary[] => {
    const groupedByDate: { [date: string]: TimeEntry[] } = {}
    
    timeEntries
      .filter(entry => entry.status === 'completed')
      .forEach(entry => {
        const date = new Date(entry.startTime).toDateString()
        if (!groupedByDate[date]) {
          groupedByDate[date] = []
        }
        groupedByDate[date].push(entry)
      })

    return Object.entries(groupedByDate).map(([date, entries]) => {
      const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const regularHours = Math.min(8 * 60, totalMinutes) // Max 8h regular
      const overtimeMinutes = Math.max(0, totalMinutes - (8 * 60))
      
      return {
        date,
        totalHours: Math.floor(totalMinutes / 60),
        totalMinutes: totalMinutes % 60,
        jobs: entries.length,
        overtime: overtimeMinutes,
        earnings: calculateEarnings(regularHours) + calculateEarnings(overtimeMinutes, true),
        entries
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getWeeklyStats = () => {
    const daily = getDailyHoursSummary()
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
    
    const thisWeek = daily.filter(day => {
      const dayDate = new Date(day.date)
      return dayDate >= weekStart
    })

    const totalMinutes = thisWeek.reduce((sum, day) => sum + (day.totalHours * 60 + day.totalMinutes), 0)
    const totalOvertime = thisWeek.reduce((sum, day) => sum + day.overtime, 0)
    const totalEarnings = thisWeek.reduce((sum, day) => sum + day.earnings, 0)

    return {
      totalHours: Math.floor(totalMinutes / 60),
      totalMinutes: totalMinutes % 60,
      totalJobs: thisWeek.reduce((sum, day) => sum + day.jobs, 0),
      overtimeHours: Math.floor(totalOvertime / 60),
      earnings: totalEarnings,
      daysWorked: thisWeek.length
    }
  }

  const getTodaysActiveJob = () => {
    const today = new Date().toDateString()
    return timeEntries.find(entry => 
      entry.status === 'started' && 
      new Date(entry.startTime).toDateString() === today
    )
  }

  const dailySummary = getDailyHoursSummary()
  const weeklyStats = getWeeklyStats()
  const activeJob = getTodaysActiveJob()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl">Mina Timmar</DialogTitle>
          </div>
          <DialogDescription>
            Översikt över dina arbetstimmar och intjäning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Active Job Alert */}
          {activeJob && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Pågående arbete</p>
                    <p className="text-sm text-green-600">
                      {activeJob.customerName || activeJob.serviceType}
                    </p>
                    <p className="text-xs text-green-600">
                      {activeJob.jobNumber ? `${activeJob.jobNumber} • ` : ''}Startade {formatTime(activeJob.startTime)}
                    </p>
                  </div>
                  <PlayCircle className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Period Tabs */}
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Idag</TabsTrigger>
              <TabsTrigger value="week">Denna vecka</TabsTrigger>
              <TabsTrigger value="month">Denna månad</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4 mt-4">
              {dailySummary.length > 0 && new Date(dailySummary[0].date).toDateString() === new Date().toDateString() ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span>Idag</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#002A5C]">
                          {dailySummary[0].totalHours}h {dailySummary[0].totalMinutes}m
                        </div>
                        <div className="text-sm text-gray-600">Total tid</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {dailySummary[0].earnings} kr
                        </div>
                        <div className="text-sm text-gray-600">Intjäning</div>
                      </div>
                    </div>
                    
                    {dailySummary[0].overtime > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-800">
                            Övertid: {formatDuration(dailySummary[0].overtime)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Dagens jobb:</h4>
                      {dailySummary[0].entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{entry.serviceType}</div>
                            <div className="text-sm text-gray-600">
                              {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : 'Pågår'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {entry.duration ? formatDuration(entry.duration) : '-'}
                            </div>
                            {entry.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Inga registrerade timmar idag</p>
                    <p className="text-sm text-gray-500">Starta ett jobb för att börja logga tid</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="week" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Veckans statistik</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#002A5C]">
                        {weeklyStats.totalHours}h {weeklyStats.totalMinutes}m
                      </div>
                      <div className="text-sm text-gray-600">Total tid</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {weeklyStats.earnings} kr
                      </div>
                      <div className="text-sm text-gray-600">Intjäning</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-700">
                        {weeklyStats.totalJobs}
                      </div>
                      <div className="text-sm text-gray-600">Jobb</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">
                        {weeklyStats.overtimeHours}h
                      </div>
                      <div className="text-sm text-gray-600">Övertid</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Daglig fördelning:</h4>
                    {dailySummary.slice(0, 7).map((day) => (
                      <div key={day.date} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{formatDate(day.date)}</div>
                          <div className="text-sm text-gray-600">{day.jobs} jobb</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {day.totalHours}h {day.totalMinutes}m
                          </div>
                          <div className="text-sm text-green-600">{day.earnings} kr</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="month" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Månadsrapport</p>
                  <p className="text-sm text-gray-500">Kommer snart - detaljerad månadsstatistik</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Stäng
            </Button>
            <Button
              onClick={() => {
                // Export or print functionality
                alert('Export-funktion kommer snart!')
              }}
              className="flex-1 bg-[#002A5C] hover:bg-[#001a42]"
            >
              Exportera
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}