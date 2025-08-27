import type { Offer } from "@/types/offer";
import sgMail from "@sendgrid/mail";
import twilio from "twilio";

// Konfigurera SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Konfigurera Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Hjälpfunktion för att formatera telefonnummer korrekt för Twilio
function normalizePhoneNumber(phone: string): string {
  // Ta bort alla icke-siffror och +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Om numret börjar med 0, anta att det är ett svenskt nummer och ersätt 0 med +46
  if (cleaned.startsWith('0')) {
    return '+46' + cleaned.substring(1);
  }
  
  // Om numret inte har landskod, lägg till +46
  if (!cleaned.startsWith('+')) {
    return '+46' + cleaned;
  }
  
  return cleaned;
}

/**
 * Skickar både e-post och SMS notifieringar för en offert
 */
export async function sendOfferNotifications(offer: Offer) {
  // Verifiera att vi har kontaktinformation
  if (!offer.email && !offer.phone) {
    console.warn("Kan inte skicka notifieringar: Saknar både e-post och telefonnummer");
    return { emailSuccess: false, smsSuccess: false };
  }

  // Skicka notifieringar parallellt
  const [emailResult, smsResult] = await Promise.allSettled([
    offer.email ? sendEmailNotification(offer) : Promise.resolve(false),
    offer.phone ? sendSMSNotification(offer) : Promise.resolve(false)
  ]);

  return {
    emailSuccess: emailResult.status === "fulfilled" ? emailResult.value : false,
    smsSuccess: smsResult.status === "fulfilled" ? smsResult.value : false
  };
}

/**
 * Skickar e-postnotifiering via SendGrid
 */
async function sendEmailNotification(offer: Offer): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.error("SendGrid-konfiguration saknas");
    return false;
  }

  if (!offer.email) {
    console.warn("Kan inte skicka e-post: E-postadress saknas");
    return false;
  }

  try {
    const emailContent = `
      Hej ${offer.customerName}!

      Din offert från Nordflytt är klar. Klicka här för att se detaljer och boka:
      ${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}

      Med vänliga hälsningar,
      Nordflytt Team
    `;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hej ${offer.customerName}!</h2>
        <p>Din offert från Nordflytt är klar.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Visa offert</a></p>
        <p>Om länken ovan inte fungerar, kopiera denna URL till din webbläsare:</p>
        <p>${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}</p>
        <p>Med vänliga hälsningar,<br>Nordflytt Team</p>
      </div>
    `;

    const msg = {
      to: offer.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Din offert från Nordflytt",
      text: emailContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`E-post skickad till ${offer.email}`);
    return true;
  } catch (error) {
    console.error("Fel vid skickande av e-post:", error);
    return false;
  }
}

/**
 * Skickar SMS-notifiering via Twilio
 */
async function sendSMSNotification(offer: Offer): Promise<boolean> {
  if (!twilioClient) {
    console.error("Twilio-konfiguration saknas");
    return false;
  }

  if (!offer.phone) {
    console.warn("Kan inte skicka SMS: Telefonnummer saknas");
    return false;
  }

  try {
    const smsContent = `Hej ${offer.customerName}! Din offert från Nordflytt är klar. Visa och boka här: ${process.env.NEXT_PUBLIC_BASE_URL}/offer/${offer.id}`;

    // Använd alfanumerisk avsändare om den finns, annars telefonnummer
    const sender = process.env.TWILIO_ALPHA_SENDER || process.env.TWILIO_PHONE_NUMBER;
    
    if (!sender) {
      console.error("Ingen avsändare konfigurerad för SMS");
      return false;
    }

    await twilioClient.messages.create({
      body: smsContent,
      from: sender,
      to: normalizePhoneNumber(offer.phone)
    });

    console.log(`SMS skickat till ${offer.phone} från ${sender}`);
    return true;
  } catch (error) {
    console.error("Fel vid skickande av SMS:", error);
    return false;
  }
}
