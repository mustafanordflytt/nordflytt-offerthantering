// A/B Testing Framework API endpoints
// Phase 4 implementation supporting comprehensive experimentation and optimization

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      hypothesis,
      variant_a, 
      variant_b, 
      target_metric,
      target_audience,
      duration_days,
      traffic_split,
      success_criteria
    } = body;
    
    console.log('🧪 Starting new A/B experiment:', { name, target_metric, duration_days });

    // Validate required fields
    if (!name || !variant_a || !variant_b || !target_metric) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, variant_a, variant_b, target_metric' 
      }, { status: 400 });
    }

    const validMetrics = [
      'conversion_rate', 'revenue_per_user', 'customer_satisfaction', 
      'booking_completion', 'user_engagement', 'churn_rate'
    ];
    
    if (!validMetrics.includes(target_metric)) {
      return NextResponse.json({ 
        error: `Invalid target metric. Must be one of: ${validMetrics.join(', ')}` 
      }, { status: 400 });
    }

    try {
      // Create experiment configuration
      const experiment = {
        id: `exp_${Date.now()}`,
        name,
        description: description || `A/B test comparing ${variant_a.name} vs ${variant_b.name}`,
        hypothesis: hypothesis || `${variant_b.name} will outperform ${variant_a.name} on ${target_metric}`,
        
        // Experiment setup
        status: 'running',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + (duration_days || 14) * 24 * 60 * 60 * 1000).toISOString(),
        duration_days: duration_days || 14,
        
        // Variants configuration
        variants: {
          a: {
            name: variant_a.name || 'Control',
            description: variant_a.description || 'Current implementation',
            config: variant_a.config || {},
            traffic_percentage: (traffic_split?.a || 50)
          },
          b: {
            name: variant_b.name || 'Treatment',
            description: variant_b.description || 'New implementation',
            config: variant_b.config || {},
            traffic_percentage: (traffic_split?.b || 50)
          }
        },
        
        // Metrics and targeting
        target_metric,
        secondary_metrics: body.secondary_metrics || [],
        target_audience: target_audience || 'all_users',
        
        // Success criteria
        success_criteria: {
          minimum_sample_size: success_criteria?.minimum_sample_size || 100,
          statistical_significance: success_criteria?.statistical_significance || 95,
          minimum_effect_size: success_criteria?.minimum_effect_size || 5,
          power: success_criteria?.power || 80
        },
        
        // Results tracking
        results: {
          group_a: {
            participants: 0,
            conversions: 0,
            conversion_rate: 0,
            total_value: 0,
            average_value: 0
          },
          group_b: {
            participants: 0,
            conversions: 0,
            conversion_rate: 0,
            total_value: 0,
            average_value: 0
          },
          statistical_significance: 0,
          confidence_interval: { lower: 0, upper: 0 },
          p_value: 1.0,
          effect_size: 0
        },
        
        // Metadata
        created_at: new Date().toISOString(),
        created_by: 'system',
        updated_at: new Date().toISOString()
      };

      // Initialize with some mock data for demonstration
      if (body.simulate_data) {
        experiment.results = generateSimulatedResults(experiment);
      }

      // Store experiment (in production, save to database)
      await storeExperiment(experiment);
      
      // Start experiment tracking
      await initializeExperimentTracking(experiment);

      console.log(`✅ A/B experiment created: ${experiment.id}`);

      return NextResponse.json({
        success: true,
        experiment,
        message: `A/B experiment "${name}" started successfully`,
        monitoring_url: `/admin/experiments/${experiment.id}`,
        estimated_completion: experiment.end_date
      }, { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Experiment-Id': experiment.id,
          'X-Experiment-Status': experiment.status
        }
      });

    } catch (experimentError) {
      console.error('Failed to create experiment:', experimentError);
      
      return NextResponse.json({ 
        error: 'Failed to create A/B experiment',
        message: experimentError instanceof Error ? experimentError.message : 'Experiment creation error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('A/B experiment API failed:', error);
    
    return NextResponse.json({ 
      error: 'A/B experiment request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const metric = searchParams.get('metric');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  try {
    console.log('📊 Fetching A/B experiments:', { status, metric, limit });

    // Generate mock experiments for demonstration
    const experiments = generateMockExperiments(status, metric, limit);
    
    const summary = {
      total: experiments.length,
      by_status: {
        running: experiments.filter(e => e.status === 'running').length,
        completed: experiments.filter(e => e.status === 'completed').length,
        paused: experiments.filter(e => e.status === 'paused').length,
        stopped: experiments.filter(e => e.status === 'stopped').length
      },
      by_result: {
        significant: experiments.filter(e => e.results.statistical_significance >= 95).length,
        trending_positive: experiments.filter(e => e.results.effect_size > 0).length,
        inconclusive: experiments.filter(e => e.results.statistical_significance < 80).length
      }
    };

    return NextResponse.json({
      experiments,
      summary,
      filters: { status, metric, limit },
      generatedAt: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Failed to fetch A/B experiments:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch experiments',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate simulated experiment results
function generateSimulatedResults(experiment: any) {
  const daysRunning = Math.min(experiment.duration_days, 7); // Simulate up to 7 days
  const baseParticipants = Math.round(50 + Math.random() * 100) * daysRunning;
  
  // Group A (Control)
  const groupAParticipants = Math.round(baseParticipants * (experiment.variants.a.traffic_percentage / 100));
  const groupAConversionRate = 0.12 + Math.random() * 0.08; // 12-20%
  const groupAConversions = Math.round(groupAParticipants * groupAConversionRate);
  const groupAValue = groupAConversions * (2500 + Math.random() * 1000);
  
  // Group B (Treatment) - simulate some improvement
  const groupBParticipants = Math.round(baseParticipants * (experiment.variants.b.traffic_percentage / 100));
  const improvementFactor = 1 + (Math.random() * 0.3 - 0.1); // -10% to +20% change
  const groupBConversionRate = groupAConversionRate * improvementFactor;
  const groupBConversions = Math.round(groupBParticipants * groupBConversionRate);
  const groupBValue = groupBConversions * (2500 + Math.random() * 1000);
  
  // Calculate statistical significance
  const effectSize = ((groupBConversionRate - groupAConversionRate) / groupAConversionRate) * 100;
  const minSampleSize = Math.max(groupAParticipants, groupBParticipants);
  let significance = 0;
  
  if (minSampleSize >= 100) {
    // Simplified significance calculation
    const pooledRate = (groupAConversions + groupBConversions) / (groupAParticipants + groupBParticipants);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/groupAParticipants + 1/groupBParticipants));
    const zScore = Math.abs(groupBConversionRate - groupAConversionRate) / standardError;
    
    if (zScore > 2.58) significance = 99;
    else if (zScore > 1.96) significance = 95;
    else if (zScore > 1.64) significance = 90;
    else significance = Math.round(Math.min(80, zScore * 40));
  }
  
  return {
    group_a: {
      participants: groupAParticipants,
      conversions: groupAConversions,
      conversion_rate: Math.round(groupAConversionRate * 1000) / 10,
      total_value: Math.round(groupAValue),
      average_value: groupAConversions > 0 ? Math.round(groupAValue / groupAConversions) : 0
    },
    group_b: {
      participants: groupBParticipants,
      conversions: groupBConversions,
      conversion_rate: Math.round(groupBConversionRate * 1000) / 10,
      total_value: Math.round(groupBValue),
      average_value: groupBConversions > 0 ? Math.round(groupBValue / groupBConversions) : 0
    },
    statistical_significance: significance,
    confidence_interval: {
      lower: Math.round((effectSize - 5) * 10) / 10,
      upper: Math.round((effectSize + 5) * 10) / 10
    },
    p_value: significance >= 95 ? 0.01 : significance >= 90 ? 0.05 : 0.1,
    effect_size: Math.round(effectSize * 10) / 10,
    days_running: daysRunning,
    sample_size_reached: minSampleSize >= experiment.success_criteria.minimum_sample_size
  };
}

// Store experiment in database (mock implementation)
async function storeExperiment(experiment: any) {
  // In production, this would save to database
  console.log('💾 Storing experiment:', experiment.id);
  return true;
}

// Initialize experiment tracking (mock implementation)
async function initializeExperimentTracking(experiment: any) {
  // In production, this would set up analytics tracking
  console.log('📈 Initializing tracking for experiment:', experiment.id);
  return true;
}

// Generate mock experiments for demonstration
function generateMockExperiments(status: string, metric?: string, limit: number = 10) {
  const experimentTypes = [
    {
      name: 'Pricing Strategy Optimization',
      description: 'Testing 10% price increase vs current pricing',
      target_metric: 'conversion_rate',
      hypothesis: 'Higher prices will reduce conversion but increase revenue per customer'
    },
    {
      name: 'Booking Form Redesign',
      description: 'New streamlined booking form vs current multi-step form',
      target_metric: 'booking_completion',
      hypothesis: 'Simplified form will increase completion rates'
    },
    {
      name: 'Service Page Layout',
      description: 'Hero image placement and call-to-action positioning',
      target_metric: 'user_engagement',
      hypothesis: 'Above-the-fold CTA will increase engagement'
    },
    {
      name: 'Email Campaign Timing',
      description: 'Morning vs evening email send times',
      target_metric: 'customer_satisfaction',
      hypothesis: 'Evening emails will have higher engagement'
    },
    {
      name: 'Mobile App Onboarding',
      description: 'Progressive disclosure vs full feature tour',
      target_metric: 'user_engagement',
      hypothesis: 'Progressive disclosure will reduce cognitive load'
    },
    {
      name: 'Premium Service Positioning',
      description: 'Highlight premium features vs standard presentation',
      target_metric: 'revenue_per_user',
      hypothesis: 'Prominent premium positioning will increase upsells'
    }
  ];

  const statusOptions = ['running', 'completed', 'paused', 'stopped'];
  const experiments = [];

  for (let i = 0; i < Math.min(limit, experimentTypes.length * 2); i++) {
    const template = experimentTypes[i % experimentTypes.length];
    const experimentStatus = status === 'all' ? statusOptions[Math.floor(Math.random() * statusOptions.length)] : status;
    
    // Skip if metric filter doesn't match
    if (metric && template.target_metric !== metric) continue;
    
    const experiment = {
      id: `exp_${Date.now()}_${i}`,
      name: `${template.name} ${i > 5 ? 'V2' : ''}`,
      description: template.description,
      hypothesis: template.hypothesis,
      status: experimentStatus,
      
      start_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration_days: 14,
      
      variants: {
        a: { name: 'Control', description: 'Current implementation', traffic_percentage: 50 },
        b: { name: 'Treatment', description: 'New implementation', traffic_percentage: 50 }
      },
      
      target_metric: template.target_metric,
      target_audience: 'all_users',
      
      results: generateRandomResults(),
      
      created_at: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add days remaining for running experiments
    if (experiment.status === 'running') {
      const endDate = new Date(experiment.end_date);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      experiment.days_remaining = daysRemaining;
    }

    experiments.push(experiment);
  }

  return experiments;
}

// Generate random results for mock experiments
function generateRandomResults() {
  const groupAParticipants = Math.round(200 + Math.random() * 800);
  const groupBParticipants = Math.round(200 + Math.random() * 800);
  
  const groupARate = Math.round((0.15 + Math.random() * 0.1) * 1000) / 10;
  const improvementFactor = 0.8 + Math.random() * 0.4; // -20% to +20%
  const groupBRate = Math.round(groupARate * improvementFactor * 10) / 10;
  
  const effectSize = ((groupBRate - groupARate) / groupARate) * 100;
  const significance = Math.min(99, Math.max(60, 70 + Math.abs(effectSize) * 5 + Math.random() * 20));
  
  return {
    group_a: {
      participants: groupAParticipants,
      conversions: Math.round(groupAParticipants * (groupARate / 100)),
      conversion_rate: groupARate,
      total_value: Math.round((groupAParticipants * (groupARate / 100)) * (2000 + Math.random() * 2000)),
      average_value: Math.round(2000 + Math.random() * 2000)
    },
    group_b: {
      participants: groupBParticipants,
      conversions: Math.round(groupBParticipants * (groupBRate / 100)),
      conversion_rate: groupBRate,
      total_value: Math.round((groupBParticipants * (groupBRate / 100)) * (2000 + Math.random() * 2000)),
      average_value: Math.round(2000 + Math.random() * 2000)
    },
    statistical_significance: Math.round(significance),
    confidence_interval: {
      lower: Math.round((effectSize - 3) * 10) / 10,
      upper: Math.round((effectSize + 3) * 10) / 10
    },
    p_value: significance >= 95 ? 0.01 : significance >= 90 ? 0.05 : 0.1,
    effect_size: Math.round(effectSize * 10) / 10,
    sample_size_reached: (groupAParticipants + groupBParticipants) >= 200
  };
}