// =============================================================================
// NORDFLYTT AI CHATBOT - SYSTEM HEALTH API
// Monitor health and performance of all integrated systems
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat/systems/health
 * Get comprehensive system health status for chatbot integration
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🏥 System health check requested');
    
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';
    const includeMetrics = url.searchParams.get('metrics') === 'true';
    
    // Check health of all integrated systems
    const systemHealth = await checkAllSystemsHealth();
    
    // Get performance metrics if requested
    const performanceMetrics = includeMetrics ? await getPerformanceMetrics() : null;
    
    // Calculate overall health score
    const overallHealth = calculateOverallHealth(systemHealth);
    
    console.log('✅ System health check completed', {
      overallHealth: Math.round(overallHealth * 100),
      systemsOnline: Object.values(systemHealth).filter(s => s.status === 'online').length,
      totalSystems: Object.keys(systemHealth).length
    });

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      overall_health: overallHealth,
      systems_online: Object.values(systemHealth).filter(s => s.status === 'online').length,
      total_systems: Object.keys(systemHealth).length,
      
      status: {
        aiPhasesStatus: systemHealth.ai_phases.status_text,
        financialStatus: systemHealth.financial_module.status_text, 
        staffAppStatus: systemHealth.staff_app.status_text,
        dailyRevenue: 24500 + Math.floor(Math.random() * 5000), // Mock daily revenue
        activeChatCount: Math.floor(Math.random() * 15),
        totalConversationsToday: 47 + Math.floor(Math.random() * 20),
        averageResponseTime: systemHealth.chatbot_ai.avg_response_time,
        systemHealth: overallHealth
      }
    };

    if (detailed) {
      response.detailed_status = systemHealth;
    }

    if (includeMetrics) {
      response.performance_metrics = performanceMetrics;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ System health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'System health check failed',
      details: error.message,
      fallback_status: {
        aiPhasesStatus: 'Unknown',
        financialStatus: 'Unknown',
        staffAppStatus: 'Unknown',
        systemHealth: 0.5
      }
    }, { status: 500 });
  }
}

// =============================================================================
// SYSTEM HEALTH CHECKING
// =============================================================================

async function checkAllSystemsHealth() {
  console.log('🔍 Checking health of all integrated systems');
  
  // In real implementation, these would be actual health checks
  const systems = {
    // Phase 1-5 AI Systems
    ai_phases: await checkAIPhasesHealth(),
    
    // Financial Module
    financial_module: await checkFinancialModuleHealth(),
    
    // Staff App
    staff_app: await checkStaffAppHealth(),
    
    // CRM Core
    crm_core: await checkCRMHealth(),
    
    // Chatbot AI Engine
    chatbot_ai: await checkChatbotAIHealth(),
    
    // External Integrations
    external_services: await checkExternalServicesHealth()
  };

  return systems;
}

async function checkAIPhasesHealth() {
  // Mock health check for Phase 1-5 AI
  const phases = {
    phase_1_clustering: { status: 'online', last_check: new Date(), response_time: 120 },
    phase_2_routing: { status: 'online', last_check: new Date(), response_time: 95 },
    phase_3_teams: { status: 'online', last_check: new Date(), response_time: 85 },
    phase_4_analytics: { status: 'online', last_check: new Date(), response_time: 150 },
    phase_5_autonomous: { status: 'online', last_check: new Date(), response_time: 200 }
  };

  const allOnline = Object.values(phases).every(phase => phase.status === 'online');
  const avgResponseTime = Object.values(phases).reduce((sum, phase) => sum + phase.response_time, 0) / 5;

  return {
    status: allOnline ? 'online' : 'degraded',
    status_text: allOnline ? 'Online' : 'Degraded',
    phases: phases,
    avg_response_time: Math.round(avgResponseTime),
    last_check: new Date().toISOString(),
    health_score: allOnline ? 0.98 : 0.75
  };
}

async function checkFinancialModuleHealth() {
  // Mock health check for Financial Module
  const modules = {
    billing_engine: { status: 'online', response_time: 180 },
    rut_integration: { status: 'online', response_time: 220 },
    invoice_processing: { status: 'online', response_time: 160 },
    receipt_ocr: { status: 'online', response_time: 300 },
    pricing_engine: { status: 'online', response_time: 90 }
  };

  const allOnline = Object.values(modules).every(module => module.status === 'online');

  return {
    status: allOnline ? 'online' : 'degraded',
    status_text: allOnline ? 'Online' : 'Degraded',
    modules: modules,
    last_check: new Date().toISOString(),
    health_score: allOnline ? 0.96 : 0.70,
    daily_transactions: 156 + Math.floor(Math.random() * 50)
  };
}

async function checkStaffAppHealth() {
  // Mock health check for Staff App
  const features = {
    gps_tracking: { status: 'online', active_teams: 8 },
    real_time_chat: { status: 'online', active_chats: 12 },
    schedule_management: { status: 'online', scheduled_jobs: 23 },
    sos_system: { status: 'online', incidents_today: 0 }
  };

  const allOnline = Object.values(features).every(feature => feature.status === 'online');

  return {
    status: allOnline ? 'online' : 'degraded',
    status_text: allOnline ? 'Online' : 'Degraded',
    features: features,
    last_check: new Date().toISOString(),
    health_score: allOnline ? 0.97 : 0.65,
    active_staff_members: 15 + Math.floor(Math.random() * 10)
  };
}

async function checkCRMHealth() {
  // Mock health check for CRM Core
  return {
    status: 'online',
    status_text: 'Online',
    database_health: 'excellent',
    response_time: 45,
    last_check: new Date().toISOString(),
    health_score: 0.99,
    active_customers: 31,
    pending_jobs: 12
  };
}

async function checkChatbotAIHealth() {
  // Mock health check for Chatbot AI Engine
  const metrics = {
    nlp_engine: { status: 'online', accuracy: 0.94 },
    intent_recognition: { status: 'online', accuracy: 0.91 },
    response_generation: { status: 'online', quality_score: 0.88 },
    system_integration: { status: 'online', sync_rate: 0.96 }
  };

  const allOnline = Object.values(metrics).every(metric => metric.status === 'online');
  const avgResponseTime = 650 + Math.floor(Math.random() * 400); // 650-1050ms

  return {
    status: allOnline ? 'online' : 'degraded',
    status_text: allOnline ? 'Online' : 'Degraded',
    components: metrics,
    avg_response_time: avgResponseTime,
    last_check: new Date().toISOString(),
    health_score: allOnline ? 0.93 : 0.60,
    conversations_today: 47 + Math.floor(Math.random() * 30),
    ai_confidence_avg: 0.87 + Math.random() * 0.10
  };
}

async function checkExternalServicesHealth() {
  // Mock health check for external services
  const services = {
    fortnox_api: { status: 'online', response_time: 180, last_sync: '2 min ago' },
    billo_api: { status: 'online', response_time: 220, last_sync: '1 min ago' },
    skatteverket_api: { status: 'online', response_time: 350, last_sync: '5 min ago' },
    google_maps_api: { status: 'online', response_time: 120, last_sync: '30 sec ago' },
    whatsapp_business: { status: 'online', response_time: 280, last_sync: '1 min ago' }
  };

  const onlineCount = Object.values(services).filter(service => service.status === 'online').length;
  const totalCount = Object.keys(services).length;

  return {
    status: onlineCount === totalCount ? 'online' : onlineCount > totalCount / 2 ? 'degraded' : 'offline',
    status_text: onlineCount === totalCount ? 'Online' : onlineCount > totalCount / 2 ? 'Degraded' : 'Offline',
    services: services,
    online_count: onlineCount,
    total_count: totalCount,
    last_check: new Date().toISOString(),
    health_score: onlineCount / totalCount
  };
}

// =============================================================================
// PERFORMANCE METRICS
// =============================================================================

async function getPerformanceMetrics() {
  return {
    response_times: {
      p50: 680,
      p90: 1200,
      p99: 2500,
      avg: 850
    },
    throughput: {
      messages_per_minute: 45,
      conversations_per_hour: 12,
      peak_concurrent_users: 25
    },
    accuracy_metrics: {
      intent_recognition: 0.91,
      response_relevance: 0.88,
      customer_satisfaction: 4.6,
      escalation_rate: 0.12
    },
    business_metrics: {
      revenue_per_conversation: 520,
      conversion_rate: 0.34,
      upsell_success_rate: 0.28,
      cost_per_conversation: 45
    },
    system_metrics: {
      cpu_usage: 0.45,
      memory_usage: 0.62,
      disk_usage: 0.33,
      network_latency: 12
    }
  };
}

function calculateOverallHealth(systemHealth: any): number {
  const weights = {
    ai_phases: 0.25,
    financial_module: 0.20,
    staff_app: 0.15,
    crm_core: 0.15,
    chatbot_ai: 0.20,
    external_services: 0.05
  };

  let weightedScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([system, weight]) => {
    if (systemHealth[system]?.health_score !== undefined) {
      weightedScore += systemHealth[system].health_score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
}