import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { StorageService, STORAGE_BUCKETS } from '@/lib/storage/storage-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string
    const description = formData.get('description') as string | null
    const tags = formData.get('tags') as string | null
    const bucket = formData.get('bucket') as string

    // Validate required fields
    if (!file || !entityType || !entityId || !bucket) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate bucket name
    if (!Object.values(STORAGE_BUCKETS).includes(bucket as any)) {
      return NextResponse.json(
        { error: 'Invalid bucket name' },
        { status: 400 }
      )
    }

    // Validate file
    const maxSize = bucket === STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS || 
                   bucket === STORAGE_BUCKETS.SUPPLIER_CONTRACTS ? 50 : 10
    
    const validation = StorageService.validateFile(file, maxSize)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Generate file path
    const filePath = StorageService.generateFilePath(entityType, entityId, file.name)

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage using service role client
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    // Save file metadata to database
    const { data: attachment, error: dbError } = await supabase
      .from('file_attachments')
      .insert({
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: filePath,
        bucket_name: bucket,
        public_url: urlData.publicUrl,
        entity_type: entityType,
        entity_id: entityId,
        description: description,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        uploaded_by: authResult.user.id
      })
      .select()
      .single()

    if (dbError) {
      // Try to delete the uploaded file if database insert fails
      await supabase.storage.from(bucket).remove([filePath])
      
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.file_name,
        fileSize: attachment.file_size,
        mimeType: attachment.mime_type,
        publicUrl: attachment.public_url,
        uploadedAt: attachment.uploaded_at
      },
      message: 'File uploaded successfully'
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: 'Failed to upload file',
      details: error.message
    }, { status: 500 })
  }
}