'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Warehouse,
  Users,
  Clock
} from 'lucide-react';

export function InventoryOverview() {
  const [inventoryData, setInventoryData] = useState({
    categoryBreakdown: [],
    monthlyTrend: [],
    facilityUtilization: [],
    topMovingItems: []
  });

  useEffect(() => {
    // Mock data - would fetch from API in production
    setInventoryData({
      categoryBreakdown: [
        { name: 'Flyttkartonger', value: 25000, color: '#3B82F6' },
        { name: 'Packematerial', value: 18500, color: '#8B5CF6' },
        { name: 'Verktyg', value: 67000, color: '#10B981' },
        { name: 'Städmaterial', value: 12300, color: '#F59E0B' },
        { name: 'Fordonsutrustning', value: 33200, color: '#EF4444' }
      ],
      monthlyTrend: [
        { month: 'Jan', inventory: 145000, storage: 32000 },
        { month: 'Feb', inventory: 148000, storage: 35000 },
        { month: 'Mar', inventory: 151000, storage: 38000 },
        { month: 'Apr', inventory: 149000, storage: 42000 },
        { month: 'Maj', inventory: 153000, storage: 45000 },
        { month: 'Jun', inventory: 156000, storage: 47500 }
      ],
      facilityUtilization: [
        { facility: 'Huvudlager Stockholm', total: 5000, used: 800, percentage: 16 },
        { facility: 'Kundmagasin Solna', total: 3000, used: 900, percentage: 30 },
        { facility: 'Säsongsmagasin', total: 2000, used: 200, percentage: 10 }
      ],
      topMovingItems: [
        { item: 'Standard flyttkartonger', usage: 450, trend: 'up' },
        { item: 'Bubbelplast', usage: 120, trend: 'up' },
        { item: 'Packtejp', usage: 200, trend: 'stable' },
        { item: 'Universalrengöring', usage: 85, trend: 'down' },
        { item: 'Flyttremmar', usage: 25, trend: 'up' }
      ]
    });
  }, []);

  const quickStats = [
    {
      title: 'Lageromsättning',
      value: '4.2x',
      description: 'Årlig omsättningshastighet',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      title: 'Lagereffektivitet',
      value: '92%',
      description: 'Optimalt lagernivå',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      title: 'Försenade leveranser',
      value: '2',
      description: 'Senaste 30 dagar',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-600'
    },
    {
      title: 'Automatiska beställningar',
      value: '85%',
      description: 'Av alla återbeställningar',
      icon: <Package className="w-5 h-5" />,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lageröversikt</h2>
        <p className="text-muted-foreground">
          Komplett översikt över företagstillgångar och kundmagasinering
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Lagervärde per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {inventoryData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value.toLocaleString()} SEK`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Månadsvis Utveckling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inventoryData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `${value.toLocaleString()} SEK`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="inventory" 
                    stroke="#3B82F6" 
                    name="Lagervärde"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="storage" 
                    stroke="#10B981" 
                    name="Magasinsinkomst"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facility Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5" />
            Anläggningskapacitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryData.facilityUtilization.map((facility, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{facility.facility}</p>
                    <p className="text-sm text-muted-foreground">
                      {facility.used} / {facility.total} m³ använt
                    </p>
                  </div>
                  <span className="text-lg font-bold">{facility.percentage}%</span>
                </div>
                <Progress value={facility.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Moving Items */}
        <Card>
          <CardHeader>
            <CardTitle>Mest Använda Artiklar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryData.topMovingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.usage} enheter denna månad
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.trend === 'up' && (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    )}
                    {item.trend === 'down' && (
                      <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                    )}
                    {item.trend === 'stable' && (
                      <div className="w-4 h-0.5 bg-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-4 rounded-lg border hover:bg-muted transition-colors text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Genomför inventering</p>
                      <p className="text-sm text-muted-foreground">
                        Senast: 15 dagar sedan
                      </p>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>

              <button className="w-full p-4 rounded-lg border hover:bg-muted transition-colors text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Generera värderingsrapport</p>
                      <p className="text-sm text-muted-foreground">
                        För månad: Juni 2024
                      </p>
                    </div>
                  </div>
                </div>
              </button>

              <button className="w-full p-4 rounded-lg border hover:bg-muted transition-colors text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Visa kundmagasin</p>
                      <p className="text-sm text-muted-foreground">
                        12 aktiva kunder
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}