/**
 * NORDFLYTT RECRUITMENT APPLICATION BY ID API
 * Handle individual application operations
 */

import { NextRequest, NextResponse } from 'next/server';

// Import mock data (in production, this would be a database query)
import { mockApplications } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = parseInt(params.id);
    console.log('📋 Fetching application:', applicationId);

    // Find application by ID
    const application = mockApplications.find(app => app.id === applicationId);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('❌ Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = parseInt(params.id);
    const updates = await request.json();
    
    console.log('📝 Updating application:', applicationId, updates);

    // Find application index
    const applicationIndex = mockApplications.findIndex(app => app.id === applicationId);
    
    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update application
    mockApplications[applicationIndex] = {
      ...mockApplications[applicationIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    console.log('✅ Application updated:', applicationId);

    return NextResponse.json(mockApplications[applicationIndex]);

  } catch (error) {
    console.error('❌ Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = parseInt(params.id);
    console.log('🗑️ Deleting application:', applicationId);

    // Find application index
    const applicationIndex = mockApplications.findIndex(app => app.id === applicationId);
    
    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Remove application
    const deletedApplication = mockApplications.splice(applicationIndex, 1)[0];

    console.log('✅ Application deleted:', applicationId);

    return NextResponse.json({ 
      message: 'Application deleted successfully',
      deleted: deletedApplication 
    });

  } catch (error) {
    console.error('❌ Error deleting application:', error);
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}