import http from 'k6/http';
import { check, sleep, group } from 'k6';

// k6 Load Test Baseline Script for ForgeFlow API
export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Ramp-up to 20 VUs
    { duration: '20s', target: 50 },   // Sustained load at 50 VUs
    { duration: '10s', target: 100 }, // Peak load test at 100 VUs
    { duration: '10s', target: 0 },   // Ramp-down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.05'],                 // Error rate < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  group('1. System Health Checks', function () {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
    });
  });

  group('2. Public & Auth Endpoints', function () {
    const loginPayload = JSON.stringify({
      email: 'admin@forgeflow.local',
      password: 'AdminPassword123!',
      turnstile_token: 'mock_token',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, params);
    check(loginRes, {
      'login status valid (200/400/401/422)': (r) => [200, 400, 401, 422].includes(r.status),
    });
  });

  group('3. Metrics & Cached Endpoints', function () {
    const res = http.get(`${BASE_URL}/api/crm/metrics`, {
      headers: {
        'X-Organization-ID': '1',
      },
    });
    check(res, {
      'crm metrics response valid': (r) => [200, 401, 403, 404].includes(r.status),
    });
  });

  sleep(1);
}
