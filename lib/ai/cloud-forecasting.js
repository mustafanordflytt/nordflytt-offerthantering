// Cloud ML Forecasting System with AWS SageMaker
// Phase 4 implementation featuring LSTM training and real-time predictions

import AWS from 'aws-sdk';
import pool from '../database/connection.js';

export class CloudMLForecaster {
  constructor() {
    this.sagemaker = new AWS.SageMaker({
      region: process.env.AWS_REGION || 'eu-north-1' // Stockholm region
    });
    this.sagemakerRuntime = new AWS.SageMakerRuntime({
      region: process.env.AWS_REGION || 'eu-north-1'
    });
    this.s3 = new AWS.S3();
    this.modelEndpoint = 'demand-forecast-lstm-endpoint';
    this.bucketName = process.env.S3_BUCKET || 'nordflytt-ml-data';
  }

  // Prepare comprehensive training data for SageMaker LSTM model
  async prepareTrainingData() {
    console.log('📊 Preparing training data for cloud ML model...');
    
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as booking_count,
        AVG(total_amount) as avg_revenue,
        SUM(total_amount) as total_revenue,
        EXTRACT(DOW FROM created_at) as day_of_week,
        EXTRACT(MONTH FROM created_at) as month,
        EXTRACT(DAY FROM created_at) as day_of_month,
        EXTRACT(WEEK FROM created_at) as week_of_year,
        COUNT(DISTINCT customer_id) as unique_customers,
        AVG(CASE WHEN service_type = 'residential' THEN 1 ELSE 0 END) as residential_ratio,
        AVG(CASE WHEN service_type = 'commercial' THEN 1 ELSE 0 END) as commercial_ratio,
        AVG(distance_km) as avg_distance,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM jobs 
      WHERE created_at >= NOW() - INTERVAL '2 years'
        AND created_at < NOW()
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    
    try {
      const { rows } = await pool.query(query);
      console.log(`📈 Retrieved ${rows.length} days of historical data`);
      
      // Add weather data and external factors
      const enrichedData = await Promise.all(rows.map(async (row, index) => {
        const weather = await this.getHistoricalWeather(row.date);
        const externalFactors = await this.getExternalFactors(row.date);
        
        return {
          ...row,
          // Weather features
          temperature: weather.temperature_avg || 15,
          precipitation: weather.precipitation_mm || 0,
          snow_depth: weather.snow_depth_cm || 0,
          wind_speed: weather.wind_speed_ms || 5,
          weather_difficulty: this.calculateWeatherDifficulty(weather),
          
          // External factors
          is_holiday: externalFactors.is_holiday || false,
          is_weekend: row.day_of_week === 0 || row.day_of_week === 6,
          season: this.getSeason(row.month),
          
          // Lag features (previous days)
          lag_1: index > 0 ? rows[index - 1].booking_count : row.booking_count,
          lag_7: index > 6 ? rows[index - 7].booking_count : row.booking_count,
          lag_30: index > 29 ? rows[index - 30].booking_count : row.booking_count,
          
          // Rolling averages
          ma_7: this.calculateMovingAverage(rows, index, 7, 'booking_count'),
          ma_30: this.calculateMovingAverage(rows, index, 30, 'booking_count'),
          
          // Trend features
          trend_7: this.calculateTrend(rows, index, 7, 'booking_count'),
          trend_30: this.calculateTrend(rows, index, 30, 'booking_count')
        };
      }));

      // Convert to CSV format optimized for SageMaker
      const csvData = this.convertToTimeSeriesCSV(enrichedData);
      
      // Upload to S3 with versioning
      const timestamp = Date.now();
      const s3Key = `training-data/demand-forecast-${timestamp}.csv`;
      
      await this.s3.upload({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: csvData,
        ContentType: 'text/csv',
        Metadata: {
          'data-points': enrichedData.length.toString(),
          'features': '20',
          'time-range': '2-years',
          'created': new Date().toISOString()
        }
      }).promise();

      console.log(`💾 Training data uploaded to S3: ${s3Key}`);
      return { s3Key, dataPoints: enrichedData.length, features: enrichedData[0] ? Object.keys(enrichedData[0]).length : 0 };

    } catch (error) {
      console.error('❌ Failed to prepare training data:', error);
      throw error;
    }
  }

  // Train advanced LSTM model using AWS SageMaker
  async trainCloudModel() {
    console.log('🚀 Starting cloud LSTM model training...');
    
    try {
      const trainingData = await this.prepareTrainingData();
      
      const trainingJobName = `demand-forecast-lstm-${Date.now()}`;
      
      const trainingParams = {
        TrainingJobName: trainingJobName,
        AlgorithmSpecification: {
          TrainingImage: `382416733822.dkr.ecr.eu-north-1.amazonaws.com/lstm-forecasting:latest`,
          TrainingInputMode: 'File'
        },
        RoleArn: process.env.SAGEMAKER_ROLE_ARN,
        InputDataConfig: [{
          ChannelName: 'training',
          DataSource: {
            S3DataSource: {
              S3DataType: 'S3Prefix',
              S3Uri: `s3://${this.bucketName}/${trainingData.s3Key}`,
              S3DataDistributionType: 'FullyReplicated'
            }
          },
          ContentType: 'text/csv',
          CompressionType: 'None'
        }],
        OutputDataConfig: {
          S3OutputPath: `s3://${this.bucketName}/model-output/`
        },
        ResourceConfig: {
          InstanceType: 'ml.m5.xlarge',
          InstanceCount: 1,
          VolumeSizeInGB: 50
        },
        StoppingCondition: {
          MaxRuntimeInSeconds: 86400 // 24 hours max
        },
        HyperParameters: {
          epochs: '100',
          batch_size: '32',
          learning_rate: '0.001',
          sequence_length: '30',
          hidden_units: '128',
          dropout_rate: '0.2',
          validation_split: '0.2',
          early_stopping_patience: '10'
        },
        Tags: [
          { Key: 'Project', Value: 'Nordflytt-ML' },
          { Key: 'Model', Value: 'LSTM-Demand-Forecast' },
          { Key: 'Version', Value: 'v4.0' }
        ]
      };

      const trainingJob = await this.sagemaker.createTrainingJob(trainingParams).promise();
      console.log(`✅ Training job started: ${trainingJob.TrainingJobArn}`);
      
      // Wait for completion and deploy endpoint
      await this.waitForTrainingCompletion(trainingJobName);
      await this.deployModel(trainingJobName);
      
      return {
        trainingJobArn: trainingJob.TrainingJobArn,
        trainingJobName,
        dataPoints: trainingData.dataPoints,
        features: trainingData.features,
        status: 'training_started'
      };

    } catch (error) {
      console.error('❌ Cloud model training failed:', error);
      throw error;
    }
  }

  // Real-time prediction using deployed SageMaker endpoint
  async predictDemandCloud(daysAhead = 14) {
    console.log(`🔮 Generating ${daysAhead}-day demand forecast using cloud ML...`);
    
    try {
      const features = await this.prepareFeatures(daysAhead);
      const csvInput = this.convertToTimeSeriesCSV(features);
      
      const params = {
        EndpointName: this.modelEndpoint,
        ContentType: 'text/csv',
        Body: csvInput
      };

      const prediction = await this.sagemakerRuntime.invokeEndpoint(params).promise();
      const results = JSON.parse(prediction.Body.toString());
      
      const forecasts = results.map((result, index) => ({
        date: this.getFutureDate(index + 1),
        predicted_bookings: Math.round(Math.max(0, result.prediction)),
        confidence_lower: Math.round(Math.max(0, result.prediction - result.std * 1.96)),
        confidence_upper: Math.round(result.prediction + result.std * 1.96),
        confidence: Math.min(0.95, Math.max(0.6, result.confidence || 0.85)),
        model_version: 'cloud-lstm-v4.0',
        factors: {
          weather_impact: result.weather_impact || 0,
          trend_impact: result.trend_impact || 0,
          seasonal_impact: result.seasonal_impact || 0
        }
      }));

      console.log(`📊 Generated ${forecasts.length} predictions with avg confidence ${(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length * 100).toFixed(1)}%`);
      
      return forecasts;

    } catch (error) {
      console.error('❌ Cloud prediction failed, using fallback:', error);
      return this.getFallbackPredictions(daysAhead);
    }
  }

  // Auto-retrain model based on performance metrics
  async scheduleAutoRetrain() {
    const checkInterval = 24 * 60 * 60 * 1000; // Daily check
    
    setInterval(async () => {
      try {
        const modelPerformance = await this.evaluateModelPerformance();
        
        if (modelPerformance.accuracy < 0.85 || modelPerformance.drift_detected) {
          console.log('🔄 Model performance degraded, starting automatic retraining...');
          await this.trainCloudModel();
        } else {
          console.log(`✅ Model performance acceptable: ${(modelPerformance.accuracy * 100).toFixed(1)}% accuracy`);
        }
      } catch (error) {
        console.error('❌ Auto-retrain check failed:', error);
      }
    }, checkInterval);

    console.log('⏰ Auto-retrain scheduler activated (daily checks)');
  }

  // Wait for SageMaker training job completion
  async waitForTrainingCompletion(trainingJobName, maxWaitTime = 3600000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.sagemaker.describeTrainingJob({
          TrainingJobName: trainingJobName
        }).promise();

        const trainingJobStatus = status.TrainingJobStatus;
        
        if (trainingJobStatus === 'Completed') {
          console.log(`✅ Training completed successfully: ${trainingJobName}`);
          return status;
        } else if (trainingJobStatus === 'Failed') {
          throw new Error(`Training failed: ${status.FailureReason}`);
        } else if (trainingJobStatus === 'Stopped') {
          throw new Error(`Training stopped: ${status.FailureReason}`);
        }

        console.log(`⏳ Training in progress (${trainingJobStatus})...`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

      } catch (error) {
        console.error('❌ Error checking training status:', error);
        throw error;
      }
    }

    throw new Error('Training timeout exceeded');
  }

  // Deploy trained model to endpoint
  async deployModel(trainingJobName) {
    try {
      const modelName = `${trainingJobName}-model`;
      const endpointConfigName = `${trainingJobName}-config`;
      
      // Create model
      await this.sagemaker.createModel({
        ModelName: modelName,
        PrimaryContainer: {
          Image: `382416733822.dkr.ecr.eu-north-1.amazonaws.com/lstm-forecasting:latest`,
          ModelDataUrl: `s3://${this.bucketName}/model-output/${trainingJobName}/output/model.tar.gz`
        },
        ExecutionRoleArn: process.env.SAGEMAKER_ROLE_ARN
      }).promise();

      // Create endpoint configuration
      await this.sagemaker.createEndpointConfig({
        EndpointConfigName: endpointConfigName,
        ProductionVariants: [{
          VariantName: 'primary',
          ModelName: modelName,
          InitialInstanceCount: 1,
          InstanceType: 'ml.t2.medium',
          InitialVariantWeight: 1
        }]
      }).promise();

      // Update or create endpoint
      try {
        await this.sagemaker.updateEndpoint({
          EndpointName: this.modelEndpoint,
          EndpointConfigName: endpointConfigName
        }).promise();
        console.log(`🔄 Endpoint updated: ${this.modelEndpoint}`);
      } catch (updateError) {
        // Create new endpoint if update fails
        await this.sagemaker.createEndpoint({
          EndpointName: this.modelEndpoint,
          EndpointConfigName: endpointConfigName
        }).promise();
        console.log(`🚀 New endpoint created: ${this.modelEndpoint}`);
      }

    } catch (error) {
      console.error('❌ Model deployment failed:', error);
      throw error;
    }
  }

  // Helper methods
  async prepareFeatures(daysAhead) {
    const features = [];
    const today = new Date();
    
    for (let i = 1; i <= daysAhead; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const weather = await this.getWeatherForecast(futureDate);
      const externalFactors = await this.getExternalFactors(futureDate);
      
      features.push({
        date: futureDate.toISOString().split('T')[0],
        day_of_week: futureDate.getDay(),
        month: futureDate.getMonth() + 1,
        day_of_month: futureDate.getDate(),
        week_of_year: this.getWeekOfYear(futureDate),
        temperature: weather.temperature || 15,
        precipitation: weather.precipitation || 0,
        snow_depth: weather.snow_depth || 0,
        wind_speed: weather.wind_speed || 5,
        weather_difficulty: this.calculateWeatherDifficulty(weather),
        is_holiday: externalFactors.is_holiday || false,
        is_weekend: futureDate.getDay() === 0 || futureDate.getDay() === 6,
        season: this.getSeason(futureDate.getMonth() + 1)
      });
    }
    
    return features;
  }

  convertToTimeSeriesCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : (value || 0);
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  calculateWeatherDifficulty(weather) {
    let difficulty = 1.0;
    
    if (weather.temperature < 0) difficulty += 0.3;
    if (weather.precipitation > 5) difficulty += 0.2;
    if (weather.snow_depth > 2) difficulty += 0.4;
    if (weather.wind_speed > 10) difficulty += 0.1;
    
    return Math.min(2.0, difficulty);
  }

  getSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  getWeekOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date - start;
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  }

  calculateMovingAverage(data, currentIndex, window, field) {
    const startIndex = Math.max(0, currentIndex - window + 1);
    const values = data.slice(startIndex, currentIndex + 1).map(row => row[field] || 0);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateTrend(data, currentIndex, window, field) {
    if (currentIndex < window) return 0;
    
    const recent = data[currentIndex][field] || 0;
    const past = data[currentIndex - window][field] || 0;
    
    return past > 0 ? (recent - past) / past : 0;
  }

  getFutureDate(daysAhead) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
  }

  async getHistoricalWeather(date) {
    // Mock historical weather - in production, use weather API
    return {
      temperature_avg: 15 + Math.sin(new Date(date).getDayOfYear() / 365 * 2 * Math.PI) * 10,
      precipitation_mm: Math.random() * 10,
      snow_depth_cm: new Date(date).getMonth() < 3 || new Date(date).getMonth() > 10 ? Math.random() * 5 : 0,
      wind_speed_ms: 3 + Math.random() * 7
    };
  }

  async getWeatherForecast(date) {
    // Mock weather forecast - in production, use weather API
    const dayOfYear = this.getDayOfYear(date);
    return {
      temperature: 15 + Math.sin(dayOfYear / 365 * 2 * Math.PI) * 10,
      precipitation: Math.random() * 5,
      snow_depth: date.getMonth() < 3 || date.getMonth() > 10 ? Math.random() * 3 : 0,
      wind_speed: 3 + Math.random() * 5
    };
  }

  async getExternalFactors(date) {
    const dateObj = new Date(date);
    const holidays = ['2025-01-01', '2025-01-06', '2025-04-18', '2025-04-21', '2025-05-01', '2025-05-29', '2025-06-06', '2025-06-20', '2025-12-24', '2025-12-25', '2025-12-26'];
    
    return {
      is_holiday: holidays.includes(dateObj.toISOString().split('T')[0])
    };
  }

  getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  async evaluateModelPerformance() {
    // Mock performance evaluation - in production, compare predictions vs actual
    return {
      accuracy: 0.92,
      mae: 2.3,
      rmse: 3.1,
      drift_detected: false,
      last_evaluation: new Date().toISOString()
    };
  }

  getFallbackPredictions(daysAhead) {
    const predictions = [];
    const today = new Date();
    
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Simple fallback based on historical averages
      const baseBookings = 12; // Average daily bookings
      const seasonalFactor = this.getSeasonalFactor(date.getMonth() + 1);
      const dayOfWeekFactor = this.getDayOfWeekFactor(date.getDay());
      
      const prediction = Math.round(baseBookings * seasonalFactor * dayOfWeekFactor);
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        predicted_bookings: prediction,
        confidence_lower: Math.round(prediction * 0.8),
        confidence_upper: Math.round(prediction * 1.2),
        confidence: 0.7,
        model_version: 'fallback-v1.0',
        factors: {
          weather_impact: 0,
          trend_impact: 0,
          seasonal_impact: seasonalFactor - 1
        }
      });
    }
    
    return predictions;
  }

  getSeasonalFactor(month) {
    // Moving season factors in Sweden
    const factors = {
      1: 0.8, 2: 0.9, 3: 1.1, 4: 1.2, 5: 1.3, 6: 1.4,
      7: 1.3, 8: 1.4, 9: 1.2, 10: 1.1, 11: 0.9, 12: 0.8
    };
    return factors[month] || 1.0;
  }

  getDayOfWeekFactor(dayOfWeek) {
    // Higher demand on weekends for residential moves
    const factors = [0.8, 1.0, 1.0, 1.0, 1.1, 1.3, 1.4]; // Sun-Sat
    return factors[dayOfWeek] || 1.0;
  }
}