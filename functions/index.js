
const { onRequest } = require('firebase-functions/v2/https');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, conf: { distDir: path.join(__dirname, '..', '.next') } });
const handle = app.getRequestHandler();

exports.nextServer = onRequest((req, res) => {
  return app.prepare().then(() => handle(req, res));
});
