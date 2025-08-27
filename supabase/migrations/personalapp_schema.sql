-- PERSONALAPP DATABASE SCHEMA
-- Detta schema stöder alla personalapp API:er som skapats

-- =============================================
-- STAFF TIMEREPORTS TABELL
-- Används av /api/staff/checkin för in/utcheckning
-- =============================================
CREATE TABLE IF NOT EXISTS staff_timereports (
    id TEXT PRIMARY KEY DEFAULT 'tr-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    staff_name TEXT NOT NULL,
    job_id TEXT NOT NULL,
    job_info JSONB NOT NULL, -- Innehåller jobbdetaljer, kund, adress
    
    -- Check-in data
    checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checkin_coordinates JSONB NOT NULL, -- { lat, lng }
    checkin_photo TEXT, -- URL till foto
    checkin_notes TEXT,
    
    -- Check-out data
    checked_out BOOLEAN DEFAULT FALSE,
    checkout_time TIMESTAMPTZ,
    checkout_coordinates JSONB, -- { lat, lng }
    checkout_photo TEXT, -- URL till foto
    checkout_notes TEXT,
    
    -- Beräknade värden
    total_hours DECIMAL(4,2),
    total_minutes INTEGER,
    earnings DECIMAL(8,2), -- Beräknad ersättning
    
    -- Status och metadata
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    cancelled_by TEXT,
    cancel_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_timereports_staff_id ON staff_timereports(staff_id);
CREATE INDEX IF NOT EXISTS idx_timereports_job_id ON staff_timereports(job_id);
CREATE INDEX IF NOT EXISTS idx_timereports_date ON staff_timereports(DATE(checkin_time));
CREATE INDEX IF NOT EXISTS idx_timereports_status ON staff_timereports(status);

-- =============================================
-- STAFF MESSAGES TABELL
-- Används av /api/staff/chat för kommunikation
-- =============================================
CREATE TABLE IF NOT EXISTS staff_messages (
    id TEXT PRIMARY KEY DEFAULT 'msg-' || LPAD(nextval('message_seq')::TEXT, 6, '0'),
    channel_id TEXT NOT NULL,
    
    -- Avsändare
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    
    -- Meddelande innehåll
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'urgent', 'system')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::JSONB,
    
    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    read_by TEXT[] DEFAULT '{}', -- Array av staff IDs som läst meddelandet
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT,
    reply_to TEXT, -- ID av meddelande som detta svarar på
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skapa sequence för meddelande IDs
CREATE SEQUENCE IF NOT EXISTS message_seq START 1;

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_messages_channel ON staff_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON staff_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON staff_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON staff_messages USING GIN(read_by);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON staff_messages(deleted) WHERE deleted = FALSE;

-- =============================================
-- STAFF DEVIATIONS TABELL
-- Används av /api/staff/deviation för avvikelsehantering
-- =============================================
CREATE TABLE IF NOT EXISTS staff_deviations (
    id TEXT PRIMARY KEY DEFAULT 'DEV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('deviation_seq')::TEXT, 4, '0'),
    job_id TEXT NOT NULL,
    
    -- Rapportör
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    
    -- Avvikelse detaljer
    type TEXT NOT NULL CHECK (type IN (
        'volume_increase', 'no_elevator', 'access_problem', 'parking_issue',
        'customer_not_present', 'weather_delay', 'equipment_failure',
        'damage_found', 'extra_services', 'safety_concern'
    )),
    type_info JSONB NOT NULL, -- Innehåller detaljer om avvikelsetypen
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Dokumentation
    photos TEXT[] DEFAULT '{}', -- URLs till foton
    coordinates JSONB, -- GPS-position där avvikelsen rapporterades
    
    -- Påverkan
    estimated_delay INTEGER DEFAULT 0, -- Minuter
    estimated_cost DECIMAL(8,2) DEFAULT 0, -- SEK
    customer_informed BOOLEAN DEFAULT FALSE,
    urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    
    -- Status och godkännande
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'accepted', 'rejected', 'resolved')),
    automatic_actions TEXT[] DEFAULT '{}',
    
    -- Administrativ hantering
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    approved_cost DECIMAL(8,2),
    approved_delay INTEGER,
    admin_notes TEXT,
    
    -- Lösning
    resolved_at TIMESTAMPTZ,
    resolution TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skapa sequence för avvikelse IDs
CREATE SEQUENCE IF NOT EXISTS deviation_seq START 1;

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_deviations_job_id ON staff_deviations(job_id);
CREATE INDEX IF NOT EXISTS idx_deviations_staff_id ON staff_deviations(staff_id);
CREATE INDEX IF NOT EXISTS idx_deviations_status ON staff_deviations(status);
CREATE INDEX IF NOT EXISTS idx_deviations_urgency ON staff_deviations(urgency);
CREATE INDEX IF NOT EXISTS idx_deviations_type ON staff_deviations(type);
CREATE INDEX IF NOT EXISTS idx_deviations_date ON staff_deviations(DATE(reported_at));

-- =============================================
-- STAFF SCHEDULES TABELL
-- Används av /api/staff/schedule för schemahantering
-- =============================================
CREATE TABLE IF NOT EXISTS staff_schedules (
    id TEXT PRIMARY KEY DEFAULT 'sched-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    staff_id TEXT NOT NULL,
    date DATE NOT NULL,
    
    -- Arbetstider
    shift_start TIME,
    shift_end TIME,
    shift_type TEXT DEFAULT 'field' CHECK (shift_type IN ('office', 'field', 'off', 'sick', 'vacation')),
    
    -- Jobb för dagen
    jobs JSONB DEFAULT '[]'::JSONB, -- Array av jobb-objekt
    
    -- Statistik
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    estimated_hours DECIMAL(4,2) DEFAULT 0,
    
    -- Metadata
    created_by TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Förhindra dubbletter
    UNIQUE(staff_id, date)
);

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_schedules_staff_date ON staff_schedules(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON staff_schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_type ON staff_schedules(shift_type);

-- =============================================
-- STAFF NOTIFICATIONS TABELL
-- För push-notifieringar och systemmeddelanden
-- =============================================
CREATE TABLE IF NOT EXISTS staff_notifications (
    id TEXT PRIMARY KEY DEFAULT 'notif-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    staff_id TEXT NOT NULL,
    
    -- Notifiering innehåll
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'urgent', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Metadata
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Koppling till andra entiteter
    entity_type TEXT, -- 'job', 'deviation', 'schedule', etc.
    entity_id TEXT,
    
    -- Push-notifiering status
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_notifications_staff_id ON staff_notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON staff_notifications(staff_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON staff_notifications(type);

-- =============================================
-- STAFF LOCATIONS TABELL
-- För att spåra personalens position (för säkerhet och logistik)
-- =============================================
CREATE TABLE IF NOT EXISTS staff_locations (
    id TEXT PRIMARY KEY DEFAULT 'loc-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    staff_id TEXT NOT NULL,
    
    -- Position
    coordinates JSONB NOT NULL, -- { lat, lng, accuracy }
    address TEXT, -- Reverse-geocoded adress
    
    -- Kontext
    activity TEXT, -- 'checkin', 'checkout', 'transit', 'break', 'emergency'
    job_id TEXT,
    
    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    battery_level INTEGER, -- Batterinivå på enheten
    network_quality TEXT -- 'good', 'poor', 'offline'
);

-- Index för prestanda
CREATE INDEX IF NOT EXISTS idx_locations_staff_id ON staff_locations(staff_id);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON staff_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_locations_activity ON staff_locations(activity);
CREATE INDEX IF NOT EXISTS idx_locations_job_id ON staff_locations(job_id);

-- =============================================
-- RLS (Row Level Security) POLICIES
-- Säkerhet för personalapp-data
-- =============================================

-- Aktivera RLS för alla tabeller
ALTER TABLE staff_timereports ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_locations ENABLE ROW LEVEL SECURITY;

-- Policies för timereports
CREATE POLICY "Staff can view own timereports" ON staff_timereports
    FOR SELECT USING (staff_id = auth.uid()::TEXT);

CREATE POLICY "Staff can insert own timereports" ON staff_timereports
    FOR INSERT WITH CHECK (staff_id = auth.uid()::TEXT);

CREATE POLICY "Staff can update own timereports" ON staff_timereports
    FOR UPDATE USING (staff_id = auth.uid()::TEXT);

CREATE POLICY "Admins can view all timereports" ON staff_timereports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE id = auth.uid()::TEXT 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies för messages
CREATE POLICY "Staff can view channel messages" ON staff_messages
    FOR SELECT USING (
        channel_id = 'general' 
        OR (channel_id = 'dispatch' AND EXISTS (
            SELECT 1 FROM staff 
            WHERE id = auth.uid()::TEXT 
            AND role IN ('admin', 'manager', 'customer_service')
        ))
        OR (channel_id = 'management' AND EXISTS (
            SELECT 1 FROM staff 
            WHERE id = auth.uid()::TEXT 
            AND role IN ('admin', 'manager')
        ))
        OR channel_id = 'emergency'
    );

CREATE POLICY "Staff can send messages" ON staff_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid()::TEXT);

CREATE POLICY "Staff can edit own messages" ON staff_messages
    FOR UPDATE USING (
        sender_id = auth.uid()::TEXT 
        OR EXISTS (
            SELECT 1 FROM staff 
            WHERE id = auth.uid()::TEXT 
            AND role = 'admin'
        )
    );

-- Policies för deviations
CREATE POLICY "Staff can view own deviations" ON staff_deviations
    FOR SELECT USING (staff_id = auth.uid()::TEXT);

CREATE POLICY "Staff can create deviations" ON staff_deviations
    FOR INSERT WITH CHECK (staff_id = auth.uid()::TEXT);

CREATE POLICY "Admins can view all deviations" ON staff_deviations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE id = auth.uid()::TEXT 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies för schedules
CREATE POLICY "Staff can view own schedule" ON staff_schedules
    FOR SELECT USING (staff_id = auth.uid()::TEXT);

CREATE POLICY "Admins can manage all schedules" ON staff_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE id = auth.uid()::TEXT 
            AND role IN ('admin', 'manager')
        )
    );

-- Policies för notifications
CREATE POLICY "Staff can view own notifications" ON staff_notifications
    FOR SELECT USING (staff_id = auth.uid()::TEXT);

CREATE POLICY "Staff can update own notifications" ON staff_notifications
    FOR UPDATE USING (staff_id = auth.uid()::TEXT);

-- Policies för locations
CREATE POLICY "Staff can insert own location" ON staff_locations
    FOR INSERT WITH CHECK (staff_id = auth.uid()::TEXT);

CREATE POLICY "Admins can view all locations" ON staff_locations
    FOR SELECT USING (
        staff_id = auth.uid()::TEXT
        OR EXISTS (
            SELECT 1 FROM staff 
            WHERE id = auth.uid()::TEXT 
            AND role IN ('admin', 'manager')
        )
    );

-- =============================================
-- TRIGGERS FÖR AUTOMATISKA UPPDATERINGAR
-- =============================================

-- Funktion för att uppdatera updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers för updated_at
CREATE TRIGGER update_timereports_updated_at BEFORE UPDATE ON staff_timereports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON staff_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deviations_updated_at BEFORE UPDATE ON staff_deviations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON staff_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FÖR RAPPORTER OCH STATISTIK
-- =============================================

-- Daglig statistik för personal
CREATE OR REPLACE VIEW daily_staff_stats AS
SELECT 
    staff_id,
    DATE(checkin_time) as work_date,
    COUNT(*) as total_jobs,
    SUM(total_hours) as total_hours,
    SUM(earnings) as total_earnings,
    MIN(checkin_time) as first_checkin,
    MAX(checkout_time) as last_checkout
FROM staff_timereports 
WHERE checked_out = TRUE
GROUP BY staff_id, DATE(checkin_time);

-- Avvikelsestatistik
CREATE OR REPLACE VIEW deviation_summary AS
SELECT 
    type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    AVG(estimated_cost) as avg_cost,
    AVG(estimated_delay) as avg_delay,
    COUNT(*) FILTER (WHERE urgency = 'critical') as critical_count
FROM staff_deviations
GROUP BY type;

-- Olästa meddelanden per personal
CREATE OR REPLACE VIEW unread_messages AS
SELECT 
    s.id as staff_id,
    s.name as staff_name,
    COUNT(m.*) as unread_count
FROM staff s
CROSS JOIN staff_messages m
WHERE NOT (s.id = ANY(m.read_by)) 
    AND m.deleted = FALSE
GROUP BY s.id, s.name;

-- =============================================
-- KOMMENTARER OCH DOKUMENTATION
-- =============================================

COMMENT ON TABLE staff_timereports IS 'Lagrar in- och utcheckningstider med GPS-validering';
COMMENT ON TABLE staff_messages IS 'Chat-system för kommunikation mellan personal och kontor';
COMMENT ON TABLE staff_deviations IS 'Avvikelsehantering för rapportering av problem under jobb';
COMMENT ON TABLE staff_schedules IS 'Schemaläggning för personalens arbetspass och jobb';
COMMENT ON TABLE staff_notifications IS 'Push-notifieringar och systemmeddelanden';
COMMENT ON TABLE staff_locations IS 'GPS-tracking för säkerhet och logistik';

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Lägg till exempel-kanaler för chat
INSERT INTO staff_messages (id, channel_id, sender_id, sender_name, sender_role, message_type, content, read_by)
VALUES 
    ('msg-000001', 'general', 'system', 'System', 'system', 'system', 'Personalappen är nu aktiv! Välkomna alla.', '{}'),
    ('msg-000002', 'dispatch', 'system', 'System', 'system', 'system', 'Kundtjänst-kanalen är redo för kommunikation.', '{}')
ON CONFLICT (id) DO NOTHING;

-- Schema skapat successfully!
-- Använd detta schema med Supabase för att aktivera alla personalapp API:er.