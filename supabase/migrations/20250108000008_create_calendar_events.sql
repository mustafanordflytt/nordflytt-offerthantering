-- Calendar Events System
-- This migration creates a comprehensive calendar system for the CRM

-- Drop existing calendar_events table if it exists
DROP TABLE IF EXISTS calendar_events CASCADE;

-- Create calendar_events table with enhanced fields
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- job, meeting, training, break, vacation, other
    event_status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    
    -- Time fields
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT false,
    recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- RRULE format for recurring events
    
    -- Relations
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Staff assignments (array of user IDs)
    assigned_staff UUID[] DEFAULT '{}',
    required_staff_count INTEGER DEFAULT 1,
    
    -- Location
    location_name VARCHAR(255),
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- Additional metadata
    color VARCHAR(7), -- Hex color for UI
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    
    -- Reminders
    reminder_minutes INTEGER[], -- Array of minutes before event to remind
    
    -- Audit fields
    created_by UUID REFERENCES crm_users(id),
    updated_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_datetime CHECK (end_datetime > start_datetime)
);

-- Create calendar_attendees table for meeting participants
CREATE TABLE calendar_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES crm_users(id) ON DELETE CASCADE,
    external_email VARCHAR(255),
    external_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, tentative
    role VARCHAR(50) DEFAULT 'attendee', -- organizer, required, optional, attendee
    responded_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either user_id or external email is provided
    CONSTRAINT attendee_identity CHECK (user_id IS NOT NULL OR external_email IS NOT NULL)
);

-- Create calendar_resources table for equipment/room bookings
CREATE TABLE calendar_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- room, vehicle, equipment
    capacity INTEGER,
    location VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calendar_resource_bookings table
CREATE TABLE calendar_resource_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES calendar_resources(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- pending, confirmed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, resource_id)
);

-- Create calendar_views table for saved calendar views/filters
CREATE TABLE calendar_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    view_name VARCHAR(255) NOT NULL,
    view_type VARCHAR(50) DEFAULT 'custom', -- personal, team, public, custom
    owner_id UUID REFERENCES crm_users(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    
    -- View configuration
    config JSONB NOT NULL DEFAULT '{}', -- Stores filters, colors, etc.
    visible_calendars UUID[] DEFAULT '{}', -- Array of user IDs to show
    visible_event_types TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_calendar_events_start_datetime ON calendar_events(start_datetime);
CREATE INDEX idx_calendar_events_end_datetime ON calendar_events(end_datetime);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_event_status ON calendar_events(event_status);
CREATE INDEX idx_calendar_events_job_id ON calendar_events(job_id);
CREATE INDEX idx_calendar_events_customer_id ON calendar_events(customer_id);
CREATE INDEX idx_calendar_events_assigned_staff ON calendar_events USING GIN(assigned_staff);
CREATE INDEX idx_calendar_attendees_event_id ON calendar_attendees(event_id);
CREATE INDEX idx_calendar_attendees_user_id ON calendar_attendees(user_id);
CREATE INDEX idx_calendar_resource_bookings_event_id ON calendar_resource_bookings(event_id);
CREATE INDEX idx_calendar_resource_bookings_resource_id ON calendar_resource_bookings(resource_id);

-- Enable Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_resource_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "CRM users can view all events" ON calendar_events
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Users can create events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Users can update their own events or assigned events" ON calendar_events
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        auth.uid() = ANY(assigned_staff) OR
        auth.uid() IN (SELECT id FROM crm_users WHERE role IN ('admin', 'manager'))
    );

CREATE POLICY "Only admins and event creators can delete" ON calendar_events
    FOR DELETE USING (
        created_by = auth.uid() OR
        auth.uid() IN (SELECT id FROM crm_users WHERE role = 'admin')
    );

-- RLS Policies for calendar_attendees
CREATE POLICY "Users can view attendees for events they can see" ON calendar_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM calendar_events ce 
            WHERE ce.id = calendar_attendees.event_id 
            AND auth.uid() IN (SELECT id FROM crm_users)
        )
    );

-- RLS Policies for calendar_resources
CREATE POLICY "All users can view resources" ON calendar_resources
    FOR SELECT USING (true);

CREATE POLICY "Only managers can manage resources" ON calendar_resources
    FOR ALL USING (auth.uid() IN (SELECT id FROM crm_users WHERE role IN ('admin', 'manager')));

-- Create function to check for scheduling conflicts
CREATE OR REPLACE FUNCTION check_calendar_conflicts(
    p_start_datetime TIMESTAMP WITH TIME ZONE,
    p_end_datetime TIMESTAMP WITH TIME ZONE,
    p_assigned_staff UUID[],
    p_exclude_event_id UUID DEFAULT NULL
) RETURNS TABLE (
    conflicting_event_id UUID,
    event_title VARCHAR,
    event_type VARCHAR,
    start_datetime TIMESTAMP WITH TIME ZONE,
    end_datetime TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.title,
        ce.event_type,
        ce.start_datetime,
        ce.end_datetime
    FROM calendar_events ce
    WHERE 
        ce.event_status != 'cancelled'
        AND (p_exclude_event_id IS NULL OR ce.id != p_exclude_event_id)
        AND ce.assigned_staff && p_assigned_staff -- Array overlap
        AND (
            (ce.start_datetime, ce.end_datetime) OVERLAPS (p_start_datetime, p_end_datetime)
        );
END;
$$ LANGUAGE plpgsql;

-- Create function to create event from job
CREATE OR REPLACE FUNCTION create_calendar_event_from_job(p_job_id INTEGER)
RETURNS UUID AS $$
DECLARE
    v_job RECORD;
    v_event_id UUID;
    v_event_number VARCHAR(50);
BEGIN
    -- Get job details
    SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;
    
    -- Generate event ID
    SELECT 'EVENT' || LPAD(COALESCE(MAX(SUBSTRING(event_id FROM 6)::INTEGER), 0) + 1, 6, '0')
    INTO v_event_number
    FROM calendar_events;
    
    -- Create calendar event
    INSERT INTO calendar_events (
        event_id,
        title,
        description,
        event_type,
        event_status,
        start_datetime,
        end_datetime,
        job_id,
        customer_id,
        location_name,
        location_address,
        priority,
        created_by
    ) VALUES (
        v_event_number,
        'Flyttuppdrag: ' || v_job.job_id,
        'Flytt från ' || v_job.from_address || ' till ' || v_job.to_address,
        'job',
        CASE 
            WHEN v_job.status = 'scheduled' THEN 'scheduled'
            WHEN v_job.status = 'in_progress' THEN 'in_progress'
            WHEN v_job.status = 'completed' THEN 'completed'
            ELSE 'scheduled'
        END,
        v_job.scheduled_date + v_job.scheduled_time,
        v_job.scheduled_date + COALESCE(v_job.end_time, v_job.scheduled_time + (v_job.estimated_duration || ' hours')::INTERVAL),
        p_job_id,
        v_job.customer_id,
        'Flyttuppdrag',
        v_job.from_address,
        'high',
        auth.uid()
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get staff availability
CREATE OR REPLACE FUNCTION get_staff_availability(
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR,
    is_available BOOLEAN,
    conflicts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cu.id,
        cu.name,
        CASE 
            WHEN COUNT(ce.id) = 0 THEN true
            ELSE false
        END as is_available,
        COUNT(ce.id)::INTEGER as conflicts
    FROM crm_users cu
    LEFT JOIN calendar_events ce ON 
        cu.id = ANY(ce.assigned_staff)
        AND ce.event_status != 'cancelled'
        AND (ce.start_datetime::DATE = p_date OR ce.end_datetime::DATE = p_date)
        AND (
            (ce.start_datetime::TIME, ce.end_datetime::TIME) OVERLAPS (p_start_time, p_end_time)
        )
    WHERE cu.role IN ('employee', 'manager')
    AND cu.is_active = true
    GROUP BY cu.id, cu.name
    ORDER BY COUNT(ce.id), cu.name;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update job status when calendar event status changes
CREATE OR REPLACE FUNCTION sync_job_status_from_calendar() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.job_id IS NOT NULL AND NEW.event_status != OLD.event_status THEN
        UPDATE jobs 
        SET status = CASE
            WHEN NEW.event_status = 'scheduled' THEN 'scheduled'
            WHEN NEW.event_status = 'in_progress' THEN 'in_progress'
            WHEN NEW.event_status = 'completed' THEN 'completed'
            WHEN NEW.event_status = 'cancelled' THEN 'cancelled'
            ELSE status
        END
        WHERE id = NEW.job_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_job_status
    AFTER UPDATE ON calendar_events
    FOR EACH ROW
    WHEN (NEW.event_status IS DISTINCT FROM OLD.event_status)
    EXECUTE FUNCTION sync_job_status_from_calendar();

-- Create trigger to auto-create calendar events for new jobs
CREATE OR REPLACE FUNCTION auto_create_calendar_event_for_job() RETURNS TRIGGER AS $$
DECLARE
    v_event_id UUID;
BEGIN
    IF NEW.status = 'scheduled' THEN
        SELECT create_calendar_event_from_job(NEW.id) INTO v_event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_calendar_event
    AFTER INSERT ON jobs
    FOR EACH ROW
    WHEN (NEW.status = 'scheduled')
    EXECUTE FUNCTION auto_create_calendar_event_for_job();

-- Update timestamp triggers
CREATE TRIGGER trigger_update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_calendar_resources_updated_at
    BEFORE UPDATE ON calendar_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_calendar_views_updated_at
    BEFORE UPDATE ON calendar_views
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON calendar_attendees TO authenticated;
GRANT ALL ON calendar_resources TO authenticated;
GRANT ALL ON calendar_resource_bookings TO authenticated;
GRANT ALL ON calendar_views TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert sample resources
INSERT INTO calendar_resources (resource_name, resource_type, capacity, location) VALUES
('Lastbil 1', 'vehicle', 4, 'Stockholm'),
('Lastbil 2', 'vehicle', 4, 'Stockholm'),
('Skåpbil 1', 'vehicle', 2, 'Stockholm'),
('Konferensrum A', 'room', 10, 'Huvudkontor'),
('Konferensrum B', 'room', 6, 'Huvudkontor');

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Calendar system created successfully';
    RAISE NOTICE '📅 Tables created: calendar_events, calendar_attendees, calendar_resources, calendar_resource_bookings, calendar_views';
    RAISE NOTICE '🔧 Functions: check_calendar_conflicts, create_calendar_event_from_job, get_staff_availability';
    RAISE NOTICE '⚡ Auto-sync between jobs and calendar events';
    RAISE NOTICE '🔐 RLS policies applied for security';
END $$;