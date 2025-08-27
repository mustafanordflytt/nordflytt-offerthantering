-- Seed data for AI and advanced module tables

-- Insert initial AI mode
INSERT INTO ai_mode_history (new_mode, reason, changed_by) VALUES
('suggest', 'Initial system setup', 'system')
ON CONFLICT DO NOTHING;

-- Insert sample AI decisions
INSERT INTO ai_decisions (decision_type, module, description, confidence_score, impact_level, ai_mode, context_data) VALUES
('staff_assignment', 'operations', 'Tilldela Team Erik till Stockholm jobb #001', 92.5, 'medium', 'auto', '{"job_id": "001", "location": "Stockholm", "team_skills": ["heavy_lifting", "customer_service"]}'),
('pricing_optimization', 'sales', 'Justera prissättning för återkommande kund rabatt', 88.0, 'low', 'suggest', '{"customer_id": "cust_123", "previous_jobs": 5, "suggested_discount": 0.15}'),
('route_optimization', 'logistics', 'Optimera leveransrutt för effektivitet', 95.2, 'high', 'auto', '{"jobs": ["001", "002", "003"], "estimated_savings": "45 minuter"}');

-- Insert sample learning metrics
INSERT INTO ai_learning_metrics (metric_type, module, value, improvement_percentage, baseline_value) VALUES
('accuracy', 'pricing', 92.5, 8.8, 85.0),
('efficiency', 'routing', 87.3, 12.1, 77.8),
('user_satisfaction', 'overall', 4.6, 15.0, 4.0),
('revenue_impact', 'pricing', 15.5, 55.0, 10.0);

-- Insert sample API alerts
INSERT INTO api_alerts (api_name, alert_type, severity, message, details) VALUES
('openai_api', 'usage_limit', 'warning', 'OpenAI API användning på 85% av månadsgränsen', '{"usage_percentage": 85, "limit": 100000, "current": 85000}'),
('google_maps_api', 'cost_threshold', 'info', 'Google Maps API kostnader närmar sig budgetgräns', '{"monthly_budget": 800, "current_spend": 620}');

-- Insert sample public procurements
INSERT INTO public_procurements (title, description, organization, category, estimated_value, deadline, status) VALUES
('Flyttjänster för Stockholms Stad', 'Ramavtal för flyttjänster inom Stockholms kommun', 'Stockholms Stad', 'moving_services', 2500000, CURRENT_DATE + INTERVAL '30 days', 'open'),
('Kontorsflytt Regeringskansliet', 'Flytt av regeringskansliets kontor', 'Regeringskansliet', 'office_moving', 850000, CURRENT_DATE + INTERVAL '45 days', 'open'),
('Arkivflytt Uppsala Universitet', 'Flytt av universitetsarkiv till ny lokal', 'Uppsala Universitet', 'archive_moving', 320000, CURRENT_DATE + INTERVAL '60 days', 'open');

-- Insert sample inventory items
INSERT INTO inventory_items (item_code, name, category, current_stock, minimum_stock, unit_cost, location, unit) VALUES
('BOX001', 'Flyttlådor Medium', 'packing_materials', 150, 50, 25.00, 'Huvudlager', 'st'),
('BOX002', 'Flyttlådor Large', 'packing_materials', 80, 30, 35.00, 'Huvudlager', 'st'),
('TAPE001', 'Packtejp Standard', 'packing_materials', 75, 25, 8.50, 'Huvudlager', 'rullar'),
('BUBBLE001', 'Bubbelplast 1.5m', 'packing_materials', 30, 10, 120.00, 'Huvudlager', 'rullar'),
('DOLLY001', 'Transportvagn Standard', 'moving_equipment', 15, 5, 1200.00, 'Huvudlager', 'st'),
('STRAP001', 'Spännband 5m', 'moving_equipment', 50, 20, 45.00, 'Huvudlager', 'st');

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, category, rating, payment_terms) VALUES
('PackMaster AB', 'Lars Andersson', 'lars@packmaster.se', '08-123-4567', 'packing_materials', 4.5, 'Net 30'),
('MoveTech Solutions', 'Anna Johansson', 'anna@movetech.se', '08-987-6543', 'moving_equipment', 4.2, 'Net 30'),
('Box Wholesale Nordic', 'Erik Svensson', 'erik@boxwholesale.se', '08-456-7890', 'packing_materials', 4.8, 'Net 15'),
('Transport Equipment AB', 'Maria Nilsson', 'maria@transportequip.se', '08-234-5678', 'moving_equipment', 4.0, 'Net 45');

-- Insert sample system health data
INSERT INTO system_health (component, status, uptime_percentage, response_time_ms, error_rate) VALUES
('pricing_engine', 'healthy', 99.8, 120, 0.01),
('route_optimizer', 'healthy', 98.5, 200, 0.05),
('ml_models', 'healthy', 99.9, 80, 0.00),
('inventory_system', 'healthy', 99.5, 150, 0.02),
('reporting_engine', 'healthy', 99.2, 250, 0.03);

-- Insert sample report templates
INSERT INTO report_templates (name, description, category, report_type, sql_query, parameters, is_active, created_by) VALUES
('Månadsrapport Omsättning', 'Månadsvis omsättning uppdelat per tjänstetyp', 'financial', 'table', 
 'SELECT service_type, SUM(total_amount) as revenue FROM jobs WHERE created_at >= {{start_date}} AND created_at <= {{end_date}} GROUP BY service_type', 
 '{"start_date": "date", "end_date": "date"}', true, 'system'),
('Personalprestation', 'Personalens prestationsmått och jobbslutförandegrad', 'operational', 'table', 
 'SELECT s.name, COUNT(ja.job_id) as jobs_completed, AVG(j.customer_rating) as avg_rating FROM staff s LEFT JOIN job_assignments ja ON s.id = ja.staff_id LEFT JOIN jobs j ON ja.job_id = j.id WHERE j.completed_at >= {{start_date}} GROUP BY s.id, s.name', 
 '{"start_date": "date"}', true, 'system'),
('Lagerrapport', 'Aktuell lagerstatus och låglagervarningar', 'inventory', 'table',
 'SELECT name, current_stock, minimum_stock, (current_stock - minimum_stock) as stock_above_minimum FROM inventory_items WHERE status = ''active'' ORDER BY (current_stock::float / NULLIF(minimum_stock, 0))',
 '{}', true, 'system');

-- Insert sample customer storage units (using existing customer IDs)
INSERT INTO customer_storage (customer_id, storage_unit, size_category, monthly_rate, start_date, status, location, contents_description) 
SELECT 
  c.id,
  'UNIT-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6),
  CASE (RANDOM() * 3)::INT 
    WHEN 0 THEN 'small'
    WHEN 1 THEN 'medium'
    ELSE 'large'
  END,
  CASE (RANDOM() * 3)::INT 
    WHEN 0 THEN 500.00
    WHEN 1 THEN 800.00
    ELSE 1200.00
  END,
  CURRENT_DATE - (RANDOM() * 180)::INT,
  'active',
  'Stockholm Huvudlager',
  'Möbler och hushållsartiklar från senaste flytten'
FROM customers c 
LIMIT 5;

-- Insert initial autonomous configuration
INSERT INTO autonomous_config (module, setting_key, setting_value, confidence_threshold, auto_execute, description, updated_by) VALUES
('global', 'ai_mode', '{"mode": "suggest"}', 80.0, false, 'Global AI mode setting', 'system'),
('pricing', 'discount_threshold', '{"max_discount": 0.20, "auto_approve_below": 0.10}', 85.0, true, 'Pricing discount automation settings', 'system'),
('routing', 'optimization_params', '{"max_distance": 200, "time_window": 120}', 90.0, true, 'Route optimization parameters', 'system'),
('staff', 'assignment_rules', '{"max_jobs_per_day": 3, "skill_match_weight": 0.7}', 88.0, false, 'Staff assignment automation rules', 'system');

-- Insert some AI performance data for today
INSERT INTO ai_performance_daily (date, module, total_decisions, automatic_decisions, manual_overrides, accuracy_score, efficiency_gain, time_saved_hours, revenue_impact) VALUES
(CURRENT_DATE, 'pricing', 25, 18, 2, 91.5, 12.3, 3.5, 4500.00),
(CURRENT_DATE, 'routing', 15, 14, 1, 94.2, 18.7, 5.2, 2800.00),
(CURRENT_DATE, 'staff', 30, 22, 3, 88.9, 15.5, 4.8, 3200.00),
(CURRENT_DATE - INTERVAL '1 day', 'pricing', 28, 20, 2, 90.8, 11.9, 3.8, 4200.00),
(CURRENT_DATE - INTERVAL '1 day', 'routing', 18, 16, 1, 93.5, 17.2, 5.5, 3100.00);