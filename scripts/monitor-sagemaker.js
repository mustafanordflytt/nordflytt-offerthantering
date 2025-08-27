#!/usr/bin/env node
/**
 * Monitor SageMaker endpoint performance and health
 * Run this script to check real-time ML model performance
 */

const AWS = require('aws-sdk');
const fetch = require('node-fetch');

// Configuration
const config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAVVR2P26C7YNCCFTG',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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',
  region: process.env.AWS_REGION || 'eu-west-2'
};

AWS.config.update(config);

const cloudwatch = new AWS.CloudWatch();
const sagemaker = new AWS.SageMaker();

const ENDPOINT_NAME = 'nordflytt-time-estimation';
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function getEndpointMetrics() {
  console.log('📊 Fetching SageMaker endpoint metrics...\n');
  
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last hour
  
  const metricQueries = [
    {
      Id: 'invocations',
      MetricStat: {
        Metric: {
          Namespace: 'AWS/SageMaker',
          MetricName: 'Invocations',
          Dimensions: [
            { Name: 'EndpointName', Value: ENDPOINT_NAME },
            { Name: 'VariantName', Value: 'AllTraffic' }
          ]
        },
        Period: 300,
        Stat: 'Sum'
      }
    },
    {
      Id: 'latency',
      MetricStat: {
        Metric: {
          Namespace: 'AWS/SageMaker',
          MetricName: 'ModelLatency',
          Dimensions: [
            { Name: 'EndpointName', Value: ENDPOINT_NAME },
            { Name: 'VariantName', Value: 'AllTraffic' }
          ]
        },
        Period: 300,
        Stat: 'Average'
      }
    },
    {
      Id: 'errors',
      MetricStat: {
        Metric: {
          Namespace: 'AWS/SageMaker',
          MetricName: 'ModelSetupTime',
          Dimensions: [
            { Name: 'EndpointName', Value: ENDPOINT_NAME },
            { Name: 'VariantName', Value: 'AllTraffic' }
          ]
        },
        Period: 300,
        Stat: 'Average'
      }
    }
  ];
  
  try {
    const response = await cloudwatch.getMetricData({
      MetricDataQueries: metricQueries,
      StartTime: startTime,
      EndTime: endTime
    }).promise();
    
    const metrics = {};
    response.MetricDataResults.forEach(result => {
      const latestValue = result.Values[0] || 0;
      metrics[result.Id] = latestValue;
    });
    
    return metrics;
  } catch (error) {
    console.error('Error fetching CloudWatch metrics:', error);
    return null;
  }
}

async function checkEndpointStatus() {
  console.log('🔍 Checking endpoint status...\n');
  
  try {
    const response = await sagemaker.describeEndpoint({
      EndpointName: ENDPOINT_NAME
    }).promise();
    
    return {
      status: response.EndpointStatus,
      createdAt: response.CreationTime,
      lastModified: response.LastModifiedTime,
      instanceCount: response.ProductionVariants[0]?.CurrentInstanceCount || 0,
      desiredInstanceCount: response.ProductionVariants[0]?.DesiredInstanceCount || 0
    };
  } catch (error) {
    console.error('Error checking endpoint status:', error);
    return null;
  }
}

async function testPrediction() {
  console.log('🧪 Testing live prediction...\n');
  
  const testData = {
    volume: 24,
    livingArea: 80,
    distance: 26.8,
    teamSize: 2,
    propertyType: 'lägenhet',
    floors: { from: 0, to: 0 },
    elevatorType: { from: 'stor', to: 'stor' },
    services: ['moving']
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/autonomous/time-estimation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        estimatedHours: result.decision.estimatedHours,
        mlEnhanced: result.decision.mlEnhanced,
        confidence: result.decision.confidence,
        inferenceTime: result.decision.executionTime
      };
    } else {
      return {
        success: false,
        error: await response.text()
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getApplicationMetrics() {
  console.log('📈 Fetching application metrics...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/ml-metrics`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching app metrics:', error);
  }
  return null;
}

async function generateReport() {
  console.log('🚀 Nordflytt ML Model Monitoring Report');
  console.log('=' .repeat(50));
  console.log(`📅 Generated: ${new Date().toLocaleString('sv-SE')}\n`);
  
  // Check endpoint status
  const endpointStatus = await checkEndpointStatus();
  if (endpointStatus) {
    console.log('📍 Endpoint Status:');
    console.log(`   Status: ${endpointStatus.status}`);
    console.log(`   Instances: ${endpointStatus.instanceCount}/${endpointStatus.desiredInstanceCount}`);
    console.log(`   Last Modified: ${new Date(endpointStatus.lastModified).toLocaleString('sv-SE')}`);
    console.log('');
  }
  
  // Get CloudWatch metrics
  const cwMetrics = await getEndpointMetrics();
  if (cwMetrics) {
    console.log('☁️  CloudWatch Metrics (Last Hour):');
    console.log(`   Invocations: ${cwMetrics.invocations || 0}`);
    console.log(`   Avg Latency: ${(cwMetrics.latency || 0).toFixed(2)}ms`);
    console.log(`   Model Setup Time: ${(cwMetrics.errors || 0).toFixed(2)}ms`);
    console.log('');
  }
  
  // Test live prediction
  const predictionTest = await testPrediction();
  console.log('🧪 Live Prediction Test:');
  if (predictionTest.success) {
    console.log(`   ✅ Success`);
    console.log(`   Estimated Hours: ${predictionTest.estimatedHours}h`);
    console.log(`   ML Enhanced: ${predictionTest.mlEnhanced ? 'Yes' : 'No'}`);
    console.log(`   Confidence: ${(predictionTest.confidence * 100).toFixed(1)}%`);
    console.log(`   Inference Time: ${predictionTest.inferenceTime || 'N/A'}ms`);
  } else {
    console.log(`   ❌ Failed: ${predictionTest.error}`);
  }
  console.log('');
  
  // Get application metrics
  const appMetrics = await getApplicationMetrics();
  if (appMetrics) {
    console.log('📊 Application Metrics (24h):');
    console.log(`   Total Predictions: ${appMetrics.totalPredictions}`);
    console.log(`   ML Enhanced: ${appMetrics.mlEnhancedPredictions} (${((appMetrics.mlEnhancedPredictions / appMetrics.totalPredictions) * 100).toFixed(1)}%)`);
    console.log(`   Accuracy: ${appMetrics.accuracy.toFixed(1)}%`);
    console.log(`   Avg Improvement: ${appMetrics.avgImprovement.toFixed(1)}%`);
    console.log(`   Model Status: ${appMetrics.modelStatus}`);
    console.log('');
    
    console.log('🎯 Confidence Distribution:');
    console.log(`   High (>85%): ${appMetrics.confidenceDistribution.high.toFixed(1)}%`);
    console.log(`   Medium (70-85%): ${appMetrics.confidenceDistribution.medium.toFixed(1)}%`);
    console.log(`   Low (<70%): ${appMetrics.confidenceDistribution.low.toFixed(1)}%`);
  }
  
  console.log('\n' + '=' .repeat(50));
  
  // Summary
  const isHealthy = endpointStatus?.status === 'InService' && 
                   predictionTest?.success && 
                   appMetrics?.modelStatus !== 'offline';
  
  if (isHealthy) {
    console.log('✅ System Status: HEALTHY');
    console.log('   All systems operational');
  } else {
    console.log('⚠️  System Status: DEGRADED');
    if (endpointStatus?.status !== 'InService') {
      console.log('   - Endpoint not in service');
    }
    if (!predictionTest?.success) {
      console.log('   - Prediction test failed');
    }
    if (appMetrics?.modelStatus === 'offline') {
      console.log('   - Model offline in application');
    }
  }
  
  console.log('\n📝 Recommendations:');
  if (cwMetrics?.invocations < 10) {
    console.log('   - Low usage detected. Consider promoting ML features.');
  }
  if (cwMetrics?.latency > 200) {
    console.log('   - High latency detected. Consider upgrading instance type.');
  }
  if (appMetrics?.confidenceDistribution?.low > 20) {
    console.log('   - High percentage of low confidence predictions. Model may need retraining.');
  }
}

// Run monitoring
generateReport().catch(console.error);