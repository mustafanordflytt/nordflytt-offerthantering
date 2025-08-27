import { NextRequest, NextResponse } from 'next/server';
import type { RealTimeAnalytics } from '@/lib/analytics/types';

// Mock real-time data for demonstration
// In production, this would connect to Google Analytics Real-Time Reporting API
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate mock real-time data
    const now = Date.now();
    const activeUsers = Math.floor(Math.random() * 50) + 10;
    
    const mockData: RealTimeAnalytics = {
      activeUsers,
      pageViewsPerMinute: Math.floor(Math.random() * 20) + 5,
      activePages: [
        { path: '/', users: Math.floor(activeUsers * 0.3) },
        { path: '/form', users: Math.floor(activeUsers * 0.25) },
        { path: '/offer/[id]', users: Math.floor(activeUsers * 0.2) },
        { path: '/crm/dashboard', users: Math.floor(activeUsers * 0.15) },
        { path: '/staff/dashboard', users: Math.floor(activeUsers * 0.1) },
      ],
      traffic: Array.from({ length: 30 }, (_, i) => ({
        timestamp: now - (29 - i) * 60000,
        users: Math.floor(Math.random() * 30) + 5,
        events: Math.floor(Math.random() * 50) + 10,
      })),
      recentEvents: [
        {
          timestamp: now - 10000,
          type: 'form_submit',
          user: 'user_' + Math.random().toString(36).substr(2, 9),
          details: { form: 'booking', service: 'moving' },
        },
        {
          timestamp: now - 25000,
          type: 'page_view',
          user: 'user_' + Math.random().toString(36).substr(2, 9),
          details: { page: '/form', referrer: 'google' },
        },
        {
          timestamp: now - 45000,
          type: 'ml_prediction',
          user: 'system',
          details: { algorithm: 'price_optimization', confidence: 0.92 },
        },
        {
          timestamp: now - 60000,
          type: 'conversion',
          user: 'user_' + Math.random().toString(36).substr(2, 9),
          details: { type: 'quote', value: 15000 },
        },
        {
          timestamp: now - 90000,
          type: 'route_optimization',
          user: 'staff_' + Math.random().toString(36).substr(2, 9),
          details: { efficiency: 0.87, distance_saved: 12.5 },
        },
      ],
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time analytics' },
      { status: 500 }
    );
  }
}