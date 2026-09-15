const { NotFoundError } = require('../utils/httpErrors');

function notFound(req, res, next) {
  next(new NotFoundError());
}

module.exports = notFound;
