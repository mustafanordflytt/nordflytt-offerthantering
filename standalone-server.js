import express from 'express';
import { StockholmDBSCANOptimizer } from './lib/ai/dbscan-clustering.js';
import { StockholmWeatherService } from './lib/weather/stockholm-weather-service.js';
import winston from 'winston';
import pool from './lib/database/connection.js';
import dotenv from 'dotenv';
import runMigration from './migrations/run_migration.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || 'error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Error response helper
const sendError = (res, statusCode, message, details = null) => {
  logger.error(`${statusCode}: ${message}`, { details });
  res.status(statusCode).json({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  });
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files
app.use(express.static('dist'));
app.use('/assets', express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Get jobs for a specific date
app.get('/api/jobs', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return sendError(res, 400, 'Date parameter is required');
    }

    // Query optimized job factors
    const { rows } = await pool.query(`
      SELECT 
        jof.job_id as id,
        jof.address_lat as lat,
        jof.address_lng as lng,
        jof.estimated_duration_minutes,
        jof.recommended_team_size,
        jof.difficulty_score,
        COALESCE(j.customer_name, 'Okänd kund') as customer_name,
        COALESCE(j.estimated_volume_m3, 15) as estimated_volume_m3,
        COALESCE(j.floors_total, 1) as floors_total,
        COALESCE(j.heavy_appliances_count, 0) as heavy_appliances_count,
        COALESCE(j.piano_count, 0) as piano_count
      FROM job_optimization_factors jof
      LEFT JOIN jobs j ON j.id = jof.job_id
      WHERE jof.last_updated::date = $1
      ORDER BY jof.job_id
    `, [date]);

    // If no jobs found, return sample data for demo
    if (rows.length === 0) {
      logger.info(`No jobs found for date ${date}, returning sample data`);
      const sampleJobs = [
        { id: 1, lat: 59.3293, lng: 18.0686, customer_name: 'Stadshuset AB', estimated_duration_minutes: 180, estimated_volume_m3: 25, floors_total: 2 },
        { id: 2, lat: 59.3156, lng: 18.0739, customer_name: 'Söder Familjen', estimated_duration_minutes: 120, estimated_volume_m3: 15, floors_total: 3 },
        { id: 3, lat: 59.3370, lng: 18.0827, customer_name: 'Östermalm Kontor', estimated_duration_minutes: 240, estimated_volume_m3: 40, floors_total: 1 },
        { id: 4, lat: 59.3467, lng: 18.0508, customer_name: 'Vasastan Villa', estimated_duration_minutes: 300, estimated_volume_m3: 60, floors_total: 4 },
        { id: 5, lat: 59.3344, lng: 18.0488, customer_name: 'Kungsholmen Byte', estimated_duration_minutes: 90, estimated_volume_m3: 10, floors_total: 1 }
      ];
      return res.json(sampleJobs);
    }

    logger.info(`Found ${rows.length} jobs for date ${date}`);
    res.json(rows);
  } catch (error) {
    sendError(res, 500, 'Failed to fetch jobs', error.message);
  }
});

// Get weather for a specific date
app.get('/api/weather', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return sendError(res, 400, 'Date parameter is required');
    }

    const weatherService = new StockholmWeatherService();
    const weatherData = await weatherService.getWeatherImpactForDate(date);
    
    logger.info(`Weather data fetched for ${date}: ${weatherData.weather?.temperature_avg}°C`);
    res.json(weatherData);
  } catch (error) {
    sendError(res, 500, 'Failed to fetch weather data', error.message);
  }
});

// Optimize schedule using DBSCAN
app.post('/api/optimize-schedule', async (req, res) => {
  try {
    const { date, jobs } = req.body;

    // Validation
    if (!date) {
      return sendError(res, 400, 'Date is required');
    }
    
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return sendError(res, 400, 'Jobs array is required and must not be empty');
    }

    logger.info(`Starting optimization for ${date} with ${jobs.length} jobs`);
    
    // Initialize optimizer
    const optimizer = new StockholmDBSCANOptimizer();
    
    // Run optimization
    const result = await optimizer.optimizeJobClustering(jobs, date);
    
    // Store optimization result in database
    try {
      await pool.query(`
        INSERT INTO ai_schedule_optimizations 
        (date, cluster_data, estimated_efficiency_percent, weather_impact, optimization_score, algorithm_used)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        date,
        JSON.stringify(result.clusters),
        result.efficiency_gain,
        JSON.stringify(result.weather_impact),
        result.optimization_score,
        'DBSCAN'
      ]);
    } catch (dbError) {
      logger.warn('Failed to store optimization result in database:', dbError.message);
    }

    logger.info(`Optimization completed: ${result.efficiency_gain}% efficiency, ${result.clusters?.length || 0} clusters`);
    
    res.json({
      success: true,
      ...result,
      meta: {
        algorithm: 'DBSCAN',
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - req.startTime
      }
    });
  } catch (error) {
    logger.error('Optimization failed:', error);
    sendError(res, 500, 'Schedule optimization failed', error.message);
  }
});

// Get optimization history
app.get('/api/optimizations', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const { rows } = await pool.query(`
      SELECT 
        id,
        date,
        estimated_efficiency_percent,
        optimization_score,
        algorithm_used,
        status,
        created_at
      FROM ai_schedule_optimizations
      ORDER BY created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json(rows);
  } catch (error) {
    sendError(res, 500, 'Failed to fetch optimization history', error.message);
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  sendError(res, 500, 'Internal server error', error.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Run database migration
    logger.info('Running database migration...');
    await runMigration();
    
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection verified');
    
    // Start Express server
    app.listen(port, () => {
      logger.info(`🚀 Nordflytt AI Optimization Server running on port ${port}`);
      logger.info(`📍 Health check: http://localhost:${port}/health`);
      logger.info(`🗺️  Dashboard: http://localhost:${port}`);
      logger.info(`🤖 API: http://localhost:${port}/api/optimize-schedule`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();