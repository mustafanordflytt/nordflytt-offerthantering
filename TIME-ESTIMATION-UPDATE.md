# Enhanced Time Estimation Algorithm Update

## Summary
The system has been updated to use the new enhanced team-based time estimation algorithm v2.1 throughout the codebase.

## Changes Made

### 1. Core Algorithm Implementation
- Created `/lib/utils/enhanced-time-estimation.ts` with the new algorithm
- Features:
  - Team efficiency calculations (1-6 people)
  - Competitive analysis against market competitors
  - Complex factors: traffic, parking distance, elevator types
  - Property-specific calculations (lägenhet, villa, kontor)
  - Optimization recommendations

### 2. Updated Components

#### Job Creation (`/lib/utils/job-creation.ts`)
- Updated to use `calculateEnhancedEstimatedTime`
- Now considers:
  - Team size (default: 2)
  - Property type
  - Living area
  - Parking distances
  - Elevator types (stor/liten/ingen)

#### GPT-RAG API (`/app/api/gpt-rag/calculate-price/route.ts`)
- Updated price calculation to use enhanced algorithm
- Converts old elevator format to new type format
- Estimates living area from volume when not provided

#### CRM Jobs API (`/app/api/crm/jobs/route.ts`)
- Updated `calculateEstimatedHours` helper function
- Uses enhanced algorithm for all job time estimations
- Properly handles property types and parking distances

### 3. Migration Support
- Created `/lib/utils/time-estimation-adapter.ts` for backward compatibility
- Provides conversion functions between old and new formats
- Allows gradual migration of existing code

## Key Algorithm Features

### Team Efficiency Matrix
```
1 person:  2.5 m³/hour
2 people:  4.5 m³/hour  
3 people: 10.0 m³/hour (matches competitors)
4 people: 12.0 m³/hour
5 people: 13.0 m³/hour
6 people: 12.5 m³/hour
```

### Volume Calculations
- Lägenhet: 0.3 m³/kvm
- Villa: 0.4 m³/kvm (includes basement/storage)
- Kontor: 0.25 m³/kvm

### Competitive Analysis
The algorithm now provides:
- Comparison with competitor estimates
- Percentage faster/slower than market
- Market position feedback

## Example Usage

```typescript
const result = calculateEnhancedEstimatedTime({
  volume: 28,
  distance: 10,
  teamSize: 3,
  propertyType: 'villa',
  livingArea: 100,
  floors: { from: 1, to: 2 },
  elevatorType: { from: 'ingen', to: 'stor' },
  parkingDistance: { from: 5, to: 20 },
  services: ['moving', 'packing'],
  trafficFactor: 'normal'
});

// Result includes:
// - totalHours: 5.5
// - breakdown: detailed hours per task
// - teamOptimization: recommendations
// - competitiveAnalysis: market comparison
```

## Next Steps
1. Update booking form to allow team size selection
2. Add traffic factor selection for move times
3. Display competitive analysis to customers
4. Use optimization recommendations in CRM

## Testing
The new algorithm has been calibrated to match competitor performance:
- 250 kvm villa with 3 people: ~10 hours (matches Jordgubbsprinsen)
- Efficiency significantly increased for 3+ person teams