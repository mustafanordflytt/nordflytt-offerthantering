import { NextResponse } from 'next/server';

// Thresholds for automation triggers
const AUTOMATION_THRESHOLDS = {
  capacityUtilization: 0.85,      // 85% capacity triggers hiring
  sickLeaveRate: 0.20,            // 20% sick leave triggers temp hiring
  bookingIncrease: 0.30,          // 30% increase triggers seasonal hiring
  geographicThreshold: 5,         // 5+ jobs/month in a city triggers local hiring
  turnoverRate: 0.15              // 15% turnover triggers retention measures
};

export async function GET(request: Request) {
  try {
    const triggers = [];
    const timestamp = new Date().toISOString();

    // Check capacity utilization
    const capacityCheck = await checkCapacityUtilization();
    if (capacityCheck.shouldTrigger) {
      triggers.push({
        type: 'capacity',
        reason: capacityCheck.reason,
        severity: 'high',
        data: capacityCheck.data,
        timestamp
      });
    }

    // Check sick leave rate
    const sickLeaveCheck = await checkSickLeaveRate();
    if (sickLeaveCheck.shouldTrigger) {
      triggers.push({
        type: 'sick_leave',
        reason: sickLeaveCheck.reason,
        severity: 'immediate',
        data: sickLeaveCheck.data,
        timestamp
      });
    }

    // Check geographic optimization
    const geoCheck = await checkGeographicNeeds();
    geoCheck.forEach(location => {
      if (location.shouldTrigger) {
        triggers.push({
          type: 'geographic',
          reason: location.reason,
          severity: 'medium',
          data: location.data,
          timestamp
        });
      }
    });

    // Check seasonal patterns
    const seasonalCheck = checkSeasonalDemand();
    if (seasonalCheck.shouldTrigger) {
      triggers.push({
        type: 'seasonal',
        reason: seasonalCheck.reason,
        severity: 'medium',
        data: seasonalCheck.data,
        timestamp
      });
    }

    return NextResponse.json({
      triggered: triggers,
      checkedAt: timestamp,
      nextCheckIn: '30 minutes'
    });

  } catch (error) {
    console.error('Error checking automation triggers:', error);
    return NextResponse.json(
      { error: 'Failed to check automation triggers' },
      { status: 500 }
    );
  }
}

async function checkCapacityUtilization() {
  // Simulate capacity check (in production, calculate from real data)
  const currentUtilization = 0.88; // 88% utilized
  const upcomingJobHours = 1250;
  const availableStaffHours = 1420;
  
  return {
    shouldTrigger: currentUtilization > AUTOMATION_THRESHOLDS.capacityUtilization,
    reason: `Capacity utilization at ${Math.round(currentUtilization * 100)}% - exceeds ${Math.round(AUTOMATION_THRESHOLDS.capacityUtilization * 100)}% threshold`,
    data: {
      currentUtilization,
      upcomingJobHours,
      availableStaffHours,
      staffNeeded: Math.ceil((currentUtilization - 0.85) * 10)
    }
  };
}

async function checkSickLeaveRate() {
  // Simulate sick leave check
  const totalStaff = 25;
  const sickStaff = 5;
  const sickRate = sickStaff / totalStaff;
  
  return {
    shouldTrigger: sickRate > AUTOMATION_THRESHOLDS.sickLeaveRate,
    reason: `Sick leave rate at ${Math.round(sickRate * 100)}% - exceeds ${Math.round(AUTOMATION_THRESHOLDS.sickLeaveRate * 100)}% threshold`,
    data: {
      sickRate,
      sickStaff,
      totalStaff,
      coverageNeeded: Math.ceil(sickStaff * 1.2)
    }
  };
}

async function checkGeographicNeeds() {
  // Simulate geographic analysis
  const cityJobCounts = {
    'Göteborg': { jobs: 8, hasLocalStaff: false },
    'Malmö': { jobs: 6, hasLocalStaff: false },
    'Uppsala': { jobs: 4, hasLocalStaff: true },
    'Linköping': { jobs: 3, hasLocalStaff: false }
  };
  
  return Object.entries(cityJobCounts).map(([city, data]) => ({
    shouldTrigger: data.jobs >= AUTOMATION_THRESHOLDS.geographicThreshold && !data.hasLocalStaff,
    reason: `${city} has ${data.jobs} jobs/month with no local staff`,
    data: {
      city,
      monthlyJobs: data.jobs,
      hasLocalStaff: data.hasLocalStaff,
      estimatedSavings: data.jobs * 1500
    }
  }));
}

function checkSeasonalDemand() {
  const currentMonth = new Date().getMonth();
  const isHighSeason = currentMonth === 5 || currentMonth === 6 || currentMonth === 7 || currentMonth === 11;
  
  // Simulate booking trend
  const bookingIncrease = isHighSeason ? 0.35 : 0.10;
  
  return {
    shouldTrigger: bookingIncrease > AUTOMATION_THRESHOLDS.bookingIncrease,
    reason: `Seasonal demand increase of ${Math.round(bookingIncrease * 100)}% detected`,
    data: {
      bookingIncrease,
      season: isHighSeason ? 'high' : 'normal',
      recommendedHires: isHighSeason ? 10 : 0
    }
  };
}