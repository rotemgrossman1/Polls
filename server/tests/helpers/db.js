const { sequelize } = require('../../models');

async function resetDatabase() {
  await sequelize.truncate({ cascade: true });
}

async function closeDatabase() {
  await sequelize.close();
}

module.exports = { resetDatabase, closeDatabase };
