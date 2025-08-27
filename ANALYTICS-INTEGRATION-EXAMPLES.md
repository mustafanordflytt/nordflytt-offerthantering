# 📊 Analytics Integration Examples for Nordflytt

## Booking Form Tracking

### Step 1: Track Form Start

```typescript
// In your booking form component
import { useFormTracking } from '@/hooks/useAnalytics';

export function BookingForm() {
  const { trackFormStart, trackFieldInteraction, trackFormComplete } = useFormTracking('booking_form');
  
  useEffect(() => {
    // Track when user starts the form
    trackFormStart();
  }, []);
  
  // Track field interactions
  const handleFieldChange = (fieldName: string) => {
    trackFieldInteraction(fieldName);
  };
```

### Step 2: Track ML Predictions

```typescript
// When ML prediction is generated
import { analytics } from '@/components/analytics/GoogleAnalytics';

const handleMLPrediction = async (bookingData: any) => {
  const prediction = await fetchMLPrediction(bookingData);
  
  // Track ML prediction event
  analytics.trackMLPrediction({
    predictionType: 'time_estimation',
    confidence: prediction.confidence,
    baseline: prediction.baselineHours,
    mlPrediction: prediction.mlHours,
    finalEstimate: prediction.finalHours,
    method: prediction.method
  });
  
  // Also track in Facebook Pixel
  fbPixel.trackMLPrediction({
    prediction_type: 'time_estimation',
    confidence: prediction.confidence,
    baseline_hours: prediction.baselineHours,
    ml_hours: prediction.mlHours,
    value: estimatedBookingValue
  });
};
```

### Step 3: Track Quote Generation

```typescript
// When quote is generated
const handleQuoteGeneration = (quoteData: QuoteData) => {
  // Track across all platforms
  trackingHelpers.trackQuoteGeneration({
    quoteId: quoteData.id,
    value: quoteData.estimatedPrice,
    livingArea: quoteData.livingArea,
    distance: quoteData.distance,
    mlConfidence: quoteData.mlConfidence,
    predictionMethod: quoteData.usedML ? 'ml' : 'enhanced',
    source: 'booking_form'
  });
  
  // Set user properties
  analytics.setUserProperties({
    customer_type: quoteData.customerType,
    property_type: quoteData.propertyType,
    stockholm_area: quoteData.area,
    ml_opt_in: true
  });
};
```

### Step 4: Track Booking Confirmation

```typescript
// When booking is confirmed
const handleBookingConfirmation = (booking: Booking) => {
  // Enhanced e-commerce tracking
  trackingHelpers.trackBookingConfirmation({
    bookingId: booking.id,
    revenue: booking.totalPrice,
    serviceType: booking.serviceType,
    mlUsed: booking.mlPredictionUsed,
    predictionAccuracy: booking.actualTime ? 
      (booking.predictedTime / booking.actualTime) : undefined,
    customerType: booking.customerType
  });
  
  // Track form completion
  trackFormComplete({
    booking_id: booking.id,
    revenue: booking.totalPrice,
    ml_enhanced: booking.mlPredictionUsed
  });
};
```

## CRM Dashboard Tracking

### Track AI Feature Usage

```typescript
// In AI-Optimering dashboard
import { useAnalytics } from '@/hooks/useAnalytics';

export function AIOptimizationDashboard() {
  const { trackAIFeature, trackEvent } = useAnalytics();
  
  const handleAIDecision = async (decision: AIDecision) => {
    const startTime = Date.now();
    
    try {
      const result = await makeAIDecision(decision);
      
      trackAIFeature(
        'ai_optimization_decision',
        true,
        {
          responseTime: Date.now() - startTime,
          userSatisfaction: result.confidence
        }
      );
      
      // Track specific decision type
      trackEvent(`ai_decision_${decision.type}`, {
        success: true,
        confidence: result.confidence,
        impact: result.estimatedImpact
      });
      
    } catch (error) {
      trackAIFeature(
        'ai_optimization_decision',
        false,
        {
          responseTime: Date.now() - startTime,
          errorType: error.type
        }
      );
    }
  };
}
```

## Marketing Campaign Tracking

### Track Campaign Performance

```typescript
// Track marketing campaign clicks
const handleCampaignClick = (campaign: Campaign) => {
  analytics.trackCampaignClick(
    campaign.name,
    campaign.medium,
    campaign.source
  );
  
  // GTM enhanced tracking
  gtmDataLayer.push({
    event: 'marketing_interaction',
    campaign_data: {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      ml_optimized: campaign.mlOptimized,
      predicted_roi: campaign.predictedROI
    }
  });
};
```

### Track Email Opens (Server-side)

```typescript
// In your email tracking API
app.get('/track/email/:campaignId/:userId', async (req, res) => {
  const { campaignId, userId } = req.params;
  
  // Server-side tracking to GA4 Measurement Protocol
  await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`, {
    method: 'POST',
    body: JSON.stringify({
      client_id: userId,
      events: [{
        name: 'email_open',
        params: {
          campaign_id: campaignId,
          engagement_time_msec: 100
        }
      }]
    })
  });
  
  // Return 1x1 tracking pixel
  res.type('image/gif').send(TRACKING_PIXEL);
});
```

## Performance Tracking

### Track Page Performance

```typescript
// In _app.tsx or layout.tsx
import { usePerformanceTracking } from '@/hooks/useAnalytics';

export function Layout({ children }) {
  const { trackAPICall } = usePerformanceTracking();
  
  // Track API performance
  const fetchWithTracking = async (url: string) => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      trackAPICall(url, startTime, response.ok);
      return response;
    } catch (error) {
      trackAPICall(url, startTime, false);
      throw error;
    }
  };
  
  return children;
}
```

## Custom Events

### Track ML Model Performance

```typescript
// Track ML model accuracy over time
const trackMLModelPerformance = (prediction: MLPrediction, actual: ActualResult) => {
  const accuracy = calculateAccuracy(prediction, actual);
  
  // Send to GA4
  gtag('event', 'ml_model_performance', {
    event_category: 'ML_System',
    event_label: 'prediction_accuracy',
    value: Math.round(accuracy * 100),
    custom_parameters: {
      prediction_id: prediction.id,
      predicted_value: prediction.value,
      actual_value: actual.value,
      model_version: 'v2.1',
      endpoint: 'nordflytt-time-estimation-015831'
    }
  });
  
  // Custom dimension for ML performance
  gtag('set', {
    'custom_map.dimension8': accuracy.toFixed(2)
  });
};
```

## Testing Your Implementation

### 1. Google Analytics DebugView

```javascript
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  gtag('config', GA_MEASUREMENT_ID, {
    debug_mode: true
  });
}
```

### 2. Facebook Pixel Helper

Install the Chrome extension and verify:
- PageView fires on every page
- Lead event fires on quote generation
- Purchase event fires on booking confirmation

### 3. GTM Preview Mode

1. Click "Preview" in GTM
2. Enter your website URL
3. Verify all tags fire correctly
4. Check variable values

## Common Tracking Scenarios

### 1. A/B Test Tracking

```typescript
// Track A/B test variants
gtag('event', 'experiment_impression', {
  experiment_id: 'ml_cta_test_001',
  variant_id: showMLVersion ? 'ml_enhanced' : 'control'
});
```

### 2. Error Tracking

```typescript
// Track errors with context
window.addEventListener('error', (event) => {
  gtag('event', 'exception', {
    description: event.message,
    fatal: false,
    error_type: 'javascript_error',
    page_path: window.location.pathname
  });
});
```

### 3. Scroll Depth Tracking

```typescript
// Track how far users scroll
let maxScroll = 0;
window.addEventListener('scroll', () => {
  const scrollPercent = (window.scrollY / document.body.scrollHeight) * 100;
  
  if (scrollPercent > maxScroll + 25) {
    maxScroll = Math.floor(scrollPercent / 25) * 25;
    
    gtag('event', 'scroll', {
      percent_scrolled: maxScroll
    });
  }
});
```

## Revenue Attribution

### Track Revenue by Source

```typescript
// Attribute revenue to marketing source
const attributeRevenue = (booking: Booking, source: string) => {
  gtag('event', 'revenue_attribution', {
    transaction_id: booking.id,
    value: booking.revenue,
    currency: 'SEK',
    attribution_source: source,
    attribution_model: 'data_driven',
    ml_influenced: booking.mlUsed
  });
};
```

This comprehensive tracking implementation will give you full visibility into your marketing performance, user behavior, and ML system effectiveness!