import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Parse email to extract candidate information
function parseRecruitmentEmail(emailContent: string) {
  const lines = emailContent.split('\n');
  const nameMatch = emailContent.match(/(?:hej|hello|hi)\s+(?:jag heter|mitt namn är|i am|my name is)\s+([^\s,\.]+)/i);
  const positionMatch = emailContent.match(/(?:söker|applying for|interested in|vill jobba som)\s+([^\s,\.]+)/i);
  
  return {
    name: nameMatch ? nameMatch[1] : 'Kandidat',
    desiredPosition: positionMatch ? positionMatch[1] : 'flyttpersonal',
    originalMessage: emailContent
  };
}

export async function POST(request: Request) {
  try {
    const { from, subject, text, html } = await request.json();
    
    // Parse email content
    const emailContent = text || html || '';
    const candidateInfo = parseRecruitmentEmail(emailContent);
    
    // Check if this is a recruitment email
    const isRecruitmentEmail = 
      subject?.toLowerCase().includes('jobb') ||
      subject?.toLowerCase().includes('ansökan') ||
      subject?.toLowerCase().includes('job') ||
      subject?.toLowerCase().includes('application') ||
      emailContent.toLowerCase().includes('jobb') ||
      emailContent.toLowerCase().includes('söker');
    
    if (!isRecruitmentEmail) {
      return NextResponse.json({
        shouldRespond: false,
        reason: 'Not a recruitment email'
      });
    }

    // Generate AI response using same Lowisa personality
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Du är Lowisa, rekryteringsassistent på Nordflytt. Svara på rekryteringsmail på ett vänligt och professionellt sätt.
          
          INSTRUKTIONER:
          1. Tacka för intresset
          2. Be dem fylla i ansökningsformuläret: https://syn7dh9e02w.typeform.com/to/pUeKubsb
          3. Förklara att du kommer kontakta dem efter de fyllt i formuläret
          4. Var varm och välkomnande
          5. Håll svaret kort (max 5-6 meningar)
          
          Avsluta alltid med:
          Med vänliga hälsningar,
          Lowisa
          Rekryteringsassistent, Nordflytt`
        },
        {
          role: 'user',
          content: `Svara på detta rekryteringsmail från ${candidateInfo.name}:\n\n${emailContent}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const aiResponse = completion.choices[0].message.content || '';

    // Create candidate record
    // In production, save to Supabase
    const candidateRecord = {
      first_name: candidateInfo.name,
      email: from,
      desired_position: candidateInfo.desiredPosition,
      current_stage: 'email_received',
      source: 'email',
      initial_message: emailContent,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      shouldRespond: true,
      response: aiResponse,
      candidateRecord,
      subject: `Re: ${subject || 'Din jobbansökan hos Nordflytt'}`
    });

  } catch (error) {
    console.error('Error processing recruitment email:', error);
    
    // Fallback response
    return NextResponse.json({
      shouldRespond: true,
      response: `Hej!

Tack för ditt intresse för att jobba på Nordflytt! 🎯

För att gå vidare med din ansökan, vänligen fyll i vårt ansökningsformulär här:
https://syn7dh9e02w.typeform.com/to/pUeKubsb

Efter du fyllt i formuläret kommer jag att kontakta dig inom kort.

Med vänliga hälsningar,
Lowisa
Rekryteringsassistent, Nordflytt`,
      subject: 'Re: Din jobbansökan hos Nordflytt'
    });
  }
}