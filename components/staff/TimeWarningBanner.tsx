'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  AlertTriangle, 
  Coffee, 
  X,
  Timer,
  TrendingUp
} from 'lucide-react'
import { TimeWarning } from '../../lib/time-tracking'

interface TimeWarningBannerProps {
  warnings: TimeWarning[]
  onDismiss: (type: TimeWarning['type']) => void
  onAction?: (type: TimeWarning['type']) => void
}

export default function TimeWarningBanner({ warnings, onDismiss, onAction }: TimeWarningBannerProps) {
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load dismissed warnings from localStorage
    const dismissed = localStorage.getItem('dismissed_time_warnings')
    if (dismissed) {
      setDismissedWarnings(new Set(JSON.parse(dismissed)))
    }
  }, [])

  const handleDismiss = (type: TimeWarning['type']) => {
    const newDismissed = new Set(dismissedWarnings)
    newDismissed.add(type)
    setDismissedWarnings(newDismissed)
    localStorage.setItem('dismissed_time_warnings', JSON.stringify(Array.from(newDismissed)))
    onDismiss(type)
  }

  const getWarningIcon = (type: TimeWarning['type']) => {
    switch (type) {
      case 'approaching_end':
        return <Clock className="h-5 w-5" />
      case 'overtime':
        return <AlertTriangle className="h-5 w-5" />
      case 'break_reminder':
        return <Coffee className="h-5 w-5" />
      case 'long_shift':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <Timer className="h-5 w-5" />
    }
  }

  const getWarningColor = (severity: TimeWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getBadgeColor = (severity: TimeWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'warning':
        return 'bg-orange-600 text-white'
      case 'info':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  const getActionText = (type: TimeWarning['type']) => {
    switch (type) {
      case 'approaching_end':
        return 'Börja avsluta'
      case 'overtime':
        return 'Rapportera övertid'
      case 'break_reminder':
        return 'Ta paus nu'
      case 'long_shift':
        return 'Visa timmar'
      default:
        return 'Hantera'
    }
  }

  // Filter out dismissed warnings and only show the most severe
  const activeWarnings = warnings.filter(warning => !dismissedWarnings.has(warning.type))
  
  if (activeWarnings.length === 0) return null

  // Sort by severity (critical first)
  const sortedWarnings = activeWarnings.sort((a, b) => {
    const severityOrder = { critical: 3, warning: 2, info: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })

  return (
    <div className="space-y-2">
      {sortedWarnings.map((warning) => (
        <Card key={warning.type} className={`border-l-4 ${getWarningColor(warning.severity)}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getWarningIcon(warning.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-sm">{warning.title}</h3>
                  <Badge className={`text-xs ${getBadgeColor(warning.severity)}`}>
                    {warning.severity === 'critical' ? 'Kritisk' : 
                     warning.severity === 'warning' ? 'Varning' : 'Info'}
                  </Badge>
                </div>
                <p className="text-sm opacity-90">{warning.message}</p>
                
                {warning.actionRequired && (
                  <div className="mt-3 flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onAction?.(warning.type)}
                      className={`
                        ${warning.severity === 'critical' 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : warning.severity === 'warning'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }
                      `}
                    >
                      {getActionText(warning.type)}
                    </Button>
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(warning.type)}
                className="flex-shrink-0 h-8 w-8 p-0 hover:bg-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}