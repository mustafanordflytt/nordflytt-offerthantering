'use client'

import { useRealtimeStaff } from '@/hooks/use-realtime-staff'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Wifi, WifiOff, Loader2, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface Props {
  staffId?: string
  className?: string
}

export default function RealtimeStatus({ staffId, className = '' }: Props) {
  const { 
    connectionStatus, 
    notifications, 
    unreadCount, 
    jobUpdates, 
    markNotificationRead,
    isConnected,
    isConnecting 
  } = useRealtimeStaff(staffId)
  
  const [showNotifications, setShowNotifications] = useState(false)

  const getConnectionIcon = () => {
    if (isConnecting) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    if (isConnected) {
      return <Wifi className="w-4 h-4 text-green-600" />
    }
    return <WifiOff className="w-4 h-4 text-red-600" />
  }

  const getConnectionText = () => {
    if (isConnecting) return 'Ansluter...'
    if (isConnected) return 'Ansluten'
    return 'Frånkopplad'
  }

  const getConnectionColor = () => {
    if (isConnecting) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (isConnected) return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection Status */}
      <Badge 
        variant="outline" 
        className={`flex items-center space-x-1 ${getConnectionColor()}`}
      >
        {getConnectionIcon()}
        <span className="text-xs">{getConnectionText()}</span>
      </Badge>

      {/* Notifications */}
      {unreadCount > 0 && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 px-1 py-0 text-xs bg-red-500 text-white"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">Notifieringar</h3>
              </div>
              
              <div className="py-2">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-3 py-2 hover:bg-gray-50 cursor-pointer border-l-4 ${
                      notification.read 
                        ? 'border-gray-200' 
                        : 'border-blue-500 bg-blue-50'
                    }`}
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          notification.read ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
                
                {notifications.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    Inga notifieringar
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Job Updates Indicator */}
      {jobUpdates.length > 0 && (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          {jobUpdates.length} uppdatering{jobUpdates.length !== 1 ? 'ar' : ''}
        </Badge>
      )}

      {/* Click outside handler for notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}