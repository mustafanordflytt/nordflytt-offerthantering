import { NextResponse } from 'next/server';

// Mock data for long-distance jobs
const MOCK_LONG_DISTANCE_JOBS = [
  {
    job_id: 'J2024-001',
    customer: 'Företag AB',
    from_location: 'Stockholm',
    to_location: 'Göteborg',
    distance_km: 470,
    scheduled_date: '2024-02-15',
    estimated_hours: 8,
    team_size: 2
  },
  {
    job_id: 'J2024-002',
    customer: 'Privat Flytt',
    from_location: 'Stockholm',
    to_location: 'Malmö',
    distance_km: 615,
    scheduled_date: '2024-02-18',
    estimated_hours: 10,
    team_size: 2
  },
  {
    job_id: 'J2024-003',
    customer: 'Tech Startup',
    from_location: 'Stockholm',
    to_location: 'Uppsala',
    distance_km: 71,
    scheduled_date: '2024-02-20',
    estimated_hours: 6,
    team_size: 2
  },
  {
    job_id: 'J2024-004',
    customer: 'Family Move',
    from_location: 'Stockholm',
    to_location: 'Linköping',
    distance_km: 200,
    scheduled_date: '2024-02-22',
    estimated_hours: 7,
    team_size: 2
  },
  {
    job_id: 'J2024-005',
    customer: 'Office Relocation',
    from_location: 'Stockholm',
    to_location: 'Örebro',
    distance_km: 165,
    scheduled_date: '2024-02-25',
    estimated_hours: 9,
    team_size: 3
  }
];

export async function GET(request: Request) {
  try {
    // In production, fetch from Supabase
    // const jobs = await supabase
    //   .from('jobs')
    //   .select('*')
    //   .gte('distance_km', 100)
    //   .gte('scheduled_date', new Date().toISOString())
    //   .order('scheduled_date', { ascending: true });

    const optimizations = MOCK_LONG_DISTANCE_JOBS
      .filter(job => job.distance_km > 100) // Only long-distance jobs
      .map(job => {
        // Calculate costs
        const fullTeamCost = calculateFullTeamCost(job);
        const hybridCost = calculateHybridTeamCost(job);
        const savings = fullTeamCost - hybridCost;
        const savingsPercentage = Math.round((savings / fullTeamCost) * 100);

        return {
          job_id: job.job_id,
          location: job.to_location,
          distance_km: job.distance_km,
          current_cost: fullTeamCost,
          optimized_cost: hybridCost,
          savings,
          savingsPercentage,
          recommendation: getRecommendation(job, savingsPercentage)
        };
      })
      .filter(opt => opt.savings > 500); // Only show significant savings

    // Group by location for summary
    const locationSummary = optimizations.reduce((acc, opt) => {
      if (!acc[opt.location]) {
        acc[opt.location] = {
          location: opt.location,
          jobs: 0,
          totalSavings: 0,
          avgDistance: 0
        };
      }
      acc[opt.location].jobs++;
      acc[opt.location].totalSavings += opt.savings;
      acc[opt.location].avgDistance = 
        (acc[opt.location].avgDistance * (acc[opt.location].jobs - 1) + opt.distance_km) / 
        acc[opt.location].jobs;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      optimizations,
      locationSummary: Object.values(locationSummary),
      totalPotentialSavings: optimizations.reduce((sum, opt) => sum + opt.savings, 0),
      recommendedActions: generateRecommendations(locationSummary)
    });

  } catch (error) {
    console.error('Geographic optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze geographic optimization' },
      { status: 500 }
    );
  }
}

function calculateFullTeamCost(job: any): number {
  const hourlyRate = 400; // SEK per hour per person
  const mileageRate = 12; // SEK per km
  const laborCost = job.estimated_hours * job.team_size * hourlyRate;
  const travelCost = job.distance_km * 2 * mileageRate; // Round trip
  const perDiem = job.distance_km > 200 ? 500 * job.team_size : 0; // Overnight allowance
  
  return laborCost + travelCost + perDiem;
}

function calculateHybridTeamCost(job: any): number {
  const stockholmRate = 400;
  const localRate = 250; // Lower rate for local staff
  const mileageRate = 12;
  
  // Assume 1 Stockholm staff + local staff
  const stockholmLaborCost = job.estimated_hours * 1 * stockholmRate;
  const localLaborCost = job.estimated_hours * (job.team_size - 1) * localRate;
  const travelCost = job.distance_km * 2 * mileageRate; // Only Stockholm staff travels
  const perDiem = job.distance_km > 200 ? 500 : 0; // Only for Stockholm staff
  
  return stockholmLaborCost + localLaborCost + travelCost + perDiem;
}

function getRecommendation(job: any, savingsPercentage: number): string {
  if (savingsPercentage > 30) {
    return `High priority: Recruit local staff in ${job.to_location} for ${savingsPercentage}% cost reduction`;
  } else if (savingsPercentage > 20) {
    return `Consider local recruitment in ${job.to_location} to save ${savingsPercentage}%`;
  } else {
    return `Monitor ${job.to_location} for future optimization opportunities`;
  }
}

function generateRecommendations(locationSummary: Record<string, any>): string[] {
  const recommendations = [];
  
  for (const [location, data] of Object.entries(locationSummary)) {
    if (data.jobs >= 3 && data.totalSavings > 5000) {
      recommendations.push(
        `🎯 Priority: Establish local team in ${location} - ${data.jobs} jobs/month, ` +
        `potential savings ${Math.round(data.totalSavings).toLocaleString()} SEK`
      );
    } else if (data.jobs >= 2) {
      recommendations.push(
        `📍 Consider: Part-time staff in ${location} - ${data.jobs} jobs/month`
      );
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Current geographic distribution is optimal');
  }
  
  return recommendations;
}