// 🔧 SKAPA: app/api/recalculate-price/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { berakna_flyttkostnad } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const { 
      bookingId,
      newStartAddress,
      newEndAddress,
      currentBookingData
    } = await request.json();

    if (!bookingId || !newStartAddress || !newEndAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Beräkna avstånd med Google Maps
    const distance = await calculateDistance(newStartAddress, newEndAddress);
    
    if (!distance) {
      return NextResponse.json({
        success: false,
        error: 'Could not calculate distance'
      }, { status: 400 });
    }

    // Skapa moveDetails objekt för prisberäkning
    const moveDetails = {
      volym_m3: currentBookingData.volym_m3 || 19,
      avstand_km: distance,
      hiss_typ_A: 'ingen' as const,
      vaningar_A: 0,
      hiss_typ_B: 'ingen' as const,
      vaningar_B: 0,
      lagenhet_kvm: currentBookingData.livingArea || 70,
      packning: currentBookingData.serviceTypes?.includes('packing') || false,
      stadning: currentBookingData.serviceTypes?.includes('cleaning') || false,
      lang_barvag: false,
      barvag_extra_meter: 0
    };

   
   // Beräkna nytt pris
// Beräkna nytt pris
const priceBreakdown = berakna_flyttkostnad(moveDetails as any);

// 🔍 DEBUG: Se exakt vad som returneras
console.log('🔍 Price breakdown delsummor:', priceBreakdown.delsummor);
const calculatedPrice = priceBreakdown.delsummor ? 
  Object.values(priceBreakdown.delsummor)
    .filter(val => typeof val === 'number' && !isNaN(val))
    .reduce((sum, val) => sum + val, 0) : 
  0;

console.log('🔍 Calculated total price:', calculatedPrice);

return NextResponse.json({
  success: true,
  distance: distance.toFixed(1),
  newPrice: calculatedPrice,  // ← ANVÄND BERÄKNAT PRIS DIREKT
  priceBreakdown: priceBreakdown
});

  } catch (error) {
    console.error('Error in recalculate-price:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper function för att beräkna avstånd
async function calculateDistance(origin: string, destination: string): Promise<number | null> {
  try {
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!API_KEY) {
      console.error('Google Maps API key not found');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=metric&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      return distanceInMeters / 1000; // Konvertera till kilometer
    }
    
    return null;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
}