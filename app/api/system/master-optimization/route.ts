// =============================================================================
// NORDFLYTT AI SYSTEM - MASTER OPTIMIZATION API
// Unified endpoint that orchestrates all 5 phases for complete optimization
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { systemConfig } from '@/config/systemConfig';

// Interfaces for unified optimization
interface MasterOptimizationRequest {
  date: string;
  jobs: JobInput[];
  vehicles?: VehicleInput[];
  staff?: StaffInput[];
  constraints?: OptimizationConstraints;
  preferences?: OptimizationPreferences;
}

interface JobInput {
  id: string;
  customerId: string;
  type: 'moving' | 'packing' | 'storage' | 'cleaning';
  pickupAddress: Address;
  deliveryAddress: Address;
  scheduledDate: string;
  estimatedDuration: number;
  volume: number;
  weight?: number;
  specialRequirements?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Address {
  street: string;
  postalCode: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

interface VehicleInput {
  id: string;
  name: string;
  capacity: number;
  currentLocation: Address;
  status: 'available' | 'in_use' | 'maintenance';
}

interface StaffInput {
  id: string;
  name: string;
  skills: string[];
  availability: boolean;
  currentLocation?: Address;
}

interface OptimizationConstraints {
  maxWorkingHours?: number;
  maxDistanceKm?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  vehiclePreferences?: string[];
  timeWindows?: TimeWindow[];
}

interface TimeWindow {
  start: string;
  end: string;
  jobIds?: string[];
}

interface OptimizationPreferences {
  optimizeFor: 'cost' | 'time' | 'efficiency' | 'co2' | 'customer_satisfaction';
  weightings?: {
    cost: number;
    time: number;
    efficiency: number;
    co2: number;
    customerSatisfaction: number;
  };
}

interface MasterOptimizationResult {
  success: boolean;
  optimizationId: string;
  timestamp: string;
  phases: {
    phase1?: Phase1Result;
    phase2?: Phase2Result;
    phase3?: Phase3Result;
    phase4?: Phase4Result;
    phase5?: Phase5Result;
  };
  overallMetrics: OverallMetrics;
  recommendations: Recommendation[];
  executionPlan: ExecutionStep[];
  estimatedImpact: EstimatedImpact;
}

interface Phase1Result {
  enabled: boolean;
  clusters: JobCluster[];
  efficiency: number;
  weatherAdjustments: any;
  processingTime: number;
}

interface Phase2Result {
  enabled: boolean;
  routes: OptimizedRoute[];
  totalDistance: number;
  estimatedFuelCost: number;
  co2Reduction: number;
  processingTime: number;
}

interface Phase3Result {
  enabled: boolean;
  teamAssignments: TeamAssignment[];
  skillCoverage: number;
  workloadBalance: number;
  processingTime: number;
}

interface Phase4Result {
  enabled: boolean;
  predictions: any[];
  demandForecast: any;
  pricingOptimization: any;
  processingTime: number;
}

interface Phase5Result {
  enabled: boolean;
  autonomousDecisions: any[];
  confidenceScore: number;
  humanReviewRequired: number;
  processingTime: number;
}

interface OverallMetrics {
  totalEfficiencyGain: number;
  totalCostSavings: number;
  totalCo2Reduction: number;
  customerSatisfactionImpact: number;
  processingTimeTotal: number;
  autonomyRate: number;
}

interface JobCluster {
  id: string;
  jobs: string[];
  centerPoint: Address;
  estimatedDuration: number;
}

interface OptimizedRoute {
  id: string;
  vehicleId: string;
  jobIds: string[];
  waypoints: Address[];
  totalDistance: number;
  estimatedDuration: number;
}

interface TeamAssignment {
  id: string;
  routeId: string;
  staffIds: string[];
  skills: string[];
  workload: number;
}

interface Recommendation {
  type: 'optimization' | 'warning' | 'info';
  phase: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
  actionRequired: boolean;
}

interface ExecutionStep {
  step: number;
  phase: string;
  action: string;
  estimatedDuration: number;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface EstimatedImpact {
  financial: {
    costSavings: number;
    revenueIncrease: number;
    roi: number;
  };
  operational: {
    efficiencyGain: number;
    timeReduction: number;
    resourceOptimization: number;
  };
  environmental: {
    co2Reduction: number;
    fuelSavings: number;
  };
  customer: {
    satisfactionIncrease: number;
    serviceImprovement: number;
  };
}

/**
 * POST /api/system/master-optimization
 * Master optimization endpoint that runs all enabled phases
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 Master optimization request received');

  try {
    const body: MasterOptimizationRequest = await request.json();
    const { date, jobs, vehicles = [], staff = [], constraints = {}, preferences = {} } = body;

    // Validate input
    if (!date || !jobs || jobs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        message: 'Date and jobs are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Generate optimization ID
    const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    console.log(`🎯 Starting master optimization ${optimizationId}`, {
      date,
      jobCount: jobs.length,
      vehicleCount: vehicles.length,
      staffCount: staff.length
    });

    // Initialize result structure
    const result: MasterOptimizationResult = {
      success: true,
      optimizationId,
      timestamp: new Date().toISOString(),
      phases: {},
      overallMetrics: {
        totalEfficiencyGain: 0,
        totalCostSavings: 0,
        totalCo2Reduction: 0,
        customerSatisfactionImpact: 0,
        processingTimeTotal: 0,
        autonomyRate: 0
      },
      recommendations: [],
      executionPlan: [],
      estimatedImpact: {
        financial: { costSavings: 0, revenueIncrease: 0, roi: 0 },
        operational: { efficiencyGain: 0, timeReduction: 0, resourceOptimization: 0 },
        environmental: { co2Reduction: 0, fuelSavings: 0 },
        customer: { satisfactionIncrease: 0, serviceImprovement: 0 }
      }
    };

    // Phase 1: Smart Clustering
    if (systemConfig.isPhaseEnabled(1)) {
      console.log('📊 Executing Phase 1: Smart Clustering');
      const phase1Start = Date.now();
      
      try {
        const phase1Result = await executePhase1Clustering(jobs, date, constraints);
        result.phases.phase1 = phase1Result;
        result.overallMetrics.totalEfficiencyGain += phase1Result.efficiency * 0.2;
        
        // Update jobs for next phase
        jobs.forEach(job => {
          const cluster = phase1Result.clusters.find(c => c.jobs.includes(job.id));
          if (cluster) {
            (job as any).clusterId = cluster.id;
          }
        });

        console.log('✅ Phase 1 completed', {
          clusters: phase1Result.clusters.length,
          efficiency: phase1Result.efficiency.toFixed(3),
          time: Date.now() - phase1Start
        });

      } catch (error) {
        console.error('❌ Phase 1 failed:', error);
        result.recommendations.push({
          type: 'warning',
          phase: 'Phase 1',
          message: 'Clustering optimization failed, using default grouping',
          impact: 'medium',
          actionRequired: false
        });
      }
    }

    // Phase 2: Route Optimization  
    if (systemConfig.isPhaseEnabled(2)) {
      console.log('🗺️ Executing Phase 2: Route Optimization');
      const phase2Start = Date.now();
      
      try {
        const clusters = result.phases.phase1?.clusters || [{ id: 'default', jobs: jobs.map(j => j.id), centerPoint: jobs[0].pickupAddress, estimatedDuration: 480 }];
        const phase2Result = await executePhase2RouteOptimization(clusters, vehicles, constraints);
        result.phases.phase2 = phase2Result;
        result.overallMetrics.totalCostSavings += phase2Result.estimatedFuelCost * 0.15;
        result.overallMetrics.totalCo2Reduction += phase2Result.co2Reduction;

        console.log('✅ Phase 2 completed', {
          routes: phase2Result.routes.length,
          totalDistance: phase2Result.totalDistance.toFixed(2),
          co2Reduction: phase2Result.co2Reduction.toFixed(2),
          time: Date.now() - phase2Start
        });

      } catch (error) {
        console.error('❌ Phase 2 failed:', error);
        result.recommendations.push({
          type: 'warning',
          phase: 'Phase 2',
          message: 'Route optimization failed, using manual routing',
          impact: 'high',
          actionRequired: true
        });
      }
    }

    // Phase 3: Team Optimization
    if (systemConfig.isPhaseEnabled(3)) {
      console.log('👥 Executing Phase 3: Team Optimization');
      const phase3Start = Date.now();
      
      try {
        const routes = result.phases.phase2?.routes || [];
        const phase3Result = await executePhase3TeamOptimization(routes, staff, constraints);
        result.phases.phase3 = phase3Result;
        result.overallMetrics.totalEfficiencyGain += phase3Result.skillCoverage * 0.15;

        console.log('✅ Phase 3 completed', {
          teamAssignments: phase3Result.teamAssignments.length,
          skillCoverage: phase3Result.skillCoverage.toFixed(3),
          workloadBalance: phase3Result.workloadBalance.toFixed(3),
          time: Date.now() - phase3Start
        });

      } catch (error) {
        console.error('❌ Phase 3 failed:', error);
        result.recommendations.push({
          type: 'warning',
          phase: 'Phase 3',
          message: 'Team optimization failed, using default assignments',
          impact: 'medium',
          actionRequired: false
        });
      }
    }

    // Phase 4: Predictive Analytics
    if (systemConfig.isPhaseEnabled(4)) {
      console.log('📈 Executing Phase 4: Predictive Analytics');
      const phase4Start = Date.now();
      
      try {
        const teamAssignments = result.phases.phase3?.teamAssignments || [];
        const phase4Result = await executePhase4Analytics(jobs, teamAssignments, date);
        result.phases.phase4 = phase4Result;
        
        if (phase4Result.pricingOptimization) {
          result.overallMetrics.totalCostSavings += phase4Result.pricingOptimization.expectedRevenue || 0;
        }

        console.log('✅ Phase 4 completed', {
          predictions: phase4Result.predictions.length,
          time: Date.now() - phase4Start
        });

      } catch (error) {
        console.error('❌ Phase 4 failed:', error);
        result.recommendations.push({
          type: 'warning',
          phase: 'Phase 4',
          message: 'Predictive analytics failed, using historical data',
          impact: 'low',
          actionRequired: false
        });
      }
    }

    // Phase 5: Autonomous Decisions
    if (systemConfig.isPhaseEnabled(5)) {
      console.log('🤖 Executing Phase 5: Autonomous Decisions');
      const phase5Start = Date.now();
      
      try {
        const phase5Result = await executePhase5AutonomousDecisions(result, preferences);
        result.phases.phase5 = phase5Result;
        result.overallMetrics.autonomyRate = phase5Result.confidenceScore;

        console.log('✅ Phase 5 completed', {
          autonomousDecisions: phase5Result.autonomousDecisions.length,
          confidenceScore: phase5Result.confidenceScore.toFixed(3),
          humanReviewRequired: phase5Result.humanReviewRequired,
          time: Date.now() - phase5Start
        });

      } catch (error) {
        console.error('❌ Phase 5 failed:', error);
        result.recommendations.push({
          type: 'warning',
          phase: 'Phase 5',
          message: 'Autonomous decision making failed, manual review required',
          impact: 'high',
          actionRequired: true
        });
      }
    }

    // Calculate final metrics
    result.overallMetrics.processingTimeTotal = Date.now() - startTime;
    result.overallMetrics.customerSatisfactionImpact = calculateCustomerSatisfactionImpact(result);
    
    // Generate execution plan
    result.executionPlan = generateExecutionPlan(result);
    
    // Calculate estimated impact
    result.estimatedImpact = calculateEstimatedImpact(result);

    // Add system recommendations
    result.recommendations.push(...generateSystemRecommendations(result));

    console.log('🎉 Master optimization completed successfully', {
      optimizationId,
      totalTime: result.overallMetrics.processingTimeTotal,
      phasesExecuted: Object.keys(result.phases).length,
      overallEfficiency: result.overallMetrics.totalEfficiencyGain.toFixed(3)
    });

    // Store optimization result (in real implementation, save to database)
    await storeMasterOptimization(result);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Optimization-ID': optimizationId,
        'X-Processing-Time': result.overallMetrics.processingTimeTotal.toString(),
        'X-Phases-Executed': Object.keys(result.phases).length.toString(),
        'X-System-Version': '1.0.0'
      }
    });

  } catch (error) {
    console.error('❌ Master optimization failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Master optimization failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Type': 'master_optimization_error'
      }
    });
  }
}

/**
 * GET /api/system/master-optimization
 * Get optimization history and status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const optimizationId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';

    if (optimizationId) {
      // Get specific optimization
      const optimization = await getMasterOptimization(optimizationId);
      if (!optimization) {
        return NextResponse.json({
          success: false,
          error: 'Optimization not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      return NextResponse.json(optimization);
    }

    // Get optimization history
    const optimizations = await getMasterOptimizationHistory(limit, status);
    
    return NextResponse.json({
      success: true,
      optimizations,
      total: optimizations.length,
      filters: { limit, status },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve optimizations',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// =============================================================================
// PHASE EXECUTION FUNCTIONS
// =============================================================================

async function executePhase1Clustering(jobs: JobInput[], date: string, constraints: OptimizationConstraints): Promise<Phase1Result> {
  // Simulate Phase 1 clustering logic
  const clusters: JobCluster[] = [];
  
  // Group jobs by geographic proximity
  const jobGroups = groupJobsByProximity(jobs);
  
  for (let i = 0; i < jobGroups.length; i++) {
    const group = jobGroups[i];
    clusters.push({
      id: `cluster_${i + 1}`,
      jobs: group.map(j => j.id),
      centerPoint: calculateCenterPoint(group.map(j => j.pickupAddress)),
      estimatedDuration: group.reduce((sum, j) => sum + j.estimatedDuration, 0)
    });
  }

  return {
    enabled: true,
    clusters,
    efficiency: Math.random() * 0.3 + 0.7, // 0.7-1.0
    weatherAdjustments: { factor: 1.1, reason: 'good_weather' },
    processingTime: Math.random() * 500 + 100
  };
}

async function executePhase2RouteOptimization(clusters: JobCluster[], vehicles: VehicleInput[], constraints: OptimizationConstraints): Promise<Phase2Result> {
  const routes: OptimizedRoute[] = [];
  let totalDistance = 0;
  
  for (const cluster of clusters) {
    const route: OptimizedRoute = {
      id: `route_${cluster.id}`,
      vehicleId: vehicles[0]?.id || 'default_vehicle',
      jobIds: cluster.jobs,
      waypoints: [cluster.centerPoint],
      totalDistance: Math.random() * 50 + 20,
      estimatedDuration: cluster.estimatedDuration
    };
    routes.push(route);
    totalDistance += route.totalDistance;
  }

  return {
    enabled: true,
    routes,
    totalDistance,
    estimatedFuelCost: totalDistance * 1.2, // SEK per km
    co2Reduction: totalDistance * 0.15, // 15% reduction
    processingTime: Math.random() * 800 + 200
  };
}

async function executePhase3TeamOptimization(routes: OptimizedRoute[], staff: StaffInput[], constraints: OptimizationConstraints): Promise<Phase3Result> {
  const teamAssignments: TeamAssignment[] = [];
  
  for (const route of routes) {
    const assignment: TeamAssignment = {
      id: `team_${route.id}`,
      routeId: route.id,
      staffIds: staff.slice(0, 2).map(s => s.id),
      skills: staff.slice(0, 2).flatMap(s => s.skills),
      workload: route.estimatedDuration / 60 // hours
    };
    teamAssignments.push(assignment);
  }

  return {
    enabled: true,
    teamAssignments,
    skillCoverage: Math.random() * 0.2 + 0.8, // 0.8-1.0
    workloadBalance: Math.random() * 0.15 + 0.85, // 0.85-1.0
    processingTime: Math.random() * 600 + 150
  };
}

async function executePhase4Analytics(jobs: JobInput[], teamAssignments: TeamAssignment[], date: string): Promise<Phase4Result> {
  return {
    enabled: true,
    predictions: [
      { type: 'demand_forecast', value: jobs.length * 1.15, confidence: 0.87 },
      { type: 'efficiency_prediction', value: 0.92, confidence: 0.81 }
    ],
    demandForecast: {
      nextWeek: jobs.length * 1.1,
      nextMonth: jobs.length * 4.2,
      confidence: 0.85
    },
    pricingOptimization: {
      recommendedAdjustment: 0.05,
      expectedRevenue: jobs.length * 150,
      confidence: 0.78
    },
    processingTime: Math.random() * 1200 + 300
  };
}

async function executePhase5AutonomousDecisions(optimizationResult: MasterOptimizationResult, preferences: OptimizationPreferences): Promise<Phase5Result> {
  const decisions = [];
  let totalConfidence = 0;
  let humanReviewCount = 0;

  // Generate autonomous decisions based on optimization results
  if (optimizationResult.phases.phase2) {
    decisions.push({
      id: 'pricing_decision_1',
      type: 'pricing',
      confidence: Math.random() * 0.2 + 0.8,
      autonomous: true,
      action: 'apply_dynamic_pricing'
    });
  }

  if (optimizationResult.phases.phase3) {
    const confidence = Math.random() * 0.3 + 0.7;
    decisions.push({
      id: 'operational_decision_1', 
      type: 'operational',
      confidence,
      autonomous: confidence > 0.85,
      action: 'optimize_team_assignments'
    });
    
    if (confidence <= 0.85) humanReviewCount++;
  }

  totalConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;

  return {
    enabled: true,
    autonomousDecisions: decisions,
    confidenceScore: totalConfidence,
    humanReviewRequired: humanReviewCount,
    processingTime: Math.random() * 400 + 100
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function groupJobsByProximity(jobs: JobInput[]): JobInput[][] {
  // Simple geographic clustering based on postal codes
  const groups: { [key: string]: JobInput[] } = {};
  
  for (const job of jobs) {
    const postalPrefix = job.pickupAddress.postalCode.substring(0, 3);
    if (!groups[postalPrefix]) {
      groups[postalPrefix] = [];
    }
    groups[postalPrefix].push(job);
  }
  
  return Object.values(groups);
}

function calculateCenterPoint(addresses: Address[]): Address {
  const lat = addresses.reduce((sum, addr) => sum + (addr.latitude || 59.3293), 0) / addresses.length;
  const lng = addresses.reduce((sum, addr) => sum + (addr.longitude || 18.0686), 0) / addresses.length;
  
  return {
    street: 'Center Point',
    postalCode: addresses[0].postalCode,
    city: addresses[0].city,
    latitude: lat,
    longitude: lng
  };
}

function calculateCustomerSatisfactionImpact(result: MasterOptimizationResult): number {
  let impact = 0;
  
  if (result.phases.phase1) impact += 0.05; // Better clustering
  if (result.phases.phase2) impact += 0.08; // Optimized routes
  if (result.phases.phase3) impact += 0.06; // Better teams
  if (result.phases.phase4) impact += 0.03; // Predictive insights
  if (result.phases.phase5) impact += 0.02; // Autonomous efficiency
  
  return impact;
}

function generateExecutionPlan(result: MasterOptimizationResult): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let stepNumber = 1;

  if (result.phases.phase1) {
    steps.push({
      step: stepNumber++,
      phase: 'Phase 1',
      action: 'Apply job clustering',
      estimatedDuration: 15,
      dependencies: [],
      status: 'completed'
    });
  }

  if (result.phases.phase2) {
    steps.push({
      step: stepNumber++,
      phase: 'Phase 2', 
      action: 'Update vehicle routes',
      estimatedDuration: 30,
      dependencies: ['Phase 1'],
      status: 'pending'
    });
  }

  if (result.phases.phase3) {
    steps.push({
      step: stepNumber++,
      phase: 'Phase 3',
      action: 'Assign optimized teams',
      estimatedDuration: 20,
      dependencies: ['Phase 2'],
      status: 'pending'
    });
  }

  return steps;
}

function calculateEstimatedImpact(result: MasterOptimizationResult): EstimatedImpact {
  return {
    financial: {
      costSavings: result.overallMetrics.totalCostSavings,
      revenueIncrease: result.phases.phase4?.pricingOptimization?.expectedRevenue || 0,
      roi: (result.overallMetrics.totalCostSavings / 10000) * 100 // Simplified ROI
    },
    operational: {
      efficiencyGain: result.overallMetrics.totalEfficiencyGain,
      timeReduction: result.phases.phase2?.totalDistance ? result.phases.phase2.totalDistance * 0.1 : 0,
      resourceOptimization: result.phases.phase3?.workloadBalance || 0
    },
    environmental: {
      co2Reduction: result.overallMetrics.totalCo2Reduction,
      fuelSavings: result.phases.phase2?.estimatedFuelCost ? result.phases.phase2.estimatedFuelCost * 0.15 : 0
    },
    customer: {
      satisfactionIncrease: result.overallMetrics.customerSatisfactionImpact,
      serviceImprovement: result.overallMetrics.totalEfficiencyGain * 0.8
    }
  };
}

function generateSystemRecommendations(result: MasterOptimizationResult): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (result.overallMetrics.totalEfficiencyGain < 0.8) {
    recommendations.push({
      type: 'optimization',
      phase: 'System',
      message: 'Consider enabling more phases for better optimization',
      impact: 'high',
      actionRequired: true
    });
  }

  if (result.phases.phase5 && result.phases.phase5.humanReviewRequired > 0) {
    recommendations.push({
      type: 'info',
      phase: 'Phase 5',
      message: `${result.phases.phase5.humanReviewRequired} decisions require human review`,
      impact: 'medium',
      actionRequired: true
    });
  }

  return recommendations;
}

async function storeMasterOptimization(result: MasterOptimizationResult): Promise<void> {
  // In real implementation, store to database
  console.log('💾 Storing master optimization result:', result.optimizationId);
}

async function getMasterOptimization(optimizationId: string): Promise<MasterOptimizationResult | null> {
  // In real implementation, fetch from database
  return null;
}

async function getMasterOptimizationHistory(limit: number, status: string): Promise<MasterOptimizationResult[]> {
  // In real implementation, fetch from database
  return [];
}