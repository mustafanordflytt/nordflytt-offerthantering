'use client'

import { useState, useEffect } from 'react'
import { Mail, MessageSquare, Bell, Settings, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/token-helper'

interface NotificationPreferencesProps {
  entityType: 'customer' | 'employee'
  entityId: string
}

interface Preferences {
  emailEnabled: boolean
  emailBookingConfirmations: boolean
  emailInvoiceReminders: boolean
  emailJobUpdates: boolean
  emailMarketing: boolean
  smsEnabled: boolean
  smsBookingConfirmations: boolean
  smsJobReminders: boolean
  smsUrgentUpdates: boolean
  smsMarketing: boolean
}

export function NotificationPreferences({ entityType, entityId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [entityType, entityId])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      
      const response = await fetch(
        `/api/notifications/preferences?entityType=${entityType}&entityId=${entityId}`,
        { headers }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }
      
      const result = await response.json()
      setPreferences(result.preferences)
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast.error('Kunde inte hämta inställningar')
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<Preferences>) => {
    if (!preferences) return

    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)

    try {
      setSaving(true)
      const headers = await getAuthHeaders()
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entityType,
          entityId,
          preferences: updates
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }
      
      toast.success('Inställningar sparade')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Kunde inte spara inställningar')
      // Revert changes
      setPreferences(preferences)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Kunde inte ladda inställningar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-postmeddelanden
          </CardTitle>
          <CardDescription>
            Hantera dina e-postnotifikationer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled" className="text-base">
                Aktivera e-postmeddelanden
              </Label>
              <div className="text-sm text-muted-foreground">
                Huvudbrytare för alla e-postnotifikationer
              </div>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => 
                updatePreferences({ emailEnabled: checked })
              }
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="space-y-4 opacity-75">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Bokningsbekräftelser</Label>
                <div className="text-xs text-muted-foreground">
                  När en bokning skapas eller ändras
                </div>
              </div>
              <Switch
                checked={preferences.emailBookingConfirmations && preferences.emailEnabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ emailBookingConfirmations: checked })
                }
                disabled={!preferences.emailEnabled || saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Fakturapåminnelser</Label>
                <div className="text-xs text-muted-foreground">
                  När fakturor skapas eller förfaller
                </div>
              </div>
              <Switch
                checked={preferences.emailInvoiceReminders && preferences.emailEnabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ emailInvoiceReminders: checked })
                }
                disabled={!preferences.emailEnabled || saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Jobbuppdateringar</Label>
                <div className="text-xs text-muted-foreground">
                  Statusuppdateringar och påminnelser
                </div>
              </div>
              <Switch
                checked={preferences.emailJobUpdates && preferences.emailEnabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ emailJobUpdates: checked })
                }
                disabled={!preferences.emailEnabled || saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Marknadsföring</Label>
                <div className="text-xs text-muted-foreground">
                  Erbjudanden och nyheter
                </div>
              </div>
              <Switch
                checked={preferences.emailMarketing && preferences.emailEnabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ emailMarketing: checked })
                }
                disabled={!preferences.emailEnabled || saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS-meddelanden
          </CardTitle>
          <CardDescription>
            Hantera dina SMS-notifikationer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-enabled" className="text-base">
                Aktivera SMS-meddelanden
              </Label>
              <div className="text-sm text-muted-foreground">
                Huvudbrytare för alla SMS-notifikationer
              </div>
            </div>
            <Switch
              id="sms-enabled"
              checked={preferences.smsEnabled}
              onCheckedChange={(checked) => 
                updatePreferences({ smsEnabled: checked })
              }
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="space-y-4 opacity-75">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Bokningsbekräftelser</Label>
                <div className="text-xs text-muted-foreground">
                  Snabb bekräftelse via SMS
                </div>
              </div>
              <Switch
                checked={preferences.smsBookingConfirmations && preferences.smsEnabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ smsBookingConfirmations: checked })
                }
                disabled={!preferences.smsEnabled || saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Jobbpåminnelser</Label>
                <div className="text-xs text-muted-foreground">
                  Påminnelser dagen före flyttdatum
                </div>
              </div>
              <Switch
                checked={preferences.smsJobReminders && preferences.smsEnabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ smsJobReminders: checked })
                }
                disabled={!preferences.smsEnabled || saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Akuta uppdateringar</Label>
                <div className="text-xs text-muted-foreground">
                  Viktiga meddelanden som kräver snabb uppmärksamhet
                </div>
              </div>
              <Switch
                checked={preferences.smsUrgentUpdates && preferences.smsEnabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ smsUrgentUpdates: checked })
                }
                disabled={!preferences.smsEnabled || saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Marknadsföring</Label>
                <div className="text-xs text-muted-foreground">
                  Erbjudanden via SMS
                </div>
              </div>
              <Switch
                checked={preferences.smsMarketing && preferences.smsEnabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ smsMarketing: checked })
                }
                disabled={!preferences.smsEnabled || saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Ytterligare inställningar
          </CardTitle>
          <CardDescription>
            Övriga notifikationsinställningar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Fler inställningar som tystläge och schemalagda tider kommer snart.</p>
            <p className="mt-2">
              <strong>Observera:</strong> Akuta meddelanden kan fortfarande skickas även om 
              vissa inställningar är avstängda.
            </p>
          </div>
        </CardContent>
      </Card>

      {saving && (
        <Card>
          <CardContent className="text-center py-4">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Sparar inställningar...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}