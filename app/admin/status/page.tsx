"use client"

import { useState, useEffect } from "react"
import { validateEnvVars } from "@/lib/env-check"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function StatusPage() {
  const [status, setStatus] = useState({
    supabaseConfigured: false,
    sendgridConfigured: false,
    twilioConfigured: false,
    baseUrlConfigured: false,
    loading: true
  })

  useEffect(() => {
    // Kör validering på klientsidan
    const envStatus = validateEnvVars()
    setStatus({
      ...envStatus,
      loading: false
    })
  }, [])

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Systemstatus</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Databasanslutning</span>
              <StatusBadge status={status.supabaseConfigured} loading={status.loading} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusItem 
              title="Supabase" 
              status={status.supabaseConfigured} 
              loading={status.loading}
              description="Anslutning till Supabase-databas och autentisering"
              errorMessage="Supabase-miljövariabler saknas eller är felaktiga"
              successMessage="Supabase är korrekt konfigurerad"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Notifieringstjänster</span>
              <StatusBadge 
                status={status.sendgridConfigured && status.twilioConfigured} 
                loading={status.loading} 
                warning={status.sendgridConfigured !== status.twilioConfigured}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusItem 
              title="SendGrid (E-post)" 
              status={status.sendgridConfigured} 
              loading={status.loading}
              description="Tjänst för att skicka e-postmeddelanden"
              errorMessage="SendGrid-miljövariabler saknas eller är felaktiga"
              successMessage="SendGrid är korrekt konfigurerad"
            />
            
            <StatusItem 
              title="Twilio (SMS)" 
              status={status.twilioConfigured} 
              loading={status.loading}
              description="Tjänst för att skicka SMS-meddelanden"
              errorMessage="Twilio-miljövariabler saknas eller är felaktiga"
              successMessage="Twilio är korrekt konfigurerad"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Applikationskonfiguration</span>
              <StatusBadge status={status.baseUrlConfigured} loading={status.loading} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusItem 
              title="Bas-URL" 
              status={status.baseUrlConfigured} 
              loading={status.loading}
              description="URL som används i e-post och SMS-meddelanden"
              errorMessage="NEXT_PUBLIC_BASE_URL miljövariabel saknas"
              successMessage="Bas-URL är korrekt konfigurerad"
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 text-gray-600">
        <h2 className="text-xl font-semibold mb-4">Hur man åtgärdar problem</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Kontrollera att .env.local-filen finns och har alla nödvändiga variabler</li>
          <li>Jämför med .env.local.example för att se vilka variabler som behövs</li>
          <li>För Supabase: Kontrollera att projektet existerar och API-nycklar är korrekta</li>
          <li>För SendGrid: Verifiera att API-nyckeln är aktiv och avsändaradressen är verifierad</li>
          <li>För Twilio: Kontrollera att kontot är aktivt och telefonnumret är korrekt formaterat</li>
        </ol>
      </div>
    </div>
  )
}

type StatusItemProps = {
  title: string
  status: boolean
  loading: boolean
  description: string
  errorMessage: string
  successMessage: string
}

function StatusItem({ title, status, loading, description, errorMessage, successMessage }: StatusItemProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="mt-1">
        {loading ? (
          <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
        ) : status ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
        {!loading && (
          <p className={`text-sm mt-1 ${status ? 'text-green-600' : 'text-red-600'}`}>
            {status ? successMessage : errorMessage}
          </p>
        )}
      </div>
    </div>
  )
}

type StatusBadgeProps = {
  status: boolean
  loading: boolean
  warning?: boolean
}

function StatusBadge({ status, loading, warning = false }: StatusBadgeProps) {
  if (loading) {
    return <Badge variant="outline" className="animate-pulse">Kontrollerar...</Badge>
  }
  
  if (warning) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Delvis
      </Badge>
    )
  }
  
  return status ? (
    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
      <CheckCircle className="w-3 h-3 mr-1" />
      OK
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
      <XCircle className="w-3 h-3 mr-1" />
      Fel
    </Badge>
  )
} 