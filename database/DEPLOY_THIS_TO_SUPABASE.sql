
-- NORDFLYTT COMPLETE SCHEMA DEPLOYMENT
-- Run this in Supabase SQL Editor

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

-- Step 3: Create AI tables
-- AI & Automation Tables for Nordflytt CRM
-- This schema enables AI decision tracking, learning metrics, and autonomous operations

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Advanced Module Tables

-- Offentliga Upphandlingar (Public Procurements)
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

-- Lager/Inventory
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  unit VARCHAR(50),
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  maximum_stock INTEGER DEFAULT 1000,
  unit_cost DECIMAL(10,2),
  supplier_id UUID,
  location VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
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

-- Kundmagasin/Customer Storage
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

-- Leverantörer/Suppliers
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

-- Rapporter/Reports Configuration
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_decisions_status ON ai_decisions(status);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_module ON ai_decisions(module);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_learning_metrics_module ON ai_learning_metrics(module);
CREATE INDEX IF NOT EXISTS idx_ai_learning_metrics_date ON ai_learning_metrics(measurement_date);
CREATE INDEX IF NOT EXISTS idx_api_alerts_resolved ON api_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_api_alerts_severity ON api_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_public_procurements_deadline ON public_procurements(deadline);
CREATE INDEX IF NOT EXISTS idx_public_procurements_status ON public_procurements(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_current_stock ON inventory_items(current_stock);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_public_procurements_updated_at BEFORE UPDATE ON public_procurements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_storage_updated_at BEFORE UPDATE ON customer_storage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Fix any missing columns
ALTER TABLE public_procurements ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Step 5: Insert sample data
INSERT INTO ai_decisions (decision_type, module, description, confidence_score, impact_level, status, ai_mode, context_data)
VALUES 
  ('pricing_optimization', 'pricing', 'Suggested 10% discount for large volume move', 92.5, 'medium', 'pending', 'suggest', '{"volume": 120, "distance": 50}'),
  ('route_optimization', 'routing', 'Optimized route saves 30 minutes', 88.3, 'low', 'approved', 'auto', '{"original_time": 120, "optimized_time": 90}')
ON CONFLICT DO NOTHING;

INSERT INTO ai_learning_metrics (metric_type, module, value, improvement_percentage, baseline_value)
VALUES 
  ('accuracy', 'pricing', 92.5, 8.8, 85.0),
  ('efficiency', 'routing', 87.3, 12.1, 77.8)
ON CONFLICT DO NOTHING;

INSERT INTO ai_mode_history (previous_mode, new_mode, changed_by, reason)
VALUES 
  ('suggest', 'auto', 'admin', 'Increased confidence after successful operations')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_items (item_code, name, description, category, unit, current_stock, minimum_stock, unit_cost)
VALUES 
  ('BOX-001', 'Flyttkartonger Standard', 'Standard moving boxes 60x40x40cm', 'moving_supplies', 'st', 150, 50, 79.00),
  ('STRAP-001', 'Spännband 5m', 'Heavy duty straps 5 meters', 'equipment', 'st', 25, 10, 299.00)
ON CONFLICT (item_code) DO NOTHING;

INSERT INTO public_procurements (title, description, procurement_number, organization, category, estimated_value, deadline, status)
VALUES 
  ('Ramavtal Flyttjänster 2025', 'Framework agreement for moving services', 'STH-2025-001', 'Stockholms stad', 'moving_services', 5000000, CURRENT_DATE + INTERVAL '30 days', 'open')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Schema deployment complete!' as message;
