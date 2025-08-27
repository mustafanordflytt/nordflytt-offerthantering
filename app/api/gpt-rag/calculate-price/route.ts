import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// API Key validation
async function validateApiKey(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const validApiKey = process.env.NORDFLYTT_GPT_API_KEY || 'nordflytt_gpt_api_key_2025';
  return token === validApiKey;
}

// Pricing constants (from your business logic)
const PRICING = {
  basePersonnelRate: 410, // SEK per hour
  rutDiscountRate: 0.5, // 50% RUT discount
  truckRate: 890, // SEK per hour
  volumeAdjustment: 240, // SEK per m³ after RUT
  packingRate: 500, // SEK per hour
  cleaningRate: 400, // SEK per hour after RUT
  pianoRate: 2500, // Fixed rate for piano
  stairsFee: 500, // Per floor without elevator
  minimumHours: 2
};

// Volume discount thresholds
const VOLUME_DISCOUNTS = [
  { min: 30, discount: 0.20, description: "20% rabatt för 30+ m³" },
  { min: 20, discount: 0.15, description: "15% rabatt för 20-29 m³" },
  { min: 15, discount: 0.10, description: "10% rabatt för 15-19 m³" },
  { min: 10, discount: 0.05, description: "5% rabatt för 10-14 m³" },
  { min: 0, discount: 0, description: "" }
];

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!await validateApiKey(request)) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid API key for Custom GPT access'
        },
        { status: 401 }
      );
    }

    const {
      volume_m3,
      floors_from,
      floors_to,
      elevator_from,
      elevator_to,
      additional_services = [],
      distance_km
    } = await request.json();
    
    // Validate required fields
    if (!volume_m3 || volume_m3 <= 0) {
      return NextResponse.json(
        { error: 'Valid volume in m³ is required' },
        { status: 400 }
      );
    }
    
    // Calculate base moving time using enhanced algorithm
    const { calculateEnhancedEstimatedTime } = require('@/lib/utils/enhanced-time-estimation');
    
    // Convert elevator info to type format
    const elevatorTypeFrom = elevator_from === 'big' ? 'stor' : 
                            elevator_from === 'small' ? 'liten' : 
                            elevator_from === 'none' ? 'ingen' : 'stor';
    const elevatorTypeTo = elevator_to === 'big' ? 'stor' : 
                          elevator_to === 'small' ? 'liten' : 
                          elevator_to === 'none' ? 'ingen' : 'stor';
    
    const timeEstimation = calculateEnhancedEstimatedTime({
      volume: volume_m3,
      distance: distance_km || 10,
      teamSize: 2, // Default team size for price calculation
      propertyType: 'lägenhet', // Default to apartment
      livingArea: Math.round(volume_m3 / 0.3), // Estimate from volume
      floors: {
        from: floors_from || 0,
        to: floors_to || 0
      },
      elevatorType: {
        from: elevatorTypeFrom,
        to: elevatorTypeTo
      },
      services: additional_services || ['moving'],
      trafficFactor: 'normal'
    });
    
    const estimatedHours = Math.max(PRICING.minimumHours, timeEstimation.totalHours);
    
    // Base costs
    let personnelCost = estimatedHours * PRICING.basePersonnelRate;
    let truckCost = estimatedHours * PRICING.truckRate;
    
    // Apply RUT discount to personnel
    personnelCost = personnelCost * (1 - PRICING.rutDiscountRate);
    
    // Volume adjustment if actual > booked
    const volumeAdjustmentCost = 0; // Only applied if actual > booked on moving day
    
    // Stairs fee calculation
    let stairsFee = 0;
    if (elevator_from === 'none' && floors_from > 2) {
      stairsFee += PRICING.stairsFee * (floors_from - 2);
    }
    if (elevator_to === 'none' && floors_to > 2) {
      stairsFee += PRICING.stairsFee * (floors_to - 2);
    }
    
    // Additional services
    let additionalServicesCost = 0;
    let serviceDescriptions: string[] = [];
    
    if (additional_services.includes('packing') || additional_services.includes('packning')) {
      const packingHours = Math.ceil(volume_m3 / 10); // 10m³ per hour for packing
      const packingCost = packingHours * PRICING.packingRate * (1 - PRICING.rutDiscountRate);
      additionalServicesCost += packingCost;
      serviceDescriptions.push(`Packning (${packingHours}h): ${Math.round(packingCost)} kr`);
    }
    
    if (additional_services.includes('cleaning') || additional_services.includes('städning')) {
      const cleaningHours = 3; // Standard 3 hours
      const cleaningCost = cleaningHours * PRICING.cleaningRate;
      additionalServicesCost += cleaningCost;
      serviceDescriptions.push(`Flyttstädning: ${Math.round(cleaningCost)} kr`);
    }
    
    if (additional_services.includes('piano')) {
      additionalServicesCost += PRICING.pianoRate;
      serviceDescriptions.push(`Pianoflytt: ${PRICING.pianoRate} kr`);
    }
    
    // Calculate subtotal
    let subtotal = personnelCost + truckCost + stairsFee + additionalServicesCost;
    
    // Apply volume discount
    const volumeDiscount = VOLUME_DISCOUNTS.find(d => volume_m3 >= d.min);
    const discountAmount = subtotal * (volumeDiscount?.discount || 0);
    const finalPrice = subtotal - discountAmount;
    
    // Generate savings explanation
    let savingsExplanation = '';
    if (volumeDiscount && volumeDiscount.discount > 0) {
      savingsExplanation = `Du sparar ${Math.round(discountAmount)} kr tack vare ${volumeDiscount.description}`;
    }
    
    // RUT savings explanation
    const rutSavings = (estimatedHours * PRICING.basePersonnelRate * PRICING.rutDiscountRate) +
                      (additional_services.includes('packing') ? 
                        Math.ceil(volume_m3 / 10) * PRICING.packingRate * PRICING.rutDiscountRate : 0);
    
    if (rutSavings > 0) {
      savingsExplanation += (savingsExplanation ? ' och ' : 'Du sparar ') + 
                           `${Math.round(rutSavings)} kr med RUT-avdrag`;
    }
    
    // Log pricing calculation for analytics
    if (supabase) {
      await supabase.from('gpt_analytics').insert({
        endpoint: 'calculate-price',
        success: true,
        metadata: { 
          volume_m3, 
          final_price: Math.round(finalPrice),
          discount_applied: volumeDiscount?.discount || 0 
        },
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      price_calculated: true,
      pricing_data: {
        total_price: Math.round(finalPrice),
        volume_discount: volumeDiscount?.description || '',
        savings_explanation: savingsExplanation
      },
      price_breakdown: {
        personnel_cost: Math.round(personnelCost),
        truck_cost: Math.round(truckCost),
        stairs_fee: stairsFee,
        additional_services: serviceDescriptions,
        subtotal: Math.round(subtotal),
        discount_amount: Math.round(discountAmount),
        rut_savings: Math.round(rutSavings)
      },
      suggested_response: generatePriceResponse(finalPrice, volumeDiscount, additional_services, savingsExplanation)
    });
    
  } catch (error: any) {
    console.error('Price calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate price' },
      { status: 500 }
    );
  }
}

function generatePriceResponse(
  finalPrice: number, 
  volumeDiscount: any, 
  services: string[], 
  savingsExplanation: string
): string {
  let response = `Din flytt kostar ${Math.round(finalPrice)} kr inklusive allt`;
  
  if (volumeDiscount && volumeDiscount.discount > 0) {
    response += ` med ${volumeDiscount.description}`;
  }
  
  response += '.';
  
  // Add service details
  if (services.length > 0) {
    const serviceNames = services.map(s => {
      if (s.includes('pack')) return 'packning';
      if (s.includes('clean') || s.includes('städ')) return 'flyttstädning';
      if (s.includes('piano')) return 'pianohantering';
      return s;
    });
    
    response += ` Detta inkluderar ${serviceNames.join(', ')}.`;
  }
  
  // Add savings if applicable
  if (savingsExplanation) {
    response += ` ${savingsExplanation}.`;
  }
  
  // Add RUT information
  response += ' Priset är redan reducerat med RUT-avdrag där det är tillämpligt.';
  
  return response;
}