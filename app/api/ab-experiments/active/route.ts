// Active A/B Experiments API endpoint
// Phase 4 implementation for retrieving currently running experiments

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeResults = searchParams.get('includeResults') === 'true';
    const priority = searchParams.get('priority'); // high, medium, low
    const targetMetric = searchParams.get('targetMetric');
    
    console.log('🔬 Fetching active A/B experiments:', { includeResults, priority, targetMetric });

    // Get active experiments
    const activeExperiments = generateActiveExperiments(includeResults, priority, targetMetric);
    
    // Calculate summary statistics
    const summary = calculateExperimentsSummary(activeExperiments);
    
    // Generate insights and recommendations
    const insights = generateExperimentInsights(activeExperiments);

    console.log(`📊 Found ${activeExperiments.length} active experiments`);

    return NextResponse.json({
      experiments: activeExperiments,
      summary,
      insights,
      filters: {
        includeResults,
        priority,
        targetMetric
      },
      lastUpdated: new Date().toISOString(),
      nextUpdate: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Experiments-Count': activeExperiments.length.toString(),
        'Cache-Control': 'public, max-age=300' // 5 minutes cache
      }
    });

  } catch (error) {
    console.error('Failed to fetch active experiments:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch active experiments',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Generate active experiments with realistic data
function generateActiveExperiments(includeResults: boolean, priority?: string, targetMetric?: string) {
  const baseExperiments = [
    {
      id: 'exp_pricing_dynamic_2025',
      name: 'Dynamic Pricing Strategy',
      description: 'Testing AI-driven dynamic pricing vs fixed pricing model',
      hypothesis: 'Dynamic pricing will increase revenue by 12-18% through demand-based optimization',
      status: 'running',
      priority: 'high',
      start_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      days_remaining: 6,
      target_metric: 'revenue_per_user',
      secondary_metrics: ['conversion_rate', 'customer_satisfaction'],
      target_audience: 'all_customers',
      traffic_split: { a: 50, b: 50 },
      variants: {
        a: {
          name: 'Fixed Pricing',
          description: 'Current static pricing model',
          participants: 892,
          key_features: ['Standard rates', 'Manual adjustments', 'Seasonal discounts']
        },
        b: {
          name: 'Dynamic Pricing',
          description: 'AI-powered demand-based pricing',
          participants: 916,
          key_features: ['Real-time adjustments', 'Demand forecasting', 'Competitor analysis']
        }
      },
      business_impact: {
        potential_revenue_lift: '+€45K annually',
        risk_level: 'medium',
        implementation_cost: '€12K'
      }
    },
    {
      id: 'exp_booking_form_v3',
      name: 'Streamlined Booking Form',
      description: 'Single-page form vs multi-step booking process',
      hypothesis: 'Reduced form complexity will increase completion rates by 15%+',
      status: 'running',
      priority: 'high',
      start_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      days_remaining: 2,
      target_metric: 'booking_completion',
      secondary_metrics: ['time_to_complete', 'user_satisfaction'],
      target_audience: 'new_customers',
      traffic_split: { a: 40, b: 60 },
      variants: {
        a: {
          name: 'Multi-Step Form',
          description: 'Current 4-step booking process',
          participants: 445,
          key_features: ['Progress indicator', 'Step validation', 'Save & continue']
        },
        b: {
          name: 'Single-Page Form',
          description: 'Condensed one-page booking',
          participants: 668,
          key_features: ['Smart sections', 'Auto-save', 'Instant validation']
        }
      },
      business_impact: {
        potential_revenue_lift: '+€28K annually',
        risk_level: 'low',
        implementation_cost: '€3K'
      }
    },
    {
      id: 'exp_service_recommendations',
      name: 'AI Service Recommendations',
      description: 'Machine learning recommendations vs manual suggestions',
      hypothesis: 'Personalized AI recommendations will increase upsell rate by 25%',
      status: 'running',
      priority: 'medium',
      start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      days_remaining: 9,
      target_metric: 'revenue_per_user',
      secondary_metrics: ['service_adoption', 'customer_satisfaction'],
      target_audience: 'returning_customers',
      traffic_split: { a: 50, b: 50 },
      variants: {
        a: {
          name: 'Manual Suggestions',
          description: 'Staff-curated service recommendations',
          participants: 234,
          key_features: ['Expert curation', 'Standard packages', 'Generic offers']
        },
        b: {
          name: 'AI Recommendations',
          description: 'ML-powered personalized suggestions',
          participants: 251,
          key_features: ['Behavior analysis', 'Dynamic offers', 'Personalized timing']
        }
      },
      business_impact: {
        potential_revenue_lift: '+€35K annually',
        risk_level: 'medium',
        implementation_cost: '€18K'
      }
    },
    {
      id: 'exp_mobile_app_onboarding',
      name: 'Mobile App Onboarding Flow',
      description: 'Progressive disclosure vs full feature tour',
      hypothesis: 'Progressive onboarding will improve user activation by 30%',
      status: 'running',
      priority: 'medium',
      start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
      days_remaining: 11,
      target_metric: 'user_engagement',
      secondary_metrics: ['feature_adoption', 'session_duration'],
      target_audience: 'mobile_users',
      traffic_split: { a: 50, b: 50 },
      variants: {
        a: {
          name: 'Full Feature Tour',
          description: 'Comprehensive app walkthrough',
          participants: 156,
          key_features: ['Complete overview', '8-step tutorial', 'Feature highlights']
        },
        b: {
          name: 'Progressive Disclosure',
          description: 'Just-in-time feature introduction',
          participants: 162,
          key_features: ['Contextual tips', 'Gradual reveal', 'User-driven discovery']
        }
      },
      business_impact: {
        potential_revenue_lift: '+€15K annually',
        risk_level: 'low',
        implementation_cost: '€8K'
      }
    },
    {
      id: 'exp_email_send_timing',
      name: 'Email Campaign Optimization',
      description: 'AI-optimized send times vs fixed schedule',
      hypothesis: 'Personalized send timing will increase email engagement by 40%',
      status: 'running',
      priority: 'low',
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      days_remaining: 7,
      target_metric: 'customer_satisfaction',
      secondary_metrics: ['open_rate', 'click_through_rate'],
      target_audience: 'email_subscribers',
      traffic_split: { a: 30, b: 70 },
      variants: {
        a: {
          name: 'Fixed Schedule',
          description: 'Traditional 9 AM Tuesday sends',
          participants: 1245,
          key_features: ['Consistent timing', 'Batch processing', 'Weekly cadence']
        },
        b: {
          name: 'AI-Optimized Timing',
          description: 'Personalized optimal send times',
          participants: 2903,
          key_features: ['Individual optimization', 'Behavioral analysis', 'Dynamic scheduling']
        }
      },
      business_impact: {
        potential_revenue_lift: '+€22K annually',
        risk_level: 'low',
        implementation_cost: '€5K'
      }
    }
  ];

  // Apply filters
  let filtered = baseExperiments;
  
  if (priority) {
    filtered = filtered.filter(exp => exp.priority === priority);
  }
  
  if (targetMetric) {
    filtered = filtered.filter(exp => exp.target_metric === targetMetric);
  }

  // Add results if requested
  if (includeResults) {
    filtered = filtered.map(exp => ({
      ...exp,
      results: generateExperimentResults(exp)
    }));
  }

  return filtered;
}

// Generate realistic experiment results
function generateExperimentResults(experiment: any) {
  const daysRunning = Math.ceil((new Date().getTime() - new Date(experiment.start_date).getTime()) / (24 * 60 * 60 * 1000));
  const totalDuration = Math.ceil((new Date(experiment.end_date).getTime() - new Date(experiment.start_date).getTime()) / (24 * 60 * 60 * 1000));
  const progress = Math.min(1, daysRunning / totalDuration);

  // Base conversion rates by metric type
  const baseRates = {
    'revenue_per_user': { base: 0.18, variance: 0.04 },
    'booking_completion': { base: 0.72, variance: 0.08 },
    'user_engagement': { base: 0.45, variance: 0.12 },
    'customer_satisfaction': { base: 0.82, variance: 0.06 }
  };

  const metricConfig = baseRates[experiment.target_metric] || baseRates['revenue_per_user'];
  
  // Group A (Control) metrics
  const groupARate = metricConfig.base + (Math.random() - 0.5) * metricConfig.variance;
  const groupAParticipants = experiment.variants.a.participants;
  const groupAConversions = Math.round(groupAParticipants * groupARate);
  const groupAValue = groupAConversions * (2500 + Math.random() * 1500);

  // Group B (Treatment) - simulate improvement based on hypothesis
  const expectedImprovement = getExpectedImprovement(experiment.name);
  const actualImprovement = expectedImprovement * (0.5 + Math.random() * 1.0); // 50-150% of expected
  const groupBRate = groupARate * (1 + actualImprovement);
  const groupBParticipants = experiment.variants.b.participants;
  const groupBConversions = Math.round(groupBParticipants * groupBRate);
  const groupBValue = groupBConversions * (2500 + Math.random() * 1500);

  // Calculate statistical significance
  const pooledRate = (groupAConversions + groupBConversions) / (groupAParticipants + groupBParticipants);
  const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/groupAParticipants + 1/groupBParticipants));
  const zScore = Math.abs(groupBRate - groupARate) / standardError;
  
  let significance = 0;
  if (zScore > 2.58) significance = 99;
  else if (zScore > 1.96) significance = 95;
  else if (zScore > 1.64) significance = 90;
  else significance = Math.round(Math.min(80, zScore * 40));

  const effectSize = ((groupBRate - groupARate) / groupARate) * 100;

  return {
    group_a: {
      participants: groupAParticipants,
      conversions: groupAConversions,
      conversion_rate: Math.round(groupARate * 1000) / 10,
      total_value: Math.round(groupAValue),
      average_value: groupAConversions > 0 ? Math.round(groupAValue / groupAConversions) : 0
    },
    group_b: {
      participants: groupBParticipants,
      conversions: groupBConversions,
      conversion_rate: Math.round(groupBRate * 1000) / 10,
      total_value: Math.round(groupBValue),
      average_value: groupBConversions > 0 ? Math.round(groupBValue / groupBConversions) : 0
    },
    statistical_significance: significance,
    confidence_interval: {
      lower: Math.round((effectSize - 3) * 10) / 10,
      upper: Math.round((effectSize + 3) * 10) / 10
    },
    p_value: significance >= 95 ? 0.01 : significance >= 90 ? 0.05 : 0.15,
    effect_size: Math.round(effectSize * 10) / 10,
    progress: Math.round(progress * 100),
    days_running: daysRunning,
    sample_size_adequate: (groupAParticipants + groupBParticipants) >= 200,
    winner: significance >= 95 ? (groupBRate > groupARate ? 'b' : 'a') : null,
    recommendation: generateRecommendation(significance, effectSize, progress)
  };
}

// Calculate expected improvement based on experiment type
function getExpectedImprovement(experimentName: string): number {
  const improvements: {[key: string]: number} = {
    'Dynamic Pricing Strategy': 0.15,
    'Streamlined Booking Form': 0.18,
    'AI Service Recommendations': 0.25,
    'Mobile App Onboarding Flow': 0.30,
    'Email Campaign Optimization': 0.40
  };
  
  return improvements[experimentName] || 0.10;
}

// Generate experiment recommendation
function generateRecommendation(significance: number, effectSize: number, progress: number): string {
  if (progress < 0.5) {
    return 'Continue running - insufficient data for decision';
  } else if (significance >= 95) {
    if (effectSize > 5) {
      return 'Strong winner identified - implement immediately';
    } else if (effectSize > 0) {
      return 'Positive result - implement with monitoring';
    } else {
      return 'Negative result - stick with control';
    }
  } else if (significance >= 80) {
    return 'Trending positive - extend test duration';
  } else {
    return 'Inconclusive - consider test redesign or longer duration';
  }
}

// Calculate experiments summary
function calculateExperimentsSummary(experiments: any[]) {
  const summary = {
    total_active: experiments.length,
    by_priority: {
      high: experiments.filter(e => e.priority === 'high').length,
      medium: experiments.filter(e => e.priority === 'medium').length,
      low: experiments.filter(e => e.priority === 'low').length
    },
    by_metric: {} as {[key: string]: number},
    ending_soon: experiments.filter(e => e.days_remaining <= 3).length,
    total_participants: experiments.reduce((sum, e) => sum + e.variants.a.participants + e.variants.b.participants, 0),
    potential_annual_impact: experiments.reduce((sum, e) => {
      const impact = parseFloat(e.business_impact.potential_revenue_lift.replace(/[+€K\s]/g, ''));
      return sum + (impact * 1000);
    }, 0)
  };

  // Count by metric
  experiments.forEach(exp => {
    summary.by_metric[exp.target_metric] = (summary.by_metric[exp.target_metric] || 0) + 1;
  });

  return summary;
}

// Generate insights and recommendations
function generateExperimentInsights(experiments: any[]) {
  const insights = [];

  // High-priority experiments ending soon
  const highPriorityEndingSoon = experiments.filter(e => e.priority === 'high' && e.days_remaining <= 5);
  if (highPriorityEndingSoon.length > 0) {
    insights.push({
      type: 'urgent',
      title: 'High-Priority Experiments Ending Soon',
      message: `${highPriorityEndingSoon.length} high-priority experiments end within 5 days. Prepare for result analysis.`,
      experiments: highPriorityEndingSoon.map(e => e.id),
      action: 'Review results and prepare implementation plans'
    });
  }

  // Revenue impact opportunities
  const revenueExperiments = experiments.filter(e => e.target_metric === 'revenue_per_user');
  if (revenueExperiments.length > 0) {
    const totalRevenuePotential = revenueExperiments.reduce((sum, e) => {
      const impact = parseFloat(e.business_impact.potential_revenue_lift.replace(/[+€K\s]/g, ''));
      return sum + (impact * 1000);
    }, 0);
    
    insights.push({
      type: 'opportunity',
      title: 'Revenue Optimization Potential',
      message: `${revenueExperiments.length} active revenue experiments could generate +€${(totalRevenuePotential/1000).toFixed(0)}K annually.`,
      experiments: revenueExperiments.map(e => e.id),
      action: 'Monitor closely and implement successful variants quickly'
    });
  }

  // Traffic distribution optimization
  const unevenTraffic = experiments.filter(e => Math.abs(e.traffic_split.a - e.traffic_split.b) > 10);
  if (unevenTraffic.length > 0) {
    insights.push({
      type: 'optimization',
      title: 'Traffic Split Optimization',
      message: `${unevenTraffic.length} experiments use uneven traffic splits. Consider if this is intentional.`,
      experiments: unevenTraffic.map(e => e.id),
      action: 'Review traffic allocation strategy'
    });
  }

  // Capacity insights
  if (experiments.length > 5) {
    insights.push({
      type: 'capacity',
      title: 'High Experiment Load',
      message: `Running ${experiments.length} concurrent experiments. Monitor for interaction effects.`,
      experiments: experiments.map(e => e.id),
      action: 'Consider experiment prioritization and sequencing'
    });
  }

  return insights;
}