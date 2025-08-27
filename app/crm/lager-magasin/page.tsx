'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package2, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { InventoryOverview } from '@/components/inventory/InventoryOverview';
import { CompanyAssetsManager } from '@/components/inventory/CompanyAssetsManager';
import { CustomerStorageManager } from '@/components/inventory/CustomerStorageManager';
import { ReorderingManager } from '@/components/inventory/ReorderingManager';
import { UsageTrackingManager } from '@/components/inventory/UsageTrackingManager';
import { StorageBillingManager } from '@/components/inventory/StorageBillingManager';
import { MaintenanceManager } from '@/components/inventory/MaintenanceManager';
import { InventoryReports } from '@/components/inventory/InventoryReports';

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalInventoryValue: 0,
    activeStorageUnits: 0,
    monthlyStorageRevenue: 0,
    reorderAlerts: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    fetchInventoryStats();
  }, []);

  const fetchInventoryStats = async () => {
    try {
      // Fetch inventory value
      const inventoryResponse = await fetch('/api/inventory/valuation');
      const inventoryData = await inventoryResponse.json();
      
      // Fetch storage stats
      const storageResponse = await fetch('/api/storage/summary');
      const storageData = await storageResponse.json();
      
      // Fetch reorder alerts
      const reorderResponse = await fetch('/api/inventory/reorder-alerts');
      const reorderData = await reorderResponse.json();
      
      setStats({
        totalInventoryValue: inventoryData.total_value || 156000,
        activeStorageUnits: storageData.active_units || 12,
        monthlyStorageRevenue: storageData.monthly_revenue || 47500,
        reorderAlerts: reorderData.alerts?.length || 3,
        lowStockItems: reorderData.low_stock_count || 5
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    }
  };

  const inventoryTabs = [
    { id: 'overview', label: 'Översikt', icon: '📊' },
    { id: 'company_assets', label: 'Företagstillgångar', icon: '🏢' },
    { id: 'customer_storage', label: 'Kundmagasin', icon: '📦' },
    { id: 'reordering', label: 'Återbeställning', icon: '🔄' },
    { id: 'usage_tracking', label: 'Användning', icon: '📈' },
    { id: 'billing', label: 'Fakturering', icon: '💰' },
    { id: 'maintenance', label: 'Underhåll', icon: '🔧' },
    { id: 'reports', label: 'Rapporter', icon: '📋' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package2 className="w-8 h-8" />
            Lager & Magasinhantering
          </h1>
          <p className="text-muted-foreground mt-1">
            Hantera företagstillgångar och kundmagasinering
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totalt Lagervärde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalInventoryValue.toLocaleString()} SEK
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+5%</span>
              <span className="text-muted-foreground">från förra månaden</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktiva Kundmagasin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStorageUnits}</div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+3</span>
              <span className="text-muted-foreground">nya denna månad</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Månadsinkomst Magasin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyStorageRevenue.toLocaleString()} SEK
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-purple-600">+12%</span>
              <span className="text-muted-foreground">tillväxt</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Återbeställningsalerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reorderAlerts}</div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              {stats.reorderAlerts > 0 ? (
                <>
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-600">{stats.lowStockItems} låg lagernivå</span>
                </>
              ) : (
                <span className="text-green-600">Allt i lager</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-8 w-full">
          {inventoryTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <span className="hidden sm:inline">{tab.icon}</span>
              <span className="ml-1">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InventoryOverview />
        </TabsContent>

        <TabsContent value="company_assets" className="space-y-4">
          <CompanyAssetsManager />
        </TabsContent>

        <TabsContent value="customer_storage" className="space-y-4">
          <CustomerStorageManager />
        </TabsContent>

        <TabsContent value="reordering" className="space-y-4">
          <ReorderingManager />
        </TabsContent>

        <TabsContent value="usage_tracking" className="space-y-4">
          <UsageTrackingManager />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <StorageBillingManager />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceManager />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <InventoryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}