import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const storageClient = createClient(supabaseUrl, supabaseAnonKey)

export interface UploadFileOptions {
  bucket: string
  path: string
  file: File
  upsert?: boolean
}

export interface UploadResult {
  success: boolean
  path?: string
  publicUrl?: string
  error?: string
}

export class StorageService {
  /**
   * Upload a file to Supabase Storage
   */
  static async uploadFile({
    bucket,
    path,
    file,
    upsert = false
  }: UploadFileOptions): Promise<UploadResult> {
    try {
      const { data, error } = await storageClient.storage
        .from(bucket)
        .upload(path, file, {
          upsert,
          cacheControl: '3600'
        })

      if (error) {
        console.error('Storage upload error:', error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = storageClient.storage
        .from(bucket)
        .getPublicUrl(path)

      return {
        success: true,
        path: data.path,
        publicUrl: urlData.publicUrl
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Download a file from Supabase Storage
   */
  static async downloadFile(bucket: string, path: string): Promise<Blob | null> {
    try {
      const { data, error } = await storageClient.storage
        .from(bucket)
        .download(path)

      if (error) {
        console.error('Storage download error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Download error:', error)
      return null
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  static async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await storageClient.storage
        .from(bucket)
        .remove([path])

      if (error) {
        console.error('Storage delete error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }

  /**
   * Get a signed URL for temporary access
   */
  static async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      const { data, error } = await storageClient.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        console.error('Signed URL error:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Signed URL error:', error)
      return null
    }
  }

  /**
   * List files in a bucket/folder
   */
  static async listFiles(bucket: string, folder?: string) {
    try {
      const { data, error } = await storageClient.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0
        })

      if (error) {
        console.error('List files error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('List files error:', error)
      return []
    }
  }

  /**
   * Generate a unique file path
   */
  static generateFilePath(
    entityType: string,
    entityId: string,
    fileName: string
  ): string {
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `${entityType}/${entityId}/${timestamp}_${sanitizedFileName}`
  }

  /**
   * Validate file before upload
   */
  static validateFile(
    file: File,
    maxSizeMB: number = 50,
    allowedTypes?: string[]
  ): { valid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `Filen är för stor. Max storlek är ${maxSizeMB}MB.`
      }
    }

    // Check file type if specified
    if (allowedTypes && allowedTypes.length > 0) {
      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Filtypen stöds inte. Tillåtna typer: ${allowedTypes.join(', ')}`
        }
      }
    }

    return { valid: true }
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export bucket names as constants
export const STORAGE_BUCKETS = {
  CUSTOMER_DOCUMENTS: 'customer-documents',
  JOB_PHOTOS: 'job-photos',
  INVOICE_ATTACHMENTS: 'invoice-attachments',
  EXPENSE_RECEIPTS: 'expense-receipts',
  EMPLOYEE_DOCUMENTS: 'employee-documents',
  SUPPLIER_CONTRACTS: 'supplier-contracts'
} as const

// Export allowed mime types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
]