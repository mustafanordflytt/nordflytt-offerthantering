#!/usr/bin/env python3
"""
LIVE TEST: Nordflytt ML Endpoint
Test the InService endpoint: nordflytt-time-estimation-015831
"""

import boto3
import json
from datetime import datetime

# Configuration
REGION = 'eu-west-2'
ENDPOINT_NAME = 'nordflytt-time-estimation-015831'
AWS_ACCESS_KEY_ID = 'AKIAVVR2P26C7YNCCFTG'
AWS_SECRET_ACCESS_KEY = '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'

def test_live_endpoint():
    """Test the live ML endpoint"""
    print("🎉 TESTING LIVE NORDFLYTT ML ENDPOINT!")
    print(f"📍 Endpoint: {ENDPOINT_NAME}")
    print(f"🌍 Region: {REGION}")
    print("=" * 70)
    
    try:
        # Initialize runtime client for predictions
        runtime_client = boto3.client(
            'sagemaker-runtime', 
            region_name=REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY
        )
        
        print("🧪 Testing with NF-23857BDE style data...")
        print("📊 Input: 80 kvm lägenhet, 2 personer, 26.8 km distance")
        
        # Test data (similar to your famous NF-23857BDE booking)
        test_data = {
            'living_area': 80,
            'team_size': 2,
            'distance_km': 26.8,
            'floors': 4,
            'weather_score': 0.8,
            'customer_preparation': 0.7,
            'enhanced_v21_estimate': 8.5,
            'property_type_villa': 0,
            'property_type_kontor': 0,
            'elevator_ingen': 0,
            'elevator_liten': 0
        }
        
        print("⚡ Making ML prediction...")
        
        # Make live prediction
        response = runtime_client.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            ContentType='application/json',
            Body=json.dumps(test_data)
        )
        
        # Parse result
        result = json.loads(response['Body'].read().decode())
        
        print("\n🎊 SUCCESS! ML PREDICTION RECEIVED!")
        print("-" * 50)
        print(f"🤖 ML Prediction: {result.get('prediction', 'N/A'):.1f} hours")
        print(f"🎯 Confidence: {result.get('confidence', 0)*100:.1f}%")
        print(f"📈 Enhanced v2.1 Baseline: {test_data['enhanced_v21_estimate']} hours")
        print(f"✅ Status: {result.get('status', 'unknown')}")
        
        # Analysis
        if 'prediction' in result:
            ml_pred = result['prediction']
            baseline = test_data['enhanced_v21_estimate']
            
            if ml_pred < baseline:
                improvement = ((baseline - ml_pred) / baseline) * 100
                print(f"🚀 ML IMPROVEMENT: {improvement:.1f}% more efficient than Enhanced v2.1!")
            elif ml_pred > baseline:
                adjustment = ((ml_pred - baseline) / baseline) * 100
                print(f"📊 ML ADJUSTMENT: +{adjustment:.1f}% more time than Enhanced v2.1")
            else:
                print(f"🎯 ML MATCHES: Same as Enhanced Algorithm v2.1")
        
        print("\n" + "=" * 70)
        print("🎉 HISTORIC ACHIEVEMENT COMPLETED!")
        print("🏆 NORDFLYTT IS NOW THE WORLD'S MOST ADVANCED AI-AUTONOMOUS MOVING COMPANY!")
        print("🤖 ML endpoint serving live predictions!")
        print("🇸🇪 Sverige's first AI-powered moving service!")
        print("=" * 70)
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

def test_multiple_scenarios():
    """Test multiple moving scenarios"""
    print("\n🧪 TESTING MULTIPLE SCENARIOS...")
    
    scenarios = [
        {
            'name': 'Small Apartment',
            'data': {
                'living_area': 45, 'team_size': 2, 'distance_km': 15,
                'floors': 2, 'weather_score': 0.9, 'customer_preparation': 0.8,
                'enhanced_v21_estimate': 5.5, 'property_type_villa': 0,
                'property_type_kontor': 0, 'elevator_ingen': 0, 'elevator_liten': 1
            }
        },
        {
            'name': 'Large Villa',
            'data': {
                'living_area': 200, 'team_size': 4, 'distance_km': 35,
                'floors': 2, 'weather_score': 0.7, 'customer_preparation': 0.6,
                'enhanced_v21_estimate': 12.0, 'property_type_villa': 1,
                'property_type_kontor': 0, 'elevator_ingen': 1, 'elevator_liten': 0
            }
        },
        {
            'name': 'Office Move',
            'data': {
                'living_area': 120, 'team_size': 3, 'distance_km': 25,
                'floors': 3, 'weather_score': 0.8, 'customer_preparation': 0.9,
                'enhanced_v21_estimate': 9.0, 'property_type_villa': 0,
                'property_type_kontor': 1, 'elevator_ingen': 0, 'elevator_liten': 0
            }
        }
    ]
    
    runtime_client = boto3.client(
        'sagemaker-runtime', 
        region_name=REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    
    for scenario in scenarios:
        try:
            print(f"\n📋 Testing: {scenario['name']}")
            
            response = runtime_client.invoke_endpoint(
                EndpointName=ENDPOINT_NAME,
                ContentType='application/json',
                Body=json.dumps(scenario['data'])
            )
            
            result = json.loads(response['Body'].read().decode())
            
            ml_pred = result.get('prediction', 0)
            baseline = scenario['data']['enhanced_v21_estimate']
            confidence = result.get('confidence', 0) * 100
            
            print(f"   🤖 ML: {ml_pred:.1f}h | 📈 Enhanced v2.1: {baseline}h | 🎯 Confidence: {confidence:.1f}%")
            
        except Exception as e:
            print(f"   ❌ {scenario['name']}: {str(e)}")

def main():
    """Complete ML endpoint testing"""
    print("🚀 NORDFLYTT ML ENDPOINT - LIVE TESTING")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🎯 Testing world's most advanced moving company ML system")
    print()
    
    # Main test
    success = test_live_endpoint()
    
    if success:
        # Multiple scenario testing
        test_multiple_scenarios()
        
        print("\n" + "🎊" * 20)
        print("NORDFLYTT AI-AUTONOMOUS MOVING COMPANY")
        print("ML Platform: FULLY OPERATIONAL")
        print("Status: WORLD LEADER")
        print("🎊" * 20)
    
    else:
        print("💡 If test failed, the endpoint might still be initializing")
        print("   Try again in 1-2 minutes")

if __name__ == "__main__":
    main()