-- Setup för tilläggstjänster i Staff App
-- Kör denna SQL i Supabase Dashboard

-- 1. Skapa tabell för tilläggstjänster
CREATE TABLE IF NOT EXISTS job_additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  service_id VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  service_category VARCHAR(100),
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(50), -- 'per låda', 'per timme', 'per meter', etc
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  rut_eligible BOOLEAN DEFAULT true,
  added_by VARCHAR(255),
  added_at TIMESTAMP DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Lägg till kolumner i jobs-tabellen
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS added_services_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_adjustments JSONB DEFAULT '[]';

-- 3. Skapa indexes för performance
CREATE INDEX IF NOT EXISTS idx_job_additional_services_job_id ON job_additional_services(job_id);
CREATE INDEX IF NOT EXISTS idx_job_additional_services_created_at ON job_additional_services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_additional_services_category ON job_additional_services(service_category);

-- 4. Skapa en view för enkel åtkomst
CREATE OR REPLACE VIEW job_services_summary AS
SELECT 
  j.id as job_id,
  j.customer_name,
  j.service_type,
  j.original_price,
  COALESCE(SUM(jas.total_price), 0) as additional_services_total,
  j.original_price + COALESCE(SUM(jas.total_price), 0) as total_price,
  COUNT(jas.id) as additional_services_count,
  ARRAY_AGG(
    CASE WHEN jas.id IS NOT NULL THEN
      json_build_object(
        'id', jas.id,
        'service_name', jas.service_name,
        'quantity', jas.quantity,
        'total_price', jas.total_price
      )
    END
  ) FILTER (WHERE jas.id IS NOT NULL) as services_list
FROM jobs j
LEFT JOIN job_additional_services jas ON j.id = jas.job_id
GROUP BY j.id;

-- 5. Trigger för att uppdatera jobs-tabellen när tjänster läggs till
CREATE OR REPLACE FUNCTION update_job_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Uppdatera totalsumman för tilläggstjänster
  UPDATE jobs
  SET 
    added_services_total = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM job_additional_services
      WHERE job_id = COALESCE(NEW.job_id, OLD.job_id)
    ),
    final_price = original_price + (
      SELECT COALESCE(SUM(total_price), 0)
      FROM job_additional_services
      WHERE job_id = COALESCE(NEW.job_id, OLD.job_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Aktivera trigger
CREATE TRIGGER update_job_totals_on_service_change
AFTER INSERT OR UPDATE OR DELETE ON job_additional_services
FOR EACH ROW
EXECUTE FUNCTION update_job_totals();

-- 7. Sätt upp Row Level Security (RLS)
ALTER TABLE job_additional_services ENABLE ROW LEVEL SECURITY;

-- Policy för att läsa (alla inloggade användare)
CREATE POLICY "Authenticated users can read job services" ON job_additional_services
  FOR SELECT
  USING (true);

-- Policy för att skapa/uppdatera (endast staff)
CREATE POLICY "Staff can manage job services" ON job_additional_services
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Aktivera realtime för ändringar
ALTER TABLE job_additional_services REPLICA IDENTITY FULL;

-- 9. Skapa en funktion för att lägga till tjänster (optional)
CREATE OR REPLACE FUNCTION add_job_service(
  p_job_id UUID,
  p_service_id VARCHAR(100),
  p_service_name VARCHAR(255),
  p_service_category VARCHAR(100),
  p_quantity INTEGER,
  p_unit VARCHAR(50),
  p_unit_price DECIMAL(10,2),
  p_added_by VARCHAR(255),
  p_photo_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS job_additional_services AS $$
DECLARE
  v_result job_additional_services;
BEGIN
  INSERT INTO job_additional_services (
    job_id,
    service_id,
    service_name,
    service_category,
    quantity,
    unit,
    unit_price,
    total_price,
    added_by,
    photo_url,
    notes
  ) VALUES (
    p_job_id,
    p_service_id,
    p_service_name,
    p_service_category,
    p_quantity,
    p_unit,
    p_unit_price,
    p_unit_price * p_quantity,
    p_added_by,
    p_photo_url,
    p_notes
  )
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Test att allt fungerar
SELECT 'Databastabeller för tilläggstjänster skapade!' as status;