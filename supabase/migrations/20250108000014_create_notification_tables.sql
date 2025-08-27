-- Create notification tables

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    template_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'booking_confirmation', 'invoice_reminder'
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Email content
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT, -- Plain text version
    
    -- Template variables (JSON array of expected variables)
    variables JSONB DEFAULT '[]',
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES crm_users(id),
    updated_by UUID REFERENCES crm_users(id)
);

-- SMS templates table
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    template_key VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- SMS content
    message_text TEXT NOT NULL,
    
    -- Template variables
    variables JSONB DEFAULT '[]',
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    max_length INTEGER DEFAULT 160,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES crm_users(id),
    updated_by UUID REFERENCES crm_users(id)
);

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Notification details
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('email', 'sms', 'push')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest, 10 = lowest
    
    -- Recipient information
    recipient_type VARCHAR(50) NOT NULL, -- customer, employee, admin
    recipient_id VARCHAR(100), -- ID of the recipient entity
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_name VARCHAR(255),
    
    -- Content
    template_id UUID,
    subject VARCHAR(500), -- For emails
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Template variables
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Processing information
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Provider information
    provider VARCHAR(50), -- sendgrid, twilio, etc.
    provider_message_id VARCHAR(255), -- External provider's message ID
    provider_response JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES crm_users(id),
    
    -- Indexes
    CONSTRAINT template_type_check CHECK (
        (notification_type = 'email' AND template_id IS NULL) OR
        (notification_type = 'email' AND EXISTS (SELECT 1 FROM email_templates WHERE id = template_id)) OR
        (notification_type = 'sms' AND template_id IS NULL) OR
        (notification_type = 'sms' AND EXISTS (SELECT 1 FROM sms_templates WHERE id = template_id)) OR
        (notification_type = 'push')
    )
);

-- Notification log table (for sent notifications)
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID REFERENCES notification_queue(id),
    
    -- Notification details
    notification_type VARCHAR(20) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    subject VARCHAR(500),
    content TEXT,
    
    -- Status
    status VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Provider info
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    provider_cost DECIMAL(10,4), -- Cost in SEK
    
    -- Tracking
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    bounce_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entity reference
    entity_type VARCHAR(50) NOT NULL, -- customer, employee
    entity_id VARCHAR(100) NOT NULL,
    
    -- Email preferences
    email_enabled BOOLEAN DEFAULT true,
    email_booking_confirmations BOOLEAN DEFAULT true,
    email_invoice_reminders BOOLEAN DEFAULT true,
    email_job_updates BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    
    -- SMS preferences
    sms_enabled BOOLEAN DEFAULT true,
    sms_booking_confirmations BOOLEAN DEFAULT true,
    sms_job_reminders BOOLEAN DEFAULT true,
    sms_urgent_updates BOOLEAN DEFAULT true,
    sms_marketing BOOLEAN DEFAULT false,
    
    -- Push preferences
    push_enabled BOOLEAN DEFAULT false,
    push_token VARCHAR(500),
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(entity_type, entity_id)
);

-- Create indexes
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_recipient ON notification_queue(recipient_type, recipient_id);
CREATE INDEX idx_notification_log_queue ON notification_log(queue_id);
CREATE INDEX idx_notification_log_sent ON notification_log(sent_at);
CREATE INDEX idx_notification_preferences_entity ON notification_preferences(entity_type, entity_id);

-- Insert default email templates
INSERT INTO email_templates (template_key, template_name, subject, body_html, body_text, variables) VALUES
(
    'booking_confirmation',
    'Bokningsbekräftelse',
    'Bekräftelse på din flyttbokning - {{bookingDate}}',
    '<h2>Tack för din bokning!</h2><p>Hej {{customerName}},</p><p>Vi bekräftar härmed din flyttbokning för <strong>{{bookingDate}}</strong>.</p><p><strong>Detaljer:</strong><br>Från: {{fromAddress}}<br>Till: {{toAddress}}<br>Tjänst: {{serviceType}}<br>Uppskattad tid: {{estimatedTime}}</p><p>Vi kommer att kontakta dig inom kort för att bekräfta alla detaljer.</p><p>Med vänlig hälsning,<br>Nordflytt</p>',
    'Tack för din bokning!\n\nHej {{customerName}},\n\nVi bekräftar härmed din flyttbokning för {{bookingDate}}.\n\nDetaljer:\nFrån: {{fromAddress}}\nTill: {{toAddress}}\nTjänst: {{serviceType}}\nUppskattad tid: {{estimatedTime}}\n\nVi kommer att kontakta dig inom kort för att bekräfta alla detaljer.\n\nMed vänlig hälsning,\nNordflytt',
    '["customerName", "bookingDate", "fromAddress", "toAddress", "serviceType", "estimatedTime"]'
),
(
    'invoice_created',
    'Ny faktura',
    'Faktura {{invoiceNumber}} från Nordflytt',
    '<h2>Ny faktura</h2><p>Hej {{customerName}},</p><p>Din faktura för flyttjänsten är nu tillgänglig.</p><p><strong>Fakturadetaljer:</strong><br>Fakturanummer: {{invoiceNumber}}<br>Belopp: {{amount}} kr<br>Förfallodatum: {{dueDate}}</p><p>Du kan betala fakturan via bifogad länk eller genom att logga in på vår hemsida.</p><p>Med vänlig hälsning,<br>Nordflytt</p>',
    'Ny faktura\n\nHej {{customerName}},\n\nDin faktura för flyttjänsten är nu tillgänglig.\n\nFakturadetaljer:\nFakturanummer: {{invoiceNumber}}\nBelopp: {{amount}} kr\nFörfallodatum: {{dueDate}}\n\nDu kan betala fakturan via bifogad länk eller genom att logga in på vår hemsida.\n\nMed vänlig hälsning,\nNordflytt',
    '["customerName", "invoiceNumber", "amount", "dueDate"]'
),
(
    'job_reminder',
    'Påminnelse om flytt',
    'Påminnelse: Flytt imorgon {{jobDate}}',
    '<h2>Påminnelse om din flytt</h2><p>Hej {{customerName}},</p><p>Detta är en påminnelse om att din flytt är planerad till <strong>imorgon {{jobDate}} kl {{jobTime}}</strong>.</p><p><strong>Viktigt att komma ihåg:</strong><ul><li>Se till att allt är packat och klart</li><li>Märk ömtåliga lådor tydligt</li><li>Ha nycklar tillgängliga</li><li>Informera grannarna om flyttdagen</li></ul></p><p>Vårt team kommer att ringa dig 30 minuter innan ankomst.</p><p>Med vänlig hälsning,<br>Nordflytt</p>',
    'Påminnelse om din flytt\n\nHej {{customerName}},\n\nDetta är en påminnelse om att din flytt är planerad till imorgon {{jobDate}} kl {{jobTime}}.\n\nViktigt att komma ihåg:\n- Se till att allt är packat och klart\n- Märk ömtåliga lådor tydligt\n- Ha nycklar tillgängliga\n- Informera grannarna om flyttdagen\n\nVårt team kommer att ringa dig 30 minuter innan ankomst.\n\nMed vänlig hälsning,\nNordflytt',
    '["customerName", "jobDate", "jobTime"]'
);

-- Insert default SMS templates
INSERT INTO sms_templates (template_key, template_name, message_text, variables) VALUES
(
    'booking_confirmation_sms',
    'Bokningsbekräftelse SMS',
    'Tack för din bokning! Vi bekräftar din flytt {{bookingDate}}. Vi kontaktar dig snart. Mvh Nordflytt',
    '["bookingDate"]'
),
(
    'job_reminder_sms',
    'Jobbpåminnelse SMS',
    'Påminnelse: Din flytt är imorgon {{jobDate}} kl {{jobTime}}. Ring oss på 08-123456 om du har frågor. Mvh Nordflytt',
    '["jobDate", "jobTime"]'
),
(
    'team_arrival_sms',
    'Team på väg SMS',
    'Vårt flytteam är nu på väg och beräknas vara framme om ca {{eta}} minuter. Mvh Nordflytt',
    '["eta"]'
);

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
    p_type VARCHAR,
    p_recipient_type VARCHAR,
    p_recipient_id VARCHAR,
    p_template_key VARCHAR,
    p_variables JSONB,
    p_priority INTEGER DEFAULT 5,
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_template_id UUID;
    v_recipient_email VARCHAR;
    v_recipient_phone VARCHAR;
    v_recipient_name VARCHAR;
    v_subject VARCHAR;
    v_content TEXT;
    v_queue_id UUID;
BEGIN
    -- Get recipient information based on type
    IF p_recipient_type = 'customer' THEN
        SELECT email, phone, COALESCE(company_name, contact_name)
        INTO v_recipient_email, v_recipient_phone, v_recipient_name
        FROM crm_customers
        WHERE customer_id = p_recipient_id;
    ELSIF p_recipient_type = 'employee' THEN
        SELECT email, phone, name
        INTO v_recipient_email, v_recipient_phone, v_recipient_name
        FROM crm_users
        WHERE id::text = p_recipient_id;
    END IF;
    
    -- Get template
    IF p_type = 'email' THEN
        SELECT id, subject, body_html
        INTO v_template_id, v_subject, v_content
        FROM email_templates
        WHERE template_key = p_template_key AND is_active = true;
    ELSIF p_type = 'sms' THEN
        SELECT id, NULL, message_text
        INTO v_template_id, v_subject, v_content
        FROM sms_templates
        WHERE template_key = p_template_key AND is_active = true;
    END IF;
    
    -- Replace variables in content
    FOR key, value IN SELECT * FROM jsonb_each_text(p_variables) LOOP
        v_subject := REPLACE(v_subject, '{{' || key || '}}', value);
        v_content := REPLACE(v_content, '{{' || key || '}}', value);
    END LOOP;
    
    -- Insert into queue
    INSERT INTO notification_queue (
        notification_type,
        recipient_type,
        recipient_id,
        recipient_email,
        recipient_phone,
        recipient_name,
        template_id,
        subject,
        content,
        variables,
        priority,
        scheduled_for
    ) VALUES (
        p_type,
        p_recipient_type,
        p_recipient_id,
        v_recipient_email,
        v_recipient_phone,
        v_recipient_name,
        v_template_id,
        v_subject,
        v_content,
        p_variables,
        p_priority,
        COALESCE(p_scheduled_for, CURRENT_TIMESTAMP)
    ) RETURNING id INTO v_queue_id;
    
    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Email/SMS templates - admins only
CREATE POLICY "Admins can manage templates"
    ON email_templates FOR ALL
    USING (EXISTS (SELECT 1 FROM crm_users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage SMS templates"
    ON sms_templates FOR ALL
    USING (EXISTS (SELECT 1 FROM crm_users WHERE id = auth.uid() AND role = 'admin'));

-- Notification queue - authenticated users can view their own
CREATE POLICY "Users can view their notifications"
    ON notification_queue FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            recipient_id = auth.uid()::text OR
            EXISTS (SELECT 1 FROM crm_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
        )
    );

CREATE POLICY "System can manage notification queue"
    ON notification_queue FOR ALL
    USING (auth.role() = 'service_role');

-- Notification preferences - users manage their own
CREATE POLICY "Users can manage their preferences"
    ON notification_preferences FOR ALL
    USING (
        auth.role() = 'authenticated' AND 
        entity_id = auth.uid()::text
    );

-- Grant permissions
GRANT SELECT ON email_templates TO authenticated;
GRANT SELECT ON sms_templates TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;
GRANT SELECT ON notification_log TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;