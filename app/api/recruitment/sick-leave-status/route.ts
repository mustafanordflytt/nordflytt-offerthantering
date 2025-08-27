import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // In production, fetch from Supabase
    // const { data: staff, error } = await supabase
    //   .from('staff')
    //   .select('id, name, status, sick_until')
    //   .in('status', ['active', 'sick_leave']);

    // Mock data for demonstration
    const totalStaff = 25;
    const sickStaff = [
      { id: '6', name: 'Emma Nilsson', sick_since: '2024-02-10', expected_return: '2024-02-20' },
      { id: '11', name: 'Peter Olsson', sick_since: '2024-02-12', expected_return: '2024-02-19' },
      { id: '15', name: 'Anna Eriksson', sick_since: '2024-02-14', expected_return: null },
      { id: '18', name: 'Mikael Lundqvist', sick_since: '2024-02-13', expected_return: '2024-02-17' },
      { id: '22', name: 'Sara Johansson', sick_since: '2024-02-15', expected_return: null }
    ];

    const sickRate = sickStaff.length / totalStaff;
    
    // Calculate trends
    const lastWeekSickRate = 0.12; // 12% last week
    const trend = sickRate > lastWeekSickRate ? 'increasing' : 'decreasing';
    
    // Identify patterns
    const patterns = [];
    if (sickRate > 0.15) {
      patterns.push('High sick leave rate detected - possible flu season or workplace issues');
    }
    if (sickStaff.filter(s => !s.expected_return).length > 2) {
      patterns.push('Multiple staff on indefinite sick leave - consider temporary hiring');
    }

    // Calculate coverage needs
    const coverageNeeded = Math.ceil(sickStaff.length * 1.2); // 20% buffer

    return NextResponse.json({
      sickRate,
      sickCount: sickStaff.length,
      totalStaff,
      sickStaff,
      trend,
      patterns,
      coverageNeeded,
      recommendation: sickRate > 0.2 
        ? 'Immediate temporary staff needed' 
        : sickRate > 0.15 
          ? 'Monitor closely, prepare contingency'
          : 'Normal levels, no action needed'
    });

  } catch (error) {
    console.error('Error fetching sick leave status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sick leave status' },
      { status: 500 }
    );
  }
}