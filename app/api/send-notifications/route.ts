import { NextResponse } from 'next/server';
import { sendOfferNotifications } from '@/lib/notifications';
import type { Offer } from '../../../types/offer';

/**
 * API-endpoint för att skicka notifieringar för en offert
 * 
 * Förväntar sig en POST-förfrågan med ett offer-objekt i request body.
 * Returnerar resultat från både e-post och SMS notifieringar.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validera att vi har nödvändig data
    if (!data || !data.id || !data.customerName) {
      return NextResponse.json(
        { error: "Offerdata saknas eller är ogiltig" },
        { status: 400 }
      );
    }

    // Konvertera input till ett Offer-objekt
    const offer: Offer = {
      id: data.id,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      services: data.services || [],
      totalPrice: data.totalPrice || 0,
      timeline: data.timeline || [],
      totalTime: data.totalTime || 0,
      totalPersonnel: data.totalPersonnel || 0,
      expectedEndTime: data.expectedEndTime || ""
    };

    // Skicka notifieringar
    const result = await sendOfferNotifications(offer);

    // Logga resultatet för diagnostik
    console.log(`Notifieringsresultat för offert ${offer.id}:`, result);

    // Returnera resultat
    return NextResponse.json({
      success: true,
      emailSent: result.emailSuccess,
      smsSent: result.smsSuccess,
      offerId: offer.id
    });
  } catch (error) {
    console.error("Fel vid sändning av notifieringar:", error);
    return NextResponse.json(
      { error: "Kunde inte skicka notifieringar" },
      { status: 500 }
    );
  }
} 