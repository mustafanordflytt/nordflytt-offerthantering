import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { StorageService, STORAGE_BUCKETS, ALLOWED_IMAGE_TYPES } from '@/lib/storage/storage-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id

    // Fetch job photos
    const { data: photos, error } = await supabase
      .from('job_photos')
      .select(`
        *,
        file_attachment:file_attachments!job_photos_file_attachment_id_fkey(
          id,
          file_name,
          file_size,
          mime_type,
          public_url,
          description,
          uploaded_at
        ),
        uploaded_by_user:crm_users!job_photos_uploaded_by_fkey(
          id,
          name,
          email
        )
      `)
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true })
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job photos' },
        { status: 500 }
      )
    }

    // Group photos by type
    const photosByType = {
      before: [],
      during: [],
      after: [],
      damage: [],
      inventory: [],
      other: []
    } as Record<string, any[]>

    photos?.forEach(photo => {
      const type = photo.photo_type || 'other'
      const formattedPhoto = {
        id: photo.id,
        photoType: photo.photo_type,
        caption: photo.caption,
        location: photo.location_in_property,
        isPrimary: photo.is_primary,
        sortOrder: photo.sort_order,
        coordinates: photo.latitude && photo.longitude ? {
          latitude: photo.latitude,
          longitude: photo.longitude
        } : null,
        takenAt: photo.taken_at,
        uploadedBy: photo.uploaded_by_user,
        uploadedAt: photo.uploaded_at,
        file: photo.file_attachment
      }
      
      if (photosByType[type]) {
        photosByType[type].push(formattedPhoto)
      } else {
        photosByType.other.push(formattedPhoto)
      }
    })

    return NextResponse.json({
      success: true,
      jobId,
      photos: photosByType,
      totalCount: photos?.length || 0
    })

  } catch (error: any) {
    console.error('Get job photos error:', error)
    return NextResponse.json({
      error: 'Failed to get job photos',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const photoType = formData.get('photoType') as string
    const caption = formData.get('caption') as string | null
    const location = formData.get('location') as string | null
    const isPrimary = formData.get('isPrimary') === 'true'
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0
    const latitude = formData.get('latitude') as string | null
    const longitude = formData.get('longitude') as string | null
    const takenAt = formData.get('takenAt') as string | null

    // Validate required fields
    if (!file || !photoType) {
      return NextResponse.json(
        { error: 'File and photo type are required' },
        { status: 400 }
      )
    }

    // Validate file is an image
    const validation = StorageService.validateFile(file, 10, ALLOWED_IMAGE_TYPES)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('job_id')
      .eq('job_id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Generate file path
    const filePath = StorageService.generateFilePath('jobs', jobId, file.name)

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.JOB_PHOTOS)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.JOB_PHOTOS)
      .getPublicUrl(filePath)

    // Start transaction
    const { data: attachment, error: attachmentError } = await supabase
      .from('file_attachments')
      .insert({
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: filePath,
        bucket_name: STORAGE_BUCKETS.JOB_PHOTOS,
        public_url: urlData.publicUrl,
        entity_type: 'job',
        entity_id: jobId,
        description: caption,
        uploaded_by: authResult.user.id
      })
      .select()
      .single()

    if (attachmentError) {
      // Try to delete the uploaded file
      await supabase.storage.from(STORAGE_BUCKETS.JOB_PHOTOS).remove([filePath])
      
      console.error('Attachment error:', attachmentError)
      return NextResponse.json(
        { error: 'Failed to save photo metadata' },
        { status: 500 }
      )
    }

    // If primary photo, update other photos
    if (isPrimary) {
      await supabase
        .from('job_photos')
        .update({ is_primary: false })
        .eq('job_id', jobId)
        .neq('id', attachment.id)
    }

    // Create job photo record
    const { data: jobPhoto, error: photoError } = await supabase
      .from('job_photos')
      .insert({
        job_id: jobId,
        photo_type: photoType,
        file_attachment_id: attachment.id,
        caption: caption,
        location_in_property: location,
        is_primary: isPrimary,
        sort_order: sortOrder,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        taken_at: takenAt || new Date().toISOString(),
        uploaded_by: authResult.user.id
      })
      .select()
      .single()

    if (photoError) {
      // Try to delete the attachment and file
      await supabase.from('file_attachments').delete().eq('id', attachment.id)
      await supabase.storage.from(STORAGE_BUCKETS.JOB_PHOTOS).remove([filePath])
      
      console.error('Job photo error:', photoError)
      return NextResponse.json(
        { error: 'Failed to create job photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: jobPhoto.id,
        photoType: jobPhoto.photo_type,
        caption: jobPhoto.caption,
        location: jobPhoto.location_in_property,
        isPrimary: jobPhoto.is_primary,
        file: {
          id: attachment.id,
          fileName: attachment.file_name,
          fileSize: attachment.file_size,
          publicUrl: attachment.public_url
        }
      },
      message: 'Photo uploaded successfully'
    })

  } catch (error: any) {
    console.error('Upload job photo error:', error)
    return NextResponse.json({
      error: 'Failed to upload job photo',
      details: error.message
    }, { status: 500 })
  }
}