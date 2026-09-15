const { Sequelize } = require('sequelize');
const dbConfig = require('../utils/dbConfig');

const env = process.env.NODE_ENV || 'development';
const { url, ...options } = dbConfig[env];

const sequelize = new Sequelize(url, options);

const models = {
  User: require('./user')(sequelize),
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = { sequelize, Sequelize, ...models };
