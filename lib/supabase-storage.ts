import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

export interface PhotoUploadResult {
  success: boolean
  url?: string
  error?: string
  publicUrl?: string
}

/**
 * Compress image before upload
 * @param dataUrl Base64 image data
 * @param maxWidth Maximum width (default 1200px)
 * @param quality JPEG quality (0-1, default 0.8)
 */
async function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }
          
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

/**
 * Upload photo to Supabase Storage
 * @param photoData Photo data from camera handler
 * @param jobId Job ID for organization
 */
export async function uploadPhoto(
  photoData: {
    dataUrl: string
    serviceType: string
    room?: string
    timestamp: string
    gpsPosition?: { latitude: number; longitude: number }
  },
  jobId: string
): Promise<PhotoUploadResult> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('⚠️ Supabase not configured - photos will only be saved locally')
      return {
        success: false,
        error: 'Supabase not configured'
      }
    }
    // Compress image first
    console.log('📸 Compressing image...')
    const compressedDataUrl = await compressImage(photoData.dataUrl, 1200, 0.8)
    
    // Convert base64 to blob
    const base64Data = compressedDataUrl.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/jpeg' })
    
    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const serviceClean = photoData.serviceType.replace(/[^a-zA-Z0-9]/g, '_')
    const roomClean = photoData.room ? `_${photoData.room.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
    const filename = `jobs/${jobId}/${serviceClean}${roomClean}_${timestamp}.jpg`
    
    console.log('📤 Uploading to Supabase:', filename)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('job-photos') // Make sure this bucket exists in Supabase
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (error) {
      console.error('❌ Upload error:', error)
      return { success: false, error: error.message }
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('job-photos')
      .getPublicUrl(filename)
    
    // Save metadata to database
    const metadata = {
      job_id: jobId,
      file_path: filename,
      public_url: urlData.publicUrl,
      service_type: photoData.serviceType,
      room: photoData.room,
      timestamp: photoData.timestamp,
      gps_latitude: photoData.gpsPosition?.latitude,
      gps_longitude: photoData.gpsPosition?.longitude,
      created_at: new Date().toISOString()
    }
    
    // Save to job_photos table (you'll need to create this table)
    const { error: dbError } = await supabase
      .from('job_photos')
      .insert([metadata])
    
    if (dbError) {
      console.error('⚠️ Failed to save metadata:', dbError)
      // Don't fail the whole operation if metadata save fails
    }
    
    console.log('✅ Photo uploaded successfully!')
    
    return {
      success: true,
      url: data.path,
      publicUrl: urlData.publicUrl
    }
  } catch (error) {
    console.error('❌ Upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all photos for a job
 * @param jobId Job ID
 */
export async function getJobPhotos(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch photos:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching photos:', error)
    return []
  }
}

/**
 * Delete a photo
 * @param filePath File path in storage
 */
export async function deletePhoto(filePath: string) {
  try {
    const { error } = await supabase.storage
      .from('job-photos')
      .remove([filePath])
    
    if (error) {
      console.error('Failed to delete photo:', error)
      return false
    }
    
    // Also delete from database
    await supabase
      .from('job_photos')
      .delete()
      .eq('file_path', filePath)
    
    return true
  } catch (error) {
    console.error('Error deleting photo:', error)
    return false
  }
}