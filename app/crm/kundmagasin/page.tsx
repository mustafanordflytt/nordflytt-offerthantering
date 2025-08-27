'use client';

import React, { useState } from 'react';
import { Warehouse, Users, Package, Calendar, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
// Component imports will be added when components are created

export default function KundmagasinPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample metrics
  const metrics = {
    activeCustomers: 12,
    monthlyRevenue: 47500,
    revenueGrowth: 12,
    occupancyRate: 78,
    pendingInvoices: 3,
    totalStorageUnits: 50
  };

  const storageTabs = [
    { id: 'overview', label: 'Översikt', icon: '📊' },
    { id: 'customers', label: 'Kunder', icon: '👥' },
    { id: 'inventory', label: 'Kundinventering', icon: '📦' },
    { id: 'billing', label: 'Fakturering', icon: '💰' },
    { id: 'contracts', label: 'Avtal', icon: '📄' },
    { id: 'portal', label: 'Kundportal', icon: '🌐' },
    { id: 'analytics', label: 'Analys', icon: '📈' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Warehouse className="h-8 w-8 text-[#002A5C]" />
          Kundmagasin
        </h1>
        <p className="text-gray-600 mt-2">Hantera kundmagasinering och skapa nya intäktskällor</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Aktiva Kunder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCustomers}</div>
            <p className="text-sm text-green-600 mt-1">+3 nya denna månad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Månadsintäkt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.monthlyRevenue.toLocaleString('sv-SE')} SEK</div>
            <p className="text-sm text-green-600 mt-1">+{metrics.revenueGrowth}% tillväxt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Beläggningsgrad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.occupancyRate}%</div>
            <p className="text-sm text-gray-600 mt-1">{Math.floor(metrics.occupancyRate * metrics.totalStorageUnits / 100)}/{metrics.totalStorageUnits} enheter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Väntande Fakturor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.pendingInvoices}</div>
            <p className="text-sm text-orange-600 mt-1">Behöver åtgärd</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button className="bg-[#002A5C] hover:bg-[#001d47]">
          <Users className="mr-2 h-4 w-4" />
          Ny Kund
        </Button>
        <Button variant="outline">
          <Package className="mr-2 h-4 w-4" />
          Registrera Inventarie
        </Button>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Skapa Faktura
        </Button>
      </div>

      {/* Tabs */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-7 w-full h-auto p-0 bg-gray-50">
              {storageTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-[#002A5C] data-[state=active]:text-white px-6 py-3 rounded-none first:rounded-tl-lg last:rounded-tr-lg"
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kundmagasin Översikt</h3>
                  <p className="text-gray-600">Se alla aktiva kundmagasin och intäktsströmmar.</p>
                </div>
              </TabsContent>

              <TabsContent value="customers" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Aktiva Kundmagasin</h3>
                  <p className="text-gray-600">Hantera kundernas magasineringstjänster och avtal.</p>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kundinventering</h3>
                  <p className="text-gray-600">Spåra och hantera kunders magasinerade föremål.</p>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fakturering</h3>
                  <p className="text-gray-600">Automatisk fakturering för magasineringstjänster.</p>
                </div>
              </TabsContent>

              <TabsContent value="contracts" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Magasineringsavtal</h3>
                  <p className="text-gray-600">Hantera kontrakt och villkor för kundmagasin.</p>
                </div>
              </TabsContent>

              <TabsContent value="portal" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kundportal</h3>
                  <p className="text-gray-600">Låt kunder se sina magasinerade föremål online.</p>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analys & Rapporter</h3>
                  <p className="text-gray-600">Intäktsanalys och beläggningsrapporter.</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}