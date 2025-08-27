'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, Users, Target, 
  Brain, Clock, RefreshCw
} from 'lucide-react';

export default function AIOptimeringDemoPage() {
  const [aiMode, setAIMode] = useState('suggest');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            AI-Optimering Demo (No API)
          </h1>
          <p className="text-gray-600 mt-1">
            Central Command System with 10 tabs
          </p>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="command" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="command">Command Center</TabsTrigger>
          <TabsTrigger value="decisions">Decision Stream</TabsTrigger>
          <TabsTrigger value="overview">Performance Analytics</TabsTrigger>
          <TabsTrigger value="autonomous">Autonoma Beslut</TabsTrigger>
          <TabsTrigger value="insights">Learning Insights</TabsTrigger>
          <TabsTrigger value="customers">Kunder</TabsTrigger>
          <TabsTrigger value="forecasting">Prognoser</TabsTrigger>
          <TabsTrigger value="iot">IoT Flotta</TabsTrigger>
          <TabsTrigger value="experiments">A/B-tester</TabsTrigger>
          <TabsTrigger value="config">System Configuration</TabsTrigger>
        </TabsList>

        {/* Command Center Tab */}
        <TabsContent value="command" className="space-y-6">
          {/* Glassmorphism Header with Mode Switcher */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
            <div className="relative flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  🧠 AI Command Center
                </h2>
                <p className="text-white/70 mt-2">Central AI Brain - Koordinerar alla intelligenta beslut</p>
              </div>
              
              {/* Mode Switcher */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4">
                <h3 className="text-white text-sm mb-3">AI Mode</h3>
                <div className="flex space-x-2">
                  {['suggest', 'auto', 'full'].map((modeOption) => (
                    <button
                      key={modeOption}
                      onClick={() => setAIMode(modeOption)}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        aiMode === modeOption
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {modeOption === 'suggest' && '💡 Suggest'}
                      {modeOption === 'auto' && '⚡ Auto'}
                      {modeOption === 'full' && '🚀 Full'}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-white/60">
                  {aiMode === 'suggest' && 'AI föreslår - du godkänner'}
                  {aiMode === 'auto' && 'AI agerar automatiskt - du kan override'}
                  {aiMode === 'full' && 'Fullständig autonomi - minimal input'}
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">Command Center content - AI mode: {aiMode}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle>Decision Stream</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Real-time decision monitoring</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics dashboard content</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autonomous">
          <Card>
            <CardHeader>
              <CardTitle>Autonoma Beslut</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Autonomous decisions with AI Module Coordination</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Learning Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">AI learning metrics and insights</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Kunder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Customer analytics</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting">
          <Card>
            <CardHeader>
              <CardTitle>Prognoser</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Demand forecasting</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iot">
          <Card>
            <CardHeader>
              <CardTitle>IoT Flotta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Fleet monitoring</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments">
          <Card>
            <CardHeader>
              <CardTitle>A/B-tester</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">A/B testing dashboard</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">System settings and configuration</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}