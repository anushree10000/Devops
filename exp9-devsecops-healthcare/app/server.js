// Demo "Patient Portal" API for the DevSecOps healthcare experiment.
// Security features shown in the code:
//   - API token authentication (token comes from a Kubernetes Secret, never from code)
//   - Role-based access control (doctor sees clinical data, receptionist does not)
//   - Masking of sensitive identifiers (Aadhaar, phone)
//   - Security headers on every response
//   - Audit log line for every access to patient data
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// Sample (fake) patient records - never use real patient data in demos or tests
const patients = [
  { id: 'P001', name: 'Ravi Kumar', aadhaar: '123412341234', phone: '9876543210', diagnosis: 'Type 2 Diabetes', bloodGroup: 'B+' },
  { id: 'P002', name: 'Meena Iyer', aadhaar: '567856785678', phone: '9123456780', diagnosis: 'Hypertension', bloodGroup: 'O+' },
];

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

function mask(value, visible = 4) {
  return '*'.repeat(Math.max(0, value.length - visible)) + value.slice(-visible);
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function audit(role, action, outcome) {
  console.log(JSON.stringify({ time: new Date().toISOString(), type: 'AUDIT', role, action, outcome }));
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
  res.end(JSON.stringify(body));
}

function handler(req, res) {
  const url = req.url.split('?')[0];

  if (url === '/health') return send(res, 200, { status: 'UP' });
  if (url === '/') return send(res, 200, { app: 'Patient Portal (DevSecOps demo)', endpoints: ['/health', '/api/patients'] });

  if (url === '/api/patients') {
    const token = req.headers['x-api-token'];
    const role = req.headers['x-user-role'];
    const expected = process.env.API_TOKEN;

    if (!expected || !token || !safeEqual(token, expected)) {
      audit(role || 'unknown', 'list_patients', 'DENIED_AUTH');
      return send(res, 401, { error: 'Unauthorized' });
    }
    if (!['doctor', 'receptionist'].includes(role)) {
      audit(role || 'unknown', 'list_patients', 'DENIED_ROLE');
      return send(res, 403, { error: 'Forbidden' });
    }

    const data = patients.map((p) => {
      const record = { id: p.id, name: p.name, aadhaar: mask(p.aadhaar), phone: mask(p.phone) };
      if (role === 'doctor') {
        record.diagnosis = p.diagnosis;
        record.bloodGroup = p.bloodGroup;
      }
      return record;
    });
    audit(role, 'list_patients', 'ALLOWED');
    return send(res, 200, data);
  }

  return send(res, 404, { error: 'Not Found' });
}

if (require.main === module) {
  http.createServer(handler).listen(PORT, () => console.log(`Patient Portal running on port ${PORT}`));
}

module.exports = { handler, mask };
