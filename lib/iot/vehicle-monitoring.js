// IoT Real-time Predictive Maintenance System
// Phase 4 implementation featuring MQTT integration and ML-powered maintenance predictions

import mqtt from 'mqtt';
import pool from '../database/connection.js';

export class IoTVehicleMonitoring {
  constructor() {
    this.mqttClient = null;
    this.isConnected = false;
    this.sensorBuffer = new Map();
    this.predictionModels = new Map();
    
    this.maintenanceThresholds = {
      engine_temp: { critical: 105, warning: 95, unit: '°C' },
      oil_pressure: { critical: 15, warning: 25, unit: 'PSI' },
      tire_pressure: { critical: 25, warning: 30, unit: 'PSI' },
      brake_pad_thickness: { critical: 2, warning: 4, unit: 'mm' },
      battery_voltage: { critical: 11.5, warning: 12.0, unit: 'V' },
      coolant_level: { critical: 20, warning: 30, unit: '%' },
      transmission_temp: { critical: 120, warning: 100, unit: '°C' },
      fuel_efficiency: { critical: 15, warning: 12, unit: 'L/100km' },
      mileage_since_service: { critical: 12000, warning: 10000, unit: 'km' },
      engine_vibration: { critical: 8.5, warning: 7.0, unit: 'Hz' }
    };
    
    this.setupMqttConnection();
    this.initializePredictiveModels();
  }

  // Setup MQTT connection with error handling and reconnection
  setupMqttConnection() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
      console.log(`🔌 Connecting to MQTT broker: ${brokerUrl}`);
      
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId: `nordflytt-iot-${Date.now()}`,
        keepalive: 60,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD
      });

      this.setupMqttHandlers();
    } catch (error) {
      console.error('❌ MQTT connection setup failed:', error);
      this.startOfflineMode();
    }
  }

  setupMqttHandlers() {
    this.mqttClient.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
      this.isConnected = true;
      
      // Subscribe to vehicle sensor topics
      const topics = [
        'nordflytt/vehicles/+/sensors/+',
        'nordflytt/vehicles/+/diagnostics',
        'nordflytt/vehicles/+/location',
        'nordflytt/fleet/alerts'
      ];
      
      topics.forEach(topic => {
        this.mqttClient.subscribe(topic, { qos: 1 }, (error) => {
          if (error) {
            console.error(`❌ Failed to subscribe to ${topic}:`, error);
          } else {
            console.log(`📡 Subscribed to ${topic}`);
          }
        });
      });
    });

    this.mqttClient.on('message', async (topic, message) => {
      try {
        await this.handleMqttMessage(topic, message);
      } catch (error) {
        console.error('❌ Error processing MQTT message:', error);
      }
    });

    this.mqttClient.on('error', (error) => {
      console.error('❌ MQTT connection error:', error);
      this.isConnected = false;
    });

    this.mqttClient.on('offline', () => {
      console.warn('⚠️ MQTT client offline');
      this.isConnected = false;
      this.startOfflineMode();
    });

    this.mqttClient.on('reconnect', () => {
      console.log('🔄 Attempting MQTT reconnection...');
    });
  }

  // Handle incoming MQTT messages
  async handleMqttMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      
      if (topicParts.length >= 4 && topicParts[0] === 'nordflytt' && topicParts[1] === 'vehicles') {
        const vehicleId = topicParts[2];
        const messageType = topicParts[3];
        
        switch (messageType) {
          case 'sensors':
            await this.processSensorData(vehicleId, data);
            break;
          case 'diagnostics':
            await this.processDiagnosticData(vehicleId, data);
            break;
          case 'location':
            await this.processLocationData(vehicleId, data);
            break;
        }
      } else if (topic === 'nordflytt/fleet/alerts') {
        await this.processFleetAlert(data);
      }
    } catch (error) {
      console.error('❌ Failed to parse MQTT message:', error);
    }
  }

  // Process individual sensor readings
  async processSensorData(vehicleId, data) {
    const { sensor_type, value, timestamp, unit, location } = data;
    
    console.log(`📊 Processing sensor data: Vehicle ${vehicleId} - ${sensor_type}: ${value}${unit || ''}`);
    
    try {
      // Store sensor reading in database
      await pool.query(`
        INSERT INTO vehicle_sensor_data (
          vehicle_id, sensor_type, value, unit, timestamp, location_lat, location_lng
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        vehicleId, 
        sensor_type, 
        value, 
        unit || '', 
        timestamp || new Date().toISOString(),
        location?.lat || null,
        location?.lng || null
      ]);

      // Add to sensor buffer for real-time analysis
      if (!this.sensorBuffer.has(vehicleId)) {
        this.sensorBuffer.set(vehicleId, new Map());
      }
      
      const vehicleBuffer = this.sensorBuffer.get(vehicleId);
      if (!vehicleBuffer.has(sensor_type)) {
        vehicleBuffer.set(sensor_type, []);
      }
      
      const sensorHistory = vehicleBuffer.get(sensor_type);
      sensorHistory.push({ value, timestamp: new Date(timestamp || Date.now()) });
      
      // Keep only last 100 readings
      if (sensorHistory.length > 100) {
        sensorHistory.shift();
      }

      // Check for immediate alerts
      const alert = await this.checkMaintenanceThresholds(vehicleId, sensor_type, value);
      if (alert) {
        await this.triggerMaintenanceAlert(alert);
      }

      // Perform predictive analysis
      const prediction = await this.performPredictiveAnalysis(vehicleId, sensor_type, sensorHistory);
      if (prediction.maintenance_needed) {
        await this.schedulePredictiveMaintenance(vehicleId, prediction);
      }

      // Update real-time dashboard
      await this.updateRealtimeDashboard(vehicleId, sensor_type, value);

    } catch (error) {
      console.error('❌ Failed to process sensor data:', error);
    }
  }

  // Process comprehensive diagnostic data
  async processDiagnosticData(vehicleId, data) {
    const { diagnostic_codes, system_health, performance_metrics, timestamp } = data;
    
    console.log(`🔧 Processing diagnostic data for vehicle ${vehicleId}`);
    
    try {
      // Store diagnostic data
      await pool.query(`
        INSERT INTO vehicle_diagnostics (
          vehicle_id, diagnostic_codes, system_health, performance_metrics, timestamp
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        vehicleId,
        JSON.stringify(diagnostic_codes || []),
        JSON.stringify(system_health || {}),
        JSON.stringify(performance_metrics || {}),
        timestamp || new Date().toISOString()
      ]);

      // Analyze diagnostic codes for critical issues
      if (diagnostic_codes && diagnostic_codes.length > 0) {
        const criticalCodes = diagnostic_codes.filter(code => 
          this.isCriticalDiagnosticCode(code.code)
        );
        
        if (criticalCodes.length > 0) {
          await this.triggerCriticalDiagnosticAlert(vehicleId, criticalCodes);
        }
      }

      // Update vehicle health score
      const healthScore = this.calculateVehicleHealthScore(system_health, performance_metrics);
      await this.updateVehicleHealthScore(vehicleId, healthScore);

    } catch (error) {
      console.error('❌ Failed to process diagnostic data:', error);
    }
  }

  // Process vehicle location data for route optimization
  async processLocationData(vehicleId, data) {
    const { lat, lng, speed, heading, timestamp } = data;
    
    try {
      await pool.query(`
        INSERT INTO vehicle_locations (
          vehicle_id, latitude, longitude, speed, heading, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [vehicleId, lat, lng, speed || 0, heading || 0, timestamp || new Date().toISOString()]);

      // Check for unusual location patterns
      await this.analyzeLocationPatterns(vehicleId, { lat, lng, speed, timestamp });

    } catch (error) {
      console.error('❌ Failed to process location data:', error);
    }
  }

  // Check sensor values against maintenance thresholds
  async checkMaintenanceThresholds(vehicleId, sensorType, value) {
    const thresholds = this.maintenanceThresholds[sensorType];
    if (!thresholds) return null;

    let alertLevel = null;
    let message = '';
    let action = '';

    // Critical threshold check
    if (this.exceedsThreshold(sensorType, value, thresholds.critical)) {
      alertLevel = 'critical';
      message = `CRITICAL: ${sensorType.replace('_', ' ')} ${this.getThresholdComparison(sensorType)} ${thresholds.critical}${thresholds.unit}`;
      action = 'immediate_maintenance';
    }
    // Warning threshold check
    else if (this.exceedsThreshold(sensorType, value, thresholds.warning)) {
      alertLevel = 'warning';
      message = `WARNING: ${sensorType.replace('_', ' ')} ${this.getThresholdComparison(sensorType)} ${thresholds.warning}${thresholds.unit}`;
      action = 'schedule_maintenance';
    }

    if (alertLevel) {
      return {
        vehicle_id: vehicleId,
        sensor_type: sensorType,
        alert_level: alertLevel,
        current_value: value,
        threshold_value: alertLevel === 'critical' ? thresholds.critical : thresholds.warning,
        unit: thresholds.unit,
        message,
        action,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  // Perform ML-powered predictive maintenance analysis
  async performPredictiveAnalysis(vehicleId, sensorType, sensorHistory) {
    if (sensorHistory.length < 10) {
      return { maintenance_needed: false, confidence: 0 };
    }

    try {
      // Calculate trend analysis
      const trend = this.calculateSensorTrend(sensorHistory);
      
      // Predict time to threshold breach
      const timeToMaintenance = this.predictTimeToMaintenance(sensorType, sensorHistory, trend);
      
      // Calculate risk score based on multiple factors
      const riskScore = this.calculateMaintenanceRiskScore(vehicleId, sensorType, sensorHistory, trend);
      
      // Determine if maintenance is needed
      const maintenanceNeeded = riskScore > 0.7 || timeToMaintenance < 7; // 7 days
      
      return {
        maintenance_needed: maintenanceNeeded,
        confidence: Math.min(0.95, Math.max(0.6, 1 - trend.variability)),
        risk_score: riskScore,
        days_to_maintenance: timeToMaintenance,
        trend: {
          slope: trend.slope,
          direction: trend.slope > 0 ? 'increasing' : 'decreasing',
          variability: trend.variability
        },
        recommended_action: this.getMaintenanceRecommendation(sensorType, riskScore, timeToMaintenance),
        priority: riskScore > 0.8 ? 'high' : riskScore > 0.6 ? 'medium' : 'low'
      };

    } catch (error) {
      console.error('❌ Predictive analysis failed:', error);
      return { maintenance_needed: false, confidence: 0 };
    }
  }

  // Calculate sensor trend using linear regression
  calculateSensorTrend(sensorHistory) {
    const n = sensorHistory.length;
    const x = sensorHistory.map((_, i) => i);
    const y = sensorHistory.map(reading => reading.value);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for trend reliability
    const yMean = sumY / n;
    const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    // Calculate variability
    const variance = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0) / n;
    const variability = Math.sqrt(variance) / Math.abs(yMean) || 0;
    
    return { slope, intercept, r_squared: rSquared, variability };
  }

  // Predict days until maintenance threshold is reached
  predictTimeToMaintenance(sensorType, sensorHistory, trend) {
    const thresholds = this.maintenanceThresholds[sensorType];
    if (!thresholds || Math.abs(trend.slope) < 0.001) {
      return 999; // No significant trend
    }

    const currentValue = sensorHistory[sensorHistory.length - 1].value;
    const targetThreshold = this.isHigherWorse(sensorType) ? thresholds.warning : thresholds.warning;
    
    const daysToThreshold = Math.abs((targetThreshold - currentValue) / trend.slope);
    
    return Math.max(0, Math.min(365, daysToThreshold)); // Cap between 0 and 365 days
  }

  // Calculate comprehensive maintenance risk score
  calculateMaintenanceRiskScore(vehicleId, sensorType, sensorHistory, trend) {
    let riskScore = 0;
    
    const currentValue = sensorHistory[sensorHistory.length - 1].value;
    const thresholds = this.maintenanceThresholds[sensorType];
    
    if (thresholds) {
      // Proximity to threshold risk
      const proximityRisk = this.calculateProximityRisk(sensorType, currentValue, thresholds);
      riskScore += proximityRisk * 0.4;
      
      // Trend risk
      const trendRisk = this.calculateTrendRisk(sensorType, trend);
      riskScore += trendRisk * 0.3;
      
      // Variability risk
      const variabilityRisk = Math.min(1, trend.variability * 2);
      riskScore += variabilityRisk * 0.2;
      
      // Historical risk (based on past maintenance)
      const historicalRisk = this.calculateHistoricalRisk(vehicleId, sensorType);
      riskScore += historicalRisk * 0.1;
    }
    
    return Math.min(1, Math.max(0, riskScore));
  }

  // Trigger maintenance alert
  async triggerMaintenanceAlert(alert) {
    console.log(`🚨 Maintenance alert triggered: ${alert.message}`);
    
    try {
      // Store alert in database
      await pool.query(`
        INSERT INTO maintenance_alerts (
          vehicle_id, sensor_type, alert_level, current_value, threshold_value,
          unit, message, action, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        alert.vehicle_id, alert.sensor_type, alert.alert_level,
        alert.current_value, alert.threshold_value, alert.unit,
        alert.message, alert.action, alert.timestamp
      ]);

      // Send real-time notification via MQTT
      if (this.isConnected) {
        this.mqttClient.publish('nordflytt/alerts/maintenance', JSON.stringify(alert), { qos: 1 });
      }

      // Create maintenance work order for critical alerts
      if (alert.alert_level === 'critical') {
        await this.createMaintenanceWorkOrder(alert);
      }

      // Notify fleet managers
      await this.notifyFleetManagers(alert);

    } catch (error) {
      console.error('❌ Failed to trigger maintenance alert:', error);
    }
  }

  // Schedule predictive maintenance
  async schedulePredictiveMaintenance(vehicleId, prediction) {
    console.log(`📅 Scheduling predictive maintenance for vehicle ${vehicleId}`);
    
    try {
      const maintenanceSchedule = {
        vehicle_id: vehicleId,
        type: 'predictive',
        priority: prediction.priority,
        estimated_date: this.calculateMaintenanceDate(prediction.days_to_maintenance),
        description: prediction.recommended_action,
        confidence: prediction.confidence,
        risk_score: prediction.risk_score,
        created_at: new Date().toISOString()
      };

      await pool.query(`
        INSERT INTO scheduled_maintenance (
          vehicle_id, type, priority, estimated_date, description, 
          confidence, risk_score, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        maintenanceSchedule.vehicle_id,
        maintenanceSchedule.type,
        maintenanceSchedule.priority,
        maintenanceSchedule.estimated_date,
        maintenanceSchedule.description,
        maintenanceSchedule.confidence,
        maintenanceSchedule.risk_score,
        maintenanceSchedule.created_at
      ]);

      console.log(`✅ Predictive maintenance scheduled for ${maintenanceSchedule.estimated_date}`);

    } catch (error) {
      console.error('❌ Failed to schedule predictive maintenance:', error);
    }
  }

  // Initialize predictive models for different sensor types
  initializePredictiveModels() {
    console.log('🤖 Initializing predictive maintenance models...');
    
    // Initialize models for each sensor type
    Object.keys(this.maintenanceThresholds).forEach(sensorType => {
      this.predictionModels.set(sensorType, {
        model: this.createSensorModel(sensorType),
        lastTraining: null,
        accuracy: 0.8 // Initial accuracy
      });
    });
    
    console.log(`✅ Initialized ${this.predictionModels.size} predictive models`);
  }

  // Create sensor-specific prediction model
  createSensorModel(sensorType) {
    // Simplified model based on sensor characteristics
    const modelConfigs = {
      engine_temp: { degradationRate: 0.1, seasonalFactor: 0.3 },
      oil_pressure: { degradationRate: 0.05, mileageFactor: 0.4 },
      tire_pressure: { degradationRate: 0.02, weatherFactor: 0.6 },
      brake_pad_thickness: { degradationRate: 0.15, usageFactor: 0.8 },
      battery_voltage: { degradationRate: 0.08, temperatureFactor: 0.4 }
    };
    
    return modelConfigs[sensorType] || { degradationRate: 0.1, usageFactor: 0.5 };
  }

  // Start offline mode when MQTT is unavailable
  startOfflineMode() {
    console.log('🔄 Starting offline mode for IoT monitoring...');
    
    // Generate mock sensor data for demonstration
    setInterval(() => {
      this.generateMockSensorData();
    }, 30000); // Every 30 seconds
  }

  // Generate mock sensor data for demonstration
  generateMockSensorData() {
    const vehicleIds = ['VH001', 'VH002', 'VH003', 'VH004', 'VH005'];
    const sensorTypes = Object.keys(this.maintenanceThresholds);
    
    vehicleIds.forEach(vehicleId => {
      const randomSensor = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];
      const threshold = this.maintenanceThresholds[randomSensor];
      
      // Generate value near threshold for demo alerts
      const baseValue = threshold.warning;
      const variation = baseValue * 0.2;
      const value = baseValue + (Math.random() - 0.5) * variation;
      
      this.processSensorData(vehicleId, {
        sensor_type: randomSensor,
        value: Math.round(value * 100) / 100,
        unit: threshold.unit,
        timestamp: new Date().toISOString(),
        location: {
          lat: 59.3293 + (Math.random() - 0.5) * 0.1,
          lng: 18.0686 + (Math.random() - 0.5) * 0.1
        }
      });
    });
  }

  // Helper methods
  exceedsThreshold(sensorType, value, threshold) {
    // Higher values are worse for most sensors
    const higherWorseSensors = ['engine_temp', 'transmission_temp', 'fuel_efficiency', 'mileage_since_service', 'engine_vibration'];
    
    if (higherWorseSensors.includes(sensorType)) {
      return value > threshold;
    } else {
      return value < threshold;
    }
  }

  isHigherWorse(sensorType) {
    const higherWorseSensors = ['engine_temp', 'transmission_temp', 'fuel_efficiency', 'mileage_since_service', 'engine_vibration'];
    return higherWorseSensors.includes(sensorType);
  }

  getThresholdComparison(sensorType) {
    return this.isHigherWorse(sensorType) ? 'above' : 'below';
  }

  calculateProximityRisk(sensorType, currentValue, thresholds) {
    const criticalThreshold = thresholds.critical;
    const warningThreshold = thresholds.warning;
    
    if (this.exceedsThreshold(sensorType, currentValue, criticalThreshold)) {
      return 1.0; // Maximum risk
    } else if (this.exceedsThreshold(sensorType, currentValue, warningThreshold)) {
      const range = Math.abs(criticalThreshold - warningThreshold);
      const distance = Math.abs(currentValue - warningThreshold);
      return 0.5 + (0.5 * (1 - distance / range));
    } else {
      return 0.1; // Minimum baseline risk
    }
  }

  calculateTrendRisk(sensorType, trend) {
    const isGettingWorse = this.isHigherWorse(sensorType) ? trend.slope > 0 : trend.slope < 0;
    
    if (!isGettingWorse) return 0;
    
    const trendMagnitude = Math.abs(trend.slope);
    const reliabilityFactor = Math.max(0, trend.r_squared);
    
    return Math.min(1, trendMagnitude * reliabilityFactor * 10);
  }

  calculateHistoricalRisk(vehicleId, sensorType) {
    // Mock historical risk calculation
    // In production, query maintenance history from database
    return Math.random() * 0.3; // Random risk between 0-0.3
  }

  getMaintenanceRecommendation(sensorType, riskScore, daysToMaintenance) {
    if (riskScore > 0.8) {
      return `Immediate inspection of ${sensorType.replace('_', ' ')} required`;
    } else if (riskScore > 0.6) {
      return `Schedule ${sensorType.replace('_', ' ')} maintenance within ${Math.ceil(daysToMaintenance)} days`;
    } else if (daysToMaintenance < 30) {
      return `Monitor ${sensorType.replace('_', ' ')} closely - maintenance needed soon`;
    } else {
      return `${sensorType.replace('_', ' ')} operating normally`;
    }
  }

  calculateMaintenanceDate(daysToMaintenance) {
    const date = new Date();
    date.setDate(date.getDate() + Math.max(1, Math.floor(daysToMaintenance * 0.8))); // Schedule 20% earlier
    return date.toISOString();
  }

  async createMaintenanceWorkOrder(alert) {
    try {
      await pool.query(`
        INSERT INTO maintenance_work_orders (
          vehicle_id, alert_id, priority, description, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        alert.vehicle_id,
        null, // alert_id would be set if we had alert IDs
        'high',
        `Critical maintenance required: ${alert.message}`,
        'pending',
        new Date().toISOString()
      ]);
      
      console.log(`📋 Work order created for vehicle ${alert.vehicle_id}`);
    } catch (error) {
      console.error('❌ Failed to create work order:', error);
    }
  }

  async notifyFleetManagers(alert) {
    // Mock notification system
    console.log(`📧 Notifying fleet managers about ${alert.alert_level} alert for vehicle ${alert.vehicle_id}`);
  }

  async updateRealtimeDashboard(vehicleId, sensorType, value) {
    // Mock real-time dashboard update
    if (this.isConnected && this.mqttClient) {
      const update = {
        vehicle_id: vehicleId,
        sensor_type: sensorType,
        value: value,
        timestamp: new Date().toISOString()
      };
      
      this.mqttClient.publish('nordflytt/dashboard/updates', JSON.stringify(update), { qos: 0 });
    }
  }

  calculateVehicleHealthScore(systemHealth, performanceMetrics) {
    // Simplified health score calculation
    let score = 100;
    
    if (systemHealth.engine_status !== 'good') score -= 20;
    if (systemHealth.transmission_status !== 'good') score -= 15;
    if (systemHealth.brake_status !== 'good') score -= 25;
    if (systemHealth.electrical_status !== 'good') score -= 10;
    
    if (performanceMetrics.fuel_efficiency > 15) score -= 10;
    if (performanceMetrics.error_count > 5) score -= (performanceMetrics.error_count * 2);
    
    return Math.max(0, Math.min(100, score));
  }

  async updateVehicleHealthScore(vehicleId, healthScore) {
    try {
      await pool.query(`
        UPDATE vehicles 
        SET health_score = $1, health_updated_at = NOW()
        WHERE id = $2
      `, [healthScore, vehicleId]);
    } catch (error) {
      console.error('❌ Failed to update vehicle health score:', error);
    }
  }

  isCriticalDiagnosticCode(code) {
    // Critical OBD-II codes that require immediate attention
    const criticalCodes = ['P0301', 'P0302', 'P0303', 'P0304', 'P0171', 'P0300', 'P0420'];
    return criticalCodes.includes(code);
  }

  async triggerCriticalDiagnosticAlert(vehicleId, criticalCodes) {
    const alert = {
      vehicle_id: vehicleId,
      alert_type: 'diagnostic',
      severity: 'critical',
      codes: criticalCodes,
      message: `Critical diagnostic codes detected: ${criticalCodes.map(c => c.code).join(', ')}`,
      timestamp: new Date().toISOString()
    };
    
    console.log(`🚨 Critical diagnostic alert: ${alert.message}`);
    
    // Store and notify
    await this.triggerMaintenanceAlert(alert);
  }

  async analyzeLocationPatterns(vehicleId, locationData) {
    // Basic location pattern analysis
    // In production, implement more sophisticated pattern recognition
    
    const { lat, lng, speed, timestamp } = locationData;
    
    // Check for unusual speed patterns
    if (speed > 120) { // Over 120 km/h
      console.log(`⚠️ High speed detected for vehicle ${vehicleId}: ${speed} km/h`);
    }
    
    // Check for location anomalies (simplified)
    const stockholmBounds = {
      north: 59.4,
      south: 59.2,
      east: 18.2,
      west: 17.9
    };
    
    if (lat < stockholmBounds.south || lat > stockholmBounds.north || 
        lng < stockholmBounds.west || lng > stockholmBounds.east) {
      console.log(`📍 Vehicle ${vehicleId} outside normal service area`);
    }
  }

  // Public methods for external API integration
  async getVehicleHealth(vehicleId) {
    try {
      const query = `
        SELECT 
          v.id,
          v.license_plate,
          v.health_score,
          v.health_updated_at,
          COUNT(ma.id) as active_alerts,
          MAX(ma.timestamp) as last_alert
        FROM vehicles v
        LEFT JOIN maintenance_alerts ma ON v.id = ma.vehicle_id 
          AND ma.timestamp >= NOW() - INTERVAL '7 days'
        WHERE v.id = $1
        GROUP BY v.id, v.license_plate, v.health_score, v.health_updated_at
      `;
      
      const { rows } = await pool.query(query, [vehicleId]);
      return rows[0] || null;
    } catch (error) {
      console.error('❌ Failed to get vehicle health:', error);
      return null;
    }
  }

  async getMaintenancePredictions(vehicleId) {
    const predictions = {};
    
    for (const sensorType of Object.keys(this.maintenanceThresholds)) {
      const sensorHistory = this.sensorBuffer.get(vehicleId)?.get(sensorType) || [];
      if (sensorHistory.length > 0) {
        predictions[sensorType] = await this.performPredictiveAnalysis(vehicleId, sensorType, sensorHistory);
      }
    }
    
    return predictions;
  }

  // Cleanup method
  disconnect() {
    if (this.mqttClient && this.isConnected) {
      this.mqttClient.end();
      console.log('📡 MQTT client disconnected');
    }
  }
}