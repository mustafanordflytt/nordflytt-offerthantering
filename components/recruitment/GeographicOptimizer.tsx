'use client'

import { useState, useEffect } from 'react';
import { MapPin, TrendingDown, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface OptimizationAnalysis {
  job_id: string;
  location: string;
  current_cost: number;
  optimized_cost: number;
  savings: number;
  savingsPercentage: number;
  recommendation: string;
  distance_km: number;
}

interface GeographicMetrics {
  totalPotentialSavings: number;
  locationsNeedingStaff: string[];
  optimizableJobs: number;
  averageSavingsPerJob: number;
}

export default function GeographicOptimizer() {
  const { toast } = useToast();
  const [optimizationData, setOptimizationData] = useState<OptimizationAnalysis[]>([]);
  const [metrics, setMetrics] = useState<GeographicMetrics>({
    totalPotentialSavings: 0,
    locationsNeedingStaff: [],
    optimizableJobs: 0,
    averageSavingsPerJob: 0
  });
  const [loading, setLoading] = useState(true);

  const analyzeLongDistanceJobs = async () => {
    try {
      // Simulate fetching long-distance jobs
      const response = await fetch('/api/recruitment/geographic-optimization');
      const data = await response.json();
      
      if (data.optimizations) {
        setOptimizationData(data.optimizations);
        
        // Calculate metrics
        const totalSavings = data.optimizations.reduce((sum: number, opt: OptimizationAnalysis) => 
          sum + opt.savings, 0
        );
        const uniqueLocations = [...new Set(data.optimizations.map((opt: OptimizationAnalysis) => 
          opt.location
        ))];
        
        setMetrics({
          totalPotentialSavings: totalSavings,
          locationsNeedingStaff: uniqueLocations,
          optimizableJobs: data.optimizations.length,
          averageSavingsPerJob: data.optimizations.length > 0 
            ? Math.round(totalSavings / data.optimizations.length)
            : 0
        });

        // Check if we should trigger recruitment for any location
        for (const location of uniqueLocations) {
          const locationJobs = data.optimizations.filter((opt: OptimizationAnalysis) => 
            opt.location === location
          );
          const locationSavings = locationJobs.reduce((sum: number, opt: OptimizationAnalysis) => 
            sum + opt.savings, 0
          );
          
          if (locationSavings > 5000) { // Significant savings threshold
            await checkAndTriggerLocalRecruitment(location, locationSavings);
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing geographic optimization:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndTriggerLocalRecruitment = async (city: string, potentialSavings: number) => {
    try {
      // Check if we have local staff in this location
      const response = await fetch(`/api/recruitment/local-staff-check?city=${city}`);
      const { hasLocalStaff, staffCount } = await response.json();
      
      if (!hasLocalStaff || staffCount < 2) {
        // Trigger geographic recruitment
        const postResponse = await fetch('/api/recruitment/auto-post-trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'geographic_optimization',
            params: {
              location: city,
              estimated_savings: potentialSavings,
              positions: 2 - staffCount, // Aim for at least 2 local staff
              urgency: 'medium',
              reason: `Geographic optimization for ${city} - potential savings of ${potentialSavings.toLocaleString()} kr/month`
            }
          })
        });

        if (postResponse.ok) {
          toast({
            title: `🗺️ Local recruitment initiated for ${city}`,
            description: `Potential monthly savings: ${potentialSavings.toLocaleString()} kr`,
          });
        }
      }
    } catch (error) {
      console.error('Error triggering local recruitment:', error);
    }
  };

  const calculateCostScenarios = (distance: number, hours: number) => {
    // Full Stockholm team scenario
    const fullTeamCost = (hours * 2 * 400) + (distance * 2 * 12); // 2 people, 400kr/h, 12kr/km roundtrip
    
    // Hybrid scenario: 1 Stockholm + 1 local
    const hybridCost = (hours * 1 * 400) + (distance * 2 * 12) + (hours * 1 * 250); // Local 250kr/h
    
    return {
      fullTeamCost,
      hybridCost,
      savings: fullTeamCost - hybridCost,
      savingsPercentage: Math.round(((fullTeamCost - hybridCost) / fullTeamCost) * 100)
    };
  };

  useEffect(() => {
    analyzeLongDistanceJobs();
    
    // Refresh every hour
    const interval = setInterval(analyzeLongDistanceJobs, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerRecruitmentForLocation = async (location: string) => {
    await checkAndTriggerLocalRecruitment(
      location, 
      optimizationData
        .filter(opt => opt.location === location)
        .reduce((sum, opt) => sum + opt.savings, 0)
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geographic Cost Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Monthly Savings Potential</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.totalPotentialSavings.toLocaleString()} kr
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Optimizable Jobs</p>
            <p className="text-2xl font-bold">{metrics.optimizableJobs}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Locations to Target</p>
            <p className="text-2xl font-bold">{metrics.locationsNeedingStaff.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Saving/Job</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.averageSavingsPerJob.toLocaleString()} kr
            </p>
          </div>
        </div>

        {/* Location Analysis */}
        {metrics.locationsNeedingStaff.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Cities Needing Local Staff</h4>
            <div className="space-y-3">
              {metrics.locationsNeedingStaff.map(location => {
                const locationJobs = optimizationData.filter(opt => opt.location === location);
                const locationSavings = locationJobs.reduce((sum, opt) => sum + opt.savings, 0);
                
                return (
                  <div key={location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">{location}</p>
                        <p className="text-sm text-gray-600">
                          {locationJobs.length} jobs, {locationSavings.toLocaleString()} kr savings
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => triggerRecruitmentForLocation(location)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Recruit Local
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Optimization Opportunities */}
        {optimizationData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Recent Long-Distance Jobs</h4>
            <div className="space-y-2">
              {optimizationData.slice(0, 5).map((opt, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{opt.location}</Badge>
                    <span className="text-gray-600">{opt.distance_km}km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      -{opt.savingsPercentage}% ({opt.savings.toLocaleString()} kr)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">AI Recommendations</h4>
          <div className="space-y-2 text-sm text-gray-600">
            {metrics.totalPotentialSavings > 20000 && (
              <p>💰 Significant savings opportunity - prioritize local recruitment</p>
            )}
            {metrics.locationsNeedingStaff.includes('Göteborg') && (
              <p>🎯 Göteborg shows high potential - consider dedicated team</p>
            )}
            {metrics.averageSavingsPerJob > 1000 && (
              <p>📈 High per-job savings - hybrid model highly effective</p>
            )}
            {metrics.optimizableJobs > 10 && (
              <p>🚀 Many optimizable jobs - systematic local hiring recommended</p>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Analyzing geographic opportunities...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}