import http from 'k6/http';
import { check, sleep, group } from 'k6';

// k6 Load Test Baseline Script for ForgeFlow API
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up to 20 VUs
    { duration: '1m', target: 50 },   // Sustained load at 50 VUs
    { duration: '30s', target: 100 }, // Peak load test at 100 VUs
    { duration: '30s', target: 0 },   // Ramp-down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  group('1. System Health Checks', function () {
    const res = http.get(`${BASE_URL}/healthz`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
    });
  });

  group('2. Public & Auth Endpoints', function () {
    const loginPayload = JSON.stringify({
      email: 'admin@forgeflow.local',
      password: 'AdminPassword123!',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, params);
    check(loginRes, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
  });

  group('3. Metrics & Cached Endpoints', function () {
    const res = http.get(`${BASE_URL}/api/crm/metrics`, {
      headers: {
        'X-Organization-ID': '1',
      },
    });
    check(res, {
      'crm metrics response valid': (r) => r.status === 200 || r.status === 401 || r.status === 403,
    });
  });

  sleep(1);
}
