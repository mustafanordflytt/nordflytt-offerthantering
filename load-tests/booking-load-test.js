import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 50 },   // Ramp down to 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = 'http://localhost:3000';

// Test data generator
function generateBookingData() {
  const randomNum = Math.floor(Math.random() * 10000);
  return {
    customerType: 'private',
    customerInfo: {
      name: `Test User ${randomNum}`,
      email: `test${randomNum}@example.com`,
      phone: `070${Math.floor(Math.random() * 10000000)}`,
    },
    moveDetails: {
      moveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startAddress: 'Testgatan 1, Stockholm',
      endAddress: 'Testgatan 2, Stockholm',
      startFloor: Math.floor(Math.random() * 5),
      endFloor: Math.floor(Math.random() * 5),
      livingArea: 50 + Math.floor(Math.random() * 100),
    },
    services: {
      movingService: true,
      packingService: Math.random() > 0.5 ? 'partial' : 'none',
      cleaningService: Math.random() > 0.5 ? 'basic' : 'none',
    }
  };
}

export default function () {
  // Test 1: Load booking form
  const formResponse = http.get(`${BASE_URL}/form`);
  check(formResponse, {
    'form loads successfully': (r) => r.status === 200,
    'form loads quickly': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 2: Check API health
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'API is healthy': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Test 3: Submit booking
  const bookingData = generateBookingData();
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const bookingResponse = http.post(
    `${BASE_URL}/api/submit-booking`,
    JSON.stringify(bookingData),
    params
  );
  
  check(bookingResponse, {
    'booking submitted successfully': (r) => r.status === 200 || r.status === 201,
    'booking returns ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.bookingId !== undefined;
      } catch (e) {
        return false;
      }
    },
    'booking response time OK': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(2);

  // Test 4: Check order confirmation
  if (bookingResponse.status === 200) {
    try {
      const bookingData = JSON.parse(bookingResponse.body);
      const confirmationResponse = http.get(
        `${BASE_URL}/api/orders/confirmation?token=${bookingData.bookingId}`
      );
      
      check(confirmationResponse, {
        'confirmation loads': (r) => r.status === 200,
      }) || errorRate.add(1);
    } catch (e) {
      errorRate.add(1);
    }
  }

  sleep(1);
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
}