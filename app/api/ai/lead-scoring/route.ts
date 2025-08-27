import { NextRequest, NextResponse } from 'next/server';
import { crmIntegration } from '@/lib/ai/crm-integration';

export async function GET(request: NextRequest) {
  try {
    // Mock AI-enhanced lead scores for development
    const mockLeads = [
      {
        id: '1',
        name: 'Anna Svensson',
        email: 'anna@example.com',
        phone: '070-123 45 67',
        ai_score: 85,
        ai_confidence: 92,
        ai_value: 45000,
        ai_insights: 'High conversion probability - engage immediately',
        created_at: new Date('2024-07-15').toISOString()
      },
      {
        id: '2',
        name: 'Erik Johansson AB',
        email: 'erik@foretaget.se',
        phone: '08-555 12 34',
        ai_score: 72,
        ai_confidence: 88,
        ai_value: 120000,
        ai_insights: 'Corporate lead with expansion potential',
        created_at: new Date('2024-07-10').toISOString()
      },
      {
        id: '3',
        name: 'Maria Nilsson',
        email: 'maria@example.com',
        phone: '073-987 65 43',
        ai_score: 65,
        ai_confidence: 75,
        ai_value: 28000,
        ai_insights: 'Medium priority - price sensitive',
        created_at: new Date('2024-07-18').toISOString()
      }
    ];
    
    return NextResponse.json(mockLeads);
    
  } catch (error) {
    console.error('Error getting lead scores:', error);
    return NextResponse.json(
      { error: 'Failed to get lead scores' },
      { status: 500 }
    );
  }
}