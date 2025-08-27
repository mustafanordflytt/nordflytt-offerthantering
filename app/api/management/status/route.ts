import { NextResponse } from 'next/server';
import { APIHealthMonitor } from '@/lib/api-management/APIHealthMonitor';

export async function GET() {
  try {
    const monitor = new APIHealthMonitor();
    const status = await monitor.checkAllAPIs();
    
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API status check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check API status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { apiName, calls, successful } = await request.json();
    
    const monitor = new APIHealthMonitor();
    await monitor.updateAPIUsage(apiName, calls, successful);
    
    return NextResponse.json({
      success: true,
      message: 'API usage updated successfully'
    });
  } catch (error) {
    console.error('API usage update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update API usage'
    }, { status: 500 });
  }
}