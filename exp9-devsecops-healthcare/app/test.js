// Security-focused unit tests (run in the Jenkins "Unit & Security Tests" stage)
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { handler, mask } = require('./server');

let server;
let base;
const TOKEN = 'unit-test-only';

before(async () => {
  process.env.API_TOKEN = TOKEN;
  server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const get = (path, headers = {}) => fetch(base + path, { headers });

test('health check works', async () => {
  assert.strictEqual((await get('/health')).status, 200);
});

test('patient data needs a valid token', async () => {
  assert.strictEqual((await get('/api/patients')).status, 401);
  assert.strictEqual((await get('/api/patients', { 'x-api-token': 'wrong', 'x-user-role': 'doctor' })).status, 401);
});

test('unknown roles are forbidden', async () => {
  const res = await get('/api/patients', { 'x-api-token': TOKEN, 'x-user-role': 'hacker' });
  assert.strictEqual(res.status, 403);
});

test('Aadhaar and phone numbers are masked', async () => {
  const res = await get('/api/patients', { 'x-api-token': TOKEN, 'x-user-role': 'doctor' });
  const [p] = await res.json();
  assert.match(p.aadhaar, /^\*{8}\d{4}$/);
  assert.match(p.phone, /^\*{6}\d{4}$/);
});

test('receptionist cannot see diagnosis (RBAC)', async () => {
  const res = await get('/api/patients', { 'x-api-token': TOKEN, 'x-user-role': 'receptionist' });
  const [p] = await res.json();
  assert.strictEqual(p.diagnosis, undefined);
});

test('doctor can see diagnosis', async () => {
  const res = await get('/api/patients', { 'x-api-token': TOKEN, 'x-user-role': 'doctor' });
  const [p] = await res.json();
  assert.ok(p.diagnosis);
});

test('security headers are present', async () => {
  const res = await get('/health');
  assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('content-security-policy'));
  assert.ok(res.headers.get('strict-transport-security'));
});

test('mask helper', () => {
  assert.strictEqual(mask('9876543210'), '******3210');
});
