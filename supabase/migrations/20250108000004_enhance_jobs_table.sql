-- Enhanced Jobs Table for CRM System
-- This migration enhances the jobs table to support all production requirements

-- First, let's check if the jobs table exists and has the right structure
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'priority') THEN
        ALTER TABLE jobs ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'assigned_staff_ids') THEN
        ALTER TABLE jobs ADD COLUMN assigned_staff_ids UUID[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'time_breakdown') THEN
        ALTER TABLE jobs ADD COLUMN time_breakdown JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'team_optimization') THEN
        ALTER TABLE jobs ADD COLUMN team_optimization JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'competitive_analysis') THEN
        ALTER TABLE jobs ADD COLUMN competitive_analysis JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'booking_id') THEN
        ALTER TABLE jobs ADD COLUMN booking_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'created_by') THEN
        ALTER TABLE jobs ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'updated_by') THEN
        ALTER TABLE jobs ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'route_id') THEN
        ALTER TABLE jobs ADD COLUMN route_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'checklist_items') THEN
        ALTER TABLE jobs ADD COLUMN checklist_items JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'materials_used') THEN
        ALTER TABLE jobs ADD COLUMN materials_used JSONB DEFAULT '[]';
    END IF;
END $$;

-- Create job_staff_assignments table for many-to-many relationship
CREATE TABLE IF NOT EXISTS job_staff_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'mover', -- team_leader, mover, driver
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES crm_users(id),
    hours_worked DECIMAL(4,2),
    notes TEXT,
    UNIQUE(job_id, staff_id)
);

-- Create job_time_logs table for tracking actual work time
CREATE TABLE IF NOT EXISTS job_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    break_minutes INTEGER DEFAULT 0,
    activity_type VARCHAR(50) DEFAULT 'moving', -- moving, packing, driving, setup, cleanup
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_photos table for better photo management
CREATE TABLE IF NOT EXISTS job_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id),
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50) NOT NULL, -- before, during, after, damage, inventory
    description TEXT,
    metadata JSONB,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS job_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES crm_users(id),
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority);
CREATE INDEX IF NOT EXISTS idx_jobs_booking_id ON jobs(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_staff_assignments_job_id ON job_staff_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_staff_assignments_staff_id ON job_staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_job_time_logs_job_id ON job_time_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_time_logs_staff_id ON job_time_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_job_status_history_job_id ON job_status_history(job_id);

-- Enable Row Level Security
ALTER TABLE job_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_staff_assignments
CREATE POLICY "CRM users can view all job assignments" ON job_staff_assignments
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Managers can manage job assignments" ON job_staff_assignments
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM crm_users 
            WHERE role IN ('admin', 'manager')
        )
    );

-- RLS Policies for job_time_logs
CREATE POLICY "CRM users can view time logs" ON job_time_logs
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Staff can create own time logs" ON job_time_logs
    FOR INSERT WITH CHECK (
        staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    );

-- RLS Policies for job_photos
CREATE POLICY "CRM users can view job photos" ON job_photos
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Staff can upload job photos" ON job_photos
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM crm_users) OR
        staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    );

-- RLS Policies for job_status_history
CREATE POLICY "CRM users can view status history" ON job_status_history
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

-- Create function to automatically create job from booking
CREATE OR REPLACE FUNCTION create_job_from_booking() RETURNS TRIGGER AS $$
DECLARE
    new_job_id VARCHAR(50);
    job_exists BOOLEAN;
BEGIN
    -- Only create job if booking status is 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
        -- Check if job already exists for this booking
        SELECT EXISTS(SELECT 1 FROM jobs WHERE booking_id = NEW.id) INTO job_exists;
        
        IF NOT job_exists THEN
            -- Generate unique job ID
            new_job_id := 'JOB' || LPAD(NEXTVAL('jobs_id_seq')::TEXT, 6, '0');
            
            -- Create job from booking
            INSERT INTO jobs (
                job_id,
                booking_number,
                booking_id,
                customer_id,
                scheduled_date,
                scheduled_time,
                status,
                services_requested,
                from_address,
                to_address,
                volume,
                distance,
                final_price,
                special_requirements,
                created_at,
                updated_at
            ) VALUES (
                new_job_id,
                NEW.reference,
                NEW.id,
                NEW.customer_id,
                NEW.move_date,
                NEW.move_time::TIME,
                'scheduled',
                NEW.service_types,
                NEW.start_address,
                NEW.end_address,
                (NEW.details->>'estimatedVolume')::DECIMAL,
                (NEW.details->>'calculatedDistance')::DECIMAL,
                NEW.total_price,
                NEW.details->>'specialInstructions',
                NOW(),
                NOW()
            );
            
            -- Log status change
            INSERT INTO job_status_history (
                job_id,
                new_status,
                reason,
                changed_at
            ) SELECT 
                id,
                'scheduled',
                'Job created from confirmed booking',
                NOW()
            FROM jobs WHERE booking_id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic job creation
DROP TRIGGER IF EXISTS trigger_create_job_from_booking ON bookings;
CREATE TRIGGER trigger_create_job_from_booking
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_job_from_booking();

-- Function to update job status when booking status changes
CREATE OR REPLACE FUNCTION update_job_status_from_booking() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        -- Update corresponding job status
        UPDATE jobs 
        SET status = CASE 
            WHEN NEW.status = 'completed' THEN 'completed'
            WHEN NEW.status = 'cancelled' THEN 'cancelled'
            WHEN NEW.status = 'in_progress' THEN 'in_progress'
            ELSE status
        END,
        updated_at = NOW()
        WHERE booking_id = NEW.id;
        
        -- Log status change
        INSERT INTO job_status_history (
            job_id,
            old_status,
            new_status,
            reason,
            changed_at
        ) SELECT 
            id,
            status,
            CASE 
                WHEN NEW.status = 'completed' THEN 'completed'
                WHEN NEW.status = 'cancelled' THEN 'cancelled'
                WHEN NEW.status = 'in_progress' THEN 'in_progress'
                ELSE status
            END,
            'Status updated from booking change',
            NOW()
        FROM jobs WHERE booking_id = NEW.id AND status != CASE 
            WHEN NEW.status = 'completed' THEN 'completed'
            WHEN NEW.status = 'cancelled' THEN 'cancelled'
            WHEN NEW.status = 'in_progress' THEN 'in_progress'
            ELSE status
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job status sync
DROP TRIGGER IF EXISTS trigger_update_job_status_from_booking ON bookings;
CREATE TRIGGER trigger_update_job_status_from_booking
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_job_status_from_booking();

-- Function to calculate job statistics
CREATE OR REPLACE FUNCTION get_job_statistics(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
    total_jobs INTEGER,
    scheduled_jobs INTEGER,
    in_progress_jobs INTEGER,
    completed_jobs INTEGER,
    cancelled_jobs INTEGER,
    total_revenue DECIMAL,
    average_job_value DECIMAL,
    average_duration DECIMAL,
    customer_satisfaction DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_jobs,
        COUNT(*) FILTER (WHERE status = 'scheduled')::INTEGER as scheduled_jobs,
        COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress_jobs,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER as cancelled_jobs,
        COALESCE(SUM(final_price) FILTER (WHERE status = 'completed'), 0) as total_revenue,
        COALESCE(AVG(final_price), 0) as average_job_value,
        COALESCE(AVG(actual_duration), 0) as average_duration,
        COALESCE(AVG(customer_rating), 0) as customer_satisfaction
    FROM jobs
    WHERE 
        (p_start_date IS NULL OR scheduled_date >= p_start_date) AND
        (p_end_date IS NULL OR scheduled_date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Function to get available time slots for scheduling
CREATE OR REPLACE FUNCTION get_available_time_slots(
    p_date DATE,
    p_duration_hours INTEGER DEFAULT 4
) RETURNS TABLE (
    start_time TIME,
    end_time TIME,
    available_teams INTEGER
) AS $$
BEGIN
    -- This is a simplified version - in production, this would check
    -- against staff schedules, existing jobs, and business hours
    RETURN QUERY
    WITH time_slots AS (
        SELECT 
            ('08:00'::TIME + (h * INTERVAL '1 hour'))::TIME as slot_start,
            ('08:00'::TIME + ((h + p_duration_hours) * INTERVAL '1 hour'))::TIME as slot_end
        FROM generate_series(0, 9) h
        WHERE ('08:00'::TIME + ((h + p_duration_hours) * INTERVAL '1 hour'))::TIME <= '18:00'::TIME
    ),
    busy_slots AS (
        SELECT 
            scheduled_time as start_time,
            (scheduled_time + (COALESCE(estimated_duration, 4) * INTERVAL '1 hour'))::TIME as end_time
        FROM jobs
        WHERE scheduled_date = p_date
        AND status IN ('scheduled', 'in_progress')
    )
    SELECT 
        ts.slot_start,
        ts.slot_end,
        3 - COALESCE(COUNT(bs.*), 0)::INTEGER as available_teams -- Assume 3 teams available
    FROM time_slots ts
    LEFT JOIN busy_slots bs ON 
        (ts.slot_start, ts.slot_end) OVERLAPS (bs.start_time, bs.end_time)
    GROUP BY ts.slot_start, ts.slot_end
    HAVING 3 - COALESCE(COUNT(bs.*), 0) > 0
    ORDER BY ts.slot_start;
END;
$$ LANGUAGE plpgsql;

-- Add some sample data for development (only if tables are empty)
INSERT INTO job_status_history (job_id, new_status, reason)
SELECT id, status, 'Initial status'
FROM jobs
WHERE NOT EXISTS (SELECT 1 FROM job_status_history WHERE job_id = jobs.id)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON jobs TO authenticated;
GRANT ALL ON job_staff_assignments TO authenticated;
GRANT ALL ON job_time_logs TO authenticated;
GRANT ALL ON job_photos TO authenticated;
GRANT ALL ON job_status_history TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE jobs IS 'Main jobs/uppdrag table for tracking moving jobs';
COMMENT ON TABLE job_staff_assignments IS 'Links staff members to jobs with their roles';
COMMENT ON TABLE job_time_logs IS 'Tracks actual time worked by staff on jobs';
COMMENT ON TABLE job_photos IS 'Stores photos taken before/during/after jobs';
COMMENT ON TABLE job_status_history IS 'Audit trail of all job status changes';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Jobs module enhancement completed successfully';
    RAISE NOTICE '📊 Tables enhanced/created: jobs, job_staff_assignments, job_time_logs, job_photos, job_status_history';
    RAISE NOTICE '🔐 RLS policies applied for security';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🔄 Automatic job creation from bookings enabled';
    RAISE NOTICE '📈 Statistics and scheduling functions available';
END $$;