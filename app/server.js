// Simple demo web app used by Experiment 7 and 8.
// APP_VERSION and APP_COLOR are set by Kubernetes so you can see
// which version (blue / green) is serving traffic.
const http = require('http');

const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || 'v1';
const COLOR = process.env.APP_COLOR || 'blue';

function handler(req, res) {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'UP', version: VERSION, color: COLOR }));
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`<!doctype html>
<html>
<head><title>DevOps Demo App</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:80px;background:${COLOR === 'green' ? '#d4f7d4' : '#d4e4f7'}">
  <h1>DevOps Demo App</h1>
  <h2>Version: ${VERSION}</h2>
  <h2>Environment: <span style="color:${COLOR}">${COLOR.toUpperCase()}</span></h2>
  <p>Deployed with Jenkins + Docker + Kubernetes</p>
  <p>Served by pod: ${process.env.HOSTNAME || 'local'}</p>
</body>
</html>`);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

const server = http.createServer(handler);

if (require.main === module) {
  server.listen(PORT, () => console.log(`App ${VERSION} (${COLOR}) running on port ${PORT}`));
}

module.exports = { handler, server };
