const { execSync } = require('child_process');
const path = require('path');

// Brings the test database schema up to date once before the test run.
module.exports = async () => {
  require('../../utils/loadEnv');

  if (!process.env.DATABASE_URL_TEST) {
    throw new Error('DATABASE_URL_TEST is not set; see server/.env.example');
  }

  execSync('npx sequelize-cli db:migrate --env test', {
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'inherit',
  });
};
