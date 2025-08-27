import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const health = {
    status: 'checking',
    ai_enabled: false,
    components: {
      core_engine: false,
      lead_scoring: false,
      customer_intelligence: false,
      workflow_automation: false,
      api_keys_configured: false,
      database_connected: false
    },
    environment: {
      node_env: process.env.NODE_ENV,
      ai_features_enabled: process.env.ENABLE_AI_FEATURES === 'true',
      has_openai_key: !!process.env.OPENAI_API_KEY,
      has_ai_service_key: !!process.env.AI_SERVICE_API_KEY
    },
    message: ''
  };

  try {
    // Check API keys
    health.components.api_keys_configured = 
      !!process.env.OPENAI_API_KEY && 
      !!process.env.AI_SERVICE_API_KEY;

    // Check database connection
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      health.components.database_connected = !error;
    } catch (dbError) {
      health.components.database_connected = false;
    }

    // Check if AI modules exist
    try {
      // These imports will fail if files don't exist
      const modules = await Promise.all([
        import('@/lib/ai/core/ai-engine').then(() => true).catch(() => false),
        import('@/lib/ai/ml-models/lead-scoring-model').then(() => true).catch(() => false),
        import('@/lib/ai/crm-integration').then(() => true).catch(() => false),
        import('@/lib/ai/workflow/smart-job-scheduler').then(() => true).catch(() => false)
      ]);

      health.components.core_engine = modules[0];
      health.components.lead_scoring = modules[1];
      health.components.customer_intelligence = modules[2];
      health.components.workflow_automation = modules[3];
    } catch (error) {
      // Module checks failed
    }

    // Determine overall status
    const componentsWorking = Object.values(health.components).filter(v => v).length;
    const totalComponents = Object.keys(health.components).length;

    if (componentsWorking === totalComponents) {
      health.status = 'healthy';
      health.ai_enabled = true;
      health.message = 'AI system is fully operational';
    } else if (componentsWorking > totalComponents / 2) {
      health.status = 'partial';
      health.ai_enabled = true;
      health.message = `AI system is partially operational (${componentsWorking}/${totalComponents} components working)`;
    } else {
      health.status = 'unhealthy';
      health.ai_enabled = false;
      health.message = 'AI system is not operational';
    }

    return NextResponse.json(health);

  } catch (error) {
    return NextResponse.json({
      ...health,
      status: 'error',
      message: 'Failed to check AI system health',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}