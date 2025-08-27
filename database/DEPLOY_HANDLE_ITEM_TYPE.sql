-- NORDFLYTT SCHEMA DEPLOYMENT - HANDLES item_type COLUMN
-- This script handles the item_type NOT NULL constraint issue
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gindcnpiejkntkangpuc/sql

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Check current inventory_items structure
DO $$
BEGIN
    RAISE NOTICE 'Checking inventory_items structure...';
END $$;

-- First, let's see what columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inventory_items'
ORDER BY ordinal_position;

-- Step 4: Fix inventory_items table comprehensively
DO $$ 
BEGIN
    -- Check if inventory_items table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
        RAISE NOTICE 'Fixing inventory_items table...';
        
        -- Add item_type column if missing (with default value to handle NOT NULL)
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS item_type VARCHAR(100) DEFAULT 'general';
        
        -- Add all other potentially missing columns
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS item_code VARCHAR(50);
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category VARCHAR(100);
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS minimum_stock INTEGER DEFAULT 0;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS maximum_stock INTEGER DEFAULT 1000;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2);
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS supplier_id UUID;
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location VARCHAR(100);
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
        
        -- Update any NULL item_type values to default
        UPDATE inventory_items 
        SET item_type = 'general' 
        WHERE item_type IS NULL;
        
        -- Add unique constraint on item_code if missing
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'inventory_items_item_code_key'
        ) THEN
            -- First, ensure item_code values are unique
            UPDATE inventory_items 
            SET item_code = 'ITEM-' || id::text 
            WHERE item_code IS NULL OR item_code = '';
            
            -- Then add the constraint
            ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_item_code_key UNIQUE (item_code);
        END IF;
        
        -- Add check constraint on status if missing
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'inventory_items_status_check'
        ) THEN
            ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_status_check 
            CHECK (status IN ('active', 'inactive', 'discontinued'));
        END IF;
    END IF;
    
    -- Fix other potentially existing tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_templates') THEN
        ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    END IF;
END $$;

-- Step 5: Create all NEW tables (skip existing ones)

-- AI Decisions Tracking
CREATE TABLE IF NOT EXISTS ai_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_type VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  impact_level VARCHAR(20) CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'overridden', 'completed')),
  ai_mode VARCHAR(20) NOT NULL CHECK (ai_mode IN ('suggest', 'auto', 'full')),
  context_data JSONB,
  recommendations JSONB,
  execution_result JSONB,
  user_feedback JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- AI Learning Metrics
CREATE TABLE IF NOT EXISTS ai_learning_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  value DECIMAL(10,4),
  improvement_percentage DECIMAL(5,2),
  baseline_value DECIMAL(10,4),
  measurement_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Mode History
CREATE TABLE IF NOT EXISTS ai_mode_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  previous_mode VARCHAR(20),
  new_mode VARCHAR(20) NOT NULL CHECK (new_mode IN ('suggest', 'auto', 'full')),
  changed_by VARCHAR(100),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Alerts
CREATE TABLE IF NOT EXISTS api_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Performance Daily
CREATE TABLE IF NOT EXISTS ai_performance_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  module VARCHAR(50) NOT NULL,
  total_decisions INTEGER DEFAULT 0,
  automatic_decisions INTEGER DEFAULT 0,
  manual_overrides INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5,2),
  efficiency_gain DECIMAL(5,2),
  time_saved_hours DECIMAL(6,2),
  revenue_impact DECIMAL(12,2),
  user_satisfaction_score DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, module)
);

-- Autonomous System Configuration
CREATE TABLE IF NOT EXISTS autonomous_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(50) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  confidence_threshold DECIMAL(5,2) DEFAULT 80.0,
  auto_execute BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module, setting_key)
);

-- System Health Monitoring
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'critical', 'offline')),
  uptime_percentage DECIMAL(5,2),
  response_time_ms INTEGER,
  error_rate DECIMAL(5,2),
  last_check TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Public Procurements
CREATE TABLE IF NOT EXISTS public_procurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  procurement_number VARCHAR(100),
  organization VARCHAR(255),
  category VARCHAR(100),
  estimated_value DECIMAL(15,2),
  deadline DATE,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'awarded', 'cancelled')),
  contact_info JSONB,
  documents_url TEXT,
  requirements TEXT,
  our_status VARCHAR(50) DEFAULT 'not_applied' CHECK (our_status IN ('not_applied', 'considering', 'applied', 'won', 'lost')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers (create if not exists)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  postal_code VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Sweden',
  organization_number VARCHAR(50),
  website VARCHAR(255),
  category VARCHAR(100),
  payment_terms VARCHAR(100),
  rating DECIMAL(3,1) CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  report_type VARCHAR(50),
  sql_query TEXT,
  parameters JSONB,
  chart_config JSONB,
  access_roles JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES inventory_items(id) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reference_id UUID,
  reference_type VARCHAR(50),
  notes TEXT,
  performed_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Storage
CREATE TABLE IF NOT EXISTS customer_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  storage_unit VARCHAR(100) NOT NULL,
  size_category VARCHAR(50),
  monthly_rate DECIMAL(8,2),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  access_code VARCHAR(20),
  location VARCHAR(255),
  contents_description TEXT,
  photos JSONB,
  insurance_value DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  po_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'delivered', 'invoiced', 'paid', 'cancelled')),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  line_items JSONB NOT NULL,
  subtotal DECIMAL(12,2),
  tax_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  notes TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES report_templates(id),
  report_name VARCHAR(255),
  parameters JSONB,
  result_data JSONB,
  file_path TEXT,
  status VARCHAR(50) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  generated_by VARCHAR(100),
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Step 6: Create indexes safely
DO $$ 
BEGIN
  -- Only create indexes if columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_items' AND column_name = 'category') THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_items' AND column_name = 'current_stock') THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_items_current_stock ON inventory_items(current_stock);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'suppliers' AND column_name = 'category') THEN
    CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);
  END IF;
  
  -- Create other indexes
  CREATE INDEX IF NOT EXISTS idx_ai_decisions_status ON ai_decisions(status);
  CREATE INDEX IF NOT EXISTS idx_ai_decisions_module ON ai_decisions(module);
  CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at);
  CREATE INDEX IF NOT EXISTS idx_ai_learning_metrics_module ON ai_learning_metrics(module);
  CREATE INDEX IF NOT EXISTS idx_ai_learning_metrics_date ON ai_learning_metrics(measurement_date);
  CREATE INDEX IF NOT EXISTS idx_api_alerts_resolved ON api_alerts(resolved);
  CREATE INDEX IF NOT EXISTS idx_api_alerts_severity ON api_alerts(severity);
  CREATE INDEX IF NOT EXISTS idx_public_procurements_deadline ON public_procurements(deadline);
  CREATE INDEX IF NOT EXISTS idx_public_procurements_status ON public_procurements(status);
  CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
END $$;

-- Step 7: Create triggers safely
DO $$ 
BEGIN
  -- Check if tables exist before creating triggers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_procurements') THEN
    DROP TRIGGER IF EXISTS update_public_procurements_updated_at ON public_procurements;
    CREATE TRIGGER update_public_procurements_updated_at BEFORE UPDATE ON public_procurements
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
    DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
    CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_storage') THEN
    DROP TRIGGER IF EXISTS update_customer_storage_updated_at ON customer_storage;
    CREATE TRIGGER update_customer_storage_updated_at BEFORE UPDATE ON customer_storage
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
    CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
    DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
    CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_templates') THEN
    DROP TRIGGER IF EXISTS update_report_templates_updated_at ON report_templates;
    CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Step 8: Insert sample data (WITH item_type column)
DO $$ 
BEGIN
  -- Check if all required columns exist in inventory_items before inserting
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items'
  ) THEN
    -- Include item_type in the insert
    INSERT INTO inventory_items (item_code, name, description, category, unit, current_stock, minimum_stock, unit_cost, item_type)
    VALUES 
      ('BOX-001', 'Flyttkartonger Standard', 'Standard moving boxes 60x40x40cm', 'moving_supplies', 'st', 150, 50, 79.00, 'consumable'),
      ('STRAP-001', 'Spännband 5m', 'Heavy duty straps 5 meters', 'equipment', 'st', 25, 10, 299.00, 'tool'),
      ('BUBBLE-001', 'Bubbelplast', 'Bubble wrap roll 1m x 50m', 'packing_materials', 'rulle', 20, 5, 199.00, 'consumable'),
      ('TAPE-001', 'Packtejp', 'Heavy duty packing tape', 'packing_materials', 'st', 100, 20, 99.00, 'consumable'),
      ('DOLLY-001', 'Transportvagn', 'Heavy duty moving dolly', 'equipment', 'st', 10, 2, 1599.00, 'equipment')
    ON CONFLICT (item_code) DO UPDATE
    SET 
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      unit = EXCLUDED.unit,
      current_stock = EXCLUDED.current_stock,
      minimum_stock = EXCLUDED.minimum_stock,
      unit_cost = EXCLUDED.unit_cost,
      item_type = EXCLUDED.item_type;
  END IF;
  
  -- Insert AI sample data
  INSERT INTO ai_decisions (decision_type, module, description, confidence_score, impact_level, status, ai_mode, context_data)
  VALUES 
    ('pricing_optimization', 'pricing', 'Suggested 10% discount for large volume move', 92.5, 'medium', 'pending', 'suggest', '{"volume": 120, "distance": 50}'),
    ('route_optimization', 'routing', 'Optimized route saves 30 minutes', 88.3, 'low', 'approved', 'auto', '{"original_time": 120, "optimized_time": 90}'),
    ('staff_assignment', 'scheduling', 'Assigned Team A based on experience and location', 95.0, 'high', 'executed', 'auto', '{"team": "A", "experience_score": 4.8}')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO ai_learning_metrics (metric_type, module, value, improvement_percentage, baseline_value)
  VALUES 
    ('accuracy', 'pricing', 92.5, 8.8, 85.0),
    ('efficiency', 'routing', 87.3, 12.1, 77.8),
    ('satisfaction', 'scheduling', 94.2, 5.5, 89.3)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO ai_mode_history (previous_mode, new_mode, changed_by, reason)
  VALUES 
    ('suggest', 'auto', 'admin', 'Increased confidence after successful operations'),
    ('auto', 'full', 'system', 'Christmas period - fully autonomous mode')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public_procurements (title, description, procurement_number, organization, category, estimated_value, deadline, status)
  VALUES 
    ('Ramavtal Flyttjänster 2025', 'Framework agreement for moving services', 'STH-2025-001', 'Stockholms stad', 'moving_services', 5000000, CURRENT_DATE + INTERVAL '30 days', 'open'),
    ('Kontorsflytt Myndighet', 'Office relocation for government agency', 'GOV-2025-012', 'Skatteverket', 'office_moving', 2500000, CURRENT_DATE + INTERVAL '45 days', 'open')
  ON CONFLICT DO NOTHING;
  
  INSERT INTO autonomous_config (module, setting_key, setting_value, confidence_threshold, auto_execute, description)
  VALUES 
    ('pricing', 'discount_rules', '{"max_discount": 15, "volume_threshold": 100}', 85.0, true, 'Automatic discount rules'),
    ('routing', 'optimization_params', '{"max_detour": 10, "time_weight": 0.7}', 80.0, true, 'Route optimization parameters'),
    ('scheduling', 'team_assignment', '{"skill_weight": 0.6, "location_weight": 0.4}', 90.0, true, 'Team assignment algorithm weights')
  ON CONFLICT DO NOTHING;
END $$;

-- Step 9: Verify deployment
DO $$
DECLARE
    table_count INTEGER;
    missing_tables TEXT := '';
    inventory_cols TEXT := '';
BEGIN
    -- Count created tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_name IN (
        'ai_decisions', 'ai_learning_metrics', 'ai_mode_history', 
        'api_alerts', 'ai_performance_daily', 'autonomous_config',
        'system_health', 'public_procurements', 'inventory_items',
        'inventory_transactions', 'customer_storage', 'suppliers',
        'purchase_orders', 'report_templates', 'generated_reports'
    );
    
    -- Check inventory_items columns
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO inventory_cols
    FROM information_schema.columns
    WHERE table_name = 'inventory_items';
    
    -- Report results
    RAISE NOTICE '✅ Schema deployment complete!';
    RAISE NOTICE '📊 Created/verified % out of 15 tables', table_count;
    RAISE NOTICE '📋 Inventory columns: %', inventory_cols;
    
    IF table_count = 15 THEN
        RAISE NOTICE '🎉 All tables successfully deployed!';
    END IF;
END $$;

-- Final success message
SELECT 
    '🚀 DEPLOYMENT COMPLETE!' as status,
    COUNT(DISTINCT t.table_name) as tables_ready,
    COUNT(DISTINCT c.column_name) as inventory_columns,
    '✅ All AI endpoints should now work with real data!' as message
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON c.table_name = 'inventory_items'
WHERE t.table_schema = 'public' 
AND t.table_name IN (
    'ai_decisions', 'ai_learning_metrics', 'ai_mode_history', 
    'api_alerts', 'ai_performance_daily', 'autonomous_config',
    'system_health', 'public_procurements', 'inventory_items',
    'inventory_transactions', 'customer_storage', 'suppliers',
    'purchase_orders', 'report_templates', 'generated_reports'
);