/**
 * Utility för att validera miljövariabler vid applikationsstart
 */

/**
 * Kontrollerar att nödvändiga miljövariabler finns tillgängliga
 * Returnerar true om allt är ok, false om något saknas
 */
export function checkRequiredEnvVars(): boolean {
  const requiredVars = [
    // Supabase-variabler
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    
    // URL-variabler
    'NEXT_PUBLIC_BASE_URL',
  ];
  
  // Notifieringsvariabler (endast kontrollera om notifieringsfunktionalitet behövs)
  const notificationVars = [
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ];
  
  let allVarsPresent = true;
  let missingVars: string[] = [];
  
  // Kontrollera nödvändiga variabler
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      allVarsPresent = false;
      missingVars.push(varName);
    }
  });
  
  // Logga saknade variabler
  if (missingVars.length > 0) {
    console.error('KRITISKT: Följande nödvändiga miljövariabler saknas:', missingVars.join(', '));
    console.error('Lägg till dessa i .env.local-filen.');
  }
  
  // Kontrollera notifieringsvariabler och logga varning om de saknas
  let missingNotificationVars: string[] = [];
  notificationVars.forEach(varName => {
    if (!process.env[varName]) {
      missingNotificationVars.push(varName);
    }
  });
  
  if (missingNotificationVars.length > 0) {
    console.warn('VARNING: Följande miljövariabler för notifieringar saknas:', missingNotificationVars.join(', '));
    console.warn('Notifieringsfunktioner (e-post/SMS) kommer inte fungera korrekt utan dessa.');
  }
  
  return allVarsPresent;
}

/**
 * Validerar miljövariabler och returnerar ett resultat med statusflaggor
 */
export function validateEnvVars(): {
  supabaseConfigured: boolean;
  sendgridConfigured: boolean;
  twilioConfigured: boolean;
  baseUrlConfigured: boolean;
} {
  return {
    supabaseConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    sendgridConfigured: !!(
      process.env.SENDGRID_API_KEY && 
      process.env.SENDGRID_FROM_EMAIL
    ),
    twilioConfigured: !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ),
    baseUrlConfigured: !!process.env.NEXT_PUBLIC_BASE_URL
  };
} 