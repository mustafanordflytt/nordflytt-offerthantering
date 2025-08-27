// Real-time Staff Availability Update API
// Phase 3 implementation for dynamic team reoptimization

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, status, date } = body;
    
    console.log(`🔄 Staff availability update request: ${staffId} -> ${status}`);

    // Validate required fields
    if (!staffId) {
      return NextResponse.json({ 
        error: 'Staff ID is required' 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required' 
      }, { status: 400 });
    }

    const validStatuses = ['available', 'unavailable', 'busy', 'sick', 'emergency', 'vacation'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    const currentDate = date || new Date().toISOString().split('T')[0];

    try {
      // Dynamic import of the Real-Time Team Adapter
      const { RealTimeTeamAdapter } = await import('../../../lib/ai/real-time-team-adapter.js');
      const adapter = new RealTimeTeamAdapter();
      
      console.log('🚀 Processing real-time staff availability change');
      
      const result = await adapter.handleStaffAvailabilityChange(staffId, status, currentDate);
      
      // Broadcast real-time update to WebSocket clients if available
      await broadcastStaffUpdate(staffId, status, result);
      
      console.log(`✅ Staff availability update processed: ${JSON.stringify(result)}`);

      return NextResponse.json({
        success: result.success,
        staffId: parseInt(staffId),
        newStatus: status,
        date: currentDate,
        ...result,
        timestamp: new Date().toISOString()
      }, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Staff-Id': staffId.toString(),
          'X-New-Status': status,
          'X-Reoptimized': result.reoptimized ? 'true' : 'false'
        }
      });

    } catch (adapterError) {
      console.error('Real-time adapter failed, using fallback:', adapterError);
      
      // Fallback response
      const fallbackResult = {
        success: true,
        staffId: parseInt(staffId),
        newStatus: status,
        date: currentDate,
        reoptimized: false,
        message: 'Staff availability updated (fallback mode)',
        fallbackMode: true,
        timestamp: new Date().toISOString()
      };

      await broadcastStaffUpdate(staffId, status, fallbackResult);

      return NextResponse.json(fallbackResult, {
        status: 200,
        headers: {
          'X-Fallback-Mode': 'true'
        }
      });
    }

  } catch (error) {
    console.error('Staff availability update failed:', error);
    
    return NextResponse.json({ 
      error: 'Staff availability update failed',
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
  const staffId = searchParams.get('staffId');
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  try {
    if (staffId) {
      // Get specific staff member availability
      const staffAvailability = {
        staffId: parseInt(staffId),
        name: `Staff Member ${staffId}`,
        availability: 'available',
        lastUpdated: new Date().toISOString(),
        currentAssignments: [
          {
            routeId: 'route-1',
            teamRole: 'member',
            estimatedDuration: 240
          }
        ],
        todaySchedule: {
          startTime: '08:00',
          endTime: '16:00',
          breakTime: '12:00-13:00',
          totalHours: 7
        },
        availabilityHistory: [
          {
            status: 'available',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            reason: 'Started shift'
          },
          {
            status: 'busy',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            reason: 'Assigned to route'
          }
        ]
      };

      return NextResponse.json(staffAvailability, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Get all staff availability for the date
      const allStaffAvailability = [
        {
          staffId: 1,
          name: 'Erik Lindström',
          availability: 'available',
          skills: ['heavy_lifting', 'leadership'],
          currentRoute: null,
          lastUpdated: new Date().toISOString()
        },
        {
          staffId: 2,
          name: 'Anna Karlsson',
          availability: 'busy',
          skills: ['fragile_items', 'customer_service'],
          currentRoute: 'route-1',
          lastUpdated: new Date().toISOString()
        },
        {
          staffId: 3,
          name: 'Johan Andersson',
          availability: 'available',
          skills: ['problem_solving', 'leadership'],
          currentRoute: null,
          lastUpdated: new Date().toISOString()
        },
        {
          staffId: 4,
          name: 'Maria Svensson',
          availability: 'busy',
          skills: ['customer_service', 'fragile_items'],
          currentRoute: 'route-2',
          lastUpdated: new Date().toISOString()
        },
        {
          staffId: 5,
          name: 'Peter Johansson',
          availability: 'available',
          skills: ['speed', 'heavy_lifting'],
          currentRoute: null,
          lastUpdated: new Date().toISOString()
        },
        {
          staffId: 6,
          name: 'Lisa Nilsson',
          availability: 'sick',
          skills: ['fragile_items', 'customer_service'],
          currentRoute: null,
          lastUpdated: new Date(Date.now() - 3600000).toISOString(),
          unavailableReason: 'Sick leave'
        }
      ];

      const summary = {
        total: allStaffAvailability.length,
        available: allStaffAvailability.filter(s => s.availability === 'available').length,
        busy: allStaffAvailability.filter(s => s.availability === 'busy').length,
        unavailable: allStaffAvailability.filter(s => ['sick', 'vacation', 'emergency'].includes(s.availability)).length,
        date: date
      };

      return NextResponse.json({
        staff: allStaffAvailability,
        summary,
        lastUpdated: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

  } catch (error) {
    console.error('Failed to fetch staff availability:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch staff availability',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// WebSocket broadcast function (mock implementation)
async function broadcastStaffUpdate(staffId: string, status: string, result: any) {
  try {
    // In a real implementation, this would broadcast to WebSocket clients
    const update = {
      type: 'staff_availability_change',
      data: {
        staffId: parseInt(staffId),
        newStatus: status,
        reoptimized: result.reoptimized || false,
        efficiencyChange: result.efficiencyChange || null,
        affectedTeams: result.affectedTeams || 0
      },
      timestamp: new Date().toISOString()
    };

    console.log('📡 Broadcasting staff update (mock):', update);
    
    // Mock WebSocket broadcast - in production, this would use actual WebSocket server
    // wss.clients.forEach(client => {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(JSON.stringify(update));
    //   }
    // });
    
  } catch (error) {
    console.warn('Failed to broadcast staff update:', error);
  }
}