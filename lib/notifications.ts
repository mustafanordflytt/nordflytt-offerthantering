import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import type { Offer, Service } from "../types/offer";

// Konfigurera SendGrid med API-nyckel
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Konfigurera Twilio-klient
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Håll reda på senast skickade notifieringar per ID för att undvika dubbletter
// Vi lagrar status för både SMS och e-post separat
const notificationCache = new Map<string, {
  emailSent: boolean,
  smsSent: boolean,
  timestamp: number
}>();

/**
 * Skickar både e-post och SMS-notifieringar för en offert
 */
export async function sendOfferNotifications(offer: Offer): Promise<{emailSuccess: boolean, smsSuccess: boolean}> {
  // Kontrollera om vi nyligen har skickat en notifiering för denna offert
  const offerId = offer.id;
  const now = Date.now();
  
  console.log(`[NOTIFICATION] Börjar process för offert ${offerId}`);
  
  // Hämta eller skapa cache-post
  let cacheEntry = notificationCache.get(offerId);
  if (!cacheEntry) {
    cacheEntry = {
      emailSent: false,
      smsSent: false,
      timestamp: 0  // Ingen tidigare notifiering
    };
  }
  
  // Uppdatera timestamp för denna körning
  cacheEntry.timestamp = now;
  notificationCache.set(offerId, cacheEntry);
  
  // Rensa gamla cache-poster
  cleanupCache();
  
  let emailSuccess = false;
  let smsSuccess = false;
  
  // Testa skicka e-post om den inte redan är skickad
  if (!cacheEntry.emailSent) {
    try {
      console.log(`[EMAIL] Försöker skicka e-post för offert ${offerId}`);
      await sendEmailNotification(offer);
      emailSuccess = true;
      cacheEntry.emailSent = true;
      console.log(`[EMAIL] E-post framgångsrikt skickad för offert ${offerId}`);
    } catch (error) {
      console.error(`[EMAIL] Misslyckades skicka e-post för offert ${offerId}:`, error);
      emailSuccess = false;
    }
  } else {
    console.log(`[EMAIL] E-post redan skickad för offert ${offerId}, hoppar över`);
    emailSuccess = true;
  }
  
  // Testa skicka SMS om det inte redan är skickat
  if (!cacheEntry.smsSent) {
    try {
      console.log(`[SMS] Försöker skicka SMS för offert ${offerId}`);
      await sendSMSNotification(offer);
      smsSuccess = true;
      cacheEntry.smsSent = true;
      console.log(`[SMS] SMS framgångsrikt skickat för offert ${offerId}`);
    } catch (error) {
      console.error(`[SMS] Misslyckades skicka SMS för offert ${offerId}:`, error);
      smsSuccess = false;
    }
  } else {
    console.log(`[SMS] SMS redan skickat för offert ${offerId}, hoppar över`);
    smsSuccess = true;
  }
  
  // Spara uppdaterat cache-status
  notificationCache.set(offerId, cacheEntry);
  
  // Sammanfatta resultatet
  console.log(`[NOTIFICATION] Resultat för offert ${offerId}: Email=${emailSuccess}, SMS=${smsSuccess}`);
  
  return { emailSuccess, smsSuccess };
}

/**
 * Rensar gamla cache-poster som är äldre än 30 minuter
 */
function cleanupCache(): void {
  const now = Date.now();
  const thirtyMinutesAgo = now - 30 * 60 * 1000;
  
  for (const [id, entry] of notificationCache.entries()) {
    if (entry.timestamp < thirtyMinutesAgo) {
      notificationCache.delete(id);
    }
  }
}

/**
 * Skickar ett e-postmeddelande till kunden med offertkonfirmation
 */
async function sendEmailNotification(offer: Offer): Promise<void> {
  console.log(`[EMAIL] Börjar skicka e-post till ${offer.email} för offert ${offer.id}`);
  
  // Validera att vi har nödvändig konfiguration
  if (!process.env.SENDGRID_API_KEY) {
    console.error('[EMAIL] SendGrid API-nyckel saknas');
    throw new Error('SendGrid API-nyckel saknas');
  }
  
  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error('[EMAIL] SendGrid från-e-post saknas');
    throw new Error('SendGrid från-e-post saknas');
  }
  
  // Validera att vi har en e-postadress att skicka till
  if (!offer.email || offer.email.trim() === '') {
    console.warn('[EMAIL] Ingen e-postadress angiven för offert:', offer.id);
    throw new Error('E-postadress saknas');
  }
  
  const offerLink = `${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}`;
  console.log(`[EMAIL] Offer link: ${offerLink}`);
  
  const emailContent = {
    to: offer.email.trim(),
    from: process.env.SENDGRID_FROM_EMAIL.trim() || 'info@nordflytt.se',
    subject: 'Din offert från Nordflytt',
    text: `
      Hej ${offer.customerName}!
      
      Tack för din offertförfrågan. Vi har nu förberett en offert åt dig.
      
      Du kan se din offert här: ${offerLink}
      
      Offertsummering:
      - Total kostnad: ${offer.totalPrice} kr
      - Antal tjänster: ${offer.services.length}
      - Förväntad sluttid: ${offer.expectedEndTime}
      
      Vi ser fram emot att hjälpa dig med din flytt!
      
      Med vänliga hälsningar,
      Nordflytt
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0056b3; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nordflytt</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hej ${offer.customerName}!</p>
          
          <p>Tack för din offertförfrågan. Vi har nu förberett en offert åt dig.</p>
          
          <p><a href="${offerLink}" style="background-color: #0056b3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Se din offert här</a></p>
          
          <h3>Offertsummering:</h3>
          <ul>
            <li>Total kostnad: ${offer.totalPrice} kr</li>
            <li>Antal tjänster: ${offer.services.length}</li>
            <li>Förväntad sluttid: ${offer.expectedEndTime}</li>
          </ul>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Tjänst</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Pris</th>
            </tr>
            ${offer.services.map((service: Service) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${service.name}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${service.price} kr</td>
              </tr>
            `).join('')}
          </table>
          
          <p style="margin-top: 20px;">Vi ser fram emot att hjälpa dig med din flytt!</p>
          
          <p>Med vänliga hälsningar,<br>Nordflytt</p>
        </div>
        
        <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Detta är ett automatiskt meddelande. Vänligen svara inte på detta mail.</p>
          <p>© ${new Date().getFullYear()} Nordflytt. Alla rättigheter förbehållna.</p>
        </div>
      </div>
    `
  };
  
  console.log(`[EMAIL] E-postinnehåll förberett, skickar från ${emailContent.from} till ${emailContent.to}`);
  
  try {
    await sgMail.send(emailContent);
    console.log(`[EMAIL] E-post framgångsrikt skickad till ${offer.email}`);
  } catch (error) {
    console.error('[EMAIL] Fel vid sändning av e-post:', error);
    
    // Mer detaljerad felhantering för SendGrid
    if (error.response) {
      console.error('[EMAIL] SendGrid API svarade med:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers
      });
    }
    
    throw error;
  }
}

/**
 * Skickar ett SMS till kunden med offertlänk
 */
async function sendSMSNotification(offer: Offer): Promise<void> {
  console.log(`[SMS] Börjar skicka SMS till ${offer.phone} för offert ${offer.id}`);
  
  // Skicka SMS om telefonnummer finns
  if (!offer.phone || offer.phone.trim() === '') {
    console.warn('[SMS] Inget telefonnummer angivet för offert:', offer.id);
    throw new Error('Telefonnummer saknas');
  }
  
  const offerLink = `${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}`;
  const message = `Hej ${offer.customerName}! Din offert från Nordflytt är klar. Se den här: ${offerLink}`;
  
  try {
    // Använd antingen Messaging Service SID eller telefonnummer
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    const normalizedPhone = normalizePhoneNumber(offer.phone);
    console.log(`[SMS] Normaliserat telefonnummer: ${normalizedPhone}`);
    
    const messageOptions: any = {
      body: message,
      to: normalizedPhone
    };
    
    // Prioritera Messaging Service om tillgänglig (för alfanumerisk avsändare)
    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid;
      console.log(`[SMS] Använder Messaging Service SID: ${messagingServiceSid}`);
    } else if (phoneNumber) {
      messageOptions.from = phoneNumber;
      console.log(`[SMS] Använder telefonnummer: ${phoneNumber}`);
    } else {
      console.error('[SMS] Varken Messaging Service SID eller telefonnummer är konfigurerade');
      throw new Error('SMS-konfiguration saknas');
    }
    
    console.log(`[SMS] Skickar SMS till ${normalizedPhone} för offert ${offer.id}...`);
    await twilioClient.messages.create(messageOptions);
    console.log(`[SMS] SMS skickat till ${normalizedPhone}`);
  } catch (error) {
    console.error('[SMS] Fel vid sändning av SMS:', error);
    throw error;
  }
}

/**
 * Normaliserar ett telefonnummer till E.164-format som Twilio kräver
 */
function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return '';
  }
  
  // Ta bort alla icke-siffror och +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Om numret börjar med 0, anta att det är ett svenskt nummer och ersätt 0 med +46
  if (cleaned.startsWith('0')) {
    return '+46' + cleaned.substring(1);
  }
  
  // Om numret börjar med 46 utan +, lägg till +
  if (cleaned.startsWith('46') && !cleaned.startsWith('+46')) {
    return '+' + cleaned;
  }
  
  // Om numret inte har landskod, lägg till +46
  if (!cleaned.startsWith('+')) {
    return '+46' + cleaned;
  }
  
  // Se till att numret är korrekt formaterat med + i början
  if (cleaned.startsWith('46')) {
    return '+' + cleaned;
  }
  
  return cleaned;
}