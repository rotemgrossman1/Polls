const createApp = require('./app');
const logger = require('./utils/logger');

const DEFAULT_PORT = 3000;
const port = Number(process.env.PORT) || DEFAULT_PORT;

createApp().listen(port, () => {
  logger.info({ port }, 'Server listening');
});
