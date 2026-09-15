require('./utils/loadEnv');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const apiRouter = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const JSON_BODY_LIMIT = '20kb';

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(pinoHttp({ logger }));
  // Without CLIENT_URL no cross-origin requests are allowed.
  app.use(cors({ origin: process.env.CLIENT_URL || false }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
