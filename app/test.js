// Unit tests run by Jenkins in the "Test" stage (node's built-in test runner).
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { handler } = require('./server');

let server;
let base;

before(async () => {
  server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test('home page returns 200', async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /DevOps Demo App/);
});

test('health endpoint reports UP', async () => {
  const res = await fetch(`${base}/health`);
  const body = await res.json();
  assert.strictEqual(body.status, 'UP');
});

test('unknown route returns 404', async () => {
  const res = await fetch(`${base}/nope`);
  assert.strictEqual(res.status, 404);
});
