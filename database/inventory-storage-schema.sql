-- NORDFLYTT INVENTORY & STORAGE MANAGEMENT DATABASE SCHEMA
-- This extends the existing Nordflytt database - DO NOT create new database
-- Run this script in your existing nordflytt database

-- Storage Facilities Management
CREATE TABLE IF NOT EXISTS storage_facilities (
  id SERIAL PRIMARY KEY,
  facility_name VARCHAR(200) NOT NULL,
  facility_type VARCHAR(50), -- 'main_warehouse', 'customer_storage', 'mobile_storage'
  address JSONB,
  total_capacity INTEGER, -- cubic meters
  available_capacity INTEGER,
  climate_controlled BOOLEAN DEFAULT false,
  security_level VARCHAR(20), -- 'basic', 'high', 'maximum'
  access_hours JSONB,
  facility_manager VARCHAR(200),
  contact_info JSONB,
  monthly_cost INTEGER,
  insurance_covered BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Storage Services
CREATE TABLE IF NOT EXISTS customer_storage (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES kunder(id),
  storage_unit_id VARCHAR(50) UNIQUE,
  facility_id INTEGER REFERENCES storage_facilities(id),
  storage_start_date DATE,
  planned_end_date DATE,
  actual_end_date DATE,
  monthly_rate INTEGER,
  total_volume DECIMAL(6,2), -- cubic meters
  storage_type VARCHAR(50), -- 'short_term', 'long_term', 'seasonal', 'document_storage'
  access_level VARCHAR(50), -- 'customer_access', 'nordflytt_only', 'restricted'
  insurance_value INTEGER,
  special_requirements JSONB, -- climate, security, handling instructions
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'ended', 'overdue', 'terminated'
  payment_status VARCHAR(50) DEFAULT 'current', -- 'current', 'overdue', 'delinquent'
  last_payment_date DATE,
  next_payment_due DATE,
  late_fees INTEGER DEFAULT 0,
  access_code VARCHAR(20),
  emergency_contact JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Detailed Customer Inventory Items
CREATE TABLE IF NOT EXISTS customer_inventory_items (
  id SERIAL PRIMARY KEY,
  storage_id INTEGER REFERENCES customer_storage(id),
  item_category VARCHAR(100), -- 'furniture', 'appliances', 'boxes', 'documents', 'artwork'
  item_description TEXT,
  estimated_value INTEGER,
  condition_on_entry VARCHAR(100),
  condition_notes TEXT,
  fragile BOOLEAN DEFAULT false,
  hazardous BOOLEAN DEFAULT false,
  dimensions JSONB, -- length, width, height in cm
  weight DECIMAL(6,2), -- kg
  photo_urls JSONB,
  barcode VARCHAR(100),
  location_in_storage VARCHAR(100), -- section, shelf, position
  date_stored TIMESTAMP DEFAULT NOW(),
  last_inspection_date DATE,
  inspection_notes TEXT,
  condition_changes TEXT,
  insurance_covered BOOLEAN DEFAULT true,
  pickup_priority INTEGER DEFAULT 0, -- for organizing pickup order
  special_handling JSONB -- special instructions for handling
);

-- Company Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL, -- 'flyttkartonger', 'städmaterial', 'verktyg'
  category_description TEXT,
  reorder_threshold INTEGER,
  preferred_supplier VARCHAR(200),
  average_cost_per_unit DECIMAL(8,2),
  standard_unit VARCHAR(50), -- 'piece', 'box', 'liter', 'kg', 'meter'
  shelf_life_days INTEGER, -- for consumables
  requires_maintenance BOOLEAN DEFAULT false,
  maintenance_interval_days INTEGER,
  depreciation_rate DECIMAL(4,2), -- annual depreciation percentage
  budget_category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Company Asset Inventory
CREATE TABLE IF NOT EXISTS company_assets (
  id SERIAL PRIMARY KEY,
  asset_code VARCHAR(50) UNIQUE,
  category_id INTEGER REFERENCES asset_categories(id),
  asset_name VARCHAR(200),
  description TEXT,
  current_quantity INTEGER DEFAULT 0,
  minimum_stock_level INTEGER,
  maximum_stock_level INTEGER,
  cost_per_unit DECIMAL(8,2),
  supplier VARCHAR(200),
  supplier_contact JSONB,
  last_reorder_date DATE,
  next_reorder_date DATE,
  reorder_quantity INTEGER,
  location VARCHAR(200), -- warehouse, truck, office, storage facility
  assigned_to INTEGER, -- employee ID or vehicle ID
  condition VARCHAR(50) DEFAULT 'new', -- 'new', 'good', 'fair', 'poor', 'needs_replacement'
  purchase_date DATE,
  warranty_expiry DATE,
  maintenance_schedule JSONB,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  usage_tracking JSONB, -- track usage patterns
  total_usage_count INTEGER DEFAULT 0,
  replacement_cost INTEGER,
  current_value INTEGER,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'disposed', 'lost'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Asset Movement & Usage Tracking
CREATE TABLE IF NOT EXISTS asset_movements (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES company_assets(id),
  movement_type VARCHAR(50), -- 'purchase', 'usage', 'maintenance', 'disposal', 'transfer', 'loss'
  quantity_change INTEGER, -- positive for additions, negative for usage/disposal
  from_location VARCHAR(200),
  to_location VARCHAR(200),
  movement_date TIMESTAMP DEFAULT NOW(),
  reference_id INTEGER, -- could reference uppdrag, employee, maintenance record
  reference_type VARCHAR(50), -- 'job', 'maintenance', 'employee', 'vehicle', 'facility'
  cost_impact DECIMAL(8,2),
  unit_cost DECIMAL(8,2),
  notes TEXT,
  performed_by INTEGER REFERENCES anställda(id),
  approved_by INTEGER REFERENCES anställda(id),
  receipt_number VARCHAR(100),
  supplier_invoice VARCHAR(100)
);

-- Automated Reordering System
CREATE TABLE IF NOT EXISTS reorder_automation (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES company_assets(id),
  auto_reorder_enabled BOOLEAN DEFAULT false,
  reorder_trigger_level INTEGER, -- quantity that triggers reorder
  reorder_quantity INTEGER,
  preferred_supplier VARCHAR(200),
  supplier_contact JSONB,
  lead_time_days INTEGER,
  automatic_approval_limit INTEGER, -- auto-approve orders under this amount
  last_auto_order_date DATE,
  next_check_date DATE,
  order_frequency VARCHAR(50), -- 'weekly', 'monthly', 'quarterly', 'as_needed'
  seasonal_adjustments JSONB, -- adjust quantities based on season
  budget_limit_monthly INTEGER,
  approval_required_above INTEGER,
  order_history JSONB,
  supplier_performance JSONB, -- track delivery times, quality, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Storage Billing & Payments
CREATE TABLE IF NOT EXISTS storage_billing (
  id SERIAL PRIMARY KEY,
  storage_id INTEGER REFERENCES customer_storage(id),
  billing_period VARCHAR(50), -- 'monthly', 'quarterly', 'annual'
  period_start DATE,
  period_end DATE,
  base_storage_fee INTEGER,
  volume_charges INTEGER DEFAULT 0,
  additional_services INTEGER DEFAULT 0, -- climate control, extra security, etc.
  access_fees INTEGER DEFAULT 0,
  late_fees INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,
  total_amount INTEGER,
  invoice_number VARCHAR(100),
  invoice_date DATE,
  due_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'failed'
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  auto_generated BOOLEAN DEFAULT true,
  sent_to_customer BOOLEAN DEFAULT false,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Asset Maintenance Records
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES company_assets(id),
  maintenance_type VARCHAR(100), -- 'preventive', 'corrective', 'inspection', 'upgrade'
  scheduled_date DATE,
  completed_date DATE,
  performed_by INTEGER REFERENCES anställda(id),
  maintenance_provider VARCHAR(200), -- external service provider if applicable
  description TEXT,
  parts_used JSONB, -- list of parts/materials used
  cost INTEGER,
  warranty_work BOOLEAN DEFAULT false,
  next_maintenance_date DATE,
  condition_before VARCHAR(100),
  condition_after VARCHAR(100),
  issues_found TEXT,
  recommendations TEXT,
  maintenance_photos JSONB,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Storage Access Log
CREATE TABLE IF NOT EXISTS storage_access_log (
  id SERIAL PRIMARY KEY,
  storage_id INTEGER REFERENCES customer_storage(id),
  access_date TIMESTAMP DEFAULT NOW(),
  access_type VARCHAR(50), -- 'customer_visit', 'staff_inspection', 'delivery', 'pickup'
  person_name VARCHAR(200),
  person_id VARCHAR(100), -- ID number for verification
  accompanied_by VARCHAR(200), -- Nordflytt staff if applicable
  purpose TEXT,
  items_added JSONB,
  items_removed JSONB,
  duration_minutes INTEGER,
  access_granted_by VARCHAR(200),
  notes TEXT,
  photos_taken JSONB,
  security_check_passed BOOLEAN DEFAULT true
);

-- Inventory Valuation & Reporting
CREATE TABLE IF NOT EXISTS inventory_valuations (
  id SERIAL PRIMARY KEY,
  valuation_date DATE,
  valuation_type VARCHAR(50), -- 'monthly', 'quarterly', 'annual', 'audit'
  total_asset_value INTEGER,
  total_customer_storage_value INTEGER,
  category_breakdowns JSONB,
  depreciation_applied INTEGER,
  write_offs INTEGER,
  new_purchases INTEGER,
  valuation_method VARCHAR(50), -- 'cost', 'market', 'replacement'
  performed_by INTEGER REFERENCES anställda(id),
  approved_by INTEGER REFERENCES anställda(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_storage_status ON customer_storage(status);
CREATE INDEX IF NOT EXISTS idx_customer_storage_payment ON customer_storage(payment_status);
CREATE INDEX IF NOT EXISTS idx_customer_storage_facility ON customer_storage(facility_id);
CREATE INDEX IF NOT EXISTS idx_customer_inventory_storage ON customer_inventory_items(storage_id);
CREATE INDEX IF NOT EXISTS idx_company_assets_category ON company_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_company_assets_location ON company_assets(location);
CREATE INDEX IF NOT EXISTS idx_company_assets_status ON company_assets(status);
CREATE INDEX IF NOT EXISTS idx_asset_movements_date ON asset_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_asset_movements_type ON asset_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_asset_movements_asset ON asset_movements(asset_id);
CREATE INDEX IF NOT EXISTS idx_storage_billing_status ON storage_billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_storage_billing_due ON storage_billing(due_date);
CREATE INDEX IF NOT EXISTS idx_reorder_automation_enabled ON reorder_automation(auto_reorder_enabled);

-- Insert initial data for storage facilities
INSERT INTO storage_facilities (facility_name, facility_type, address, total_capacity, available_capacity, climate_controlled, security_level, access_hours, facility_manager, contact_info, monthly_cost, status)
VALUES 
('Nordflytt Huvudlager Stockholm', 'main_warehouse', '{"street": "Lagervägen 15", "city": "Stockholm", "postal_code": "12345", "country": "Sweden"}', 5000, 4200, true, 'high', '{"weekdays": "07:00-18:00", "saturday": "08:00-14:00", "sunday": "closed"}', 'Lars Andersson', '{"phone": "+46701234567", "email": "lars@nordflytt.se"}', 45000, 'active'),
('Nordflytt Kundmagasin Solna', 'customer_storage', '{"street": "Industrivägen 8", "city": "Solna", "postal_code": "17065", "country": "Sweden"}', 3000, 2100, true, 'maximum', '{"weekdays": "08:00-17:00", "saturday": "09:00-13:00", "sunday": "closed"}', 'Anna Eriksson', '{"phone": "+46707654321", "email": "anna@nordflytt.se"}', 35000, 'active'),
('Nordflytt Säsongsmagasin', 'customer_storage', '{"street": "Magasinsvägen 22", "city": "Kungsängen", "postal_code": "19635", "country": "Sweden"}', 2000, 1800, false, 'basic', '{"weekdays": "08:00-16:00", "saturday": "closed", "sunday": "closed"}', 'Erik Johansson', '{"phone": "+46705551234", "email": "erik@nordflytt.se"}', 18000, 'active');

-- Insert initial asset categories
INSERT INTO asset_categories (category_name, category_description, reorder_threshold, preferred_supplier, average_cost_per_unit, standard_unit, shelf_life_days, requires_maintenance, maintenance_interval_days, depreciation_rate, budget_category)
VALUES
('Flyttkartonger', 'Alla typer av flyttkartonger och förpackningar', 10, 'Packaging Solutions AB', 30.00, 'piece', NULL, false, NULL, 0.00, 'Material'),
('Packematerial', 'Skyddsmaterial och packningstillbehör', 5, 'Protective Materials Sweden', 150.00, 'box', NULL, false, NULL, 0.00, 'Material'),
('Verktyg', 'Verktyg och utrustning för flyttarbete', 2, 'Professional Moving Equipment', 800.00, 'piece', NULL, true, 180, 20.00, 'Equipment'),
('Städmaterial', 'Rengöringsmedel och städutrustning', 10, 'Eco Clean Supplies', 90.00, 'liter', 730, false, NULL, 0.00, 'Consumables'),
('Fordonsutrustning', 'Utrustning för flyttfordon', 1, 'Transport Equipment AB', 2500.00, 'piece', NULL, true, 90, 15.00, 'Equipment');