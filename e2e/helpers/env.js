// Shared E2E settings. Loads server/.env so DATABASE_URL_E2E and friends are available.
const path = require('path');
const { createRequire } = require('module');

const ROOT = path.resolve(__dirname, '..', '..');
// Reuse the server's installed packages (pg, dotenv) instead of duplicating them here.
const serverRequire = createRequire(path.join(ROOT, 'server', 'package.json'));
serverRequire('dotenv').config({ path: path.join(ROOT, 'server', '.env'), quiet: true });

const API_PORT = 3100;
const CLIENT_PORT = 5174;
const E2E_USERNAME = 'e2e-user';
const OTHER_USERNAME = 'e2e-other-user';

function e2eDatabaseUrl() {
  const url = process.env.DATABASE_URL_E2E;
  if (!url) {
    throw new Error('DATABASE_URL_E2E is not set; see server/.env.example');
  }
  if (url === process.env.DATABASE_URL || url === process.env.DATABASE_URL_TEST) {
    throw new Error('DATABASE_URL_E2E must differ from DATABASE_URL and DATABASE_URL_TEST');
  }
  return url;
}

module.exports = {
  ROOT,
  serverRequire,
  API_PORT,
  CLIENT_PORT,
  API_URL: `http://localhost:${API_PORT}/api`,
  CLIENT_URL: `http://localhost:${CLIENT_PORT}`,
  E2E_USERNAME,
  OTHER_USERNAME,
  e2eDatabaseUrl,
};
