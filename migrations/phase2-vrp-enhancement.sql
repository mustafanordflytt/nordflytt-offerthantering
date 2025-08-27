-- Phase 2 VRP Enhancement Migration
-- Adds CO2 tracking, traffic caching, and route optimization tables

-- Add CO2 emissions tracking to vehicles
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS co2_emission_grams_per_km DECIMAL(5,2) DEFAULT 150.0,
ADD COLUMN IF NOT EXISTS fuel_consumption_per_100km DECIMAL(4,2) DEFAULT 8.0;

-- Update existing vehicles with realistic CO2 emissions data
UPDATE vehicles SET
  co2_emission_grams_per_km = CASE
    WHEN vehicle_type = 'small' THEN 120.0
    WHEN vehicle_type = 'medium' THEN 150.0
    WHEN vehicle_type = 'large' THEN 180.0
    ELSE 150.0
  END,
  fuel_consumption_per_100km = CASE
    WHEN vehicle_type = 'small' THEN 6.5
    WHEN vehicle_type = 'medium' THEN 8.0
    WHEN vehicle_type = 'large' THEN 10.5
    ELSE 8.0
  END
WHERE co2_emission_grams_per_km = 150.0;

-- Enhanced optimized_routes table
CREATE TABLE IF NOT EXISTS optimized_routes (
  id SERIAL PRIMARY KEY,
  optimization_id INTEGER REFERENCES ai_schedule_optimizations(id),
  vehicle_id INTEGER,
  route_order INTEGER,
  job_sequence JSONB NOT NULL,
  total_distance_km DECIMAL(6,2),
  total_duration_minutes INTEGER,
  total_fuel_cost DECIMAL(7,2),
  estimated_co2_emissions DECIMAL(8,2),
  traffic_condition VARCHAR(20),
  real_time_eta TIMESTAMP,
  reroute_count INTEGER DEFAULT 0,
  google_maps_route JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traffic cache table for Google Maps API cost reduction
CREATE TABLE IF NOT EXISTS traffic_cache (
  id SERIAL PRIMARY KEY,
  origin_lat DECIMAL(10,8) NOT NULL,
  origin_lng DECIMAL(11,8) NOT NULL,
  destination_lat DECIMAL(10,8) NOT NULL,
  destination_lng DECIMAL(11,8) NOT NULL,
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  duration_in_traffic_seconds INTEGER,
  traffic_condition VARCHAR(20),
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 minutes'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_traffic_cache_coords 
ON traffic_cache (origin_lat, origin_lng, destination_lat, destination_lng);

CREATE INDEX IF NOT EXISTS idx_traffic_cache_expires 
ON traffic_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_optimized_routes_vehicle 
ON optimized_routes (vehicle_id, created_at);

-- Route update tracking for real-time monitoring
CREATE TABLE IF NOT EXISTS route_updates (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES optimized_routes(id),
  traffic_condition VARCHAR(20),
  delay_minutes INTEGER,
  new_eta TIMESTAMP,
  update_timestamp TIMESTAMP DEFAULT NOW(),
  update_reason VARCHAR(100)
);

-- Sustainability metrics tracking
CREATE TABLE IF NOT EXISTS sustainability_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_distance_km DECIMAL(8,2),
  total_co2_emissions_kg DECIMAL(8,2),
  co2_saved_vs_naive_kg DECIMAL(8,2),
  fuel_cost_saved DECIMAL(7,2),
  efficiency_percent DECIMAL(5,2),
  sustainability_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add service type and apartment size to jobs for volume estimation
ALTER TABLE job_optimization_factors
ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'moving',
ADD COLUMN IF NOT EXISTS apartment_size VARCHAR(10),
ADD COLUMN IF NOT EXISTS postal_code INTEGER;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache() RETURNS void AS $$
BEGIN
  DELETE FROM traffic_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cache cleanup (requires pg_cron extension)
-- SELECT cron.schedule('clean-traffic-cache', '*/30 * * * *', 'SELECT clean_expired_cache();');

-- Sample vehicles with CO2 data
INSERT INTO vehicles (id, vehicle_type, license_plate, capacity_cubic_meters, co2_emission_grams_per_km, fuel_consumption_per_100km)
VALUES 
  (1, 'small', 'ABC123', 15, 120.0, 6.5),
  (2, 'medium', 'DEF456', 25, 150.0, 8.0),
  (3, 'large', 'GHI789', 40, 180.0, 10.5),
  (4, 'medium', 'JKL012', 25, 150.0, 8.0)
ON CONFLICT (id) DO UPDATE SET
  co2_emission_grams_per_km = EXCLUDED.co2_emission_grams_per_km,
  fuel_consumption_per_100km = EXCLUDED.fuel_consumption_per_100km;