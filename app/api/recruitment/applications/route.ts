/**
 * NORDFLYTT RECRUITMENT APPLICATIONS API
 * Handle recruitment application CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock database operations (replace with actual Supabase in production)
export let mockApplications: any[] = [
  {
    id: 1,
    application_date: '2025-01-15T10:00:00Z',
    first_name: 'Anna',
    last_name: 'Andersson',
    email: 'anna.andersson@example.com',
    phone: '+46701234567',
    desired_position: 'flyttpersonal',
    current_stage: 'cv_screening',
    overall_score: 0.85,
    status: 'active',
    geographic_preference: 'Stockholm',
    availability_date: '2025-02-01',
    salary_expectation: 28000,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  },
  {
    id: 2,
    application_date: '2025-01-14T14:30:00Z',
    first_name: 'Erik',
    last_name: 'Johansson',
    email: 'erik.johansson@example.com',
    phone: '+46702345678',
    desired_position: 'team_leader',
    current_stage: 'email_screening',
    overall_score: 0.76,
    status: 'active',
    geographic_preference: 'Göteborg',
    availability_date: '2025-01-30',
    salary_expectation: 35000,
    created_at: '2025-01-14T14:30:00Z',
    updated_at: '2025-01-15T09:15:00Z'
  },
  {
    id: 3,
    application_date: '2025-01-13T11:15:00Z',
    first_name: 'Maria',
    last_name: 'Lindqvist',
    email: 'maria.lindqvist@example.com',
    phone: '+46703456789',
    desired_position: 'kundservice',
    current_stage: 'personality_test',
    overall_score: 0.92,
    status: 'active',
    geographic_preference: 'Stockholm',
    availability_date: '2025-02-15',
    salary_expectation: 32000,
    created_at: '2025-01-13T11:15:00Z',
    updated_at: '2025-01-15T08:45:00Z'
  }
];

export let nextId = 4;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const position = searchParams.get('position');

    console.log('📋 Fetching recruitment applications with filters:', { stage, status, position });

    let filteredApplications = [...mockApplications];

    // Apply filters
    if (stage) {
      filteredApplications = filteredApplications.filter(app => app.current_stage === stage);
    }
    if (status) {
      filteredApplications = filteredApplications.filter(app => app.status === status);
    }
    if (position) {
      filteredApplications = filteredApplications.filter(app => app.desired_position === position);
    }

    // Sort by application date (newest first)
    filteredApplications.sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime());

    return NextResponse.json(filteredApplications);

  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creating new recruitment application:', body.email);

    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'desired_position'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email
    const existingApplication = mockApplications.find(app => app.email === body.email);
    if (existingApplication) {
      return NextResponse.json(
        { error: 'Application with this email already exists' },
        { status: 409 }
      );
    }

    // Create new application
    const newApplication = {
      id: nextId++,
      application_date: new Date().toISOString(),
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone || null,
      desired_position: body.desired_position,
      current_stage: body.current_stage || 'cv_screening',
      overall_score: body.overall_score || 0,
      status: body.status || 'active',
      geographic_preference: body.geographic_preference || null,
      availability_date: body.availability_date || null,
      salary_expectation: body.salary_expectation || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockApplications.push(newApplication);

    console.log('✅ Application created with ID:', newApplication.id);

    return NextResponse.json(newApplication, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}