-- Fix trigger to not use updated_at column
CREATE OR REPLACE FUNCTION update_job_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_original_price DECIMAL(10,2);
  v_added_total DECIMAL(10,2);
BEGIN
  -- Get original price
  SELECT COALESCE(original_price, 0) INTO v_original_price
  FROM jobs
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  
  -- Calculate total for additional services
  SELECT COALESCE(SUM(total_price), 0) INTO v_added_total
  FROM job_additional_services
  WHERE job_id = COALESCE(NEW.job_id, OLD.job_id);
  
  -- Update jobs table (without updated_at)
  UPDATE jobs
  SET 
    added_services_total = v_added_total,
    final_price = v_original_price + v_added_total
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the fix
SELECT 'Trigger updated successfully!' as status;