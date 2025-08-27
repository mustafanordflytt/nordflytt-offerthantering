import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Check if API configurations already exist
    const { data: existingConfigs } = await supabase
      .from('api_config')
      .select('*')
      .limit(1);
    
    if (existingConfigs && existingConfigs.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'API Management system already initialized'
      });
    }

    // Insert initial API configurations
    const { error: configError } = await supabase
      .from('api_config')
      .insert([
        {
          api_name: 'SendGrid',
          display_name: 'SendGrid Email API',
          endpoint: 'https://api.sendgrid.com/v3',
          auth_type: 'bearer',
          api_type: 'email',
          usage_threshold: 80,
          cost_threshold: 1000,
          critical: true,
          backup_api: 'Mailgun',
          documentation_url: 'https://docs.sendgrid.com/'
        },
        {
          api_name: 'Mailgun',
          display_name: 'Mailgun Email API',
          endpoint: 'https://api.mailgun.net/v3',
          auth_type: 'basic',
          api_type: 'email',
          usage_threshold: 80,
          cost_threshold: 800,
          critical: false,
          backup_api: 'SendGrid',
          documentation_url: 'https://documentation.mailgun.com/'
        },
        {
          api_name: 'Twilio',
          display_name: 'Twilio SMS API',
          endpoint: 'https://api.twilio.com/2010-04-01',
          auth_type: 'basic',
          api_type: 'sms',
          usage_threshold: 85,
          cost_threshold: 1200,
          critical: true,
          documentation_url: 'https://www.twilio.com/docs/'
        },
        {
          api_name: 'Google Maps',
          display_name: 'Google Maps API',
          endpoint: 'https://maps.googleapis.com/maps/api',
          auth_type: 'api_key',
          api_type: 'maps',
          usage_threshold: 75,
          cost_threshold: 2000,
          critical: true,
          documentation_url: 'https://developers.google.com/maps/documentation/'
        },
        {
          api_name: 'SMHI Weather',
          display_name: 'SMHI Weather API',
          endpoint: 'https://opendata-download-metfcst.smhi.se/api',
          auth_type: 'none',
          api_type: 'weather',
          usage_threshold: 95,
          cost_threshold: 0,
          critical: false,
          documentation_url: 'https://opendata.smhi.se/apidocs/'
        },
        {
          api_name: 'Fortnox',
          display_name: 'Fortnox Accounting API',
          endpoint: 'https://api.fortnox.se/3',
          auth_type: 'bearer',
          api_type: 'accounting',
          usage_threshold: 70,
          cost_threshold: 1500,
          critical: true,
          documentation_url: 'https://developer.fortnox.se/documentation/'
        },
        {
          api_name: 'OpenAI Pricing Expert',
          display_name: 'OpenAI Pricing Expert GPT',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          auth_type: 'bearer',
          api_type: 'ai',
          usage_threshold: 80,
          cost_threshold: 3000,
          critical: true,
          documentation_url: 'https://platform.openai.com/docs/'
        },
        {
          api_name: 'OpenAI Logistics Expert',
          display_name: 'OpenAI Logistics Expert GPT',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          auth_type: 'bearer',
          api_type: 'ai',
          usage_threshold: 80,
          cost_threshold: 2500,
          critical: false,
          documentation_url: 'https://platform.openai.com/docs/'
        }
      ]);

    if (configError) {
      console.error('Config insert error:', configError);
      throw configError;
    }

    // Insert sample usage data for current month
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const { error: usageError } = await supabase
      .from('api_usage')
      .insert([
        {
          api_name: 'SendGrid',
          date: today.toISOString().split('T')[0],
          calls: 1247,
          successful_calls: 1240,
          failed_calls: 7,
          percentage: 62.35,
          usage_limit: 2000,
          cost_per_call: 0.001,
          total_cost: 1.247
        },
        {
          api_name: 'Mailgun',
          date: today.toISOString().split('T')[0],
          calls: 342,
          successful_calls: 340,
          failed_calls: 2,
          percentage: 42.75,
          usage_limit: 800,
          cost_per_call: 0.0008,
          total_cost: 0.274
        },
        {
          api_name: 'Twilio',
          date: today.toISOString().split('T')[0],
          calls: 89,
          successful_calls: 87,
          failed_calls: 2,
          percentage: 22.25,
          usage_limit: 400,
          cost_per_call: 0.75,
          total_cost: 66.75
        },
        {
          api_name: 'Google Maps',
          date: today.toISOString().split('T')[0],
          calls: 1567,
          successful_calls: 1550,
          failed_calls: 17,
          percentage: 78.35,
          usage_limit: 2000,
          cost_per_call: 0.005,
          total_cost: 7.835
        }
      ]);

    if (usageError) {
      console.error('Usage insert error:', usageError);
      throw usageError;
    }

    // Insert sample cost data
    const { error: costError } = await supabase
      .from('api_costs')
      .insert([
        {
          api_name: 'SendGrid',
          month: currentMonth,
          year: currentYear,
          current_cost: 124.50,
          budget: 1000,
          percentage: 12.45,
          projection: 450,
          status: 'good'
        },
        {
          api_name: 'Mailgun',
          month: currentMonth,
          year: currentYear,
          current_cost: 67.30,
          budget: 800,
          percentage: 8.41,
          projection: 280,
          status: 'good'
        },
        {
          api_name: 'Twilio',
          month: currentMonth,
          year: currentYear,
          current_cost: 356.80,
          budget: 1200,
          percentage: 29.73,
          projection: 1100,
          status: 'good'
        },
        {
          api_name: 'Google Maps',
          month: currentMonth,
          year: currentYear,
          current_cost: 1456.20,
          budget: 2000,
          percentage: 72.81,
          projection: 1890,
          status: 'warning'
        },
        {
          api_name: 'OpenAI Pricing Expert',
          month: currentMonth,
          year: currentYear,
          current_cost: 2345.60,
          budget: 3000,
          percentage: 78.19,
          projection: 2890,
          status: 'warning'
        }
      ]);

    if (costError) {
      console.error('Cost insert error:', costError);
      throw costError;
    }

    // Insert sample alerts
    const { error: alertError } = await supabase
      .from('api_alerts')
      .insert([
        {
          api_name: 'Fortnox',
          level: 'critical',
          message: 'API completely down - authentication failed',
          impact: 'Accounting integration broken',
          recommended_action: 'Check API credentials and endpoint status',
          alert_type: 'failure',
          threshold_value: 100,
          current_value: 0,
          resolved: false
        },
        {
          api_name: 'Google Maps',
          level: 'warning',
          message: 'High response time detected (1250ms)',
          impact: 'Slow route optimization',
          recommended_action: 'Monitor performance and consider fallback',
          alert_type: 'response_time',
          threshold_value: 1000,
          current_value: 1250,
          resolved: false
        },
        {
          api_name: 'OpenAI Pricing Expert',
          level: 'warning',
          message: 'Cost at 78% of monthly budget',
          impact: 'May exceed budget this month',
          recommended_action: 'Monitor usage and consider cost optimization',
          alert_type: 'cost_threshold',
          threshold_value: 75,
          current_value: 78.19,
          resolved: false
        }
      ]);

    if (alertError) {
      console.error('Alert insert error:', alertError);
      throw alertError;
    }

    return NextResponse.json({
      success: true,
      message: 'API Management system initialized successfully with sample data'
    });

  } catch (error) {
    console.error('API Management setup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize API Management system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}