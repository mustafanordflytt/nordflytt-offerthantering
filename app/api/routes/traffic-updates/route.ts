// Real-time traffic updates API for route monitoring
// Phase 2 implementation for live traffic tracking and automatic rerouting

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🚦 Fetching real-time traffic updates for active routes');

    // Mock traffic data - in production this would integrate with Google Maps Traffic API
    const mockTrafficUpdates = {
      'route-1': {
        routeId: 'route-1',
        vehicleId: 1,
        currentLocation: {
          lat: 59.3325,
          lng: 18.0648,
          address: 'Östermalm, Stockholm'
        },
        condition: 'moderate',
        delayMinutes: 8,
        estimatedDelay: '8 minuter',
        nextUpdate: new Date(Date.now() + 60000).toISOString(),
        segments: [
          {
            from: 'Depot',
            to: 'Drottninggatan 45',
            condition: 'light',
            delayMinutes: 2
          },
          {
            from: 'Drottninggatan 45',
            to: 'Kungsgatan 12',
            condition: 'moderate',
            delayMinutes: 5
          },
          {
            from: 'Kungsgatan 12',
            to: 'Vasagatan 8',
            condition: 'light',
            delayMinutes: 1
          }
        ]
      },
      'route-2': {
        routeId: 'route-2',
        vehicleId: 2,
        currentLocation: {
          lat: 59.3293,
          lng: 18.0686,
          address: 'Depot, Stockholm'
        },
        condition: 'light',
        delayMinutes: 3,
        estimatedDelay: '3 minuter',
        nextUpdate: new Date(Date.now() + 60000).toISOString(),
        segments: [
          {
            from: 'Depot',
            to: 'Östermalm 23',
            condition: 'light',
            delayMinutes: 2
          },
          {
            from: 'Östermalm 23',
            to: 'Strandvägen 45',
            condition: 'light',
            delayMinutes: 1
          }
        ]
      },
      'route-3': {
        routeId: 'route-3',
        vehicleId: 3,
        currentLocation: {
          lat: 59.3418,
          lng: 18.0717,
          address: 'Norrmalm, Stockholm'
        },
        condition: 'heavy',
        delayMinutes: 18,
        estimatedDelay: '18 minuter',
        nextUpdate: new Date(Date.now() + 60000).toISOString(),
        segments: [
          {
            from: 'Depot',
            to: 'Sveavägen 100',
            condition: 'heavy',
            delayMinutes: 12
          },
          {
            from: 'Sveavägen 100',
            to: 'Upplandsgatan 45',
            condition: 'moderate',
            delayMinutes: 6
          }
        ],
        reroute_suggested: true,
        reroute_reason: 'Traffic jam detected on primary route'
      }
    };

    // Add weather impact simulation
    const weatherImpact = {
      condition: 'cloudy',
      temperature: 16,
      precipitation: 0,
      visibility_km: 10,
      impact_factor: 1.0,
      additional_delay_minutes: 0
    };

    // Calculate overall traffic statistics
    const totalRoutes = Object.keys(mockTrafficUpdates).length;
    const routesWithDelays = Object.values(mockTrafficUpdates).filter(route => route.delayMinutes > 5).length;
    const averageDelay = Object.values(mockTrafficUpdates).reduce((sum, route) => sum + route.delayMinutes, 0) / totalRoutes;
    const routesRequiringReroute = Object.values(mockTrafficUpdates).filter(route => route.delayMinutes > 15).length;

    const response = {
      traffic_updates: mockTrafficUpdates,
      weather_impact: weatherImpact,
      statistics: {
        total_routes: totalRoutes,
        routes_with_delays: routesWithDelays,
        average_delay_minutes: Math.round(averageDelay * 10) / 10,
        routes_requiring_reroute: routesRequiringReroute,
        overall_condition: averageDelay > 10 ? 'heavy' : averageDelay > 5 ? 'moderate' : 'light'
      },
      last_updated: new Date().toISOString(),
      next_update: new Date(Date.now() + 60000).toISOString()
    };

    console.log(`✅ Traffic updates fetched: ${totalRoutes} routes, ${routesRequiringReroute} need rerouting`);

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Update-Frequency': '60',
        'X-Routes-Count': totalRoutes.toString(),
        'X-Average-Delay': averageDelay.toFixed(1)
      }
    });

  } catch (error) {
    console.error('Failed to fetch traffic updates:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch traffic updates',
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
    const { route_ids, update_frequency_seconds = 60 } = body;

    console.log(`🔄 Subscribing to traffic updates for routes: ${route_ids?.join(', ') || 'all'}`);

    // Mock subscription response
    const subscription = {
      subscription_id: `sub_${Date.now()}`,
      route_ids: route_ids || ['all'],
      update_frequency_seconds,
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    return NextResponse.json({
      message: 'Traffic updates subscription created',
      subscription,
      webhook_url: `/api/routes/traffic-updates/webhook`,
      instructions: 'Real-time updates will be pushed to your webhook endpoint'
    }, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Failed to create traffic subscription:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create traffic subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}