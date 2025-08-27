-- Employee module database schema for complete HR lifecycle
-- This migration creates all tables needed for the employee module

-- Enhanced employee table with HR data
CREATE TABLE IF NOT EXISTS anstallda_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  hire_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  address TEXT,
  emergency_contact TEXT,
  
  -- Contract information
  contract_status TEXT DEFAULT 'draft' CHECK (contract_status IN ('draft', 'sent', 'signed', 'expired', 'rejected')),
  contract_signed_date DATE,
  contract_expiry_date DATE,
  contract_version TEXT,
  
  -- Personal code for vehicle access
  personal_code TEXT UNIQUE,
  
  -- Metadata
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_anstallda_extended_email ON anstallda_extended(email);
CREATE INDEX IF NOT EXISTS idx_anstallda_extended_status ON anstallda_extended(status);
CREATE INDEX IF NOT EXISTS idx_anstallda_extended_department ON anstallda_extended(department);
CREATE INDEX IF NOT EXISTS idx_anstallda_extended_contract_status ON anstallda_extended(contract_status);

-- Contracts table
CREATE TABLE IF NOT EXISTS personal_avtal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES anstallda_extended(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('flyttare', 'städare', 'chaufför', 'kundtjänst', 'ledning')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired', 'rejected')),
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sent_date DATE,
  signed_date DATE,
  expiry_date DATE,
  contract_version TEXT NOT NULL,
  signature_method TEXT NOT NULL DEFAULT 'bankid' CHECK (signature_method IN ('bankid', 'oneflow', 'physical')),
  pdf_url TEXT,
  signed_by TEXT,
  witness_name TEXT,
  witness_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_avtal_employee_id ON personal_avtal(employee_id);
CREATE INDEX IF NOT EXISTS idx_personal_avtal_status ON personal_avtal(status);

-- Assets table
CREATE TABLE IF NOT EXISTS personal_tillgangar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES anstallda_extended(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('klader', 'utrustning', 'fordon')),
  type TEXT NOT NULL,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'utdelat' CHECK (status IN ('utdelat', 'returnerat', 'forlorat', 'skadat')),
  condition TEXT NOT NULL DEFAULT 'nytt' CHECK (condition IN ('nytt', 'bra', 'slit', 'dåligt')),
  cost DECIMAL(10,2),
  supplier TEXT,
  warranty_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_tillgangar_employee_id ON personal_tillgangar(employee_id);
CREATE INDEX IF NOT EXISTS idx_personal_tillgangar_status ON personal_tillgangar(status);
CREATE INDEX IF NOT EXISTS idx_personal_tillgangar_category ON personal_tillgangar(category);

-- Vehicle table
CREATE TABLE IF NOT EXISTS fordon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('van', 'truck', 'car', 'trailer')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
  current_location TEXT,
  mileage INTEGER NOT NULL DEFAULT 0,
  fuel_level INTEGER CHECK (fuel_level >= 0 AND fuel_level <= 100),
  last_service DATE,
  next_service DATE,
  insurance_expiry DATE NOT NULL,
  inspection_expiry DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fordon_registration_number ON fordon(registration_number);
CREATE INDEX IF NOT EXISTS idx_fordon_status ON fordon(status);
CREATE INDEX IF NOT EXISTS idx_fordon_type ON fordon(type);

-- Vehicle access table
CREATE TABLE IF NOT EXISTS fordon_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES fordon(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES anstallda_extended(id) ON DELETE CASCADE,
  personal_code TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'basic' CHECK (access_level IN ('basic', 'advanced', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  granted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  revoked_date DATE,
  revoked_by TEXT,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fordon_access_vehicle_id ON fordon_access(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fordon_access_employee_id ON fordon_access(employee_id);
CREATE INDEX IF NOT EXISTS idx_fordon_access_personal_code ON fordon_access(personal_code);
CREATE INDEX IF NOT EXISTS idx_fordon_access_is_active ON fordon_access(is_active);

-- Access logs table
CREATE TABLE IF NOT EXISTS fordon_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES fordon(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES anstallda_extended(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('unlock', 'lock', 'start', 'stop', 'emergency')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  location TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fordon_access_logs_vehicle_id ON fordon_access_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fordon_access_logs_employee_id ON fordon_access_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_fordon_access_logs_timestamp ON fordon_access_logs(timestamp);

-- Onboarding templates table
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  total_estimated_time INTEGER NOT NULL DEFAULT 0, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_templates_role ON onboarding_templates(role);
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_department ON onboarding_templates(department);
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_is_active ON onboarding_templates(is_active);

-- Onboarding template steps table
CREATE TABLE IF NOT EXISTS onboarding_template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('documentation', 'assets', 'access', 'training', 'setup')),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL,
  estimated_time INTEGER NOT NULL DEFAULT 0, -- in minutes
  instructions TEXT,
  checklist JSONB, -- Array of checklist items
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_template_steps_template_id ON onboarding_template_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_template_steps_category ON onboarding_template_steps(category);
CREATE INDEX IF NOT EXISTS idx_onboarding_template_steps_order ON onboarding_template_steps(order_index);

-- Onboarding processes table
CREATE TABLE IF NOT EXISTS onboarding_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES anstallda_extended(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,
  actual_completion_date DATE,
  assigned_mentor TEXT,
  mentor_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_processes_employee_id ON onboarding_processes(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_processes_template_id ON onboarding_processes(template_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_processes_status ON onboarding_processes(status);

-- Onboarding process steps table
CREATE TABLE IF NOT EXISTS onboarding_process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES onboarding_processes(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('documentation', 'assets', 'access', 'training', 'setup')),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL,
  estimated_time INTEGER NOT NULL DEFAULT 0, -- in minutes
  instructions TEXT,
  checklist JSONB, -- Array of checklist items
  assigned_to TEXT,
  due_date DATE,
  completed_date DATE,
  completed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(process_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_process_steps_process_id ON onboarding_process_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_process_steps_category ON onboarding_process_steps(category);
CREATE INDEX IF NOT EXISTS idx_onboarding_process_steps_completed_date ON onboarding_process_steps(completed_date);

-- Employee documents table
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES anstallda_extended(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('id', 'certificate', 'license', 'other')),
  file_url TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by TEXT,
  verified_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(type);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiry_date ON employee_documents(expiry_date);

-- Asset types table for standardization
CREATE TABLE IF NOT EXISTS asset_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('klader', 'utrustning', 'fordon')),
  sizes JSONB, -- Array of available sizes
  standard_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  supplier TEXT,
  warranty_months INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_types_category ON asset_types(category);
CREATE INDEX IF NOT EXISTS idx_asset_types_is_active ON asset_types(is_active);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES anstallda_extended(id) ON DELETE CASCADE,
  total_jobs_completed INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  customer_feedback_score INTEGER NOT NULL DEFAULT 0 CHECK (customer_feedback_score >= 0 AND customer_feedback_score <= 100),
  last_performance_review DATE,
  next_performance_review DATE,
  goals JSONB, -- Array of performance goals
  achievements JSONB, -- Array of achievements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_performance_employee_id ON employee_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_average_rating ON employee_performance(average_rating);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_anstallda_extended_updated_at BEFORE UPDATE ON anstallda_extended FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_avtal_updated_at BEFORE UPDATE ON personal_avtal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_tillgangar_updated_at BEFORE UPDATE ON personal_tillgangar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fordon_updated_at BEFORE UPDATE ON fordon FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fordon_access_updated_at BEFORE UPDATE ON fordon_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_templates_updated_at BEFORE UPDATE ON onboarding_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_template_steps_updated_at BEFORE UPDATE ON onboarding_template_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_processes_updated_at BEFORE UPDATE ON onboarding_processes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_process_steps_updated_at BEFORE UPDATE ON onboarding_process_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_types_updated_at BEFORE UPDATE ON asset_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_performance_updated_at BEFORE UPDATE ON employee_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default asset types
INSERT INTO asset_types (id, name, category, sizes, standard_cost, description, supplier, warranty_months) VALUES
('tshirt', 'Nordflytt T-shirt', 'klader', '["XS", "S", "M", "L", "XL", "XXL"]', 249.00, 'Officiell Nordflytt T-shirt med logotyp', 'Profilprodukter AB', 6),
('jacket', 'Arbetsjacka', 'klader', '["XS", "S", "M", "L", "XL", "XXL"]', 899.00, 'Vattentät arbetsjacka med reflex', 'Workwear Nordic', 12),
('pants', 'Arbetsbyxor', 'klader', '["46", "48", "50", "52", "54", "56", "58", "60"]', 699.00, 'Förstärkta arbetsbyxor med knäskydd', 'Workwear Nordic', 12),
('shoes', 'Säkerhetsskor', 'klader', '["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"]', 1299.00, 'S3-klassade säkerhetsskor med stålhätta', 'Safety First AB', 12),
('gloves', 'Arbetshandskar', 'klader', '["S", "M", "L", "XL"]', 149.00, 'Greppvänliga arbetshandskar', 'Safety First AB', 3),
('lifting_belt', 'Lyftbälte', 'utrustning', '["S", "M", "L", "XL"]', 899.00, 'Ergonomiskt lyftbälte för tunga lyft', 'Ergonomic Tools', 24),
('trolley', 'Transportkärra', 'utrustning', NULL, 1899.00, 'Professionell transportkärra, 200kg', 'Moving Equipment AB', 24),
('straps', 'Spännband', 'utrustning', NULL, 199.00, 'Spännband för säker transport', 'Transport Safety', 12),
('blankets', 'Flyttfilt', 'utrustning', NULL, 299.00, 'Skyddande flyttfilt för möbler', 'Moving Equipment AB', 6),
('tools', 'Verktygsset', 'utrustning', NULL, 1499.00, 'Komplett verktygsset för montering', 'Professional Tools', 36);

-- Insert default onboarding templates
INSERT INTO onboarding_templates (id, name, description, role, department, total_estimated_time) VALUES
('template-admin', 'Administratör Onboarding', 'Komplett onboarding för administrativa roller', 'admin', 'Ledning', 585),
('template-mover', 'Flyttare Onboarding', 'Onboarding för flyttpersonal med fokus på säkerhet', 'mover', 'Flyttteam', 450),
('template-driver', 'Chaufför Onboarding', 'Onboarding för chaufförer med fordonsaccess', 'driver', 'Transport', 585),
('template-customer-service', 'Kundtjänst Onboarding', 'Onboarding för kundtjänstpersonal', 'customer_service', 'Kundtjänst', 450);

-- Insert default onboarding steps for admin template
INSERT INTO onboarding_template_steps (template_id, step_id, name, description, category, required, order_index, estimated_time, instructions, checklist) VALUES
('template-admin', 'welcome', 'Välkomstmöte', 'Första intryck och introduktion till företaget', 'setup', true, 1, 60, 'Genomför välkomstmöte med ny anställd. Gå igenom företagskultur, värderingar och förväntningar.', '["Välkomna och introducera sig själv", "Gå igenom företagshistoria och värderingar", "Förklara organisationsstruktur", "Presentera kollegor och team", "Ge överblick över första dagen/veckan"]'),
('template-admin', 'contract', 'Avtal signerat', 'Anställningsavtal digitalt signerat', 'documentation', true, 2, 15, 'Skicka anställningsavtal för digital signering via BankID eller Oneflow.', '["Avtal skapat och granskat", "Skickat till anställd för signering", "Signerat av båda parter", "Arkiverat i personalsystem"]'),
('template-admin', 'documents', 'Dokument insamlade', 'Alla nödvändiga dokument insamlade och verifierade', 'documentation', true, 3, 30, 'Samla in och verifiera alla nödvändiga dokument från den anställde.', '["Giltig legitimation (ID/pass)", "Körkort (om relevant för rollen)", "Utbildningscertifikat", "Tidigare arbetsgivarintyg", "Skatteverket blankett"]'),
('template-admin', 'assets', 'Arbetskläder utdelade', 'Alla nödvändiga arbetskläder och utrustning utdelade', 'assets', true, 4, 45, 'Dela ut arbetskläder och utrustning baserat på roll och storlek.', '["Storlek uppmätt och dokumenterad", "T-shirts och jackor utdelade", "Arbetsbyxor och skor", "Säkerhetsutrustning", "Kvitto undertecknat"]'),
('template-admin', 'vehicle', 'Fordonsaccess given', 'Personlig kod genererad och fordonsaccess konfigurerad', 'access', false, 5, 20, 'Generera personlig kod och konfigurera fordonsaccess baserat på roll.', '["Personlig kod genererad", "Fordonsaccess konfigurerad", "Säkerhetsinstruktioner givna", "Testaccess genomförd", "Loggar verifierade"]'),
('template-admin', 'app', 'Personalapp-inlogg', 'Inlogg till personalapp skapat och testat', 'setup', true, 6, 30, 'Skapa inloggningsuppgifter till personalapp och genomför grundläggande träning.', '["Användaruppgifter skapade", "Första inloggning genomförd", "Grundläggande funktioner visade", "Testorder genomförd", "Support-kontakter delgivna"]'),
('template-admin', 'safety', 'Säkerhetsutbildning', 'Genomgång av säkerhetsrutiner och arbetsmiljöregler', 'training', true, 7, 90, 'Genomför säkerhetsutbildning anpassad för roll och arbetsplats.', '["Arbetsmiljöregler genomgångna", "Säkerhetsutrustning demonstrerad", "Nödsituationer och rutiner", "Rapportering av tillbud", "Säkerhetstest genomfört"]'),
('template-admin', 'mentor', 'Mentor tilldelad', 'Mentor tilldelad för första månaden', 'setup', true, 8, 15, 'Tilldela erfaren kollega som mentor för den nya anställde.', '["Mentor identifierad och tillfrågad", "Första möte schemalagt", "Kontaktuppgifter utbytta", "Förväntningar tydliggjorda", "Uppföljningsschema bestämt"]'),
('template-admin', 'training', 'Rollspecifik utbildning', 'Utbildning specifik för den anställdes roll', 'training', true, 9, 240, 'Genomför rollspecifik utbildning anpassad för den anställdes arbetsuppgifter.', '["Arbetsprocesser genomgångna", "Verktyg och system tränade", "Kvalitetsstandarder förklarade", "Praktiska övningar genomförda", "Kompetenstest godkänt"]'),
('template-admin', 'evaluation', 'Första utvärdering', 'Utvärdering av första veckan och feedback', 'setup', true, 10, 60, 'Genomför utvärdering av första veckan och samla feedback.', '["Utvärderingsmöte genomfört", "Feedback från anställd samlad", "Eventuella problem identifierade", "Handlingsplan för fortsättning", "Nästa uppföljning schemalagd"]');

-- Create views for easier querying
CREATE OR REPLACE VIEW employee_overview AS
SELECT 
    e.*,
    COALESCE(perf.total_jobs_completed, 0) as total_jobs_completed,
    COALESCE(perf.average_rating, 0) as average_rating,
    COALESCE(perf.customer_feedback_score, 0) as customer_feedback_score,
    (SELECT COUNT(*) FROM personal_tillgangar WHERE employee_id = e.id) as total_assets,
    (SELECT COUNT(*) FROM personal_tillgangar WHERE employee_id = e.id AND status = 'utdelat') as active_assets,
    (SELECT COUNT(*) FROM personal_tillgangar WHERE employee_id = e.id AND status = 'returnerat') as returned_assets,
    (SELECT COUNT(*) FROM personal_tillgangar WHERE employee_id = e.id AND status = 'forlorat') as lost_assets,
    (SELECT COUNT(*) > 0 FROM fordon_access WHERE employee_id = e.id AND is_active = true) as has_vehicle_access,
    (SELECT access_level FROM fordon_access WHERE employee_id = e.id AND is_active = true LIMIT 1) as vehicle_access_level
FROM anstallda_extended e
LEFT JOIN employee_performance perf ON e.id = perf.employee_id;

-- Create RLS policies (Row Level Security)
ALTER TABLE anstallda_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_avtal ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tillgangar ENABLE ROW LEVEL SECURITY;
ALTER TABLE fordon ENABLE ROW LEVEL SECURITY;
ALTER TABLE fordon_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE fordon_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;

-- Basic policies for authenticated users (adjust based on your auth system)
CREATE POLICY "Allow authenticated users to view all employees" ON anstallda_extended FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert employees" ON anstallda_extended FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update employees" ON anstallda_extended FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete employees" ON anstallda_extended FOR DELETE TO authenticated USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users full access to contracts" ON personal_avtal FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to assets" ON personal_tillgangar FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to vehicles" ON fordon FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to vehicle access" ON fordon_access FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to access logs" ON fordon_access_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to onboarding templates" ON onboarding_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to onboarding template steps" ON onboarding_template_steps FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to onboarding processes" ON onboarding_processes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to onboarding process steps" ON onboarding_process_steps FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to employee documents" ON employee_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to view asset types" ON asset_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to employee performance" ON employee_performance FOR ALL TO authenticated USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;