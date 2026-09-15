'use strict';

require('../utils/loadEnv');

// The fixed test user who acts as the logged-in user until Register and log in ships.
function testUsername() {
  const username = process.env.TEST_USER_USERNAME;
  if (!username) {
    throw new Error('TEST_USER_USERNAME is not set; see server/.env.example');
  }
  return username;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'INSERT INTO users (username) VALUES (:username) ON CONFLICT (username) DO NOTHING',
      { replacements: { username: testUsername() } },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { username: testUsername() });
  },
};
