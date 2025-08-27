import { NextRequest, NextResponse } from 'next/server'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { NotificationService } from '@/lib/notifications/notification-service'

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType') as 'customer' | 'employee'
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Entity type and ID are required' },
        { status: 400 }
      )
    }

    // Check if user can access these preferences
    const canAccess = entityId === authResult.user.id ||
                     authResult.permissions.includes('admin') ||
                     authResult.permissions.includes('notifications:manage')

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const preferences = await NotificationService.getPreferences(entityType, entityId)

    if (!preferences) {
      return NextResponse.json(
        { error: 'Failed to get preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error: any) {
    console.error('Get preferences error:', error)
    return NextResponse.json({
      error: 'Failed to get notification preferences',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, entityId, preferences } = body

    if (!entityType || !entityId || !preferences) {
      return NextResponse.json(
        { error: 'Entity type, ID and preferences are required' },
        { status: 400 }
      )
    }

    // Check if user can update these preferences
    const canUpdate = entityId === authResult.user.id ||
                     authResult.permissions.includes('admin') ||
                     authResult.permissions.includes('notifications:manage')

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const success = await NotificationService.updatePreferences(
      entityType,
      entityId,
      preferences
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    })

  } catch (error: any) {
    console.error('Update preferences error:', error)
    return NextResponse.json({
      error: 'Failed to update notification preferences',
      details: error.message
    }, { status: 500 })
  }
}