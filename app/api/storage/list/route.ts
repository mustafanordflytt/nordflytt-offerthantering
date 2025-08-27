import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const bucket = searchParams.get('bucket')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('file_attachments')
      .select(`
        *,
        uploaded_by_user:crm_users!file_attachments_uploaded_by_fkey(
          id,
          name,
          email
        )
      `)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    if (entityId) {
      query = query.eq('entity_id', entityId)
    }

    if (bucket) {
      query = query.eq('bucket_name', bucket)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: attachments, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch attachments' },
        { status: 500 }
      )
    }

    // Format response
    const formattedAttachments = (attachments || []).map(attachment => ({
      id: attachment.id,
      fileName: attachment.file_name,
      fileSize: attachment.file_size,
      mimeType: attachment.mime_type,
      publicUrl: attachment.public_url,
      entityType: attachment.entity_type,
      entityId: attachment.entity_id,
      description: attachment.description,
      tags: attachment.tags || [],
      uploadedBy: attachment.uploaded_by_user,
      uploadedAt: attachment.uploaded_at,
      // Include storage info for admins
      ...(authResult.permissions.includes('admin') && {
        bucketName: attachment.bucket_name,
        storagePath: attachment.storage_path
      })
    }))

    return NextResponse.json({
      success: true,
      attachments: formattedAttachments,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error: any) {
    console.error('List attachments error:', error)
    return NextResponse.json({
      error: 'Failed to list attachments',
      details: error.message
    }, { status: 500 })
  }
}