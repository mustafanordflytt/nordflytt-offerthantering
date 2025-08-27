-- Create storage buckets for file uploads

-- Customer documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-documents',
  'customer-documents',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Job photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  false,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Invoice attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-attachments',
  'invoice-attachments',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Expense receipts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Employee documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Supplier contracts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'supplier-contracts',
  'supplier-contracts',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage buckets

-- Customer documents policies
CREATE POLICY "Authenticated users can view customer documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload customer documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their customer documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'customer-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete their customer documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'customer-documents' 
  AND auth.role() = 'authenticated'
);

-- Job photos policies
CREATE POLICY "Authenticated users can view job photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'job-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload job photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'job-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update job photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'job-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete job photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'job-photos' 
  AND auth.role() = 'authenticated'
);

-- Invoice attachments policies
CREATE POLICY "Authenticated users can view invoice attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoice-attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload invoice attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoice-attachments' 
  AND auth.role() = 'authenticated'
);

-- Expense receipts policies
CREATE POLICY "Authenticated users can view expense receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'expense-receipts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload expense receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'expense-receipts' 
  AND auth.role() = 'authenticated'
);

-- Employee documents policies
CREATE POLICY "Authenticated users can view employee documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin users can upload employee documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-documents' 
  AND auth.role() = 'authenticated'
);

-- Supplier contracts policies
CREATE POLICY "Authenticated users can view supplier contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'supplier-contracts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can upload supplier contracts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'supplier-contracts' 
  AND auth.role() = 'authenticated'
);