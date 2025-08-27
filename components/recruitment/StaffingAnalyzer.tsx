'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, TrendingUp, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CapacityStatus {
  utilization: number;
  shortageRisk: boolean;
  autoPostsTriggered: string[];
  totalJobHours: number;
  totalAvailableHours: number;
  staffNeeded: number;
  sickLeaveRate: number;
}

export default function StaffingAnalyzer() {
  const { toast } = useToast();
  const [capacityStatus, setCapacityStatus] = useState<CapacityStatus>({
    utilization: 0,
    shortageRisk: false,
    autoPostsTriggered: [],
    totalJobHours: 0,
    totalAvailableHours: 0,
    staffNeeded: 0,
    sickLeaveRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState<Date>(new Date());

  // Analyze booking capacity vs available staff
  const analyzeCapacityNeeds = async () => {
    try {
      // Simulate fetching upcoming jobs (in production, use real Supabase queries)
      const upcomingJobs = await fetch('/api/recruitment/upcoming-jobs').then(res => res.json());
      const availableStaff = await fetch('/api/recruitment/available-staff').then(res => res.json());
      
      // Calculate capacity utilization
      const totalJobHours = upcomingJobs.reduce((sum: number, job: any) => 
        sum + (job.estimated_hours * job.team_size_needed), 0
      );
      const totalAvailableHours = availableStaff.length * 8 * 14; // 8 hours/day, 14 days
      const utilization = totalAvailableHours > 0 ? totalJobHours / totalAvailableHours : 0;

      // Calculate staff needed if utilization > 85%
      const staffNeeded = utilization > 0.85 
        ? Math.ceil((utilization - 0.85) * availableStaff.length)
        : 0;

      // Check if auto-recruitment should be triggered
      if (utilization > 0.85 && capacityStatus.autoPostsTriggered.length === 0) {
        await triggerAutoRecruitment('high_demand', {
          utilization: Math.round(utilization * 100),
          needed_positions: staffNeeded,
          urgency: utilization > 0.95 ? 'immediate' : 'high',
          reason: `Capacity utilization at ${Math.round(utilization * 100)}% - additional staff needed`
        });
      }

      setCapacityStatus(prev => ({
        ...prev,
        utilization: Math.round(utilization * 100),
        shortageRisk: utilization > 0.85,
        totalJobHours,
        totalAvailableHours,
        staffNeeded,
        autoPostsTriggered: utilization > 0.85 ? ['high_demand'] : []
      }));
    } catch (error) {
      console.error('Error analyzing capacity:', error);
    }
  };

  // Monitor sick leave and trigger emergency recruitment
  const monitorSickLeave = async () => {
    try {
      const sickLeaveData = await fetch('/api/recruitment/sick-leave-status').then(res => res.json());
      const sickRate = sickLeaveData.sickRate || 0;

      if (sickRate > 0.2 && !capacityStatus.autoPostsTriggered.includes('sick_coverage')) {
        await triggerAutoRecruitment('sick_coverage', {
          sickRate: Math.round(sickRate * 100),
          positions: Math.ceil(sickLeaveData.sickCount * 1.2),
          urgency: 'immediate',
          reason: `High sick leave rate (${Math.round(sickRate * 100)}%) - emergency staffing needed`
        });
      }

      setCapacityStatus(prev => ({
        ...prev,
        sickLeaveRate: Math.round(sickRate * 100)
      }));
    } catch (error) {
      console.error('Error monitoring sick leave:', error);
    }
  };

  const triggerAutoRecruitment = async (reason: string, params: any) => {
    try {
      const response = await fetch('/api/recruitment/auto-post-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, params })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: '🤖 Auto-recruitment triggered!',
          description: `Posted ${params.needed_positions || params.positions} positions due to ${reason}`,
        });
        
        setCapacityStatus(prev => ({
          ...prev,
          autoPostsTriggered: [...prev.autoPostsTriggered, reason]
        }));
      }
    } catch (error) {
      console.error('Error triggering auto-recruitment:', error);
      toast({
        title: 'Auto-recruitment failed',
        description: 'Could not trigger automatic job posting',
        variant: 'destructive'
      });
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    await analyzeCapacityNeeds();
    await monitorSickLeave();
    setLastAnalysis(new Date());
    setLoading(false);
  };

  useEffect(() => {
    runAnalysis();
    
    // Run analysis every 4 hours
    const interval = setInterval(runAnalysis, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 70) return 'text-green-600';
    if (utilization < 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationBg = (utilization: number) => {
    if (utilization < 70) return 'bg-green-100';
    if (utilization < 85) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Staffing Analyzer
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Capacity Utilization */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Capacity Utilization</span>
            <span className={`text-2xl font-bold ${getUtilizationColor(capacityStatus.utilization)}`}>
              {capacityStatus.utilization}%
            </span>
          </div>
          <Progress 
            value={capacityStatus.utilization} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{capacityStatus.totalJobHours}h booked</span>
            <span>{capacityStatus.totalAvailableHours}h available</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${capacityStatus.shortageRisk ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="flex items-center gap-2">
              {capacityStatus.shortageRisk ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-green-600" />
              )}
              <span className="font-medium">
                {capacityStatus.shortageRisk ? 'Staff Shortage Risk' : 'Adequate Staffing'}
              </span>
            </div>
            {capacityStatus.staffNeeded > 0 && (
              <p className="text-sm text-red-600 mt-1">
                Need {capacityStatus.staffNeeded} additional staff
              </p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Sick Leave Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {capacityStatus.sickLeaveRate}%
            </p>
          </div>
        </div>

        {/* Auto-triggered Posts */}
        {capacityStatus.autoPostsTriggered.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Auto-triggered Recruitments</h4>
            <div className="space-y-2">
              {capacityStatus.autoPostsTriggered.map((trigger, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {trigger === 'high_demand' ? 'High Demand' : 'Sick Coverage'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Job posting created automatically
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">AI Insights</h4>
          <div className="space-y-2 text-sm text-gray-600">
            {capacityStatus.utilization > 90 && (
              <p>⚠️ Critical capacity - immediate hiring recommended</p>
            )}
            {capacityStatus.utilization > 85 && capacityStatus.utilization <= 90 && (
              <p>📈 High utilization - proactive recruitment advised</p>
            )}
            {capacityStatus.utilization < 70 && (
              <p>✅ Healthy capacity - no immediate action needed</p>
            )}
            {capacityStatus.sickLeaveRate > 15 && (
              <p>🏥 Elevated sick leave - consider temporary staff pool</p>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Last analysis: {lastAnalysis.toLocaleString('sv-SE')}
        </div>
      </CardContent>
    </Card>
  );
}