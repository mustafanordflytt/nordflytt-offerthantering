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

const ISSUE_TYPE_NAMES: { [key: string]: string } = {
  damage_claim: 'skadeanmälan',
  booking_change: 'bokningsändring',
  complaint: 'klagomål',
  cleaning_issue: 'städningsproblem',
  general: 'allmän fråga'
};

const ASSIGNED_TEAMS: { [key: string]: string } = {
  damage_claim: 'Claims Department',
  booking_change: 'Booking Team',
  complaint: 'Customer Relations',
  cleaning_issue: 'Quality Control',
  general: 'Customer Service'
};

const ESTIMATED_RESPONSE: { [key: string]: string } = {
  high: 'inom 2 timmar',
  medium: 'inom 24 timmar',
  low: 'inom 2 arbetsdagar'
};

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
      customer_email, 
      issue_type, 
      description, 
      priority, 
      booking_reference 
    } = await request.json();
    
    // Validate required fields
    if (!customer_email || !issue_type || !description) {
      return NextResponse.json(
        { error: 'Customer email, issue type, and description are required' },
        { status: 400 }
      );
    }
    
    // Validate issue type
    if (!ISSUE_TYPE_NAMES[issue_type]) {
      return NextResponse.json(
        { error: 'Invalid issue type. Must be one of: damage_claim, booking_change, complaint, cleaning_issue, general' },
        { status: 400 }
      );
    }
    
    // Validate priority
    const validPriority = priority || 'medium';
    if (!['low', 'medium', 'high'].includes(validPriority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, medium, high' },
        { status: 400 }
      );
    }
    
    // Generate ticket number
    const ticketNumber = generateTicketNumber();
    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Implementation without database dependency
    // In production, this would save to support_tickets table
    const ticketResponse = {
      ticket_created: true,
      ticket_data: {
        ticket_id: ticketId,
        ticket_number: ticketNumber,
        estimated_response: ESTIMATED_RESPONSE[validPriority],
        assigned_team: ASSIGNED_TEAMS[issue_type]
      },
      suggested_response: generateSuggestedResponse(ticketNumber, issue_type, validPriority)
    };
    
    // Log the ticket creation (mock implementation)
    console.log('Support ticket created:', {
      ticketNumber,
      customer_email,
      issue_type,
      priority: validPriority,
      booking_reference
    });
    
    // In production, send email notification
    await sendTicketConfirmationEmail(customer_email, ticketNumber, issue_type);
    
    return NextResponse.json(ticketResponse);
    
  } catch (error: any) {
    console.error('Ticket creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `NF-${year}-${randomNum}`;
}

function generateSuggestedResponse(ticketNumber: string, issueType: string, priority: string): string {
  const baseResponse = `Jag har skapat ärende ${ticketNumber} för din ${ISSUE_TYPE_NAMES[issueType]}. `;
  
  let additionalInfo = '';
  
  switch (issueType) {
    case 'damage_claim':
      additionalInfo = 'Vår skadeavdelning kommer att kontakta dig med information om nästa steg, inklusive eventuell dokumentation som behövs.';
      break;
    case 'booking_change':
      additionalInfo = 'Vårt bokningsteam kommer att bekräfta dina ändringar och uppdatera din bokning.';
      break;
    case 'complaint':
      additionalInfo = 'Vi tar alla klagomål på allvar. En kundrelationsansvarig kommer att kontakta dig för att lösa situationen.';
      break;
    case 'cleaning_issue':
      additionalInfo = 'Vårt kvalitetsteam kommer att granska ärendet och eventuellt schemalägga en ny städning om det behövs.';
      break;
    default:
      additionalInfo = 'En kundservicemedarbetare kommer att hantera ditt ärende.';
  }
  
  return `${baseResponse}Du får email ${ESTIMATED_RESPONSE[priority]} med mer information. ${additionalInfo}`;
}

async function sendTicketConfirmationEmail(email: string, ticketNumber: string, issueType: string) {
  // This would integrate with your email service
  // For now, just log the action
  console.log(`Email notification would be sent to ${email} for ticket ${ticketNumber}`);
  
  // In production, this would use SendGrid, AWS SES, or similar:
  // await emailService.send({
  //   to: email,
  //   subject: `Nordflytt - Ärende ${ticketNumber} mottaget`,
  //   template: 'ticket-confirmation',
  //   data: { ticketNumber, issueType: ISSUE_TYPE_NAMES[issueType] }
  // });
}