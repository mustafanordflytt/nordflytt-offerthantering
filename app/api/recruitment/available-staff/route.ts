import { NextResponse } from 'next/server';

// Mock available staff data
const MOCK_AVAILABLE_STAFF = [
  {
    id: '1',
    name: 'Erik Johansson',
    position: 'Team Leader',
    availability: 'full_time',
    hours_per_week: 40,
    skills: ['heavy_lifting', 'driving_b', 'customer_service'],
    location: 'Stockholm',
    status: 'active'
  },
  {
    id: '2',
    name: 'Maria Andersson',
    position: 'Moving Specialist',
    availability: 'full_time',
    hours_per_week: 40,
    skills: ['packing', 'customer_service', 'furniture_assembly'],
    location: 'Stockholm',
    status: 'active'
  },
  {
    id: '3',
    name: 'Ahmed Hassan',
    position: 'Driver',
    availability: 'full_time',
    hours_per_week: 40,
    skills: ['driving_c', 'heavy_lifting', 'route_planning'],
    location: 'Stockholm',
    status: 'active'
  },
  {
    id: '4',
    name: 'Lisa Svensson',
    position: 'Moving Specialist',
    availability: 'part_time',
    hours_per_week: 20,
    skills: ['packing', 'cleaning', 'customer_service'],
    location: 'Stockholm',
    status: 'active'
  },
  {
    id: '5',
    name: 'Johan Berg',
    position: 'Moving Specialist',
    availability: 'full_time',
    hours_per_week: 40,
    skills: ['heavy_lifting', 'driving_b', 'warehouse'],
    location: 'Göteborg',
    status: 'active'
  },
  {
    id: '6',
    name: 'Emma Nilsson',
    position: 'Team Leader',
    availability: 'full_time',
    hours_per_week: 40,
    skills: ['leadership', 'customer_service', 'planning'],
    location: 'Stockholm',
    status: 'sick_leave',
    sick_until: '2024-02-20'
  },
  {
    id: '7',
    name: 'Karl Pettersson',
    position: 'Moving Specialist',
    availability: 'full_time',
    hours_per_week: 40,
    skills: ['heavy_lifting', 'furniture_assembly'],
    location: 'Uppsala',
    status: 'active'
  },
  {
    id: '8',
    name: 'Sofia Lindqvist',
    position: 'Moving Specialist',
    availability: 'part_time',
    hours_per_week: 25,
    skills: ['packing', 'customer_service', 'cleaning'],
    location: 'Stockholm',
    status: 'active'
  }
];

export async function GET(request: Request) {
  try {
    // In production, fetch from Supabase
    // const { data: staff, error } = await supabase
    //   .from('staff')
    //   .select('*')
    //   .in('status', ['active', 'sick_leave'])
    //   .order('name', { ascending: true });

    // Calculate available hours
    const activeStaff = MOCK_AVAILABLE_STAFF.filter(s => s.status === 'active');
    const sickStaff = MOCK_AVAILABLE_STAFF.filter(s => s.status === 'sick_leave');
    
    const totalAvailableHours = activeStaff.reduce((sum, staff) => 
      sum + staff.hours_per_week, 0
    );

    // Group by location
    const staffByLocation = MOCK_AVAILABLE_STAFF.reduce((acc, staff) => {
      if (!acc[staff.location]) {
        acc[staff.location] = {
          location: staff.location,
          activeCount: 0,
          sickCount: 0,
          totalHours: 0
        };
      }
      if (staff.status === 'active') {
        acc[staff.location].activeCount++;
        acc[staff.location].totalHours += staff.hours_per_week;
      } else if (staff.status === 'sick_leave') {
        acc[staff.location].sickCount++;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate sick leave rate
    const sickLeaveRate = sickStaff.length / MOCK_AVAILABLE_STAFF.length;

    // Identify skill gaps
    const skillCounts = activeStaff.reduce((acc, staff) => {
      staff.skills.forEach(skill => {
        acc[skill] = (acc[skill] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      staff: MOCK_AVAILABLE_STAFF,
      summary: {
        totalStaff: MOCK_AVAILABLE_STAFF.length,
        activeStaff: activeStaff.length,
        sickStaff: sickStaff.length,
        sickLeaveRate: Math.round(sickLeaveRate * 100),
        totalAvailableHours,
        staffByLocation: Object.values(staffByLocation),
        skillDistribution: skillCounts,
        criticalSkills: Object.entries(skillCounts)
          .filter(([_, count]) => count < 3)
          .map(([skill]) => skill)
      }
    });

  } catch (error) {
    console.error('Error fetching available staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available staff' },
      { status: 500 }
    );
  }
}