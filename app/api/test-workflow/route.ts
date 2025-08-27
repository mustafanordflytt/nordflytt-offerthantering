import { NextRequest, NextResponse } from 'next/server';
import { executeCompleteWorkflow } from '@/lib/workflows/complete-business-workflow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🧪 Test workflow endpoint called');
    console.log('Input data:', body);
    
    // Execute workflow
    const result = await executeCompleteWorkflow({
      name: body.name || 'Test User',
      email: body.email || 'test@example.com',
      phone: body.phone || '070-123-4567',
      customerType: 'private',
      serviceType: 'moving',
      serviceTypes: ['moving'],
      moveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      moveTime: '10:00',
      startAddress: 'Test Start Address',
      endAddress: 'Test End Address',
      startLivingArea: '70',
      endLivingArea: '70',
      startFloor: '2',
      endFloor: '1',
      startElevator: true,
      endElevator: true,
      startParkingDistance: '5',
      endParkingDistance: '5',
      totalPrice: 10000,
      ...body
    });
    
    console.log('Workflow result:', result);
    
    return NextResponse.json({
      success: true,
      result: result,
      jobCreated: !!result.jobId
    });
    
  } catch (error: any) {
    console.error('Test workflow error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}