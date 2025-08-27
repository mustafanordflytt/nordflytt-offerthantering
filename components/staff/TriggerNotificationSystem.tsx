'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  MapPin, 
  Clock, 
  Camera, 
  CheckCircle,
  AlertTriangle,
  X,
  Navigation,
  PlayCircle
} from 'lucide-react'

interface TriggerNotification {
  id: string
  type: 'location' | 'time' | 'checklist' | 'photo'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  actions: Array<{
    id: string
    label: string
    type: 'primary' | 'secondary' | 'danger'
    icon?: React.ReactNode
  }>
  jobId?: string
  autoHide?: boolean
  hideAfter?: number
}

interface TriggerNotificationSystemProps {
  activeJobId: string | null
  isJobStarted: boolean
  timeRemaining: number // minutes until scheduled end
  missingPhotos: string[]
  onStartJob: () => void
  onNavigateToJob: () => void
  onOpenCamera: () => void
  onDismiss: (notificationId: string) => void
}

export default function TriggerNotificationSystem({
  activeJobId,
  isJobStarted,
  timeRemaining,
  missingPhotos,
  onStartJob,
  onNavigateToJob,
  onOpenCamera,
  onDismiss
}: TriggerNotificationSystemProps) {
  const [notifications, setNotifications] = useState<TriggerNotification[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Generate smart trigger notifications based on job state
  useEffect(() => {
    const newNotifications: TriggerNotification[] = []

    // 1. "Du är på plats – starta jobbet?" 
    if (activeJobId && !isJobStarted) {
      newNotifications.push({
        id: `location-start-${activeJobId}`,
        type: 'location',
        title: 'Du är på plats – starta jobbet?',
        message: 'GPS visar att du är framme. Klicka för att starta uppdraget.',
        priority: 'high',
        actions: [
          {
            id: 'start-job',
            label: 'Starta jobbet',
            type: 'primary',
            icon: <PlayCircle className="h-4 w-4" />
          },
          {
            id: 'navigate',
            label: 'Navigera',
            type: 'secondary',
            icon: <Navigation className="h-4 w-4" />
          }
        ],
        jobId: activeJobId
      })
    }

    // 2. "20 min kvar – är du klar?"
    if (isJobStarted && timeRemaining <= 20 && timeRemaining > 0) {
      newNotifications.push({
        id: `time-warning-${activeJobId}`,
        type: 'time',
        title: `${timeRemaining} min kvar – är du klar?`,
        message: 'Schemalagd sluttid närmar sig. Kontrollera att allt är klart.',
        priority: 'medium',
        actions: [
          {
            id: 'check-progress',
            label: 'Kontrollera',
            type: 'primary',
            icon: <CheckCircle className="h-4 w-4" />
          }
        ],
        jobId: activeJobId
      })
    }

    // 3. "Checklistan saknar bilder på moment X" - Visa endast om jobb är startat
    if (isJobStarted && missingPhotos.length > 0) {
      newNotifications.push({
        id: `missing-photos-${activeJobId}`,
        type: 'photo',
        title: 'Checklistan saknar bilder',
        message: `${missingPhotos.length} obligatoriska foton saknas: ${missingPhotos.join(', ')}`,
        priority: 'high',
        actions: [
          {
            id: 'take-photos',
            label: 'Ta foton',
            type: 'primary',
            icon: <Camera className="h-4 w-4" />
          }
        ],
        jobId: activeJobId
      })
    }

    // Filter out dismissed notifications
    const filteredNotifications = newNotifications.filter(n => !dismissedIds.has(n.id))
    
    setNotifications(filteredNotifications)
  }, [activeJobId, isJobStarted, timeRemaining, missingPhotos, dismissedIds])

  const handleAction = (notificationId: string, actionId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (!notification) return

    switch (actionId) {
      case 'start-job':
        onStartJob()
        break
      case 'navigate':
        onNavigateToJob()
        break
      case 'take-photos':
        onOpenCamera()
        break
      case 'check-progress':
        // Show progress/checklist
        break
    }

    // Auto-dismiss after action
    handleDismiss(notificationId)
  }

  const handleDismiss = (notificationId: string) => {
    setDismissedIds(prev => new Set(prev).add(notificationId))
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    onDismiss(notificationId)
  }

  const getStatusColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200'
      case 'medium': return 'bg-orange-50 border-orange-200'
      case 'low': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'location': return <MapPin className="h-5 w-5 text-blue-600" />
      case 'time': return <Clock className="h-5 w-5 text-orange-600" />
      case 'photo': return <Camera className="h-5 w-5 text-red-600" />
      case 'checklist': return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = (priority: string) => {
    switch (priority) {
      case 'high': return { text: 'Missat', color: 'bg-red-500' }
      case 'medium': return { text: 'Delvis', color: 'bg-orange-500' }
      case 'low': return { text: 'Klart', color: 'bg-green-500' }
      default: return { text: 'Info', color: 'bg-gray-500' }
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const statusInfo = getStatusText(notification.priority)
        
        return (
          <Card key={notification.id} className={`${getStatusColor(notification.priority)} border-2 shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${statusInfo.color} text-white text-xs px-2 py-1`}>
                        {statusInfo.text}
                      </Badge>
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    {notification.message}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {notification.actions.map((action) => (
                      <Button
                        key={action.id}
                        onClick={() => handleAction(notification.id, action.id)}
                        variant={action.type === 'primary' ? 'default' : 'outline'}
                        size="sm"
                        className={`h-8 text-xs ${
                          action.type === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : ''
                        } ${
                          action.type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                        }`}
                      >
                        {action.icon && <span className="mr-1">{action.icon}</span>}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}