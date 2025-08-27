'use client'

import { useOffline } from '@/hooks/use-offline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wifi, 
  WifiOff, 
  Upload, 
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { useState } from 'react'

interface Props {
  className?: string
  showDetails?: boolean
}

export default function OfflineIndicator({ className = '', showDetails = false }: Props) {
  const { 
    isOnline, 
    queuedItems, 
    processQueue, 
    clearQueue, 
    getQueueCount 
  } = useOffline()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQueueDetails, setShowQueueDetails] = useState(false)
  
  const queueCount = getQueueCount()

  const handleProcessQueue = async () => {
    setIsProcessing(true)
    try {
      await processQueue()
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-100 text-red-800 border-red-200'
    if (queueCount > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />
    if (queueCount > 0) return <Clock className="w-4 h-4" />
    return <Wifi className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (queueCount > 0) return `${queueCount} väntande`
    return 'Online'
  }

  if (isOnline && queueCount === 0 && !showDetails) {
    return null // Don't show indicator when everything is working normally
  }

  return (
    <div className={className}>
      {/* Compact Status Badge */}
      <Badge 
        variant="outline" 
        className={`flex items-center space-x-2 cursor-pointer ${getStatusColor()}`}
        onClick={() => setShowQueueDetails(!showQueueDetails)}
      >
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>

      {/* Detailed Queue Status */}
      {(showQueueDetails || showDetails) && (
        <Card className="mt-2 w-80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <CardTitle className="text-lg">
                  {isOnline ? 'Online' : 'Offline-läge'}
                </CardTitle>
              </div>
              {queueCount > 0 && isOnline && (
                <Button
                  size="sm"
                  onClick={handleProcessQueue}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Synkroniserar...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3 mr-1" />
                      Synka
                    </>
                  )}
                </Button>
              )}
            </div>
            <CardDescription>
              {isOnline 
                ? 'Ansluten till servern'
                : 'Ändringar sparas lokalt tills du är online igen'
              }
            </CardDescription>
          </CardHeader>

          {queueCount > 0 && (
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Väntande synkronisering:</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    {queueCount} objekt
                  </Badge>
                </div>

                <div className="space-y-2">
                  {queuedItems.slice(0, 5).map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        {getQueueItemIcon(item.type)}
                        <span className="font-medium">
                          {getQueueItemLabel(item.type)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500">
                        {item.retries > 0 && (
                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-600">
                            Försök {item.retries + 1}
                          </Badge>
                        )}
                        <span>{new Date(item.timestamp).toLocaleTimeString('sv-SE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  ))}
                  
                  {queuedItems.length > 5 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{queuedItems.length - 5} fler objekt
                    </div>
                  )}
                </div>

                {!isOnline && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Du jobbar offline</p>
                        <p>
                          Alla ändringar sparas lokalt och kommer att synkroniseras 
                          automatiskt när du får internetanslutning igen.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {queueCount > 0 && (
                  <div className="flex space-x-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearQueue}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Rensa kö
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

function getQueueItemIcon(type: string) {
  switch (type) {
    case 'job-update':
      return <CheckCircle className="w-3 h-3 text-blue-600" />
    case 'time-report':
      return <Clock className="w-3 h-3 text-green-600" />
    case 'photo-upload':
      return <Upload className="w-3 h-3 text-purple-600" />
    default:
      return <AlertTriangle className="w-3 h-3 text-gray-600" />
  }
}

function getQueueItemLabel(type: string): string {
  switch (type) {
    case 'job-update':
      return 'Jobbuppdatering'
    case 'time-report':
      return 'Tidsrapport'
    case 'photo-upload':
      return 'Fotouppladdning'
    default:
      return 'Okänd uppdatering'
  }
}