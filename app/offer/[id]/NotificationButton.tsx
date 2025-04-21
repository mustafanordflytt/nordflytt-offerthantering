"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Mail, Send, Smartphone } from "lucide-react"
import type { Offer } from "../../../types/offer"

interface NotificationButtonProps {
  offer: Offer
}

/**
 * Komponent för att skicka notifieringar för en offert
 */
export default function NotificationButton({ offer }: NotificationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    emailSent?: boolean
    smsSent?: boolean
    error?: string
  } | null>(null)

  const sendNotifications = async () => {
    if (!offer.email && !offer.phone) {
      setResult({
        success: false,
        error: "Varken e-post eller telefonnummer finns tillgängligt för denna kund"
      })
      return
    }
    
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch("/api/send-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offer),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Något gick fel vid sändning av notifieringar")
      }
      
      setResult({
        success: true,
        emailSent: data.emailSent,
        smsSent: data.smsSent
      })
    } catch (error) {
      console.error("Error sending notifications:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Okänt fel uppstod"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Om kunden saknar kontaktuppgifter
  const hasMissingContactInfo = !offer.email && !offer.phone

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 mb-4">
        <Button
          onClick={sendNotifications}
          disabled={loading || hasMissingContactInfo}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Skicka notifieringar
        </Button>
        
        <div className="flex items-center gap-6 ml-4">
          <div className="flex items-center gap-2">
            <Mail className={`w-5 h-5 ${offer.email ? "text-blue-500" : "text-gray-300"}`} />
            <span className={offer.email ? "text-gray-700" : "text-gray-400"}>
              {offer.email || "Ingen e-post"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Smartphone className={`w-5 h-5 ${offer.phone ? "text-blue-500" : "text-gray-300"}`} />
            <span className={offer.phone ? "text-gray-700" : "text-gray-400"}>
              {offer.phone || "Inget telefonnummer"}
            </span>
          </div>
        </div>
      </div>
      
      {result && (
        <Alert
          variant={result.success ? "default" : "destructive"}
          className="mt-4"
        >
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {result.success ? "Notifieringar skickade" : "Fel uppstod"}
          </AlertTitle>
          <AlertDescription>
            {result.success ? (
              <div>
                {result.emailSent && result.smsSent ? (
                  "Både e-post och SMS skickades framgångsrikt."
                ) : result.emailSent ? (
                  "E-post skickades framgångsrikt, men SMS misslyckades."
                ) : result.smsSent ? (
                  "SMS skickades framgångsrikt, men e-post misslyckades."
                ) : (
                  "Varken e-post eller SMS kunde skickas. Kontrollera kundens kontaktuppgifter."
                )}
              </div>
            ) : (
              result.error
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 