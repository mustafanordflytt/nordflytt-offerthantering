import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UploadParams {
  bucket: string
  path: string
  file: Buffer | Blob | File
  contentType?: string
}

export async function uploadToSupabase({
  bucket,
  path,
  file,
  contentType = 'application/octet-stream'
}: UploadParams) {
  try {
    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === bucket)
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 52428800 // 50MB
      })
      
      if (createError && createError.message !== 'Bucket already exists') {
        throw createError
      }
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return { 
      path: data.path, 
      publicUrl,
      fullPath: data.fullPath 
    }
  } catch (error) {
    console.error('Storage upload error:', error)
    throw new Error('Failed to upload file')
  }
}

export async function downloadFromSupabase(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Storage download error:', error)
    throw new Error('Failed to download file')
  }
}

export async function deleteFromSupabase(bucket: string, paths: string[]) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Storage delete error:', error)
    throw new Error('Failed to delete file')
  }
}

export async function createSignedUrl(
  bucket: string, 
  path: string, 
  expiresIn: number = 3600
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw error
    }

    return data.signedUrl
  } catch (error) {
    console.error('Signed URL error:', error)
    throw new Error('Failed to create signed URL')
  }
}

// Storage policies setup
export async function setupStoragePolicies() {
  const policies = [
    {
      bucket: 'employee-documents',
      name: 'Allow authenticated users to view',
      definition: `
        CREATE POLICY "Allow authenticated users to view"
        ON storage.objects FOR SELECT
        USING (auth.uid() IS NOT NULL AND bucket_id = 'employee-documents');
      `
    },
    {
      bucket: 'employee-documents',
      name: 'Allow HR to upload',
      definition: `
        CREATE POLICY "Allow HR to upload"
        ON storage.objects FOR INSERT
        WITH CHECK (
          auth.uid() IS NOT NULL AND 
          bucket_id = 'employee-documents' AND
          EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::uuid 
            AND role IN ('admin', 'hr')
          )
        );
      `
    }
  ]

  // Apply policies
  for (const policy of policies) {
    try {
      await supabase.rpc('exec_sql', {
        sql: policy.definition
      })
    } catch (error) {
      console.error(`Failed to create policy ${policy.name}:`, error)
    }
  }
}