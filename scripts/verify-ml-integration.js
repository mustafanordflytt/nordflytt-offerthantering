#!/usr/bin/env node
/**
 * Verify Nordflytt ML Integration - ES Module Version
 * Tests the complete ML-CRM integration
 */

import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.development.local' });

// Configuration from environment
const mlConfig = {
  mlEnabled: process.env.ML_ENABLED === 'true',
  endpointName: process.env.ML_ENDPOINT_NAME,
  region: process.env.ML_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

console.log('🚀 Nordflytt ML Integration Verification');
console.log('='.repeat(50));

async function verifyEnvironmentVariables() {
  console.log('\n📋 Checking Environment Variables...');
  
  const required = [
    'ML_ENABLED',
    'ML_ENDPOINT_NAME', 
    'ML_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY'
  ];
  
  let allPresent = true;
  
  for (const env of required) {
    const value = process.env[env];
    if (value) {
      const displayValue = env.includes('SECRET') ? '***' : value;
      console.log(`✅ ${env}: ${displayValue}`);
    } else {
      console.log(`❌ ${env}: Missing`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function verifyAWSConnection() {
  console.log('\n🔗 Verifying AWS Connection...');
  
  try {
    // Configure AWS
    AWS.config.update({
      accessKeyId: mlConfig.accessKeyId,
      secretAccessKey: mlConfig.secretAccessKey,
      region: mlConfig.region
    });
    
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    
    console.log(`✅ AWS Connection: Success`);
    console.log(`   Account: ${identity.Account}`);
    console.log(`   Region: ${mlConfig.region}`);
    
    return true;
  } catch (error) {
    console.log(`❌ AWS Connection: ${error.message}`);
    return false;
  }
}

async function verifyMLEndpoint() {
  console.log('\n🤖 Verifying ML Endpoint...');
  
  try {
    const sagemaker = new AWS.SageMaker();
    const endpoint = await sagemaker.describeEndpoint({
      EndpointName: mlConfig.endpointName
    }).promise();
    
    console.log(`✅ Endpoint Status: ${endpoint.EndpointStatus}`);
    console.log(`   Name: ${endpoint.EndpointName}`);
    console.log(`   Created: ${endpoint.CreationTime.toISOString()}`);
    
    if (endpoint.EndpointStatus === 'InService') {
      return true;
    } else {
      console.log(`⚠️ Endpoint not ready: ${endpoint.EndpointStatus}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Endpoint Check: ${error.message}`);
    return false;
  }
}

async function testMLPrediction() {
  console.log('\n🧪 Testing ML Prediction...');
  
  try {
    const sagemakerRuntime = new AWS.SageMakerRuntime();
    
    // Test data (NF-23857BDE style)
    const testData = {
      living_area: 80,
      team_size: 2,
      distance_km: 26.8,
      floors: 4,
      weather_score: 0.8,
      customer_preparation: 0.7,
      enhanced_v21_estimate: 8.5,
      property_type_villa: 0,
      property_type_kontor: 0,
      elevator_ingen: 0,
      elevator_liten: 0
    };
    
    console.log(`   Testing with: ${testData.living_area} kvm, ${testData.team_size} personer, ${testData.distance_km} km`);
    
    const response = await sagemakerRuntime.invokeEndpoint({
      EndpointName: mlConfig.endpointName,
      ContentType: 'application/json',
      Body: JSON.stringify(testData)
    }).promise();
    
    const result = JSON.parse(response.Body.toString());
    
    console.log(`✅ ML Prediction: ${result.prediction?.toFixed(1)}h`);
    console.log(`   Confidence: ${(result.confidence * 100)?.toFixed(1)}%`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Enhanced v2.1 Baseline: ${testData.enhanced_v21_estimate}h`);
    
    if (result.prediction && testData.enhanced_v21_estimate) {
      const diff = result.prediction - testData.enhanced_v21_estimate;
      const diffPercent = (Math.abs(diff) / testData.enhanced_v21_estimate * 100).toFixed(1);
      
      if (diff > 0) {
        console.log(`   📊 ML suggests +${diff.toFixed(1)}h (${diffPercent}% more conservative)`);
      } else {
        console.log(`   🚀 ML suggests ${Math.abs(diff).toFixed(1)}h less (${diffPercent}% more efficient)`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ ML Prediction: ${error.message}`);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('\n🌐 Testing Local API Endpoint...');
  
  try {
    // Test if development server is running
    const healthResponse = await fetch('http://localhost:3000/api/health', {
      timeout: 5000
    }).catch(() => null);
    
    if (!healthResponse) {
      console.log(`⚠️ Development server not running on localhost:3000`);
      console.log(`💡 Start with: npm run dev`);
      return false;
    }
    
    // Test ML predictions API
    const response = await fetch('http://localhost:3000/api/ml-predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        livingArea: 80,
        teamSize: 2,
        distance: 26.8,
        floors: 4,
        propertyType: 'lägenhet',
        elevatorType: 'liten'
      }),
      timeout: 10000
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ API Endpoint: Working`);
      console.log(`   Enhanced v2.1: ${result.enhanced?.toFixed(1)}h`);
      console.log(`   ML Prediction: ${result.ml?.prediction?.toFixed(1)}h`);
      console.log(`   Final Estimate: ${result.final?.toFixed(1)}h`);
      console.log(`   Method Used: ${result.method}`);
      return true;
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.log(`❌ API Endpoint: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ API Endpoint: ${error.message}`);
    console.log(`💡 Make sure your development server is running (npm run dev)`);
    return false;
  }
}

async function generateTestReport() {
  console.log('\n📊 Running Complete Integration Test...');
  console.log('='.repeat(50));
  
  const results = {
    environment: await verifyEnvironmentVariables(),
    aws: await verifyAWSConnection(),
    endpoint: await verifyMLEndpoint(),
    prediction: await testMLPrediction(),
    api: await testAPIEndpoint()
  };
  
  console.log('\n🎯 INTEGRATION TEST RESULTS:');
  console.log('='.repeat(30));
  
  Object.entries(results).forEach(([test, passed]) => {
    const emoji = passed ? '✅' : '❌';
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`${emoji} ${test.toUpperCase()}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.values(results).length;
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! ML INTEGRATION IS FULLY OPERATIONAL!');
    console.log('🏆 Nordflytt is now the world\'s most advanced AI-autonomous moving company!');
    console.log('🎯 Next steps:');
    console.log('   - Visit your CRM to see ML predictions in action');
    console.log('   - Monitor performance at /crm/ml-insights');
    console.log('   - Start collecting feedback from completed moves');
  } else {
    console.log(`⚠️ ${passedCount}/${totalCount} tests passed. Some issues found:`);
    
    if (!results.environment) {
      console.log('💡 Check your .env.development.local file');
    }
    if (!results.aws) {
      console.log('💡 Verify AWS credentials are correct');
    }
    if (!results.endpoint) {
      console.log('💡 Check SageMaker endpoint status in AWS Console');
    }
    if (!results.api) {
      console.log('💡 Make sure development server is running: npm run dev');
    }
  }
  
  console.log('='.repeat(50));
}

// Run the verification
generateTestReport().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});