'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  BellRing, 
  CheckCircle, 
  Clock, 
  Camera, 
  MapPin, 
  Coffee,
  Heart,
  Settings,
  X,
  TrendingUp,
  Zap
} from 'lucide-react'
import { smartTriggerService } from '../../lib/smart-triggers'

interface SmartNotification {
  id: string
  type: 'location_arrival' | 'time_warning' | 'documentation_reminder' | 'job_completion' | 'wellbeing_reminder'
  title: string
  message: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  isRead: boolean
  jobId?: string
  actions?: Array<{
    id: string
    label: string
    icon: any
    action: () => void
  }>
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  staffId: string
  onOpenCamera?: () => void
  onOpenHours?: () => void
  onNotificationCountChange?: (count: number) => void
}

export default function SmartNotificationCenter({ isOpen, onClose, staffId, onOpenCamera, onOpenHours, onNotificationCountChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([])
  const [triggerStats, setTriggerStats] = useState<any>({})
  const [smartTriggersEnabled, setSmartTriggersEnabled] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
      loadTriggerStats()
      
      // Start smart trigger service if enabled
      if (smartTriggersEnabled) {
        smartTriggerService.startMonitoring()
      }
    }

    return () => {
      if (!isOpen) {
        smartTriggerService.stopMonitoring()
      }
    }
  }, [isOpen, smartTriggersEnabled])

  const loadNotifications = () => {
    // Load notifications from localStorage and system
    const mockNotifications: SmartNotification[] = [
      {
        id: '1',
        type: 'location_arrival',
        title: '📍 Välkommen till uppdraget!',
        message: 'Du har anlänt till arbetslokalen. Glöm inte att ta "före"-bilder.',
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
        priority: 'medium',
        isRead: false,
        jobId: 'job_1',
        actions: [
          {
            id: 'take_photo',
            label: 'Ta foto',
            icon: Camera,
            action: () => handleTakePhoto()
          }
        ]
      },
      {
        id: '2',
        type: 'time_warning',
        title: '☕ Dags för paus!',
        message: 'Du har arbetat i 4 timmar. Ta en välförtjänt paus.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        priority: 'high',
        isRead: false,
        jobId: 'job_1',
        actions: [
          {
            id: 'view_hours',
            label: 'Visa timmar',
            icon: Clock,
            action: () => handleViewHours()
          }
        ]
      },
      {
        id: '3',
        type: 'documentation_reminder',
        title: '📸 Saknad dokumentation',
        message: 'Du har arbetat utan att ta bilder. Dokumentation krävs.',
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
        priority: 'critical',
        isRead: false,
        jobId: 'job_1',
        actions: [
          {
            id: 'take_photo_now',
            label: 'Ta foto nu',
            icon: Camera,
            action: () => handleTakePhoto()
          }
        ]
      }
    ]

    setNotifications(mockNotifications)
  }

  const loadTriggerStats = () => {
    const stats = smartTriggerService.getTriggerStats()
    setTriggerStats(stats)
  }

  const handleTakePhoto = () => {
    // Trigger camera functionality via parent
    if (onOpenCamera) {
      onOpenCamera()
      onClose()
    } else {
      alert('Kamera öppnas för fotodokumentation!')
    }
  }

  const handleViewHours = () => {
    // Open hours modal via parent
    if (onOpenHours) {
      onOpenHours()
      onClose()
    } else {
      alert('Mina Timmar öppnas!')
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
      
      // Update parent component with new unread count
      const unreadCount = updated.filter(n => !n.isRead).length
      if (onNotificationCountChange) {
        onNotificationCountChange(unreadCount)
      }
      
      return updated
    })
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId)
      
      // Update parent component with new unread count
      const unreadCount = updated.filter(n => !n.isRead).length
      if (onNotificationCountChange) {
        onNotificationCountChange(unreadCount)
      }
      
      return updated
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'location_arrival': return MapPin
      case 'time_warning': return Clock
      case 'documentation_reminder': return Camera
      case 'job_completion': return CheckCircle
      case 'wellbeing_reminder': return Heart
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800'
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'low': return 'bg-gray-50 border-gray-200 text-gray-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-600 text-white'
      case 'medium': return 'bg-blue-600 text-white'
      case 'low': return 'bg-gray-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'Nu'
    if (diffMinutes < 60) return `${diffMinutes}m sedan`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h sedan`
    return timestamp.toLocaleDateString('sv-SE')
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.isRead).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <div className="relative">
                <BellRing className="h-6 w-6 text-[#002A5C]" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </div>
                )}
              </div>
              <span>Smarta påminnelser</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Smart Triggers Status */}
          <div className="mt-3 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Smart Triggers</span>
              <Badge className={smartTriggersEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
                {smartTriggersEnabled ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSmartTriggersEnabled(!smartTriggersEnabled)}
              className="h-8"
            >
              <Settings className="h-3 w-3 mr-1" />
              {smartTriggersEnabled ? 'Stäng av' : 'Aktivera'}
            </Button>
          </div>

          {/* Statistics */}
          {triggerStats.totalTriggered > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded border">
                <div className="text-lg font-bold text-[#002A5C]">{triggerStats.totalTriggered}</div>
                <div className="text-xs text-gray-600">Totalt</div>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="text-lg font-bold text-green-600">{unreadCount}</div>
                <div className="text-xs text-gray-600">Olästa</div>
              </div>
              <div className="bg-white p-2 rounded border">
                <div className="text-lg font-bold text-red-600">{criticalCount}</div>
                <div className="text-xs text-gray-600">Kritiska</div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Inga aktiva påminnelser</p>
              <p className="text-sm text-gray-500">Smarta notifikationer visas här automatiskt</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              return (
                <Card key={notification.id} className={`border-2 ${getPriorityColor(notification.priority)} ${!notification.isRead ? 'shadow-md' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm leading-tight">{notification.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={`text-xs ${getPriorityBadgeColor(notification.priority)}`}>
                              {notification.priority === 'critical' ? 'Kritisk' :
                               notification.priority === 'high' ? 'Hög' :
                               notification.priority === 'medium' ? 'Medium' : 'Låg'}
                            </Badge>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{notification.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                          
                          <div className="flex items-center space-x-2">
                            {notification.actions?.map((action) => (
                              <Button
                                key={action.id}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  action.action()
                                  markAsRead(notification.id)
                                }}
                                className="h-8 text-xs"
                              >
                                <action.icon className="h-3 w-3 mr-1" />
                                {action.label}
                              </Button>
                            ))}
                            
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Markera läst
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissNotification(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </CardContent>

        {/* Quick Actions Footer */}
        <div className="flex-shrink-0 border-t bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNotifications(prev => {
                    const updated = prev.map(n => ({ ...n, isRead: true }))
                    
                    // Update parent component with new unread count (0)
                    if (onNotificationCountChange) {
                      onNotificationCountChange(0)
                    }
                    
                    return updated
                  })
                }}
                disabled={unreadCount === 0}
                className="h-9"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Markera alla lästa
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Show trigger configuration
                  alert('Trigger-inställningar kommer snart!')
                }}
                size="sm"
                className="h-9"
              >
                <Settings className="h-4 w-4 mr-2" />
                Inställningar
              </Button>
              
              <Button onClick={onClose} className="h-9 bg-[#002A5C] hover:bg-[#001a42]">
                Stäng
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}