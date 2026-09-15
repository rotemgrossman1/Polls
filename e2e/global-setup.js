// Prepares the E2E database: create it if missing, migrate, reset, and seed the two users.
const { execSync } = require('child_process');
const path = require('path');
const { ROOT, serverRequire, e2eDatabaseUrl, E2E_USERNAME, OTHER_USERNAME } = require('./helpers/env');

const { Client } = serverRequire('pg');

async function ensureDatabaseExists(url) {
  const name = decodeURIComponent(new URL(url).pathname.slice(1));
  const maintenance = new URL(url);
  maintenance.pathname = '/postgres';
  const client = new Client({ connectionString: maintenance.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (!rowCount) {
      await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}

module.exports = async () => {
  const url = e2eDatabaseUrl();
  await ensureDatabaseExists(url);

  // The server's development config reads DATABASE_URL, so point it at the E2E database.
  execSync('npx sequelize-cli db:migrate', {
    cwd: path.join(ROOT, 'server'),
    env: { ...process.env, NODE_ENV: 'development', DATABASE_URL: url },
    stdio: 'ignore',
  });

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('TRUNCATE poll_options, polls, users CASCADE');
    await client.query('INSERT INTO users (username) VALUES ($1), ($2)', [E2E_USERNAME, OTHER_USERNAME]);
  } finally {
    await client.end();
  }
};
