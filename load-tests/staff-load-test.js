import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { WebSocket } from 'k6/experimental/websockets';

const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    // Scenario 1: Regular API load
    api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    // Scenario 2: WebSocket connections (real-time)
    websocket_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 30 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<700'],
    ws_connecting: ['p(95)<1000'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

// Mock auth token for development
const AUTH_TOKEN = 'Bearer development-token';

export default function () {
  const scenario = __ENV.SCENARIO || 'api_load';
  
  if (scenario === 'websocket_load') {
    testWebSocketLoad();
  } else {
    testAPILoad();
  }
}

function testAPILoad() {
  // Test 1: Staff dashboard
  const dashboardResponse = http.get(`${BASE_URL}/staff/dashboard`);
  check(dashboardResponse, {
    'dashboard loads': (r) => r.status === 200,
    'dashboard fast': (r) => r.timings.duration < 700,
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 2: Get jobs
  const today = new Date().toISOString().split('T')[0];
  const jobsResponse = http.get(`${BASE_URL}/api/staff/jobs?date=${today}`, {
    headers: { 'Authorization': AUTH_TOKEN },
  });
  
  check(jobsResponse, {
    'jobs API works': (r) => r.status === 200,
    'jobs API returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (e) {
        return false;
      }
    },
    'jobs API fast': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);

  // Test 3: Update job status
  const updateData = {
    jobId: `test-${Date.now()}`,
    status: 'active',
    timestamp: new Date().toISOString(),
  };
  
  const updateResponse = http.post(
    `${BASE_URL}/api/staff/update-status`,
    JSON.stringify(updateData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN,
      },
    }
  );
  
  check(updateResponse, {
    'status update works': (r) => r.status === 200 || r.status === 201,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Photo upload simulation
  const photoData = {
    jobId: `test-${Date.now()}`,
    category: 'before',
    timestamp: new Date().toISOString(),
    base64: 'data:image/jpeg;base64,/9j/4AAQ...', // Mock base64
  };
  
  const photoResponse = http.post(
    `${BASE_URL}/api/staff/upload-photo`,
    JSON.stringify(photoData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN,
      },
    }
  );
  
  check(photoResponse, {
    'photo upload endpoint exists': (r) => r.status !== 404,
  }) || errorRate.add(1);
}

function testWebSocketLoad() {
  // Test WebSocket connection for real-time updates
  const ws = new WebSocket(`${WS_URL}/api/realtime`);
  
  ws.on('open', () => {
    console.log('WebSocket connected');
    
    // Subscribe to job updates
    ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'jobs',
    }));
  });
  
  ws.on('message', (data) => {
    check(data, {
      'receives realtime updates': () => true,
    });
  });
  
  ws.on('error', (e) => {
    console.error('WebSocket error:', e);
    errorRate.add(1);
  });
  
  // Keep connection alive for test duration
  sleep(30);
  
  ws.close();
}

// Stress test specific endpoints
export function stressTestBookingAPI() {
  const iterations = 100;
  const responses = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    const response = http.get(`${BASE_URL}/api/health`);
    const duration = Date.now() - start;
    
    responses.push({
      status: response.status,
      duration: duration,
    });
  }
  
  // Calculate statistics
  const avgDuration = responses.reduce((sum, r) => sum + r.duration, 0) / responses.length;
  const successRate = responses.filter(r => r.status === 200).length / responses.length;
  
  console.log(`Average duration: ${avgDuration}ms`);
  console.log(`Success rate: ${successRate * 100}%`);
}