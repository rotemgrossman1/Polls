require('./loadEnv');

const { DATABASE_URL, DATABASE_URL_TEST } = process.env;

if (DATABASE_URL && DATABASE_URL_TEST && DATABASE_URL === DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL_TEST must differ from DATABASE_URL');
}

const common = {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
};

// Read by sequelize-cli (see .sequelizerc) and by models/index.js.
module.exports = {
  development: { ...common, url: DATABASE_URL },
  test: { ...common, url: DATABASE_URL_TEST },
  production: { ...common, url: DATABASE_URL },
};
