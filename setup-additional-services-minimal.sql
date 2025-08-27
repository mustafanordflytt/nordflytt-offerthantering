-- Setup för tilläggstjänster i Staff App (MINIMAL VERSION)
-- Fungerar oavsett jobs-tabellens struktur

-- 1. Skapa tabell för tilläggstjänster
CREATE TABLE IF NOT EXISTS job_additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  service_id VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  service_category VARCHAR(100),
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(50),
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

-- 2. Lägg till nödvändiga kolumner i jobs (om de inte finns)
DO $$ 
BEGIN
  -- Lägg till added_services_total om den inte finns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'added_services_total') THEN
    ALTER TABLE jobs ADD COLUMN added_services_total DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Lägg till price_adjustments om den inte finns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'price_adjustments') THEN
    ALTER TABLE jobs ADD COLUMN price_adjustments JSONB DEFAULT '[]';
  END IF;
  
  -- Lägg till original_price om den inte finns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'original_price') THEN
    ALTER TABLE jobs ADD COLUMN original_price DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Lägg till final_price om den inte finns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'final_price') THEN
    ALTER TABLE jobs ADD COLUMN final_price DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- 3. Skapa indexes
CREATE INDEX IF NOT EXISTS idx_job_additional_services_job_id ON job_additional_services(job_id);
CREATE INDEX IF NOT EXISTS idx_job_additional_services_created_at ON job_additional_services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_additional_services_category ON job_additional_services(service_category);

-- 4. Skapa en enkel view utan referenser till saknade kolumner
CREATE OR REPLACE VIEW job_services_summary AS
SELECT 
  j.id as job_id,
  COALESCE(j.original_price, 0) as base_price,
  COALESCE(SUM(jas.total_price), 0) as additional_services_total,
  COALESCE(j.original_price, 0) + COALESCE(SUM(jas.total_price), 0) as total_price_with_additions,
  COUNT(jas.id) as additional_services_count,
  ARRAY_AGG(
    CASE WHEN jas.id IS NOT NULL THEN
      json_build_object(
        'id', jas.id,
        'service_name', jas.service_name,
        'quantity', jas.quantity,
        'total_price', jas.total_price,
        'added_by', jas.added_by,
        'added_at', jas.added_at
      )
    END
  ) FILTER (WHERE jas.id IS NOT NULL) as services_list
FROM jobs j
LEFT JOIN job_additional_services jas ON j.id = jas.job_id
GROUP BY j.id, j.original_price;

-- 5. Enkel trigger funktion
CREATE OR REPLACE FUNCTION update_job_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_original_price DECIMAL(10,2);
  v_added_total DECIMAL(10,2);
BEGIN
  -- Hämta original_price (som vi just la till om den saknades)
  SELECT COALESCE(original_price, 0) INTO v_original_price
  FROM jobs
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  
  -- Beräkna total för tilläggstjänster
  SELECT COALESCE(SUM(total_price), 0) INTO v_added_total
  FROM job_additional_services
  WHERE job_id = COALESCE(NEW.job_id, OLD.job_id);
  
  -- Uppdatera jobs-tabellen
  UPDATE jobs
  SET 
    added_services_total = v_added_total,
    final_price = v_original_price + v_added_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger
DROP TRIGGER IF EXISTS update_job_totals_on_service_change ON job_additional_services;

CREATE TRIGGER update_job_totals_on_service_change
AFTER INSERT OR UPDATE OR DELETE ON job_additional_services
FOR EACH ROW
EXECUTE FUNCTION update_job_totals();

-- 7. Row Level Security
ALTER TABLE job_additional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job services" ON job_additional_services
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage job services" ON job_additional_services
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Realtime
ALTER TABLE job_additional_services REPLICA IDENTITY FULL;

-- 9. Hjälpfunktion
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

-- 10. Verifiera
SELECT 'Tilläggstjänster setup klar!' as status;

-- Visa vad vi skapade
SELECT 
  'Jobs-tabell har nu dessa pris-kolumner:' as info,
  string_agg(column_name, ', ') as columns
FROM information_schema.columns
WHERE table_name = 'jobs' 
AND column_name LIKE '%price%'
GROUP BY table_name;

SELECT COUNT(*) as antal_job_services FROM job_additional_services;