const pino = require('pino');

const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});

module.exports = logger;
