# 🤖 Nordflytt ML SageMaker Integration Guide

## Overview

This guide documents the complete integration between the Nordflytt CRM system and the AWS SageMaker ML endpoint (`nordflytt-time-estimation-015831`) for enhanced time predictions.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CRM Frontend  │────▶│   API Gateway    │────▶│   SageMaker     │
│  (Next.js/React)│     │  /api/ml-*       │     │   ML Endpoint   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       ▼                         │
         │              ┌──────────────────┐              │
         └─────────────▶│  Enhanced Time   │◀─────────────┘
                        │  Estimation v2.1  │
                        └──────────────────┘
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# AWS SageMaker Configuration
SAGEMAKER_ENDPOINT_NAME=nordflytt-time-estimation-015831
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# ML Model Configuration
ML_ENABLED=true
ML_CONFIDENCE_THRESHOLD=0.85
ML_FALLBACK_TO_ALGORITHM=true
```

### 2. Install Dependencies

```bash
npm install @aws-sdk/client-sagemaker-runtime
```

### 3. Database Setup (Optional)

If you want to store ML feedback in the database, create the following table:

```sql
CREATE TABLE ml_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  predicted_hours DECIMAL(10,2) NOT NULL,
  actual_hours DECIMAL(10,2) NOT NULL,
  deviation_hours DECIMAL(10,2) NOT NULL,
  deviation_percentage DECIMAL(10,2) NOT NULL,
  is_accurate BOOLEAN DEFAULT FALSE,
  team_size INTEGER DEFAULT 2,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ml_feedback_job_id ON ml_feedback(job_id);
CREATE INDEX idx_ml_feedback_created_at ON ml_feedback(created_at);
```

## API Endpoints

### 1. ML Predictions

**POST** `/api/ml-predictions`

Get ML-enhanced time estimation for a job.

Request:
```json
{
  "livingArea": 75,
  "teamSize": 3,
  "distance": 15,
  "propertyType": "lägenhet",
  "floors": { "from": 2, "to": 3 },
  "elevatorType": { "from": "liten", "to": "stor" },
  "services": ["moving", "packing"],
  "moveDate": "2024-02-15"
}
```

Response:
```json
{
  "success": true,
  "prediction": {
    "mlPrediction": 5.2,
    "baselinePrediction": 6.0,
    "confidence": 0.89,
    "improvement": "13.3%",
    "modelVersion": "v1.0-randomforest",
    "breakdown": {
      "loadingHours": 1.8,
      "unloadingHours": 1.6,
      "drivingHours": 0.8,
      "packingHours": 0.7
    }
  },
  "cached": false,
  "responseTime": 245
}
```

### 2. Health Check

**GET** `/api/ml-predictions/health`

Check ML service health and metrics.

Response:
```json
{
  "status": "healthy",
  "mlEnabled": true,
  "sagemakerHealthy": true,
  "endpoint": "nordflytt-time-estimation-015831",
  "metrics": {
    "api": {
      "totalRequests": 1250,
      "requestsPerHour": 45,
      "mlSuccessRate": "94.5%",
      "avgResponseTime": "186ms"
    }
  }
}
```

### 3. Feedback Submission

**POST** `/api/ml-predictions/feedback`

Submit actual time data to improve model accuracy.

Request:
```json
{
  "jobId": "JOB-12345",
  "predictedHours": 5.2,
  "actualHours": 5.5,
  "teamSize": 3,
  "notes": "Traffic delays on E4",
  "factors": {
    "trafficDelays": true,
    "weatherImpact": false
  }
}
```

## Integration Points

### 1. Booking Submission

The ML prediction is automatically called when a new booking is submitted:

```typescript
// In /api/submit-booking/route.ts
const mlResponse = await fetch('/api/ml-predictions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(estimationInput)
});
```

### 2. CRM Dashboard

Use the `MLTimeEstimationDisplay` component to show predictions:

```tsx
import MLTimeEstimationDisplay from '@/components/crm/MLTimeEstimationDisplay';

<MLTimeEstimationDisplay 
  estimation={job.timeEstimation}
  jobId={job.id}
  showFeedback={true}
  actualHours={job.actualHours}
/>
```

### 3. ML Insights Page

Access comprehensive ML analytics at `/crm/ml-insights`:

- Real-time monitoring
- Prediction accuracy analytics
- Pattern identification
- Performance recommendations

## Monitoring & Maintenance

### 1. Monitor Performance

Track key metrics:
- **Success Rate**: Should be >90%
- **Response Time**: Target <300ms
- **Cache Hit Rate**: Target >30%
- **Accuracy**: Within 30 minutes for >70% of jobs

### 2. Common Issues

**ML Service Unavailable**
- Check AWS credentials
- Verify endpoint name and region
- Check AWS service health

**Low Accuracy**
- Review feedback data for patterns
- Check if model needs retraining
- Verify input data quality

**High Response Times**
- Check network connectivity
- Monitor SageMaker endpoint performance
- Increase cache TTL if appropriate

### 3. Testing

Run the integration test script:

```bash
cd scripts
./test-ml-integration.js
```

## Best Practices

1. **Always provide fallback**: Use baseline algorithm if ML fails
2. **Collect feedback**: Actual times improve model accuracy
3. **Monitor continuously**: Use the ML Insights dashboard
4. **Cache predictions**: Reduce costs and improve response times
5. **Version control**: Track model versions for debugging

## Security Considerations

1. **API Authentication**: All endpoints require authentication
2. **AWS Credentials**: Never commit credentials to git
3. **Data Privacy**: Don't send PII to SageMaker
4. **Rate Limiting**: Implement to prevent abuse

## Cost Optimization

1. **Use caching**: Reduces SageMaker invocations
2. **Batch predictions**: For bulk operations
3. **Monitor usage**: Track invocations in AWS Console
4. **Right-size endpoint**: Use appropriate instance type

## Future Enhancements

1. **A/B Testing**: Compare ML vs baseline performance
2. **Multi-model ensemble**: Combine multiple models
3. **Real-time learning**: Update model with feedback
4. **Weather integration**: Real-time weather data
5. **Traffic API**: Live traffic conditions

## Support

For issues or questions:
1. Check the error logs in the console
2. Review the ML Insights dashboard
3. Run the test script for diagnostics
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-30  
**Maintained By**: Nordflytt Development Team