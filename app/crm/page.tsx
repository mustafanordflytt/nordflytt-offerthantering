"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerList } from "@/components/crm/CustomerList"
import { OfferOverview } from "@/components/crm/OfferOverview"
import { Schedule } from "@/components/crm/Schedule"
import { CustomerDetails } from "@/components/crm/CustomerDetails"

export default function CRMPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Nordflytt CRM</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="schedule">Schema</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CustomerList onCustomerSelect={handleCustomerSelect} />
            {selectedCustomerId ? <CustomerDetails customerId={selectedCustomerId} /> : <OfferOverview />}
          </div>
        </TabsContent>
        <TabsContent value="schedule">
          <Schedule />
        </TabsContent>
      </Tabs>
    </div>
  )
}
