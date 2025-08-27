// Automatic rerouting API for traffic-impacted routes
// Phase 2 implementation for intelligent route adaptation

import { NextRequest, NextResponse } from 'next/server';
import { GoogleMapsService } from '../../../../../lib/maps/enhanced-google-maps-service.js';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const routeId = params.id;
    const body = await request.json();
    
    console.log(`🔄 Rerouting request for route ${routeId}:`, {
      trafficCondition: body.trafficCondition?.condition || 'unknown',
      delayMinutes: body.trafficCondition?.delayMinutes || 0
    });

    const { trafficCondition, options = {} } = body;

    if (!trafficCondition) {
      return NextResponse.json({ 
        error: 'Traffic condition data is required for rerouting' 
      }, { status: 400 });
    }

    // Mock route data - in production this would come from database
    const currentRoute = {
      id: routeId,
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
          estimated_duration: 90
        },
        {
          id: 5,
          lat: 59.3325,
          lng: 18.0875,
          customer_name: 'Kund 5', 
          address: 'Strandvägen 45',
          estimated_volume: 30,
          estimated_duration: 120
        }
      ],
      originalDistance: 25000, // meters
      originalDuration: 3600,   // seconds
      currentLocation: {
        lat: 59.3293,
        lng: 18.0686
      }
    };

    // Initialize Google Maps service for rerouting
    const mapsService = new GoogleMapsService();
    
    const reroutingStart = Date.now();
    
    try {
      // Build waypoints for new route calculation
      const waypoints = [
        { lat: 59.3293, lng: 18.0686 }, // Depot start
        ...currentRoute.jobs.map(job => ({ 
          lat: job.lat, 
          lng: job.lng,
          jobId: job.id,
          name: job.customer_name
        })),
        { lat: 59.3293, lng: 18.0686 }  // Return to depot
      ];

      // Get new optimized route with current traffic
      const newRoute = await mapsService.getOptimizedRouteWithTraffic(waypoints, new Date());
      
      // Calculate new costs and emissions
      const newDistance = newRoute.totalDistance; // meters
      const fuelUsed = (newDistance / 1000 / 100) * currentRoute.vehicle.fuel_consumption_per_100km;
      const fuelCost = fuelUsed * 15.5; // SEK per liter
      const co2Emissions = (newDistance / 1000) * currentRoute.vehicle.co2_emission_grams_per_km;

      // Calculate savings/changes vs original route
      const distanceChange = newDistance - currentRoute.originalDistance;
      const durationChange = newRoute.totalDurationInTraffic - currentRoute.originalDuration;
      const trafficDelaySaved = trafficCondition.delayMinutes * 60; // Convert to seconds

      const reroute = {
        route_id: routeId,
        reroute_id: `reroute_${Date.now()}`,
        status: 'success',
        original_route: {
          distance_meters: currentRoute.originalDistance,
          duration_seconds: currentRoute.originalDuration,
          traffic_delay_seconds: trafficCondition.delayMinutes * 60
        },
        new_route: {
          distance_meters: newRoute.totalDistance,
          duration_seconds: newRoute.totalDuration,
          duration_in_traffic_seconds: newRoute.totalDurationInTraffic,
          traffic_condition: newRoute.overallTrafficCondition,
          estimated_arrival: newRoute.estimatedArrival,
          polyline: newRoute.polyline,
          optimized_order: newRoute.optimizedOrder
        },
        improvements: {
          distance_change_meters: distanceChange,
          distance_change_percent: ((distanceChange / currentRoute.originalDistance) * 100).toFixed(1),
          duration_change_seconds: durationChange,
          traffic_delay_saved_seconds: Math.max(0, trafficDelaySaved - durationChange),
          traffic_delay_saved_minutes: Math.max(0, (trafficDelaySaved - durationChange) / 60).toFixed(1),
          fuel_cost_change: (fuelCost - (currentRoute.originalDistance / 1000 / 100 * currentRoute.vehicle.fuel_consumption_per_100km * 15.5)).toFixed(2),
          co2_change_grams: co2Emissions - (currentRoute.originalDistance / 1000 * currentRoute.vehicle.co2_emission_grams_per_km)
        },
        updated_costs: {
          fuel_cost_sek: Math.round(fuelCost * 100) / 100,
          co2_emissions_grams: Math.round(co2Emissions),
          estimated_completion_time: newRoute.estimatedArrival
        },
        reroute_reason: `Heavy traffic detected: ${trafficCondition.delayMinutes} min delay. Automatic rerouting activated.`,
        created_at: new Date().toISOString(),
        processing_time_ms: Date.now() - reroutingStart
      };

      console.log(`✅ Route ${routeId} successfully rerouted in ${reroute.processing_time_ms}ms`);
      console.log(`📊 Improvements: ${reroute.improvements.traffic_delay_saved_minutes}min saved, ${reroute.improvements.distance_change_percent}% distance change`);

      return NextResponse.json(reroute, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Reroute-Time': reroute.processing_time_ms.toString(),
          'X-Traffic-Delay-Saved': reroute.improvements.traffic_delay_saved_minutes,
          'X-Distance-Change': reroute.improvements.distance_change_percent
        }
      });

    } catch (mapsError) {
      console.warn('Google Maps rerouting failed, using fallback calculation:', mapsError);
      
      // Fallback rerouting calculation
      const fallbackReroute = {
        route_id: routeId,
        reroute_id: `fallback_reroute_${Date.now()}`,
        status: 'fallback',
        original_route: {
          distance_meters: currentRoute.originalDistance,
          duration_seconds: currentRoute.originalDuration,
          traffic_delay_seconds: trafficCondition.delayMinutes * 60
        },
        new_route: {
          distance_meters: currentRoute.originalDistance * 1.1, // 10% longer route
          duration_seconds: currentRoute.originalDuration * 1.05, // 5% longer time
          duration_in_traffic_seconds: currentRoute.originalDuration * 1.15, // 15% with traffic
          traffic_condition: 'estimated',
          estimated_arrival: new Date(Date.now() + currentRoute.originalDuration * 1.15 * 1000),
          polyline: 'fallback_polyline_data',
          optimized_order: currentRoute.jobs.map((_, index) => index)
        },
        improvements: {
          distance_change_meters: currentRoute.originalDistance * 0.1,
          distance_change_percent: '+10.0',
          duration_change_seconds: currentRoute.originalDuration * 0.05,
          traffic_delay_saved_seconds: Math.max(0, trafficCondition.delayMinutes * 60 - currentRoute.originalDuration * 0.15),
          traffic_delay_saved_minutes: Math.max(0, trafficCondition.delayMinutes - currentRoute.originalDuration * 0.15 / 60).toFixed(1),
          fuel_cost_change: '15.50', // Estimated additional cost
          co2_change_grams: currentRoute.originalDistance * 0.1 / 1000 * currentRoute.vehicle.co2_emission_grams_per_km
        },
        updated_costs: {
          fuel_cost_sek: 85.75,
          co2_emissions_grams: 3750,
          estimated_completion_time: new Date(Date.now() + currentRoute.originalDuration * 1.15 * 1000).toISOString()
        },
        reroute_reason: `Fallback rerouting due to API limitations. Estimated improvements based on traffic conditions.`,
        warnings: ['Route calculated using fallback method - accuracy may be reduced'],
        created_at: new Date().toISOString(),
        processing_time_ms: Date.now() - reroutingStart
      };

      return NextResponse.json(fallbackReroute, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Reroute-Method': 'fallback',
          'X-Reroute-Time': fallbackReroute.processing_time_ms.toString()
        }
      });
    }

  } catch (error) {
    console.error(`Failed to reroute ${params.id}:`, error);
    
    return NextResponse.json({ 
      error: 'Rerouting failed',
      route_id: params.id,
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const routeId = params.id;
    
    // Mock response for getting reroute history
    const rerouteHistory = [
      {
        reroute_id: `reroute_${Date.now() - 3600000}`,
        route_id: routeId,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        reason: 'Heavy traffic on Sveavägen',
        traffic_delay_saved_minutes: 12.5,
        distance_change_percent: '+8.3',
        status: 'success'
      },
      {
        reroute_id: `reroute_${Date.now() - 7200000}`,
        route_id: routeId,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        reason: 'Road closure on Kungsgatan',
        traffic_delay_saved_minutes: 18.2,
        distance_change_percent: '+15.1',
        status: 'success'
      }
    ];

    return NextResponse.json({
      route_id: routeId,
      reroute_history: rerouteHistory,
      total_reroutes: rerouteHistory.length,
      total_time_saved_minutes: rerouteHistory.reduce((sum, r) => sum + parseFloat(r.traffic_delay_saved_minutes.toString()), 0)
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error(`Failed to fetch reroute history for ${params.id}:`, error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch reroute history',
      route_id: params.id,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}