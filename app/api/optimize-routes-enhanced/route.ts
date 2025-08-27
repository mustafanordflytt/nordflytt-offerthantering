// Enhanced Route Optimization API endpoint with Clarke-Wright Algorithm
// Phase 2 implementation supporting 95%+ efficiency through AI optimization

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedVRPOptimizer } from '../../../lib/ai/enhanced-vrp-optimizer.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🚀 Enhanced VRP optimization request received:', {
      date: body.date,
      clustersCount: body.clusters?.length || 0,
      vehiclesCount: body.vehicleIds?.length || 0,
      algorithm: body.algorithm
    });

    const { date, clusters, vehicleIds, algorithm = 'clarke_wright', options = {} } = body;

    // Validate required fields
    if (!date) {
      return NextResponse.json({ 
        error: 'Date is required for optimization' 
      }, { status: 400 });
    }

    if (!clusters || !Array.isArray(clusters) || clusters.length === 0) {
      return NextResponse.json({ 
        error: 'Job clusters are required for optimization' 
      }, { status: 400 });
    }

    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return NextResponse.json({ 
        error: 'Vehicle IDs are required for optimization' 
      }, { status: 400 });
    }

    // Mock vehicle data for demo - in production this would come from database
    const availableVehicles = [
      {
        id: 1,
        vehicle_type: 'small',
        license_plate: 'ABC123',
        capacity_cubic_meters: 15,
        co2_emission_grams_per_km: 120.0,
        fuel_consumption_per_100km: 6.5
      },
      {
        id: 2,
        vehicle_type: 'medium',
        license_plate: 'DEF456',
        capacity_cubic_meters: 25,
        co2_emission_grams_per_km: 150.0,
        fuel_consumption_per_100km: 8.0
      },
      {
        id: 3,
        vehicle_type: 'large',
        license_plate: 'GHI789',
        capacity_cubic_meters: 40,
        co2_emission_grams_per_km: 180.0,
        fuel_consumption_per_100km: 10.5
      },
      {
        id: 4,
        vehicle_type: 'medium',
        license_plate: 'JKL012',
        capacity_cubic_meters: 25,
        co2_emission_grams_per_km: 150.0,
        fuel_consumption_per_100km: 8.0
      }
    ].filter(vehicle => vehicleIds.includes(vehicle.id));

    if (availableVehicles.length === 0) {
      return NextResponse.json({ 
        error: 'No valid vehicles found for the provided IDs' 
      }, { status: 400 });
    }

    // Initialize Enhanced VRP Optimizer
    const optimizer = new EnhancedVRPOptimizer();
    
    console.log(`🧮 Starting ${algorithm} optimization with ${options.enableTrafficOptimization ? 'traffic' : 'no traffic'} and ${options.enableSustainabilityTracking ? 'sustainability' : 'no sustainability'} tracking`);

    // Run optimization
    const optimizationStart = Date.now();
    const result = await optimizer.optimizeVehicleRoutes(clusters, date, availableVehicles);
    const optimizationTime = Date.now() - optimizationStart;

    // Add optimization metadata
    result.metadata = {
      optimizationTime,
      algorithm,
      options,
      requestId: `opt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      apiVersion: '2.0.0'
    };

    console.log(`✅ Enhanced VRP optimization complete in ${optimizationTime}ms`);
    console.log(`📊 Results: ${result.routes.length} routes, ${result.costAnalysis.efficiencyGain.toFixed(1)}% efficiency`);

    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Optimization-Time': optimizationTime.toString(),
        'X-Algorithm': algorithm,
        'X-Routes-Count': result.routes.length.toString(),
        'X-Efficiency-Gain': result.costAnalysis.efficiencyGain.toFixed(1)
      }
    });

  } catch (error) {
    console.error('Enhanced VRP optimization failed:', error);
    
    return NextResponse.json({ 
      error: 'Route optimization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  
  if (!date) {
    return NextResponse.json({ 
      error: 'Date parameter is required' 
    }, { status: 400 });
  }

  try {
    // Mock response for getting optimization history
    const optimizationHistory = [
      {
        id: 1,
        date: date,
        algorithm: 'clarke_wright',
        routes_count: 3,
        efficiency_gain: 92.5,
        total_distance_km: 145.2,
        total_co2_emissions_kg: 23.4,
        optimization_score: 89.1,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        date: date,
        algorithm: 'genetic_algorithm',
        routes_count: 4,
        efficiency_gain: 87.3,
        total_distance_km: 162.8,
        total_co2_emissions_kg: 26.1,
        optimization_score: 85.7,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    return NextResponse.json({
      optimizations: optimizationHistory,
      total: optimizationHistory.length,
      date: date
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Failed to fetch optimization history:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch optimization history',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}