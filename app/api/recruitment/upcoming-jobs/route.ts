import { NextResponse } from 'next/server';

// Mock upcoming jobs data
const MOCK_UPCOMING_JOBS = [
  {
    id: '1',
    customer_name: 'IKEA Stockholm',
    job_type: 'office_move',
    scheduled_date: '2024-02-15',
    estimated_hours: 8,
    team_size_needed: 4,
    location: 'Stockholm',
    status: 'confirmed'
  },
  {
    id: '2',
    customer_name: 'Private Villa',
    job_type: 'residential_move',
    scheduled_date: '2024-02-16',
    estimated_hours: 6,
    team_size_needed: 3,
    location: 'Solna',
    status: 'confirmed'
  },
  {
    id: '3',
    customer_name: 'Tech Startup',
    job_type: 'office_move',
    scheduled_date: '2024-02-17',
    estimated_hours: 10,
    team_size_needed: 5,
    location: 'Kista',
    status: 'confirmed'
  },
  {
    id: '4',
    customer_name: 'Restaurant Chain',
    job_type: 'commercial_move',
    scheduled_date: '2024-02-18',
    estimated_hours: 12,
    team_size_needed: 6,
    location: 'Göteborg',
    status: 'confirmed'
  },
  {
    id: '5',
    customer_name: 'Family Apartment',
    job_type: 'residential_move',
    scheduled_date: '2024-02-19',
    estimated_hours: 5,
    team_size_needed: 2,
    location: 'Uppsala',
    status: 'tentative'
  },
  {
    id: '6',
    customer_name: 'Government Office',
    job_type: 'office_move',
    scheduled_date: '2024-02-20',
    estimated_hours: 16,
    team_size_needed: 8,
    location: 'Stockholm',
    status: 'confirmed'
  },
  {
    id: '7',
    customer_name: 'Retail Store',
    job_type: 'commercial_move',
    scheduled_date: '2024-02-21',
    estimated_hours: 8,
    team_size_needed: 4,
    location: 'Malmö',
    status: 'confirmed'
  },
  {
    id: '8',
    customer_name: 'Student Housing',
    job_type: 'residential_move',
    scheduled_date: '2024-02-22',
    estimated_hours: 4,
    team_size_needed: 2,
    location: 'Lund',
    status: 'confirmed'
  }
];

export async function GET(request: Request) {
  try {
    // In production, fetch from Supabase
    // const { data: jobs, error } = await supabase
    //   .from('jobs')
    //   .select('*')
    //   .gte('scheduled_date', new Date().toISOString())
    //   .lte('scheduled_date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
    //   .eq('status', 'confirmed')
    //   .order('scheduled_date', { ascending: true });

    // Calculate total hours needed
    const totalHoursNeeded = MOCK_UPCOMING_JOBS.reduce((sum, job) => 
      sum + (job.estimated_hours * job.team_size_needed), 0
    );

    // Group by date for capacity planning
    const jobsByDate = MOCK_UPCOMING_JOBS.reduce((acc, job) => {
      const date = job.scheduled_date;
      if (!acc[date]) {
        acc[date] = {
          date,
          jobs: [],
          totalHours: 0,
          totalStaffNeeded: 0
        };
      }
      acc[date].jobs.push(job);
      acc[date].totalHours += job.estimated_hours * job.team_size_needed;
      acc[date].totalStaffNeeded += job.team_size_needed;
      return acc;
    }, {} as Record<string, any>);

    // Identify peak days
    const peakDays = Object.values(jobsByDate)
      .filter((day: any) => day.totalStaffNeeded > 15)
      .map((day: any) => day.date);

    return NextResponse.json({
      jobs: MOCK_UPCOMING_JOBS,
      summary: {
        totalJobs: MOCK_UPCOMING_JOBS.length,
        totalHoursNeeded,
        averageTeamSize: Math.round(
          MOCK_UPCOMING_JOBS.reduce((sum, job) => sum + job.team_size_needed, 0) / 
          MOCK_UPCOMING_JOBS.length
        ),
        peakDays,
        jobsByDate: Object.values(jobsByDate)
      }
    });

  } catch (error) {
    console.error('Error fetching upcoming jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming jobs' },
      { status: 500 }
    );
  }
}