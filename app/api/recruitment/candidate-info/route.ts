import { NextResponse } from 'next/server';
import { extractApiKey, handleCorsRequest, withCors } from '@/lib/api-auth-enhanced';

// Mock candidate database
const MOCK_CANDIDATES = [
  {
    id: 1,
    first_name: 'Anna',
    last_name: 'Andersson',
    email: 'anna.andersson@email.com',
    phone: '+46701234567',
    desired_position: 'flyttpersonal',
    current_stage: 'email_screening',
    overall_score: 0.75,
    status: 'active',
    application_date: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-16T14:20:00Z',
    location: 'Stockholm',
    availability: 'full_time',
    experience_years: 2,
    has_drivers_license: true,
    license_type: 'B',
    languages: ['Svenska', 'Engelska'],
    previous_experience: {
      moving: true,
      cleaning: false,
      warehouse: true,
      restaurant: false,
      construction: false
    },
    availability_details: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      flexible_hours: true,
      can_work_evenings: false
    },
    notes: 'Tidigare erfarenhet från PostNord lager och flyttfirma i 2 år.',
    cv_url: '/cvs/anna-andersson-cv.pdf',
    references: [
      {
        name: 'Erik Johansson',
        company: 'PostNord',
        phone: '+46702345678',
        relationship: 'Tidigare chef'
      }
    ]
  },
  {
    id: 2,
    first_name: 'Mohammed',
    last_name: 'Ali',
    email: 'mohammed.ali@email.com',
    phone: '+46703456789',
    desired_position: 'chauffor',
    current_stage: 'personality_test',
    overall_score: 0.82,
    status: 'active',
    application_date: '2024-01-14T09:15:00Z',
    updated_at: '2024-01-17T11:30:00Z',
    location: 'Stockholm',
    availability: 'full_time',
    experience_years: 5,
    has_drivers_license: true,
    license_type: 'CE',
    languages: ['Svenska', 'Arabiska', 'Engelska'],
    previous_experience: {
      moving: true,
      cleaning: false,
      warehouse: true,
      restaurant: false,
      construction: true
    },
    availability_details: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
      flexible_hours: true,
      can_work_evenings: true
    },
    notes: 'CE-körkort med ADR. 5 års erfarenhet som lastbilschaufför.',
    cv_url: '/cvs/mohammed-ali-cv.pdf'
  },
  {
    id: 3,
    first_name: 'Emma',
    last_name: 'Nilsson',
    email: 'emma.nilsson@email.com',
    phone: '+46704567890',
    desired_position: 'team_leader',
    current_stage: 'final_assessment',
    overall_score: 0.88,
    status: 'active',
    application_date: '2024-01-12T13:45:00Z',
    updated_at: '2024-01-18T16:00:00Z',
    location: 'Göteborg',
    availability: 'full_time',
    experience_years: 7,
    has_drivers_license: true,
    license_type: 'B',
    languages: ['Svenska', 'Engelska', 'Tyska'],
    previous_experience: {
      moving: true,
      cleaning: true,
      warehouse: true,
      restaurant: false,
      construction: false
    },
    availability_details: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      flexible_hours: true,
      can_work_evenings: false
    },
    notes: 'Teamledare på flyttfirma i 3 år, totalt 7 års branscherfarenhet.',
    cv_url: '/cvs/emma-nilsson-cv.pdf'
  }
];

export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsRequest(request as any);
  if (corsResponse) return corsResponse;

  try {
    // Check API key (supports both X-API-Key and Bearer token)
    const apiKey = extractApiKey(request as any);
    const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
    
    if (!apiKey || apiKey !== validApiKey) {
      return withCors(NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      ));
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const stage = searchParams.get('stage');
    const position = searchParams.get('position');

    // In production, query from Supabase
    // const { data, error } = await supabase
    //   .from('recruitment_applications')
    //   .select('*')
    //   .eq(id ? 'id' : email ? 'email' : 'id', id || email || '')
    //   .single();

    let candidates = [...MOCK_CANDIDATES];

    // Filter by ID
    if (id) {
      const candidate = candidates.find(c => c.id === parseInt(id));
      if (candidate) {
        return NextResponse.json(candidate);
      } else {
        return NextResponse.json(
          { error: 'Candidate not found' },
          { status: 404 }
        );
      }
    }

    // Filter by email
    if (email) {
      const candidate = candidates.find(c => c.email === email);
      if (candidate) {
        return NextResponse.json(candidate);
      } else {
        return NextResponse.json(
          { error: 'Candidate not found' },
          { status: 404 }
        );
      }
    }

    // Filter by stage
    if (stage) {
      candidates = candidates.filter(c => c.current_stage === stage);
    }

    // Filter by position
    if (position) {
      candidates = candidates.filter(c => c.desired_position === position);
    }

    // Return all candidates if no specific filters
    return NextResponse.json({
      candidates,
      total: candidates.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching candidate info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch candidate information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Update candidate information
export async function PATCH(request: Request) {
  try {
    // Check API key
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
    const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
    
    if (apiKey !== validApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // In production, update in Supabase
    // const { data, error } = await supabase
    //   .from('recruitment_applications')
    //   .update({
    //     ...updates,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', id)
    //   .select()
    //   .single();

    // Mock update
    const candidateIndex = MOCK_CANDIDATES.findIndex(c => c.id === parseInt(id));
    if (candidateIndex === -1) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    MOCK_CANDIDATES[candidateIndex] = {
      ...MOCK_CANDIDATES[candidateIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      candidate: MOCK_CANDIDATES[candidateIndex],
      message: 'Candidate information updated successfully'
    });

  } catch (error) {
    console.error('Error updating candidate info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update candidate information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS(request: Request) {
  const corsResponse = handleCorsRequest(request as any);
  return corsResponse || new NextResponse(null, { status: 200 });
}