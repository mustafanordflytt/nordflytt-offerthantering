import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const customerId = params.customerId;
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }
    
    // Build comprehensive customer context
    const context = await buildCustomerContext(customerId);
    
    return NextResponse.json({
      success: true,
      context,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Customer context error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer context' },
      { status: 500 }
    );
  }
}

async function buildCustomerContext(customerId: string) {
  if (!supabase) {
    // Return mock context for demo
    return {
      customer: {
        id: customerId,
        name: 'Anna Andersson',
        email: 'anna@example.com',
        phone: '+46701234567',
        preferredName: 'Anna',
        isVIP: true,
        lifetimeValue: 75000,
        customerSince: '2023-01-15',
        totalMoves: 3
      },
      bookings: {
        active: {
          id: 'booking-123',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          fromAddress: 'Vasagatan 10, Stockholm',
          toAddress: 'Östermalm 25, Stockholm',
          services: ['flytt', 'packning'],
          status: 'confirmed'
        },
        history: [
          {
            date: '2023-06-15',
            value: 25000,
            satisfaction: 5,
            services: ['flytt', 'städning']
          },
          {
            date: '2023-01-20',
            value: 18000,
            satisfaction: 5,
            services: ['flytt']
          }
        ]
      },
      preferences: {
        communicationChannel: 'chat',
        communicationStyle: 'friendly',
        favoriteServices: ['packning', 'städning'],
        priceRange: 'premium',
        preferredTimes: ['morning', 'weekend']
      },
      interactions: {
        lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        totalInteractions: 12,
        averageSatisfaction: 4.8,
        commonTopics: ['booking_changes', 'service_questions', 'pricing']
      },
      recommendations: {
        services: [
          {
            service: 'magasinering',
            reason: 'Ofta används tillsammans med packning',
            confidence: 0.85
          },
          {
            service: 'återvinning',
            reason: 'Miljömedveten kund',
            confidence: 0.72
          }
        ],
        nextAction: 'Påminn om inventarielista 2 dagar före flytt'
      }
    };
  }
  
  // Fetch customer profile with all related data
  const [
    customerResult,
    bookingsResult,
    interactionsResult,
    preferencesResult
  ] = await Promise.all([
    // Customer profile
    supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single(),
    
    // Bookings
    supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', customerId)
      .order('scheduled_date', { ascending: false }),
    
    // Interactions
    supabase
      .from('customer_interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10),
    
    // Preferences
    supabase
      .from('customer_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .single()
  ]);
  
  const customer = customerResult.data;
  if (!customer) {
    throw new Error('Customer not found');
  }
  
  const bookings = bookingsResult.data || [];
  const activeBooking = bookings.find(b => 
    b.status === 'confirmed' && 
    new Date(b.scheduled_date) > new Date()
  );
  
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const interactions = interactionsResult.data || [];
  const preferences = preferencesResult.data || {};
  
  // Calculate metrics
  const totalMoves = completedBookings.length;
  const lifetimeValue = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const averageSatisfaction = calculateAverageSatisfaction(completedBookings);
  
  // Generate recommendations
  const recommendations = await generateRecommendations(customer, bookings, preferences);
  
  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      preferredName: customer.first_name || customer.name.split(' ')[0],
      isVIP: lifetimeValue > 50000,
      lifetimeValue,
      customerSince: customer.created_at,
      totalMoves
    },
    bookings: {
      active: activeBooking ? {
        id: activeBooking.id,
        date: activeBooking.scheduled_date,
        fromAddress: activeBooking.from_address,
        toAddress: activeBooking.to_address,
        services: activeBooking.services || [],
        status: activeBooking.status
      } : null,
      history: completedBookings.slice(0, 5).map(b => ({
        date: b.scheduled_date,
        value: b.total_amount,
        satisfaction: b.customer_satisfaction,
        services: b.services || []
      }))
    },
    preferences: {
      communicationChannel: preferences.communication_channel || 'email',
      communicationStyle: preferences.communication_style || 'professional',
      favoriteServices: preferences.favorite_services || [],
      priceRange: preferences.price_range || 'standard',
      preferredTimes: preferences.preferred_times || []
    },
    interactions: {
      lastContact: interactions[0]?.created_at || null,
      totalInteractions: interactions.length,
      averageSatisfaction,
      commonTopics: extractCommonTopics(interactions)
    },
    recommendations
  };
}

function calculateAverageSatisfaction(bookings: any[]): number {
  const ratings = bookings
    .filter(b => b.customer_satisfaction)
    .map(b => b.customer_satisfaction);
  
  if (ratings.length === 0) return 0;
  
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

function extractCommonTopics(interactions: any[]): string[] {
  const topics: { [key: string]: number } = {};
  
  interactions.forEach(i => {
    if (i.topic) {
      topics[i.topic] = (topics[i.topic] || 0) + 1;
    }
  });
  
  return Object.entries(topics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic);
}

async function generateRecommendations(customer: any, bookings: any[], preferences: any) {
  const recommendations = {
    services: [] as any[],
    nextAction: ''
  };
  
  // Service recommendations based on history
  const usedServices = new Set(
    bookings.flatMap(b => b.services || [])
  );
  
  if (usedServices.has('packning') && !usedServices.has('magasinering')) {
    recommendations.services.push({
      service: 'magasinering',
      reason: 'Ofta används tillsammans med packning',
      confidence: 0.85
    });
  }
  
  if (preferences.environmental_conscious && !usedServices.has('återvinning')) {
    recommendations.services.push({
      service: 'återvinning',
      reason: 'Miljömedveten kund',
      confidence: 0.72
    });
  }
  
  // Next action recommendation
  const activeBooking = bookings.find(b => 
    b.status === 'confirmed' && 
    new Date(b.scheduled_date) > new Date()
  );
  
  if (activeBooking) {
    const daysUntilMove = Math.ceil(
      (new Date(activeBooking.scheduled_date).getTime() - Date.now()) / 
      (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilMove <= 7 && daysUntilMove > 2) {
      recommendations.nextAction = 'Påminn om inventarielista och förberedelser';
    } else if (daysUntilMove <= 2) {
      recommendations.nextAction = 'Skicka slutlig bekräftelse och kontaktinfo för flyttteam';
    }
  }
  
  return recommendations;
}