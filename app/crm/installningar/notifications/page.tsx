'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { NotificationTester } from '@/components/notifications/NotificationTester'

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifikationsinställningar</h1>
        <p className="text-muted-foreground">
          Hantera e-post- och SMS-inställningar för systemet
        </p>
      </div>

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList>
          <TabsTrigger value="preferences">Inställningar</TabsTrigger>
          <TabsTrigger value="test">Testa notifikationer</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          <NotificationPreferences 
            entityType="employee" 
            entityId="current-user-id" // This should be dynamically set
          />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <NotificationTester />
        </TabsContent>
      </Tabs>
    </div>
  )
}