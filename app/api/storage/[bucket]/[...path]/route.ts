import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const bucket = resolvedParams.bucket
    const path = resolvedParams.path.join('/')

    // Download file from storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      console.error('Download error:', error)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Get file metadata from database
    const { data: metadata } = await supabase
      .from('file_attachments')
      .select('mime_type, file_name')
      .eq('bucket_name', bucket)
      .eq('storage_path', path)
      .single()

    // Return file with proper headers
    const headers = new Headers()
    headers.set('Content-Type', metadata?.mime_type || 'application/octet-stream')
    headers.set('Content-Disposition', `inline; filename="${metadata?.file_name || 'download'}"`)
    headers.set('Cache-Control', 'private, max-age=3600')

    return new NextResponse(data, {
      status: 200,
      headers
    })

  } catch (error: any) {
    console.error('File serve error:', error)
    return NextResponse.json({
      error: 'Failed to serve file',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const bucket = resolvedParams.bucket
    const path = resolvedParams.path.join('/')

    // Check if user has permission to delete
    const { data: attachment } = await supabase
      .from('file_attachments')
      .select('id, uploaded_by')
      .eq('bucket_name', bucket)
      .eq('storage_path', path)
      .single()

    if (!attachment) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwner = attachment.uploaded_by === authResult.user.id
    const isAdmin = authResult.permissions.includes('admin')
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      return NextResponse.json(
        { error: 'Failed to delete file from storage' },
        { status: 500 }
      )
    }

    // Soft delete from database
    const { error: dbError } = await supabase
      .from('file_attachments')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: authResult.user.id
      })
      .eq('id', attachment.id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json(
        { error: 'Failed to update file metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json({
      error: 'Failed to delete file',
      details: error.message
    }, { status: 500 })
  }
}