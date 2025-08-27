import { NextResponse } from 'next/server';

// Job posting platforms configuration
const POSTING_PLATFORMS = {
  linkedin: {
    name: 'LinkedIn',
    apiEndpoint: 'https://api.linkedin.com/v2/jobs',
    enabled: true
  },
  indeed: {
    name: 'Indeed',
    apiEndpoint: 'https://api.indeed.com/ads/v1',
    enabled: true
  },
  arbetsformedlingen: {
    name: 'Arbetsförmedlingen',
    apiEndpoint: 'https://api.arbetsformedlingen.se/v1/platsannonser',
    enabled: true
  },
  facebook: {
    name: 'Facebook Jobs',
    apiEndpoint: 'https://graph.facebook.com/v1/job_openings',
    enabled: true
  },
  blocket: {
    name: 'Blocket Jobb',
    apiEndpoint: 'https://api.blocket.se/jobs/v1',
    enabled: true
  }
};

// Job templates based on trigger reasons
const JOB_TEMPLATES = {
  high_demand: {
    title: 'Urgent: Experienced Moving Personnel - Immediate Start',
    description: `Nordflytt is rapidly expanding and needs experienced moving personnel immediately.

Requirements:
- Previous experience in moving/logistics
- Driver's license (B or higher)
- Strong physical condition
- Service-minded attitude
- Swedish language skills

We offer:
- Competitive hourly rate (280-350 SEK/hour)
- Flexible scheduling
- Career development opportunities
- Great team environment
- Performance bonuses

Start: Immediate
Location: {location}
Type: Full-time/Part-time available`,
    urgency: 'immediate',
    salary_range: { min: 280, max: 350 },
    employment_type: ['full-time', 'part-time']
  },
  
  geographic_optimization: {
    title: 'Local Moving Team - {location}',
    description: `Join Nordflytt's expanding team in {location}!

We're building a local presence to better serve our customers in your area.

Requirements:
- Live in or near {location}
- Moving/logistics experience preferred
- Driver's license required
- Customer service skills
- Flexible availability

Benefits:
- Work close to home
- Competitive local rates
- Growth opportunities
- Join a leading company
- Training provided

Apply now to be part of our {location} team!`,
    urgency: 'medium',
    salary_range: { min: 250, max: 320 },
    employment_type: ['full-time', 'part-time']
  },
  
  sick_coverage: {
    title: 'Temporary Moving Staff - Flexible Hours',
    description: `Immediate need for temporary moving staff to support our team.

Perfect for:
- Students
- Part-time workers
- Those seeking flexible income
- Experienced movers between jobs

Requirements:
- Available on short notice
- Physical fitness
- Basic Swedish
- Service attitude

We offer:
- Excellent hourly rate
- Flexible scheduling
- Potential for permanent position
- Immediate start
- Daily/weekly payment options`,
    urgency: 'immediate',
    salary_range: { min: 300, max: 380 },
    employment_type: ['temporary', 'part-time']
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reason, params } = body;

    // Select appropriate job template
    const template = JOB_TEMPLATES[reason as keyof typeof JOB_TEMPLATES] || JOB_TEMPLATES.high_demand;
    
    // Customize job posting
    const jobPosting = {
      id: `auto-${Date.now()}`,
      title: template.title.replace('{location}', params.location || 'Stockholm'),
      description: template.description.replace(/{location}/g, params.location || 'Stockholm'),
      location: params.location || 'Stockholm',
      urgency: params.urgency || template.urgency,
      salary_range: template.salary_range,
      employment_type: template.employment_type,
      positions_available: params.positions || params.needed_positions || 2,
      auto_posted: true,
      trigger_reason: params.reason,
      posted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    // Post to multiple platforms
    const postingResults = [];
    for (const [platformId, platform] of Object.entries(POSTING_PLATFORMS)) {
      if (platform.enabled) {
        try {
          // In production, make actual API calls to each platform
          // For now, simulate successful posting
          const result = await simulateJobPosting(platformId, jobPosting, platform);
          postingResults.push(result);
        } catch (error) {
          console.error(`Failed to post to ${platform.name}:`, error);
        }
      }
    }

    // Log the auto-posting event
    const autoPostLog = {
      id: jobPosting.id,
      reason,
      params,
      job_details: jobPosting,
      platforms_posted: postingResults.filter(r => r.success).map(r => r.platform),
      created_at: new Date().toISOString()
    };

    // In production, save to database
    // await supabase.from('auto_posted_jobs').insert(autoPostLog);

    // Send notification to recruitment team
    await notifyRecruitmentTeam(jobPosting, postingResults);

    return NextResponse.json({
      success: true,
      job_id: jobPosting.id,
      platforms_posted: postingResults.filter(r => r.success).length,
      total_platforms: postingResults.length,
      posting_results: postingResults,
      message: `Job automatically posted to ${postingResults.filter(r => r.success).length} platforms`
    });

  } catch (error) {
    console.error('Auto-posting error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-post job' },
      { status: 500 }
    );
  }
}

async function simulateJobPosting(platformId: string, jobPosting: any, platform: any) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
  
  // Simulate 95% success rate
  const success = Math.random() > 0.05;
  
  return {
    platform: platform.name,
    platform_id: platformId,
    success,
    job_url: success ? `https://${platformId}.com/jobs/${jobPosting.id}` : null,
    error: success ? null : 'Platform temporarily unavailable',
    posted_at: new Date().toISOString()
  };
}

async function notifyRecruitmentTeam(jobPosting: any, postingResults: any[]) {
  // In production, send email/Slack notification
  const notification = {
    type: 'auto_job_posted',
    job_id: jobPosting.id,
    title: jobPosting.title,
    location: jobPosting.location,
    platforms: postingResults.filter(r => r.success).map(r => r.platform),
    urgency: jobPosting.urgency,
    trigger_reason: jobPosting.trigger_reason,
    timestamp: new Date().toISOString()
  };
  
  // Log notification for demo
  console.log('Recruitment team notified:', notification);
  
  return notification;
}