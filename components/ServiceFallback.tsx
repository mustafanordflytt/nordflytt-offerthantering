'use client'

import { AlertCircle, RefreshCw, WifiOff, Database, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

interface ServiceFallbackProps {
  service: 'google-maps' | 'supabase' | 'network' | 'unknown'
  error?: Error | null
  onRetry?: () => void
  children?: React.ReactNode
}

export function ServiceFallback({ 
  service, 
  error, 
  onRetry,
  children 
}: ServiceFallbackProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getServiceInfo = () => {
    switch (service) {
      case 'google-maps':
        return {
          icon: Map,
          title: 'Karttjänsten är inte tillgänglig',
          description: 'Google Maps kunde inte laddas. Du kan fortfarande fylla i adresser manuellt.',
          showManualInput: true
        }
      case 'supabase':
        return {
          icon: Database,
          title: 'Databasanslutning misslyckades',
          description: 'Vi kunde inte ansluta till databasen. Försök igen om en stund.',
          showRetry: true
        }
      case 'network':
        return {
          icon: WifiOff,
          title: 'Ingen internetanslutning',
          description: 'Kontrollera din internetanslutning och försök igen.',
          showNetworkStatus: true
        }
      default:
        return {
          icon: AlertCircle,
          title: 'Tjänsten är inte tillgänglig',
          description: 'Ett oväntat fel har uppstått. Försök igen senare.',
          showRetry: true
        }
    }
  }

  const info = getServiceInfo()
  const Icon = info.icon

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Icon className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <CardTitle className="text-center">{info.title}</CardTitle>
        <CardDescription className="text-center">
          {info.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isOnline && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Offline</AlertTitle>
            <AlertDescription>
              Du är inte ansluten till internet
            </AlertDescription>
          </Alert>
        )}

        {error && process.env.NODE_ENV === 'development' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Feldetaljer</AlertTitle>
            <AlertDescription className="font-mono text-xs">
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {info.showManualInput && children && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Fyll i adressen manuellt:
            </p>
            {children}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {(info.showRetry || onRetry) && (
            <Button 
              onClick={onRetry || (() => window.location.reload())}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Försök igen
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            Gå tillbaka
          </Button>
        </div>

        <div className="text-center text-sm text-gray-500 pt-4">
          <p>Problem kvarstår?</p>
          <a 
            href="tel:010-555-12-89" 
            className="text-blue-600 hover:underline"
          >
            Ring 010-555 12 89
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

// Google Maps Fallback component
export function GoogleMapsFallback({ children }: { children: React.ReactNode }) {
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Check if Google Maps is loaded
    const checkMaps = () => {
      if (window.google?.maps) {
        setMapsLoaded(true)
      } else {
        setError(new Error('Google Maps kunde inte laddas'))
      }
    }

    // Give it some time to load
    const timeout = setTimeout(checkMaps, 5000)

    // Also check immediately
    if (window.google?.maps) {
      setMapsLoaded(true)
      clearTimeout(timeout)
    }

    return () => clearTimeout(timeout)
  }, [])

  if (mapsLoaded) {
    return <>{children}</>
  }

  return (
    <ServiceFallback 
      service="google-maps" 
      error={error}
      onRetry={() => window.location.reload()}
    >
      {children}
    </ServiceFallback>
  )
}

// Supabase Fallback wrapper
export function SupabaseFallback({ 
  error, 
  onRetry,
  children 
}: { 
  error?: Error | null
  onRetry?: () => void
  children?: React.ReactNode 
}) {
  return (
    <ServiceFallback 
      service="supabase" 
      error={error}
      onRetry={onRetry}
    >
      {children}
    </ServiceFallback>
  )
}

// Network check wrapper
export function NetworkFallback({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOnline) {
    return <ServiceFallback service="network" />
  }

  return <>{children}</>
}