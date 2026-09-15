// Wraps an async route handler so rejected promises reach the error middleware.
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve()
    .then(() => handler(req, res, next))
    .catch(next);

module.exports = asyncHandler;
