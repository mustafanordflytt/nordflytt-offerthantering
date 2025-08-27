#!/usr/bin/env python3
"""
Create support_tickets and gpt_analytics tables in Supabase
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://gindcnpiejkntkangpuc.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_KEY:
    logger.error("SUPABASE_SERVICE_ROLE_KEY not found in environment variables")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# SQL for creating support_tickets table
CREATE_SUPPORT_TICKETS_SQL = """
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('damage_claim', 'booking_change', 'complaint', 'cleaning_issue', 'general')),
    description TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    booking_reference VARCHAR(50),
    assigned_team VARCHAR(100) NOT NULL,
    assigned_to VARCHAR(255),
    created_by VARCHAR(50) NOT NULL,
    resolution TEXT,
    resolution_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_support_tickets_customer_email ON support_tickets(customer_email);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
"""

# SQL for creating gpt_analytics table
CREATE_GPT_ANALYTICS_SQL = """
CREATE TABLE IF NOT EXISTS gpt_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255),
    success BOOLEAN NOT NULL DEFAULT true,
    response_time_ms INTEGER,
    error_message TEXT,
    request_data JSONB,
    response_data JSONB,
    api_key_used VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_gpt_analytics_endpoint ON gpt_analytics(endpoint);
CREATE INDEX idx_gpt_analytics_timestamp ON gpt_analytics(timestamp DESC);
CREATE INDEX idx_gpt_analytics_customer_email ON gpt_analytics(customer_email);

-- Create view for metrics
CREATE OR REPLACE VIEW gpt_api_metrics AS
SELECT 
    endpoint,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN success THEN 1 END) as successful_calls,
    COUNT(CASE WHEN NOT success THEN 1 END) as failed_calls,
    AVG(response_time_ms) as avg_response_time,
    MIN(response_time_ms) as min_response_time,
    MAX(response_time_ms) as max_response_time,
    DATE_TRUNC('hour', timestamp) as hour
FROM gpt_analytics
GROUP BY endpoint, DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;
"""

# SQL for updating existing tables
UPDATE_EXISTING_TABLES_SQL = """
-- Add VIP status to customers if not exists
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS vip_status BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_preferences JSONB DEFAULT '{}';

-- Add AI-related columns to jobs if not exists
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS packed_by_nordflytt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photos_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS special_requirements TEXT,
ADD COLUMN IF NOT EXISTS ai_notes JSONB DEFAULT '{}';

-- Create function to update VIP status
CREATE OR REPLACE FUNCTION update_customer_vip_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers 
    SET 
        total_spent = (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM jobs 
            WHERE customer_email = NEW.customer_email
        ),
        vip_status = (
            SELECT COUNT(*) >= 3 OR COALESCE(SUM(total_amount), 0) > 50000
            FROM jobs 
            WHERE customer_email = NEW.customer_email
        )
    WHERE email = NEW.customer_email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for VIP status updates
DROP TRIGGER IF EXISTS update_vip_status_trigger ON jobs;
CREATE TRIGGER update_vip_status_trigger
AFTER INSERT OR UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_customer_vip_status();
"""

def create_tables():
    """Create all necessary tables and updates"""
    try:
        # Note: Supabase Python client doesn't support direct SQL execution
        # These queries would need to be run in Supabase SQL editor or via migration files
        
        logger.info("Database tables creation script generated.")
        logger.info("\nPlease run the following SQL in your Supabase SQL editor:")
        
        print("\n-- 1. Create support_tickets table")
        print(CREATE_SUPPORT_TICKETS_SQL)
        
        print("\n-- 2. Create gpt_analytics table")
        print(CREATE_GPT_ANALYTICS_SQL)
        
        print("\n-- 3. Update existing tables")
        print(UPDATE_EXISTING_TABLES_SQL)
        
        # Create migration files
        os.makedirs("python-api/migrations", exist_ok=True)
        
        with open("python-api/migrations/001_create_support_tickets.sql", "w") as f:
            f.write(CREATE_SUPPORT_TICKETS_SQL)
        
        with open("python-api/migrations/002_create_gpt_analytics.sql", "w") as f:
            f.write(CREATE_GPT_ANALYTICS_SQL)
        
        with open("python-api/migrations/003_update_existing_tables.sql", "w") as f:
            f.write(UPDATE_EXISTING_TABLES_SQL)
        
        logger.info("\nMigration files created in python-api/migrations/")
        logger.info("Run these in order in your Supabase SQL editor.")
        
    except Exception as e:
        logger.error(f"Error creating tables: {str(e)}")
        raise

if __name__ == "__main__":
    create_tables()