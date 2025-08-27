'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// AI Performance Timeline Chart
export function AIPerformanceTimeline({ data }: { data?: any[] }) {
  const defaultData = [
    { time: '00:00', conversations: 2, emails: 5 },
    { time: '04:00', conversations: 1, emails: 3 },
    { time: '08:00', conversations: 8, emails: 12 },
    { time: '12:00', conversations: 15, emails: 18 },
    { time: '16:00', conversations: 12, emails: 14 },
    { time: '20:00', conversations: 6, emails: 8 },
    { time: 'Nu', conversations: 3, emails: 4 }
  ];

  const chartData = data || defaultData;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>AI Aktivitet - Senaste 24h</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="conversations" 
              stackId="1"
              stroke="#8b5cf6" 
              fill="#8b5cf6" 
              fillOpacity={0.6}
              name="Maja Konversationer"
            />
            <Area 
              type="monotone" 
              dataKey="emails" 
              stackId="1"
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.6}
              name="Auto-emails"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Payment Status Pie Chart
export function PaymentStatusChart({ data }: { data?: any }) {
  const chartData = [
    { name: 'Betald', value: parseInt(data?.paidThisMonth?.replace(/[^0-9]/g, '') || '2722000'), color: '#10b981' },
    { name: 'Utestående', value: parseInt(data?.outstanding?.replace(/[^0-9]/g, '') || '125000'), color: '#f59e0b' },
    { name: 'Försenad', value: parseInt(data?.overdue?.replace(/[^0-9]/g, '') || '23000'), color: '#ef4444' }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Betalningsstatus</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `${value.toLocaleString('sv-SE')} kr`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Team Workload Bar Chart
export function TeamWorkloadChart({ data }: { data?: any }) {
  const defaultData = [
    { name: 'Erik', jobs: 4, efficiency: 92 },
    { name: 'Anna', jobs: 3, efficiency: 88 },
    { name: 'Johan', jobs: 5, efficiency: 95 },
    { name: 'Maria', jobs: 2, efficiency: 85 },
    { name: 'Lars', jobs: 3, efficiency: 90 }
  ];

  const chartData = data || defaultData;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Team Arbetsbelastning</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="jobs" fill="#8884d8" name="Antal jobb" />
            <Bar yAxisId="right" dataKey="efficiency" fill="#82ca9d" name="Effektivitet %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Customer Journey Funnel
export function CustomerJourneyFunnel({ data }: { data?: any }) {
  const defaultData = [
    { stage: 'Leads', value: 100, percentage: 100 },
    { stage: 'Kvalificerade', value: 75, percentage: 75 },
    { stage: 'Offerter', value: 50, percentage: 50 },
    { stage: 'Bokningar', value: 35, percentage: 35 },
    { stage: 'Genomförda', value: 30, percentage: 30 }
  ];

  const chartData = data || defaultData;
  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kundresa - Konvertering</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {chartData.map((stage: any, index: number) => (
            <div key={stage.stage}>
              <div className="flex justify-between text-sm mb-1">
                <span>{stage.stage}</span>
                <span className="font-medium">{stage.value} ({stage.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stage.percentage}%`,
                    backgroundColor: colors[index]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Revenue Trend Chart
export function RevenueTrendChart({ data }: { data?: any[] }) {
  const defaultData = [
    { month: 'Jan', revenue: 2100000, rutSavings: 280000 },
    { month: 'Feb', revenue: 2300000, rutSavings: 310000 },
    { month: 'Mar', revenue: 2500000, rutSavings: 320000 },
    { month: 'Apr', revenue: 2400000, rutSavings: 315000 },
    { month: 'Maj', revenue: 2700000, rutSavings: 335000 },
    { month: 'Jun', revenue: 2845000, rutSavings: 340000 }
  ];

  const chartData = data || defaultData;

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Omsättning & RUT-besparingar</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => `${value.toLocaleString('sv-SE')} kr`} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Omsättning"
            />
            <Line 
              type="monotone" 
              dataKey="rutSavings" 
              stroke="#10b981" 
              strokeWidth={2}
              name="RUT-besparingar"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}