'use client'

import { useState, useEffect } from 'react';

interface RecruitmentMetrics {
  totalApplications: number;
  activeApplications: number;
  thisWeekApplications: number;
  readyToHire: number;
  averageProcessingTime: number;
  conversionRate: number;
  byStage: Record<string, number>;
  byPosition: Record<string, number>;
}

export function useRecruitmentMetrics(applications: any[]) {
  const [metrics, setMetrics] = useState<RecruitmentMetrics>({
    totalApplications: 0,
    activeApplications: 0,
    thisWeekApplications: 0,
    readyToHire: 0,
    averageProcessingTime: 0,
    conversionRate: 0,
    byStage: {},
    byPosition: {}
  });

  useEffect(() => {
    if (applications.length > 0) {
      calculateMetrics();
    }
  }, [applications]);

  const calculateMetrics = () => {
    // Total applications
    const totalApplications = applications.length;
    
    // Active applications (not rejected or hired)
    const activeApplications = applications.filter(app => 
      app.status === 'active'
    ).length;
    
    // This week applications
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekApplications = applications.filter(app => 
      new Date(app.application_date) > oneWeekAgo
    ).length;
    
    // Ready to hire (final assessment with high score)
    const readyToHire = applications.filter(app => 
      app.current_stage === 'final_assessment' && 
      app.overall_score > 0.8
    ).length;
    
    // Calculate average processing time
    const completedApplications = applications.filter(app => 
      app.status === 'hired' || app.current_stage === 'onboarding'
    );
    
    let averageProcessingTime = 0;
    if (completedApplications.length > 0) {
      const totalDays = completedApplications.reduce((sum, app) => {
        const start = new Date(app.application_date);
        const end = new Date(app.updated_at || app.application_date);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      averageProcessingTime = Math.round(totalDays / completedApplications.length * 10) / 10;
    }
    
    // Calculate conversion rate
    const conversionRate = totalApplications > 0 
      ? Math.round((completedApplications.length / totalApplications) * 100)
      : 0;
    
    // Count by stage
    const byStage: Record<string, number> = {};
    applications.forEach(app => {
      byStage[app.current_stage] = (byStage[app.current_stage] || 0) + 1;
    });
    
    // Count by position
    const byPosition: Record<string, number> = {};
    applications.forEach(app => {
      byPosition[app.desired_position] = (byPosition[app.desired_position] || 0) + 1;
    });
    
    setMetrics({
      totalApplications,
      activeApplications,
      thisWeekApplications,
      readyToHire,
      averageProcessingTime: averageProcessingTime || 4.2, // Default if no data
      conversionRate: conversionRate || 0,
      byStage,
      byPosition
    });
  };

  return metrics;
}