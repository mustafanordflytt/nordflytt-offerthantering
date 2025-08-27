// Routes API for retrieving optimized route data
// Phase 2 implementation supporting real-time route monitoring

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const vehicleId = searchParams.get('vehicleId');
    const includeTraffic = searchParams.get('includeTraffic') === 'true';
    
    console.log('📍 Fetching routes:', { date, vehicleId, includeTraffic });

    if (!date) {
      return NextResponse.json({ 
        error: 'Date parameter is required' 
      }, { status: 400 });
    }

    // Mock route data - in production this would come from optimized_routes table
    const mockRoutes = [
      {
        id: 'route-1',
        vehicleId: 1,
        vehicle: {
          id: 1,
          license_plate: 'ABC123',
          vehicle_type: 'small',
          capacity_cubic_meters: 15,
          co2_emission_grams_per_km: 120.0,
          fuel_consumption_per_100km: 6.5
        },
        jobs: [
          {
            id: 1,
            lat: 59.3345,
            lng: 18.0648,
            customer_name: 'Kund 1',
            address: 'Drottninggatan 45',
            estimated_volume: 20,
            estimated_duration: 180,
            service_type: 'moving'
          },
          {
            id: 2,
            lat: 59.3312,
            lng: 18.0632,
            customer_name: 'Kund 2',
            address: 'Kungsgatan 12',
            estimated_volume: 15,
            estimated_duration: 120,
            service_type: 'moving'
          },
          {
            id: 3,
            lat: 59.3298,
            lng: 18.0553,
            customer_name: 'Kund 3',
            address: 'Vasagatan 8',
            estimated_volume: 25,
            estimated_duration: 210,
            service_type: 'moving'
          }
        ],
        totalVolume: 60,
        totalDistance: 23500, // meters
        realTimeDistance: 24800, // meters with traffic routing
        realTimeDuration: 3300, // seconds
        realTimeDurationInTraffic: 3960, // seconds with current traffic
        trafficCondition: 'moderate',
        fuelCost: 72.50,
        co2Emissions: 2976, // grams
        estimatedArrival: new Date(Date.now() + 3960000).toISOString(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'route-2',
        vehicleId: 2,
        vehicle: {
          id: 2,
          license_plate: 'DEF456',
          vehicle_type: 'medium',
          capacity_cubic_meters: 25,
          co2_emission_grams_per_km: 150.0,
          fuel_consumption_per_100km: 8.0
        },
        jobs: [
          {
            id: 4,
            lat: 59.3345,
            lng: 18.0755,
            customer_name: 'Kund 4',
            address: 'Östermalm 23',
            estimated_volume: 18,
            estimated_duration: 90,
            service_type: 'moving'
          },
          {
            id: 5,
            lat: 59.3325,
            lng: 18.0875,
            customer_name: 'Kund 5',
            address: 'Strandvägen 45',
            estimated_volume: 30,
            estimated_duration: 180,
            service_type: 'moving'
          }
        ],
        totalVolume: 48,
        totalDistance: 18200, // meters
        realTimeDistance: 19500, // meters with traffic routing
        realTimeDuration: 2700, // seconds
        realTimeDurationInTraffic: 3240, // seconds with current traffic
        trafficCondition: 'light',
        fuelCost: 60.84,
        co2Emissions: 2925, // grams
        estimatedArrival: new Date(Date.now() + 3240000).toISOString(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'route-3',
        vehicleId: 3,
        vehicle: {
          id: 3,
          license_plate: 'GHI789',
          vehicle_type: 'large',
          capacity_cubic_meters: 40,
          co2_emission_grams_per_km: 180.0,
          fuel_consumption_per_100km: 10.5
        },
        jobs: [
          {
            id: 6,
            lat: 59.3418,
            lng: 18.0717,
            customer_name: 'Kund 6',
            address: 'Sveavägen 100',
            estimated_volume: 35,
            estimated_duration: 240,
            service_type: 'moving'
          }
        ],
        totalVolume: 35,
        totalDistance: 15800, // meters
        realTimeDistance: 17900, // meters with traffic routing (rerouted due to traffic)
        realTimeDuration: 2400, // seconds
        realTimeDurationInTraffic: 3600, // seconds with heavy traffic
        trafficCondition: 'heavy',
        fuelCost: 58.25,
        co2Emissions: 3222, // grams
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        rerouteCount: 1,
        lastReroute: new Date(Date.now() - 900000).toISOString() // 15 minutes ago
      }
    ];

    // Filter by vehicleId if specified
    let filteredRoutes = mockRoutes;
    if (vehicleId) {
      const vehicleIdNum = parseInt(vehicleId);
      filteredRoutes = mockRoutes.filter(route => route.vehicleId === vehicleIdNum);
    }

    // Add real-time traffic data if requested
    if (includeTraffic) {
      filteredRoutes = filteredRoutes.map(route => ({
        ...route,
        currentTraffic: {
          condition: route.trafficCondition,
          delayMinutes: Math.round((route.realTimeDurationInTraffic - route.realTimeDuration) / 60),
          lastUpdated: new Date().toISOString(),
          nextUpdate: new Date(Date.now() + 60000).toISOString()
        },
        liveLocation: {
          lat: route.jobs[0]?.lat || 59.3293,
          lng: route.jobs[0]?.lng || 18.0686,
          heading: 45,
          speed_kmh: route.trafficCondition === 'heavy' ? 15 : route.trafficCondition === 'moderate' ? 25 : 35,
          lastUpdated: new Date().toISOString()
        }
      }));
    }

    // Calculate summary statistics
    const summary = {
      total_routes: filteredRoutes.length,
      total_jobs: filteredRoutes.reduce((sum, route) => sum + route.jobs.length, 0),
      total_distance_km: Math.round(filteredRoutes.reduce((sum, route) => sum + route.realTimeDistance, 0) / 1000 * 10) / 10,
      total_duration_hours: Math.round(filteredRoutes.reduce((sum, route) => sum + route.realTimeDurationInTraffic, 0) / 3600 * 10) / 10,
      total_fuel_cost: Math.round(filteredRoutes.reduce((sum, route) => sum + route.fuelCost, 0) * 100) / 100,
      total_co2_emissions_kg: Math.round(filteredRoutes.reduce((sum, route) => sum + route.co2Emissions, 0) / 1000 * 100) / 100,
      average_traffic_delay_minutes: Math.round(filteredRoutes.reduce((sum, route) => {
        return sum + (route.realTimeDurationInTraffic - route.realTimeDuration);
      }, 0) / filteredRoutes.length / 60 * 10) / 10,
      routes_with_delays: filteredRoutes.filter(route => 
        (route.realTimeDurationInTraffic - route.realTimeDuration) > 300 // > 5 minutes delay
      ).length
    };

    const response = {
      routes: filteredRoutes,
      summary,
      filters: {
        date,
        vehicleId: vehicleId ? parseInt(vehicleId) : null,
        includeTraffic
      },
      metadata: {
        timestamp: new Date().toISOString(),
        data_source: 'optimized_routes_table',
        real_time_traffic: includeTraffic
      }
    };

    console.log(`✅ Routes fetched: ${filteredRoutes.length} routes for ${date}`);

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Routes-Count': filteredRoutes.length.toString(),
        'X-Total-Distance': summary.total_distance_km.toString(),
        'X-Average-Delay': summary.average_traffic_delay_minutes.toString(),
        'Cache-Control': includeTraffic ? 'no-cache' : 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('Failed to fetch routes:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch routes',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleId, jobs, date, options = {} } = body;

    console.log(`📝 Creating manual route for vehicle ${vehicleId} with ${jobs?.length || 0} jobs`);

    if (!vehicleId || !jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ 
        error: 'Vehicle ID and jobs array are required' 
      }, { status: 400 });
    }

    // Mock manual route creation
    const manualRoute = {
      id: `manual-route-${Date.now()}`,
      vehicleId: parseInt(vehicleId),
      jobs: jobs,
      totalVolume: jobs.reduce((sum: number, job: any) => sum + (job.estimated_volume || 0), 0),
      totalDistance: jobs.length * 15000, // 15km per job estimate
      realTimeDistance: jobs.length * 16500, // With traffic
      realTimeDuration: jobs.length * 3600, // 1 hour per job
      realTimeDurationInTraffic: jobs.length * 4200, // With traffic
      trafficCondition: 'estimated',
      fuelCost: jobs.length * 45, // 45 SEK per job
      co2Emissions: jobs.length * 2500, // 2.5kg per job
      estimatedArrival: new Date(Date.now() + jobs.length * 4200000).toISOString(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      createdBy: 'manual',
      optimization_score: 75 // Lower score for manual routes
    };

    console.log(`✅ Manual route created: ${manualRoute.id} with ${jobs.length} jobs`);

    return NextResponse.json({
      message: 'Manual route created successfully',
      route: manualRoute,
      warnings: [
        'Manual routes may not be optimally efficient',
        'Consider using enhanced VRP optimization for better results'
      ]
    }, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Failed to create manual route:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create manual route',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}