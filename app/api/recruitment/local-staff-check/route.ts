import { NextResponse } from 'next/server';

// Mock local staff data by city
const LOCAL_STAFF_DATA = {
  'Stockholm': { count: 12, active: 10 },
  'Göteborg': { count: 1, active: 1 },
  'Malmö': { count: 0, active: 0 },
  'Uppsala': { count: 1, active: 1 },
  'Linköping': { count: 0, active: 0 },
  'Örebro': { count: 0, active: 0 },
  'Västerås': { count: 0, active: 0 },
  'Norrköping': { count: 0, active: 0 },
  'Helsingborg': { count: 0, active: 0 },
  'Jönköping': { count: 0, active: 0 }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      );
    }

    // In production, query Supabase
    // const { data: staff, error } = await supabase
    //   .from('staff')
    //   .select('id, name, status')
    //   .eq('location', city)
    //   .eq('status', 'active');

    const staffData = LOCAL_STAFF_DATA[city] || { count: 0, active: 0 };
    const hasLocalStaff = staffData.count > 0;
    
    // Calculate recommendations
    let recommendation = '';
    if (staffData.count === 0) {
      recommendation = 'No local staff - high priority for recruitment';
    } else if (staffData.count === 1) {
      recommendation = 'Only 1 local staff - recommend hiring 1-2 more for reliability';
    } else if (staffData.count < 3) {
      recommendation = 'Limited local coverage - consider expanding team';
    } else {
      recommendation = 'Adequate local coverage';
    }

    // Estimate savings potential
    const avgJobsPerMonth = city === 'Göteborg' ? 8 : 
                           city === 'Malmö' ? 6 : 
                           city === 'Uppsala' ? 4 : 2;
    
    const potentialMonthlySavings = avgJobsPerMonth * 1500; // Average savings per job

    return NextResponse.json({
      city,
      hasLocalStaff,
      staffCount: staffData.count,
      activeStaffCount: staffData.active,
      recommendation,
      avgJobsPerMonth,
      potentialMonthlySavings,
      priority: staffData.count === 0 ? 'high' : 
               staffData.count === 1 ? 'medium' : 'low'
    });

  } catch (error) {
    console.error('Error checking local staff:', error);
    return NextResponse.json(
      { error: 'Failed to check local staff' },
      { status: 500 }
    );
  }
}