import { NextRequest, NextResponse } from 'next/server';
import { automatedLeadAssignment } from '@/lib/workflows/automated-lead-assignment';
import { salesPipelineAutomation } from '@/lib/workflows/sales-pipeline-automation';

export async function POST(request: NextRequest) {
  try {
    const lead = await request.json();

    // Validate lead data
    if (!lead.name || !lead.email) {
      return NextResponse.json(
        { error: 'Lead name and email are required' },
        { status: 400 }
      );
    }

    // Auto-assign the lead
    const result = await automatedLeadAssignment.assignLead(lead);

    if (result.success) {
      // Start automated sales pipeline
      const pipelineId = await salesPipelineAutomation.initiatePipeline({
        ...lead,
        assignedTo: result.assignedTo,
        leadScore: result.leadScore
      });
      
      return NextResponse.json({
        success: true,
        message: 'Lead assigned successfully',
        assignedTo: result.assignedTo,
        leadScore: result.leadScore,
        pipelineId: pipelineId
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.reason || 'Assignment failed'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Auto-assign API error:', error);
    return NextResponse.json(
      { error: 'Failed to assign lead' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get assignment metrics
    const metrics = await automatedLeadAssignment.getAssignmentMetrics();
    
    return NextResponse.json({
      success: true,
      metrics
    });
    
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}