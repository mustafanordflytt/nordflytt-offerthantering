import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AISupplierRiskEngine } from '@/lib/suppliers/AISupplierRiskEngine';

const riskEngine = new AISupplierRiskEngine();

export async function POST(request: NextRequest) {
  try {
    const { supplier_id, force_refresh } = await request.json();

    if (!supplier_id) {
      return NextResponse.json(
        { success: false, error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    // Get supplier data
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplier_id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check if we have a recent assessment (unless forced refresh)
    if (!force_refresh) {
      const { data: recentAssessment } = await supabase
        .from('supplier_monitoring')
        .select('*')
        .eq('supplier_id', supplier_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentAssessment && recentAssessment.length > 0) {
        return NextResponse.json({
          success: true,
          data: recentAssessment[0],
          message: 'Recent risk assessment found',
          cached: true
        });
      }
    }

    // Perform comprehensive risk assessment
    const riskAssessment = await riskEngine.comprehensiveRiskAssessment(supplier);

    // Store the assessment results
    const { data: monitoringRecord, error: monitoringError } = await supabase
      .from('supplier_monitoring')
      .insert({
        supplier_id: supplier_id,
        monitoring_date: new Date().toISOString(),
        f_skatt_status: riskAssessment.risk_factors.find(f => f.category === 'financial_health')?.indicators?.f_skatt_status?.status || 'unknown',
        bankruptcy_risk_score: riskAssessment.overall_risk_score,
        financial_health_indicators: riskAssessment.risk_factors.find(f => f.category === 'financial_health')?.indicators,
        market_reputation_score: riskAssessment.risk_factors.find(f => f.category === 'market_position')?.score || 0,
        monitoring_source: 'ai_assessment',
        alerts_triggered: riskAssessment.immediate_action_required ? [{
          type: 'high_risk_detected',
          severity: riskAssessment.risk_level,
          triggered_at: new Date().toISOString(),
          recommendations: riskAssessment.recommendations
        }] : [],
        action_required: riskAssessment.immediate_action_required,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (monitoringError) {
      console.error('Error storing monitoring record:', monitoringError);
    }

    // Update supplier risk score
    await supabase
      .from('suppliers')
      .update({
        risk_score: riskAssessment.overall_risk_score,
        compliance_status: riskAssessment.risk_factors.find(f => f.category === 'compliance')?.risk_level || 'unknown',
        updated_at: new Date().toISOString()
      })
      .eq('id', supplier_id);

    // Create risk alerts if needed
    if (riskAssessment.immediate_action_required) {
      await createRiskAlerts(supplier_id, riskAssessment);
    }

    return NextResponse.json({
      success: true,
      data: {
        assessment: riskAssessment,
        monitoring_record: monitoringRecord
      },
      message: 'Risk assessment completed successfully'
    });

  } catch (error) {
    console.error('Error performing risk assessment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform risk assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplier_id = searchParams.get('supplier_id');
    const days = parseInt(searchParams.get('days') || '30');

    if (!supplier_id) {
      return NextResponse.json(
        { success: false, error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    // Get recent risk monitoring data
    const { data: monitoringData, error } = await supabase
      .from('supplier_monitoring')
      .select('*')
      .eq('supplier_id', supplier_id)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate risk trends
    const riskTrend = calculateRiskTrend(monitoringData);

    return NextResponse.json({
      success: true,
      data: {
        monitoring_data: monitoringData,
        risk_trend: riskTrend,
        latest_assessment: monitoringData?.[0] || null
      }
    });

  } catch (error) {
    console.error('Error fetching risk assessment data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch risk assessment data' },
      { status: 500 }
    );
  }
}

async function createRiskAlerts(supplierId: number, assessment: any) {
  const alerts = assessment.recommendations.map((rec: any) => ({
    supplier_id: supplierId,
    alert_type: rec.action,
    severity: rec.priority,
    title: rec.description,
    description: rec.description,
    recommended_actions: [rec.action],
    status: 'active',
    created_at: new Date().toISOString()
  }));

  // Store alerts in a notifications table (would need to be created)
  // For now, we'll log them
  console.log('Risk alerts created:', alerts);
}

function calculateRiskTrend(monitoringData: any[]): string {
  if (!monitoringData || monitoringData.length < 2) {
    return 'insufficient_data';
  }

  const recent = monitoringData.slice(0, 5);
  const older = monitoringData.slice(5, 10);

  if (recent.length === 0 || older.length === 0) {
    return 'insufficient_data';
  }

  const recentAvg = recent.reduce((sum, item) => sum + (item.bankruptcy_risk_score || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, item) => sum + (item.bankruptcy_risk_score || 0), 0) / older.length;

  const change = recentAvg - olderAvg;

  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}