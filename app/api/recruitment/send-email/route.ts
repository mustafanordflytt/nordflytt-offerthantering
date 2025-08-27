import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, candidateId, candidateName } = body;

    console.log('📧 Sending recruitment email:', {
      to,
      subject,
      candidateName
    });

    // For now, we'll simulate sending the email
    // In production, integrate with SendGrid here:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to,
      from: 'rekrytering@nordflytt.se',
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>')
    };
    
    await sgMail.send(msg);
    */

    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log the communication (in production, save to database)
    console.log('✅ Email sent successfully to:', to);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: `email_${candidateId}_${Date.now()}`
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}