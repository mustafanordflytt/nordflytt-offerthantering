-- Fixa trigger-funktionen för att fungera med din jobs-tabell
-- (tar bort referensen till updated_at som inte finns)

-- Droppa och återskapa trigger-funktionen
DROP FUNCTION IF EXISTS update_job_totals() CASCADE;

CREATE OR REPLACE FUNCTION update_job_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_original_price DECIMAL(10,2);
  v_added_total DECIMAL(10,2);
BEGIN
  -- Hämta original_price
  SELECT COALESCE(original_price, 0) INTO v_original_price
  FROM jobs
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  
  -- Beräkna total för tilläggstjänster
  SELECT COALESCE(SUM(total_price), 0) INTO v_added_total
  FROM job_additional_services
  WHERE job_id = COALESCE(NEW.job_id, OLD.job_id);
  
  -- Uppdatera jobs-tabellen (UTAN updated_at)
  UPDATE jobs
  SET 
    added_services_total = v_added_total,
    final_price = v_original_price + v_added_total
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Återskapa triggern
DROP TRIGGER IF EXISTS update_job_totals_on_service_change ON job_additional_services;

CREATE TRIGGER update_job_totals_on_service_change
AFTER INSERT OR UPDATE OR DELETE ON job_additional_services
FOR EACH ROW
EXECUTE FUNCTION update_job_totals();

-- Verifiera
SELECT 'Trigger fixad - updated_at referens borttagen!' as status;