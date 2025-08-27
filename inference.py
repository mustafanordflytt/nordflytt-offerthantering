
import joblib
import numpy as np
import pandas as pd
import json
import os

def model_fn(model_dir):
    """Load the Nordflytt RandomForest model"""
    model_path = os.path.join(model_dir, 'model.joblib')
    model = joblib.load(model_path)
    return model

def input_fn(request_body, request_content_type):
    """Parse and prepare input features"""
    if request_content_type == 'application/json':
        input_data = json.loads(request_body)
        
        # Expected feature order for Nordflytt model
        feature_names = [
            'living_area', 'team_size', 'distance_km', 'floors',
            'weather_score', 'customer_preparation', 'enhanced_v21_estimate',
            'property_type_villa', 'property_type_kontor', 
            'elevator_ingen', 'elevator_liten'
        ]
        
        # Handle both single and batch predictions
        if 'instances' in input_data:
            # Batch format
            df = pd.DataFrame(input_data['instances'], columns=feature_names)
        else:
            # Single prediction - ensure correct feature extraction
            features = []
            for feature in feature_names:
                if feature in input_data:
                    features.append(input_data[feature])
                else:
                    # Default values for missing features
                    if feature == 'weather_score':
                        features.append(0.8)
                    elif feature == 'customer_preparation':
                        features.append(0.7)
                    else:
                        features.append(0)
            
            df = pd.DataFrame([features], columns=feature_names)
            
        return df
    else:
        raise ValueError(f"Unsupported content type: {request_content_type}")

def predict_fn(input_data, model):
    """Make predictions with the RandomForest model"""
    predictions = model.predict(input_data)
    
    # Calculate confidence scores based on prediction variance
    # For RandomForest, we can use the standard deviation of tree predictions
    if hasattr(model, 'estimators_'):
        tree_predictions = np.array([tree.predict(input_data) for tree in model.estimators_])
        std_dev = np.std(tree_predictions, axis=0)
        # Convert std to confidence (lower std = higher confidence)
        confidence = 1 / (1 + std_dev)
    else:
        confidence = np.ones(len(predictions)) * 0.85  # Default confidence
    
    return {'predictions': predictions, 'confidence': confidence}

def output_fn(prediction_output, content_type):
    """Format output for Nordflytt CRM integration"""
    if content_type == 'application/json':
        predictions = prediction_output['predictions']
        confidence = prediction_output['confidence']
        
        # Format for single or batch predictions
        if len(predictions) == 1:
            return json.dumps({
                'predicted_hours': float(predictions[0]),
                'confidence_score': float(confidence[0]),
                'model_version': 'v1.0-randomforest-nordflytt'
            })
        else:
            return json.dumps({
                'predictions': predictions.tolist(),
                'confidence_scores': confidence.tolist(),
                'model_version': 'v1.0-randomforest-nordflytt'
            })
    else:
        raise ValueError(f"Unsupported content type: {content_type}")
