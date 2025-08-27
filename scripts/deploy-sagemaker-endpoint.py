#!/usr/bin/env python3
"""
Deploy Nordflytt ML Model to SageMaker Endpoint
This script creates a real-time inference endpoint from a trained model
"""

import boto3
import sagemaker
from sagemaker.sklearn.model import SKLearnModel
from datetime import datetime
import json
import os

# Configuration
REGION = 'eu-north-1'  # Stockholm region
ROLE_ARN = os.environ.get('SAGEMAKER_ROLE_ARN', 'arn:aws:iam::YOUR_ACCOUNT:role/SageMakerExecutionRole')
MODEL_DATA = os.environ.get('MODEL_DATA_S3_PATH', 's3://nordflytt-ml-models/time-estimation/model.tar.gz')
ENDPOINT_NAME = 'nordflytt-time-estimation-prod'
INSTANCE_TYPE = 'ml.t2.medium'  # Cost-effective for real-time inference

def create_model(sagemaker_session, role):
    """Create SageMaker model from trained artifacts"""
    
    model = SKLearnModel(
        model_data=MODEL_DATA,
        role=role,
        entry_point='inference.py',  # Custom inference script
        framework_version='1.0-1',
        py_version='py3',
        sagemaker_session=sagemaker_session,
        name=f'nordflytt-time-model-{datetime.now().strftime("%Y%m%d%H%M%S")}'
    )
    
    return model

def create_inference_script():
    """Create custom inference script for the model"""
    
    inference_code = '''
import joblib
import numpy as np
import pandas as pd
import json

def model_fn(model_dir):
    """Load model for inference"""
    model = joblib.load(f"{model_dir}/model.joblib")
    return model

def input_fn(request_body, request_content_type):
    """Parse input data"""
    if request_content_type == 'application/json':
        input_data = json.loads(request_body)
        
        # Handle both single predictions and batch
        if 'instances' in input_data:
            # Batch prediction format
            df = pd.DataFrame(input_data['instances'], columns=[
                'living_area', 'team_size', 'distance_km', 'floors',
                'weather_score', 'customer_preparation', 'enhanced_v21_estimate',
                'property_type_villa', 'property_type_kontor', 
                'elevator_ingen', 'elevator_liten'
            ])
        else:
            # Single prediction
            df = pd.DataFrame([input_data])
            
        return df
    else:
        raise ValueError(f"Unsupported content type: {request_content_type}")

def predict_fn(input_data, model):
    """Make predictions"""
    predictions = model.predict(input_data)
    return predictions

def output_fn(prediction, content_type):
    """Format output"""
    if content_type == 'application/json':
        return json.dumps({
            'predictions': prediction.tolist(),
            'model_version': 'v1.0-randomforest'
        })
    else:
        raise ValueError(f"Unsupported content type: {content_type}")
'''
    
    with open('inference.py', 'w') as f:
        f.write(inference_code)
    
    print("✅ Created inference.py")

def deploy_endpoint(model, endpoint_name):
    """Deploy model to SageMaker endpoint"""
    
    print(f"🚀 Deploying model to endpoint: {endpoint_name}")
    
    try:
        # Check if endpoint already exists
        sm_client = boto3.client('sagemaker', region_name=REGION)
        try:
            sm_client.describe_endpoint(EndpointName=endpoint_name)
            print(f"⚠️  Endpoint {endpoint_name} already exists. Updating...")
            
            # Update existing endpoint
            predictor = model.deploy(
                initial_instance_count=1,
                instance_type=INSTANCE_TYPE,
                endpoint_name=endpoint_name,
                update_endpoint=True
            )
        except:
            # Create new endpoint
            predictor = model.deploy(
                initial_instance_count=1,
                instance_type=INSTANCE_TYPE,
                endpoint_name=endpoint_name
            )
            
        print(f"✅ Endpoint deployed successfully!")
        return predictor
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        raise

def test_endpoint(predictor):
    """Test the deployed endpoint with sample data"""
    
    print("\n🧪 Testing endpoint with sample data...")
    
    # Test data matching NF-23857BDE scenario
    test_data = {
        'instances': [[
            80,    # living_area
            2,     # team_size
            26.8,  # distance_km
            0,     # floors
            0.8,   # weather_score (good weather)
            0.7,   # customer_preparation
            6.75,  # enhanced_v21_estimate
            0,     # property_type_villa
            0,     # property_type_kontor
            0,     # elevator_ingen
            0      # elevator_liten
        ]]
    }
    
    try:
        # Make prediction
        result = predictor.predict(test_data)
        print(f"✅ Test successful! Result: {result}")
        
        # Validate result
        predictions = result.get('predictions', [])
        if predictions and 3 < predictions[0] < 15:
            print(f"✅ Prediction looks reasonable: {predictions[0]:.2f} hours")
        else:
            print(f"⚠️  Prediction may be out of range: {predictions}")
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

def create_endpoint_config():
    """Create endpoint configuration for monitoring"""
    
    config = {
        "endpoint_name": ENDPOINT_NAME,
        "model_name": "nordflytt-time-estimation-randomforest",
        "instance_type": INSTANCE_TYPE,
        "instance_count": 1,
        "features": [
            "living_area", "team_size", "distance_km", "floors",
            "weather_score", "customer_preparation", "enhanced_v21_estimate",
            "property_type_villa", "property_type_kontor", 
            "elevator_ingen", "elevator_liten"
        ],
        "monitoring": {
            "data_capture": True,
            "capture_percentage": 10,  # Capture 10% of requests for monitoring
            "enable_cloudwatch": True
        },
        "auto_scaling": {
            "min_instances": 1,
            "max_instances": 3,
            "target_invocations_per_instance": 1000
        }
    }
    
    with open('endpoint_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ Created endpoint_config.json")

def main():
    """Main deployment function"""
    
    print("🚀 Nordflytt ML Model Deployment Script")
    print(f"📍 Region: {REGION}")
    print(f"📦 Model Data: {MODEL_DATA}")
    print(f"🎯 Endpoint Name: {ENDPOINT_NAME}\n")
    
    # Create SageMaker session
    sagemaker_session = sagemaker.Session(boto3.Session(region_name=REGION))
    
    # Create inference script
    create_inference_script()
    
    # Create model
    print("📦 Creating SageMaker model...")
    model = create_model(sagemaker_session, ROLE_ARN)
    
    # Deploy endpoint
    predictor = deploy_endpoint(model, ENDPOINT_NAME)
    
    # Test endpoint
    if predictor:
        test_endpoint(predictor)
    
    # Create configuration file
    create_endpoint_config()
    
    print("\n✅ Deployment complete!")
    print(f"🎯 Endpoint URL: https://runtime.sagemaker.{REGION}.amazonaws.com/endpoints/{ENDPOINT_NAME}/invocations")
    print("\n📝 Next steps:")
    print("1. Update .env.local with SAGEMAKER_ENDPOINT_NAME=" + ENDPOINT_NAME)
    print("2. Configure AWS credentials for the application")
    print("3. Test the integration with real job data")
    print("4. Monitor performance in CloudWatch")

if __name__ == "__main__":
    main()