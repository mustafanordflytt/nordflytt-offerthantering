'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar,
  FileText,
  Briefcase,
  AlertCircle,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface LegalCost {
  id: number;
  dispute_id?: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  provider?: string;
}

interface CostSummary {
  totalCosts: number;
  averageCostPerCase: number;
  costTrend: 'up' | 'down' | 'stable';
  highestCategory: string;
  savingsFromAI: number;
}

export function LegalCostsManager() {
  const [costs, setCosts] = useState<LegalCost[]>([]);
  const [summary, setSummary] = useState<CostSummary>({
    totalCosts: 287500,
    averageCostPerCase: 12500,
    costTrend: 'down',
    highestCategory: 'Advokatkostnader',
    savingsFromAI: 145000
  });

  const monthlyTrend = [
    { month: 'Jan', costs: 45000, aiSaved: 15000 },
    { month: 'Feb', costs: 52000, aiSaved: 18000 },
    { month: 'Mar', costs: 48000, aiSaved: 22000 },
    { month: 'Apr', costs: 41000, aiSaved: 25000 },
    { month: 'Maj', costs: 38000, aiSaved: 28000 },
    { month: 'Jun', costs: 35000, aiSaved: 32000 }
  ];

  const costCategories = [
    { name: 'Advokatkostnader', value: 125000, color: '#8b5cf6' },
    { name: 'Rättegångskostnader', value: 45000, color: '#3b82f6' },
    { name: 'Expertutlåtanden', value: 35000, color: '#10b981' },
    { name: 'Dokumenthantering', value: 25000, color: '#f59e0b' },
    { name: 'Försäkringssjälvrisker', value: 30000, color: '#ef4444' },
    { name: 'Övrigt', value: 27500, color: '#6b7280' }
  ];

  const budgetUtilization = 68; // Procent av budget använt
  const yearlyBudget = 600000;
  const currentSpend = 408000;
  const projectedSpend = 545000;

  const recentCosts: LegalCost[] = [
    {
      id: 1,
      dispute_id: 1234,
      category: 'Advokatkostnader',
      description: 'Juridisk rådgivning - Skadetvist',
      amount: 15000,
      date: '2024-06-15',
      status: 'paid',
      provider: 'Advokatfirman Lindberg & Co'
    },
    {
      id: 2,
      dispute_id: 1235,
      category: 'Expertutlåtanden',
      description: 'Teknisk besiktning av skador',
      amount: 8500,
      date: '2024-06-10',
      status: 'approved',
      provider: 'Besiktningsföretaget AB'
    },
    {
      id: 3,
      category: 'Försäkringssjälvrisker',
      description: 'Självrisk för försäkringsärende',
      amount: 10000,
      date: '2024-06-08',
      status: 'pending',
      provider: 'Trygg-Hansa'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'warning',
      approved: 'secondary',
      paid: 'success',
      disputed: 'destructive'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Väntar',
      approved: 'Godkänd',
      paid: 'Betald',
      disputed: 'Tvistad'
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Juridiska Kostnader
        </h2>
        <p className="text-muted-foreground">Spåra, analysera och optimera juridiska utgifter</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totala Kostnader (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCosts.toLocaleString()} kr</div>
            <div className="flex items-center gap-1 mt-1">
              {summary.costTrend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs text-muted-foreground">
                {summary.costTrend === 'down' ? '-12%' : '+12%'} från förra året
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Genomsnitt per Ärende</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageCostPerCase.toLocaleString()} kr</div>
            <p className="text-xs text-muted-foreground mt-1">Baserat på 23 ärenden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI-Besparingar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.savingsFromAI.toLocaleString()} kr
            </div>
            <p className="text-xs text-muted-foreground mt-1">60% reduktion i kostnader</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budgetutnyttjande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetUtilization}%</div>
            <Progress value={budgetUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {currentSpend.toLocaleString()} / {yearlyBudget.toLocaleString()} kr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trends and Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Kostnadstrend & AI-Besparingar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `${value.toLocaleString()} kr`}
                />
                <Line 
                  type="monotone" 
                  dataKey="costs" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Kostnader"
                />
                <Line 
                  type="monotone" 
                  dataKey="aiSaved" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="AI-besparingar"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kostnadsfördelning</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={costCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toLocaleString()} kr`} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {costCategories.map((category) => (
                <div key={category.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="truncate">{category.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Costs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Senaste Kostnader</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCosts.map((cost) => (
              <div key={cost.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{cost.description}</p>
                      <Badge variant={getStatusColor(cost.status)}>
                        {getStatusText(cost.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{cost.category}</span>
                      {cost.provider && (
                        <>
                          <span>•</span>
                          <span>{cost.provider}</span>
                        </>
                      )}
                      {cost.dispute_id && (
                        <>
                          <span>•</span>
                          <span>Ärende #{cost.dispute_id}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{cost.amount.toLocaleString()} kr</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(cost.date).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Budgetanalys & Prognos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Årsbudget</span>
                <span className="text-sm">{yearlyBudget.toLocaleString()} kr</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Nuvarande förbrukning</span>
                <span className="text-sm">{currentSpend.toLocaleString()} kr ({budgetUtilization}%)</span>
              </div>
              <Progress value={budgetUtilization} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Prognos helår</span>
                <span className="text-sm">{projectedSpend.toLocaleString()} kr (91%)</span>
              </div>
              <Progress value={91} className="h-2" />
            </div>

            {projectedSpend < yearlyBudget && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Budget i balans</p>
                    <p className="text-xs text-green-700 mt-1">
                      Prognosen visar att vi kommer hålla oss inom budget med en marginal på {((yearlyBudget - projectedSpend) / 1000).toFixed(0)}k kr.
                      AI-automatisering har reducerat kostnaderna med 60%.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Generera Kostnadsrapport
        </Button>
        <Button variant="outline">
          <Briefcase className="w-4 h-4 mr-2" />
          Jämför Leverantörer
        </Button>
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Schemalägg Granskning
        </Button>
      </div>
    </div>
  );
}