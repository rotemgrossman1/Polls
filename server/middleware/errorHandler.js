const { AppError } = require('../utils/httpErrors');
const logger = require('../utils/logger');

const GENERIC_MESSAGE = 'Something went wrong';

// body-parser error types mapped to client-safe responses.
const BODY_PARSER_ERRORS = {
  'entity.parse.failed': { status: 400, message: 'Invalid request' },
  'entity.too.large': { status: 413, message: 'Request too large' },
};

function requestContext(req) {
  return {
    method: req.method,
    path: req.originalUrl.split('?')[0],
    userId: req.user ? req.user.id : undefined,
  };
}

// Centralized error middleware. Express needs all four arguments to treat it as one.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const context = requestContext(req);

  if (err instanceof AppError) {
    logger.info(
      { ...context, status: err.status, reason: err.publicMessage, details: err.details },
      'Request rejected',
    );
    return res.status(err.status).json({ data: null, error: err.publicMessage });
  }

  const bodyParserError = BODY_PARSER_ERRORS[err.type];
  if (bodyParserError) {
    logger.info({ ...context, status: bodyParserError.status, reason: err.type }, 'Request rejected');
    return res.status(bodyParserError.status).json({ data: null, error: bodyParserError.message });
  }

  logger.error({ ...context, err }, 'Unhandled error');
  return res.status(500).json({ data: null, error: GENERIC_MESSAGE });
}

module.exports = errorHandler;
