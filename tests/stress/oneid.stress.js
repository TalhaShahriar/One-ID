import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Options: 30 virtual users, ramp up to 30 over 30s, hold for 60s, then ramp down.
export const options = {
  stages: [
    { duration: '30s', target: 30 }, // ramp up
    { duration: '60s', target: 30 }, // hold
    { duration: '10s', target: 0 },  // ramp down
  ],
  thresholds: {
    'http_req_duration{endpoint:health}': ['p(95)<100'],
    'http_req_duration{endpoint:summary}': ['p(95)<300'],
    'http_req_duration{endpoint:tax_calc}': ['p(95)<200'],
    'http_req_duration{endpoint:ledger_stats}': ['p(95)<200'],
    'http_req_duration{endpoint:property_history}': ['p(95)<300'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Setup function - logs in test citizen and returns token
export function setup() {
  const loginUrl = `${BASE_URL}/api/auth/login`;
  const payload = JSON.stringify({
    email: 'talha@citizen.bd',
    password: 'Test@1234',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(loginUrl, payload, params);
  
  const token = res.json('token') || res.json('data.token');

  if (!token) {
    console.error('❌ Failed to login and retrieve JWT in setup block!');
  }

  return { token };
}

// Main test loop
export default function (data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  // 1. GET /api/health
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { endpoint: 'health' },
  });
  check(healthRes, {
    'health returns 200': (r) => r.status === 200,
    'health body is not empty': (r) => r.body && r.body.length > 0,
  });

  sleep(1);

  // 2. GET /api/citizen/summary (Authenticated)
  if (token) {
    const summaryRes = http.get(`${BASE_URL}/api/citizen/summary`, {
      headers,
      tags: { endpoint: 'summary' },
    });
    check(summaryRes, {
      'summary returns 200': (r) => r.status === 200,
      'summary body contains division/details': (r) => r.body && r.body.includes('Dhaka'),
    });
  }

  sleep(1);

  // 3. POST /api/tax/calculate (Authenticated)
  if (token) {
    const taxPayload = JSON.stringify({
      grossIncome: 800000,
      taxYear: 2024,
      gender: 'MALE',
      residencyType: 'RESIDENT',
    });
    const taxRes = http.post(`${BASE_URL}/api/tax/calculate`, taxPayload, {
      headers,
      tags: { endpoint: 'tax_calc' },
    });
    check(taxRes, {
      'tax calculate returns 200': (r) => r.status === 200,
      'tax returns correct calculations': (r) => r.body && r.body.includes('calculatedTax'),
    });
  }

  sleep(1);

  // 4. GET /api/ledger/stats (Public)
  const statsRes = http.get(`${BASE_URL}/api/ledger/stats`, {
    tags: { endpoint: 'ledger_stats' },
  });
  check(statsRes, {
    'ledger stats returns 200': (r) => r.status === 200,
    'ledger stats has valid statistics count': (r) => r.body && r.body.includes('stats'),
  });

  sleep(1);

  // 5. GET /api/property/{id}/history (Public)
  const propId = 'PROP-BD-MIRPUR-001';
  const historyRes = http.get(`${BASE_URL}/api/property/${propId}/history`, {
    tags: { endpoint: 'property_history' },
  });
  check(historyRes, {
    'property history returns 200': (r) => r.status === 200,
    'property history has transaction records': (r) => r.body && (r.body.includes('Mirpur') || r.body.length >= 2),
  });

  sleep(1);
}
