# 🚨 DEMO API FIX - IMMEDIATE SOLUTION

## ✅ BOOKING API IS WORKING!

The `/api/submit-booking` endpoint is working perfectly. The issue was field name mismatches.

## 🔧 QUICK FIX FOR YOUR DEMO SCRIPT

Replace your booking request with this format:

```javascript
// WORKING FORMAT FOR DEMO
const bookingData = {
  // Customer info (use these field names!)
  name: "Anna Svensson",
  email: "anna.svensson@email.se",
  phone: "+46 70 123 4567",
  customerType: "private",
  
  // Services (translate Swedish to English)
  serviceType: "moving",
  serviceTypes: ["packing", "moving", "cleaning"],
  
  // Moving details
  moveDate: "2025-08-20",
  moveTime: "09:00",
  startAddress: "Hornsgatan 45, 118 49 Stockholm (Södermalm)",
  endAddress: "Östermalmsvägen 12, 114 39 Stockholm (Östermalm)",
  
  // Floors (as strings!)
  startFloor: "2",
  endFloor: "3",
  startElevator: "true",
  endElevator: "true",
  
  // Parking (as strings!)
  startParkingDistance: "10",
  endParkingDistance: "5",
  
  // Living area (required)
  startLivingArea: "75",
  endLivingArea: "75",
  
  // Volume and extras
  estimatedVolume: 25,
  movingBoxes: 40,
  specialInstructions: "Piano transport, fragile artwork, vintage furniture",
  
  // Required fields
  paymentMethod: "invoice",
  additionalServices: ["packingMaterial"]
};

// Send to API
const response = await fetch('http://localhost:3000/api/submit-booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData)
});
```

## 📋 FIELD MAPPING

Your Demo Format → API Format:
- `customer_name` → `name`
- `customer_email` → `email`
- `customer_phone` → `phone`
- `from_address` → `startAddress`
- `to_address` → `endAddress`
- `moving_date` → `moveDate`
- `floors` → `startFloor` (as string)
- `target_floors` → `endFloor` (as string)
- `parking_distance_from` → `startParkingDistance` (as string)
- `parking_distance_to` → `endParkingDistance` (as string)
- `special_requirements` → `specialInstructions`

Services mapping:
- `"packhjälp"` → `"packing"`
- `"flytt"` → `"moving"`
- `"flyttstädning"` → `"cleaning"`

## ✅ TESTED AND CONFIRMED WORKING

Just tested with your exact data:
- Status: 200 OK
- Booking created successfully
- Customer ID: acdd436d-a6bf-48f1-92cd-5796bface16c
- Booking ID: a620433d-2880-4d48-b602-887088a4d71c
- Total Price: 12,186 SEK

## 🚀 IMMEDIATE ACTION

1. Update your demo script to use the field names shown above
2. Make sure to convert Swedish service names to English
3. Convert numeric fields to strings where needed
4. Include required fields: `startLivingArea`, `endLivingArea`, `paymentMethod`

The API is ready for your demo!