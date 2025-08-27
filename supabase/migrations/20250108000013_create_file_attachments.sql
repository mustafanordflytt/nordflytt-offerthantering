-- Create file_attachments table for tracking uploaded files

CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- File information
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    bucket_name VARCHAR(100) NOT NULL,
    public_url TEXT,
    
    -- Relationship to entities
    entity_type VARCHAR(50) NOT NULL, -- customer, job, invoice, expense, employee, supplier
    entity_id VARCHAR(100) NOT NULL, -- ID of the related entity
    
    -- Additional metadata
    description TEXT,
    tags TEXT[],
    
    -- Upload information
    uploaded_by UUID REFERENCES crm_users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES crm_users(id),
    
    -- Indexes for performance
    CONSTRAINT file_size_positive CHECK (file_size > 0)
);

-- Create indexes
CREATE INDEX idx_file_attachments_entity ON file_attachments(entity_type, entity_id);
CREATE INDEX idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX idx_file_attachments_uploaded_at ON file_attachments(uploaded_at);
CREATE INDEX idx_file_attachments_deleted_at ON file_attachments(deleted_at);

-- Create job_photos table specifically for job documentation
CREATE TABLE IF NOT EXISTS job_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(50) REFERENCES jobs(job_id) ON DELETE CASCADE,
    
    -- Photo information
    photo_type VARCHAR(50) NOT NULL, -- before, during, after, damage, inventory
    file_attachment_id UUID REFERENCES file_attachments(id) ON DELETE CASCADE,
    
    -- Additional metadata
    caption TEXT,
    location_in_property VARCHAR(255), -- e.g., "Living room", "Kitchen"
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- GPS coordinates (if available)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Timestamps
    taken_at TIMESTAMP WITH TIME ZONE,
    uploaded_by UUID REFERENCES crm_users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(file_attachment_id)
);

-- Create indexes for job_photos
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_job_photos_photo_type ON job_photos(photo_type);
CREATE INDEX idx_job_photos_uploaded_at ON job_photos(uploaded_at);

-- Create document_templates table for reusable document templates
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template information
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- contract, invoice, quote, report
    category VARCHAR(100),
    
    -- File reference
    file_attachment_id UUID REFERENCES file_attachments(id) ON DELETE SET NULL,
    
    -- Template variables (JSON)
    variables JSONB DEFAULT '{}',
    
    -- Usage settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Metadata
    created_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES crm_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(template_name, template_type)
);

-- Create indexes for document_templates
CREATE INDEX idx_document_templates_type ON document_templates(template_type);
CREATE INDEX idx_document_templates_active ON document_templates(is_active);

-- Function to automatically delete storage file when attachment is deleted
CREATE OR REPLACE FUNCTION delete_storage_file()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete file from storage when file_attachment record is deleted
    IF OLD.bucket_name IS NOT NULL AND OLD.storage_path IS NOT NULL THEN
        -- This would need to be handled by the application layer
        -- as we can't directly delete from storage within SQL
        -- But we can log it for cleanup
        INSERT INTO audit_logs (
            action,
            entity_type,
            entity_id,
            details,
            created_at
        ) VALUES (
            'storage_file_pending_deletion',
            'file_attachment',
            OLD.id,
            jsonb_build_object(
                'bucket', OLD.bucket_name,
                'path', OLD.storage_path
            ),
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for file deletion
CREATE TRIGGER trigger_delete_storage_file
    AFTER DELETE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION delete_storage_file();

-- RLS Policies
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- File attachments policies
CREATE POLICY "Users can view file attachments"
    ON file_attachments FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upload file attachments"
    ON file_attachments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their file attachments"
    ON file_attachments FOR UPDATE
    USING (
        auth.role() = 'authenticated' 
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can soft delete their file attachments"
    ON file_attachments FOR UPDATE
    USING (
        auth.role() = 'authenticated'
        AND (uploaded_by = auth.uid() OR EXISTS (
            SELECT 1 FROM crm_users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        ))
    );

-- Job photos policies
CREATE POLICY "Users can view job photos"
    ON job_photos FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upload job photos"
    ON job_photos FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update job photos"
    ON job_photos FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Document templates policies
CREATE POLICY "Users can view active templates"
    ON document_templates FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_active = true
    );

CREATE POLICY "Admins can manage templates"
    ON document_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM crm_users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON file_attachments TO authenticated;
GRANT ALL ON job_photos TO authenticated;
GRANT SELECT ON document_templates TO authenticated;
GRANT ALL ON document_templates TO service_role;