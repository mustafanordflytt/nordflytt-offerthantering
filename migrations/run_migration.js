import pool from '../lib/database/connection.js';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting database migration...');
    
    await client.query(`
      DO $$ 
      BEGIN
        -- Stockholm Areas Table
        CREATE TABLE IF NOT EXISTS stockholm_areas (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          postal_codes INTEGER[] NOT NULL,
          center_lat DECIMAL(10,8) NOT NULL,
          center_lng DECIMAL(11,8) NOT NULL,
          traffic_multiplier DECIMAL(3,2) DEFAULT 1.0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Weather Cache Table  
        CREATE TABLE IF NOT EXISTS stockholm_weather (
          date DATE PRIMARY KEY,
          temperature_avg DECIMAL(4,1),
          precipitation_mm DECIMAL(5,2) DEFAULT 0,
          snow_depth_cm DECIMAL(5,2) DEFAULT 0,
          wind_speed_ms DECIMAL(4,1) DEFAULT 0,
          humidity_percent DECIMAL(4,1) DEFAULT 70,
          visibility_km DECIMAL(4,1) DEFAULT 10,
          fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- AI Schedule Optimizations
        CREATE TABLE IF NOT EXISTS ai_schedule_optimizations (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          cluster_data JSONB,
          estimated_efficiency_percent DECIMAL(5,2),
          weather_impact JSONB,
          optimization_score INTEGER,
          algorithm_used VARCHAR(50) DEFAULT 'DBSCAN',
          status VARCHAR(20) DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Job Optimization Factors
        CREATE TABLE IF NOT EXISTS job_optimization_factors (
          job_id INTEGER PRIMARY KEY,
          address_lat DECIMAL(10,8),
          address_lng DECIMAL(11,8),
          estimated_duration_minutes INTEGER,
          recommended_team_size INTEGER,
          difficulty_score DECIMAL(3,2) DEFAULT 1.0,
          weather_adjusted BOOLEAN DEFAULT FALSE,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_stockholm_areas_postal ON stockholm_areas USING GIN (postal_codes);
        CREATE INDEX IF NOT EXISTS idx_weather_date ON stockholm_weather (date);
        CREATE INDEX IF NOT EXISTS idx_optimizations_date ON ai_schedule_optimizations (date);
        CREATE INDEX IF NOT EXISTS idx_job_factors_location ON job_optimization_factors (address_lat, address_lng);

        -- Insert Stockholm areas data
        INSERT INTO stockholm_areas (name, postal_codes, center_lat, center_lng, traffic_multiplier)
        VALUES 
          ('Södermalm', ARRAY[11646, 11647, 11648], 59.3156, 18.0739, 1.4),
          ('Östermalm', ARRAY[11434, 11435, 11436], 59.3370, 18.0827, 1.6),
          ('Norrmalm', ARRAY[11111, 11142, 11143], 59.3326, 18.0649, 1.8),
          ('Vasastan', ARRAY[11361, 11362, 11363], 59.3467, 18.0508, 1.3),
          ('Gamla Stan', ARRAY[11130], 59.3258, 18.0711, 2.0),
          ('Djurgården', ARRAY[11521], 59.3251, 18.0946, 1.1),
          ('Kungsholmen', ARRAY[11252, 11253], 59.3344, 18.0488, 1.2)
        ON CONFLICT (name) DO UPDATE SET
          postal_codes = EXCLUDED.postal_codes,
          center_lat = EXCLUDED.center_lat,
          center_lng = EXCLUDED.center_lng,
          traffic_multiplier = EXCLUDED.traffic_multiplier;

        -- Insert sample weather data for testing
        INSERT INTO stockholm_weather (date, temperature_avg, precipitation_mm, snow_depth_cm, wind_speed_ms)
        VALUES 
          (CURRENT_DATE, 16.0, 0.0, 0.0, 3.5),
          (CURRENT_DATE + INTERVAL '1 day', 18.0, 2.5, 0.0, 4.0),
          (CURRENT_DATE + INTERVAL '2 days', 15.0, 8.0, 0.0, 6.2)
        ON CONFLICT (date) DO UPDATE SET
          temperature_avg = EXCLUDED.temperature_avg,
          precipitation_mm = EXCLUDED.precipitation_mm,
          snow_depth_cm = EXCLUDED.snow_depth_cm,
          wind_speed_ms = EXCLUDED.wind_speed_ms,
          fetched_at = CURRENT_TIMESTAMP;

        RAISE NOTICE 'Migration completed successfully';
      END $$;
    `);
    
    console.log('✅ Migration completed successfully');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('stockholm_areas', 'stockholm_weather', 'ai_schedule_optimizations', 'job_optimization_factors')
    `);
    
    console.log('✅ Created tables:', result.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runMigration;