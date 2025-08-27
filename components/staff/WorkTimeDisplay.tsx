'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Clock, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface WorkTimeData {
  todayHours: number
  todayMinutes: number
  weekHours: number
  monthHours: number
  activeJob: string | null
  startTime: string | null
  overtime: boolean
}

export default function WorkTimeDisplay() {
  const [workTime, setWorkTime] = useState<WorkTimeData>({
    todayHours: 0,
    todayMinutes: 0,
    weekHours: 0,
    monthHours: 0,
    activeJob: null,
    startTime: null,
    overtime: false
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      updateWorkTime()
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const updateWorkTime = () => {
    // Get time tracking data from localStorage
    const tracking = localStorage.getItem('staff_timeTracking')
    if (tracking) {
      const data = JSON.parse(tracking)
      const activeSession = data.sessions?.find((s: any) => !s.endTime)
      
      if (activeSession) {
        const start = new Date(activeSession.startTime)
        const now = new Date()
        const diff = now.getTime() - start.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        setWorkTime(prev => ({
          ...prev,
          todayHours: hours,
          todayMinutes: minutes,
          activeJob: activeSession.jobId,
          startTime: activeSession.startTime,
          overtime: hours >= 8
        }))
      }
    }

    // Calculate week and month totals
    const weekTotal = calculateWeekTotal()
    const monthTotal = calculateMonthTotal()
    
    setWorkTime(prev => ({
      ...prev,
      weekHours: weekTotal,
      monthHours: monthTotal
    }))
  }

  const calculateWeekTotal = () => {
    // Mock data - in real app, fetch from database
    return 32.5
  }

  const calculateMonthTotal = () => {
    // Mock data - in real app, fetch from database
    return 156.25
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      {/* Dagens arbetstid */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Idag</span>
          </div>
          {workTime.overtime && (
            <span className="text-xs text-orange-600">Övertid</span>
          )}
        </div>
        
        <div className="text-lg font-semibold text-gray-900">
          {workTime.todayHours}h {workTime.todayMinutes}m
        </div>
        
        {workTime.activeJob && (
          <div className="mt-2 text-xs text-gray-600 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Sedan {new Date(workTime.startTime!).toLocaleTimeString('sv-SE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>

      {/* Veckans arbetstid */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Vecka</span>
        </div>
        
        <div className="text-lg font-semibold text-gray-900">
          {workTime.weekHours}h
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          {40 - workTime.weekHours > 0 
            ? `${(40 - workTime.weekHours).toFixed(1)}h kvar`
            : `${(workTime.weekHours - 40).toFixed(1)}h övertid`
          }
        </div>
      </div>

      {/* Månadens arbetstid */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Månad</span>
        </div>
        
        <div className="text-lg font-semibold text-gray-900">
          {workTime.monthHours}h
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          ⌀ {(workTime.monthHours / new Date().getDate()).toFixed(1)}h/dag
        </div>
      </div>
    </div>
  )
}