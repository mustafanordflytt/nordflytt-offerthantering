import { NextRequest, NextResponse } from 'next/server';
import { smartSchedulingEngine } from '@/lib/ai/smart-scheduling-engine';

// Mock teams data - in production, fetch from database
const mockTeams = [
  {
    id: 'team1',
    name: 'Team Alpha',
    size: 4,
    homeBase: { lat: 59.3293, lng: 18.0686 }, // Stockholm
    skills: ['residential', 'commercial', 'piano_moving'],
    vehicle: { type: 'large_truck', capacity: 60 },
    workingHours: { start: '08:00', end: '17:00' },
    efficiency: 0.92
  },
  {
    id: 'team2',
    name: 'Team Beta',
    size: 3,
    homeBase: { lat: 59.3293, lng: 18.0686 },
    skills: ['residential', 'fragile_handling'],
    vehicle: { type: 'medium_truck', capacity: 40 },
    workingHours: { start: '07:00', end: '16:00' },
    efficiency: 0.85
  },
  {
    id: 'team3',
    name: 'Team Gamma',
    size: 2,
    homeBase: { lat: 59.4034, lng: 17.9436 }, // Solna
    skills: ['residential', 'office'],
    vehicle: { type: 'van', capacity: 20 },
    workingHours: { start: '09:00', end: '18:00' },
    efficiency: 0.88
  }
];

export async function POST(request: NextRequest) {
  try {
    const jobData = await request.json();

    // Validate job data
    if (!jobData.customerLocation || !jobData.preferredDate) {
      return NextResponse.json(
        { error: 'Customer location and preferred date are required' },
        { status: 400 }
      );
    }

    // Transform job data to match engine interface
    const job = {
      id: jobData.id || `job_${Date.now()}`,
      customerId: jobData.customerId,
      customerLocation: jobData.customerLocation,
      serviceType: jobData.serviceType || 'residential_move',
      estimatedDuration: jobData.estimatedDuration || 4,
      requiredTeamSize: jobData.requiredTeamSize || 2,
      preferredDate: new Date(jobData.preferredDate),
      flexibility: jobData.flexibility || 'flexible',
      priority: jobData.priority || 'medium',
      specialRequirements: jobData.specialRequirements,
      volume: jobData.volume,
      floors: jobData.floors,
      hasElevator: jobData.hasElevator
    };

    // Get available teams (in production, filter by actual availability)
    const availableTeams = mockTeams;

    // Use AI to find optimal schedule
    const schedulingResult = await smartSchedulingEngine.scheduleJob(job, availableTeams);

    return NextResponse.json({
      success: true,
      scheduling: {
        jobId: schedulingResult.jobId,
        team: {
          id: schedulingResult.assignedTeam.id,
          name: schedulingResult.assignedTeam.name,
          size: schedulingResult.assignedTeam.size
        },
        schedule: {
          date: schedulingResult.scheduledSlot.date,
          startTime: schedulingResult.scheduledSlot.startTime,
          endTime: schedulingResult.scheduledSlot.endTime,
          duration: schedulingResult.totalDuration
        },
        optimization: {
          travelTime: schedulingResult.travelTime,
          efficiency: schedulingResult.efficiency,
          notes: schedulingResult.optimizationNotes
        },
        alternatives: schedulingResult.alternativeSlots
      }
    });

  } catch (error) {
    console.error('Smart scheduling error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule job' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return scheduling analytics
    const analytics = await smartSchedulingEngine.getSchedulingAnalytics();
    
    return NextResponse.json({
      success: true,
      analytics,
      teams: mockTeams.map(team => ({
        id: team.id,
        name: team.name,
        efficiency: team.efficiency,
        capacity: team.vehicle.capacity
      }))
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}