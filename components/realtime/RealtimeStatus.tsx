'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, Activity, Users, Bell, Calendar, Briefcase, Circle } from 'lucide-react'
import { realtimeManager } from '@/lib/realtime/realtime-manager'
import { toast } from 'sonner'

interface RealtimeStatusProps {
  showDetails?: boolean
  className?: string
}

export function RealtimeStatus({ showDetails = false, className }: RealtimeStatusProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [activeChannels, setActiveChannels] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')
  const [lastHeartbeat, setLastHeartbeat] = useState<string>('')

  useEffect(() => {
    // Check connection status periodically
    const checkStatus = () => {
      const status = (realtimeManager as any).supabase?.realtime?.connection?.readyState === 1
      setIsConnected(status)
      setConnectionStatus(status ? 'connected' : 'disconnected')
      
      const channels = (realtimeManager as any).channels ? 
        Array.from((realtimeManager as any).channels.keys()) : []
      setActiveChannels(channels)
      
      if (status) {
        setLastHeartbeat(new Date().toLocaleTimeString('sv-SE'))
      }
    }

    // Initial check
    checkStatus()

    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  const reconnect = async () => {
    setConnectionStatus('connecting')
    try {
      // Force reconnection by creating a test channel
      const testChannel = (realtimeManager as any).supabase
        .channel('reconnect_test')
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected')
            setIsConnected(true)
            toast.success('Real-time anslutning återställd')
            // Clean up test channel
            setTimeout(() => {
              (realtimeManager as any).supabase.removeChannel(testChannel)
            }, 1000)
          }
        })
    } catch (error) {
      console.error('Reconnection failed:', error)
      setConnectionStatus('disconnected')
      setIsConnected(false)
      toast.error('Kunde inte återställa anslutning')
    }
  }

  const getChannelIcon = (channelName: string) => {
    if (channelName.includes('job')) return <Briefcase className="h-3 w-3" />
    if (channelName.includes('notification')) return <Bell className="h-3 w-3" />
    if (channelName.includes('booking') || channelName.includes('calendar')) return <Calendar className="h-3 w-3" />
    if (channelName.includes('presence')) return <Users className="h-3 w-3" />
    return <Activity className="h-3 w-3" />
  }

  const getChannelLabel = (channelName: string): string => {
    if (channelName.includes('jobs')) return 'Uppdrag'
    if (channelName.includes('notifications')) return 'Notifikationer'
    if (channelName.includes('bookings')) return 'Bokningar'
    if (channelName.includes('leads')) return 'Leads'
    if (channelName.includes('customers')) return 'Kunder'
    if (channelName.includes('presence')) return 'Närvaro'
    if (channelName.includes('custom')) return 'Anpassad kanal'
    return channelName
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <Badge 
            variant={isConnected ? 'default' : 'destructive'}
            className="text-xs"
          >
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>
        {activeChannels.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {activeChannels.length} kanaler
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            Real-time Status
          </div>
          <Badge 
            variant={isConnected ? 'default' : 'destructive'}
            className="ml-2"
          >
            {connectionStatus === 'connecting' ? 'Ansluter...' : 
             connectionStatus === 'connected' ? 'Ansluten' : 'Frånkopplad'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Live-uppdateringar för dashboard och notifikationer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Anslutningsstatus</p>
            <p className="text-xs text-muted-foreground">
              {isConnected 
                ? `Senaste heartbeat: ${lastHeartbeat}` 
                : 'Ingen aktiv anslutning'
              }
            </p>
          </div>
          {!isConnected && (
            <Button 
              size="sm" 
              onClick={reconnect}
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? 'Ansluter...' : 'Återanslut'}
            </Button>
          )}
        </div>

        {activeChannels.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">
              Aktiva kanaler ({activeChannels.length})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {activeChannels.map((channel, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                >
                  <div className="flex items-center gap-2">
                    {getChannelIcon(channel)}
                    <span>{getChannelLabel(channel)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    <span className="text-muted-foreground">aktiv</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChannels.length === 0 && isConnected && (
          <div className="text-center py-4 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Inga aktiva kanaler</p>
            <p className="text-xs">Kanaler aktiveras när du öppnar relevanta sidor</p>
          </div>
        )}

        {!isConnected && (
          <div className="text-center py-4 text-muted-foreground">
            <WifiOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Real-time funktioner avstängda</p>
            <p className="text-xs">Vissa uppdateringar kan vara försenade</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}