import { NextResponse } from 'next/server';

// Mock auto-posted jobs history
const MOCK_AUTO_POSTED_JOBS = [
  {
    id: 'auto-1706790000000',
    title: 'Urgent: Flyttpersonal Stockholm',
    location: 'Stockholm',
    type: 'flyttpersonal',
    urgency: 'immediate',
    trigger_reason: 'Capacity at 92% - urgent staffing needed',
    posted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    views: 234,
    applications: 12,
    auto_posted: true,
    platforms: ['LinkedIn', 'Arbetsförmedlingen', 'Indeed', 'Facebook'],
    status: 'active',
    positions_available: 3
  },
  {
    id: 'auto-1706703600000',
    title: 'Local Team - Göteborg',
    location: 'Göteborg',
    type: 'team',
    urgency: 'high',
    trigger_reason: 'Geographic optimization - 8 jobs/month in Göteborg',
    posted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
    views: 156,
    applications: 8,
    auto_posted: true,
    platforms: ['LinkedIn', 'Local job boards', 'Blocket Jobb'],
    status: 'active',
    positions_available: 2
  },
  {
    id: 'auto-1706782800000',
    title: 'Temporary Coverage - Immediate Start',
    location: 'Stockholm',
    type: 'temporary',
    urgency: 'immediate',
    trigger_reason: 'High sick leave rate (24%) - coverage needed',
    posted_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    views: 189,
    applications: 6,
    auto_posted: true,
    platforms: ['Gigstr', 'StudentJob', 'Indeed'],
    status: 'active',
    positions_available: 4
  },
  {
    id: 'auto-1706617200000',
    title: 'Team Leader - Malmö Region',
    location: 'Malmö',
    type: 'team_leader',
    urgency: 'medium',
    trigger_reason: 'Regional expansion - establishing Malmö presence',
    posted_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
    views: 312,
    applications: 15,
    auto_posted: true,
    platforms: ['LinkedIn', 'Arbetsförmedlingen', 'Monster'],
    status: 'active',
    positions_available: 1
  },
  {
    id: 'auto-1706530800000',
    title: 'Summer Staff - Multiple Locations',
    location: 'Multiple',
    type: 'seasonal',
    urgency: 'medium',
    trigger_reason: 'Seasonal demand prediction - 35% increase expected',
    posted_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    views: 445,
    applications: 28,
    auto_posted: true,
    platforms: ['LinkedIn', 'StudentJob', 'Arbetsförmedlingen', 'Indeed'],
    status: 'active',
    positions_available: 10
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter postings based on status
    let postings = MOCK_AUTO_POSTED_JOBS;
    if (status !== 'all') {
      postings = postings.filter(p => p.status === status);
    }

    // Calculate statistics
    const stats = {
      totalAutoPosted: postings.length,
      activePostings: postings.filter(p => p.status === 'active').length,
      totalViews: postings.reduce((sum, p) => sum + p.views, 0),
      totalApplications: postings.reduce((sum, p) => sum + p.applications, 0),
      avgApplicationsPerPosting: Math.round(
        postings.reduce((sum, p) => sum + p.applications, 0) / postings.length
      ),
      platformDistribution: calculatePlatformDistribution(postings)
    };

    // Sort by posted date (newest first)
    postings.sort((a, b) => 
      new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
    );

    return NextResponse.json({
      postings: postings.slice(0, limit),
      stats,
      totalCount: postings.length
    });

  } catch (error) {
    console.error('Error fetching auto-posted jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auto-posted jobs' },
      { status: 500 }
    );
  }
}

function calculatePlatformDistribution(postings: any[]) {
  const platformCounts: Record<string, number> = {};
  
  postings.forEach(posting => {
    posting.platforms.forEach((platform: string) => {
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
  });
  
  return Object.entries(platformCounts)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}