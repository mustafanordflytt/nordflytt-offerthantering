'use client';

import React, { useState } from 'react';
import { Package2, TrendingUp, AlertCircle, Package, BarChart3, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Component imports will be added when components are created

export default function LagerPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample metrics
  const metrics = {
    totalValue: 156000,
    valueChange: 5,
    criticalItems: 3,
    assetsInUse: 47,
    utilizationRate: 82
  };

  const inventoryTabs = [
    { id: 'overview', label: 'Översikt', icon: '📊' },
    { id: 'assets', label: 'Företagstillgångar', icon: '📦' },
    { id: 'movements', label: 'Rörelser', icon: '🚚' },
    { id: 'reordering', label: 'Återbeställning', icon: '🔄' },
    { id: 'usage', label: 'Användning', icon: '📈' },
    { id: 'financials', label: 'Ekonomi', icon: '💰' },
    { id: 'reports', label: 'Rapporter', icon: '📋' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package2 className="h-8 w-8 text-[#002A5C]" />
          Lagerhantering
        </h1>
        <p className="text-gray-600 mt-2">Hantera företagstillgångar och automatisk återbeställning</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Totalt Lagervärde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalValue.toLocaleString('sv-SE')} SEK</div>
            <p className="text-sm text-green-600 mt-1">+{metrics.valueChange}% från förra månaden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Tillgångar i Användning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.assetsInUse}</div>
            <p className="text-sm text-gray-600 mt-1">{metrics.utilizationRate}% utnyttjandegrad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Återbeställningsalerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.criticalItems}</div>
            <p className="text-sm text-orange-600 mt-1">Låg lagernivå</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-7 w-full h-auto p-0 bg-gray-50">
              {inventoryTabs.map((tab) => (
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
                  <h3 className="text-lg font-semibold">Lageröversikt</h3>
                  <p className="text-gray-600">Komplett översikt över företagstillgångar och lagerstatus.</p>
                </div>
              </TabsContent>

              <TabsContent value="assets" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Företagstillgångar</h3>
                  <p className="text-gray-600">Hantera och spåra alla företagets tillgångar.</p>
                </div>
              </TabsContent>

              <TabsContent value="movements" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Lagerrörelser</h3>
                  <p className="text-gray-600">Spåra in- och utleveranser av tillgångar.</p>
                </div>
              </TabsContent>

              <TabsContent value="reordering" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Smart Återbeställning</h3>
                  <p className="text-gray-600">Automatisk återbeställning baserat på användningsmönster.</p>
                </div>
              </TabsContent>

              <TabsContent value="usage" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Användningsanalys</h3>
                  <p className="text-gray-600">Analysera hur tillgångar används över tid.</p>
                </div>
              </TabsContent>

              <TabsContent value="financials" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Lagerekonomi</h3>
                  <p className="text-gray-600">Ekonomisk översikt och kostnadskontroll.</p>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Lagerrapporter</h3>
                  <p className="text-gray-600">Generera detaljerade rapporter för analys och bokföring.</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}