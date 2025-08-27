import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// Enhanced Customer Memory Engine with Grok's improvements
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
    
    // Build focused customer context (3-5 key data points)
    const context = await buildFocusedCustomerContext(customerId);
    const greeting = await generateContextualGreeting(context);
    
    return NextResponse.json({
      message: greeting,
      context: context.essentials,
      personalized: true
    });
    
  } catch (error: any) {
    console.error('Greeting generation error:', error);
    return NextResponse.json({
      message: 'Hej! Välkommen till Nordflytt. Jag är här för att hjälpa dig med din flytt 24/7. Vad kan jag göra för dig?',
      personalized: false
    });
  }
}

async function buildFocusedCustomerContext(customerId: string) {
  if (!supabase) {
    // Mock context for demo
    return {
      essentials: {
        preferredName: 'Anna',
        customerSince: new Date('2023-01-15'),
        totalMoves: 2,
        isVIP: true
      },
      currentSituation: {
        activeBooking: {
          id: 'booking-123',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          status: 'confirmed'
        },
        upcomingDeadline: null,
        lastInteraction: {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          type: 'chat',
          topic: 'booking_inquiry'
        }
      },
      preferences: {
        communicationStyle: 'friendly',
        favoriteServices: ['packning', 'städning', 'förvaring'],
        priceRange: 'premium'
      }
    };
  }
  
  // Fetch customer profile
  const { data: profile } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
  
  if (!profile) {
    throw new Error('Customer not found');
  }
  
  // Fetch recent interactions (last 3)
  const { data: interactions } = await supabase
    .from('customer_interactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(3);
  
  // Fetch active booking
  const { data: activeBooking } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'confirmed')
    .gte('scheduled_date', new Date().toISOString())
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .single();
  
  // Calculate customer metrics
  const { count: totalMoves } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('status', 'completed');
  
  const lifetimeValue = profile.lifetime_value || 0;
  const isVIP = lifetimeValue > 50000;
  
  return {
    essentials: {
      preferredName: profile.first_name || profile.name?.split(' ')[0] || 'Kund',
      customerSince: new Date(profile.created_at),
      totalMoves: totalMoves || 0,
      isVIP
    },
    currentSituation: {
      activeBooking,
      upcomingDeadline: activeBooking?.scheduled_date,
      lastInteraction: interactions?.[0] || null
    },
    preferences: {
      communicationStyle: profile.preferred_communication_style || 'professional',
      favoriteServices: profile.favorite_services || [],
      priceRange: profile.price_preference || 'standard'
    }
  };
}

async function generateContextualGreeting(context: any) {
  const { essentials, currentSituation } = context;
  
  // Active booking takes priority
  if (currentSituation.activeBooking && isUpcoming(currentSituation.activeBooking.scheduled_date, 7)) {
    const date = formatDate(currentSituation.activeBooking.scheduled_date);
    return `Hej ${essentials.preferredName}! 👋 Jag ser att din flytt den ${date} närmar sig. Hur kan jag hjälpa dig?`;
  }
  
  // VIP customers get special treatment
  if (essentials.isVIP) {
    return `Välkommen tillbaka ${essentials.preferredName}! 🌟 Som en av våra värdefulla kunder, hur kan jag assistera dig idag?`;
  }
  
  // Returning customers with history
  if (essentials.totalMoves > 0) {
    return `Hej igen ${essentials.preferredName}! 😊 Kul att höra från dig. Vad kan jag hjälpa dig med denna gång?`;
  }
  
  // New customers
  return `Hej ${essentials.preferredName}! Välkommen till Nordflytt. Jag är här för att hjälpa dig med din flytt 24/7. Vad kan jag göra för dig?`;
}

function isUpcoming(date: string | Date, daysAhead: number): boolean {
  const moveDate = new Date(date);
  const today = new Date();
  const diffTime = moveDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= daysAhead;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long'
  });
}