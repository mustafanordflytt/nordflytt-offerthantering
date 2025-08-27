import { NextResponse } from 'next/server';

// Mock email sending function
async function sendTypeformEmail(candidate: any) {
  console.log(`Sending Typeform link to ${candidate.email}`);
  
  // In production, use SendGrid
  // await sendgrid.send({
  //   to: candidate.email,
  //   from: 'hej@nordflytt.se',
  //   subject: 'Nästa steg i din ansökan - Nordflytt',
  //   html: `
  //     <h2>Hej ${candidate.first_name}!</h2>
  //     <p>Tack för att du chattade med Lowisa!</p>
  //     <p>Nästa steg är att fylla i vårt formulär:</p>
  //     <a href="https://syn7dh9e02w.typeform.com/to/pUeKubsb" 
  //        style="background: #002A5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
  //       Fyll i formuläret här
  //     </a>
  //   `
  // });
  
  return true;
}

// Mock notification function
async function notifyRecruiter(candidateId: number, candidateName: string) {
  console.log(`Notifying recruiter: ${candidateName} has completed Lowisa screening`);
  
  // In production, send notification via preferred channel
  // Could be Slack, email, or internal notification system
  
  return true;
}

export async function POST(request: Request) {
  try {
    const { candidateId, candidateData } = await request.json();

    // Update candidate stage to 'typeform_sent'
    // In production, update in Supabase
    // await supabase
    //   .from('recruitment_applications')
    //   .update({
    //     current_stage: 'typeform_sent',
    //     lowisa_completion_date: new Date().toISOString(),
    //     information_status: {
    //       korkort: true,
    //       arbetserfarenhet: true,
    //       tillganglighet: true,
    //       svenska: true,
    //       isComplete: true,
    //       completionRate: 100
    //     }
    //   })
    //   .eq('id', candidateId);

    // Send Typeform email
    await sendTypeformEmail(candidateData);

    // Notify recruiter
    await notifyRecruiter(candidateId, candidateData.first_name);

    // Log completion for analytics
    console.log(`[Lowisa Complete] Candidate ${candidateId} completed information gathering`);

    return NextResponse.json({
      success: true,
      message: 'Information gathering complete',
      nextStep: 'typeform_sent',
      typeformUrl: 'https://syn7dh9e02w.typeform.com/to/pUeKubsb'
    });

  } catch (error) {
    console.error('Error completing Lowisa process:', error);
    return NextResponse.json(
      { error: 'Failed to complete process' },
      { status: 500 }
    );
  }
}