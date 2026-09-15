// Tells search engines not to list the response, including error responses.
function noIndex(req, res, next) {
  res.set('X-Robots-Tag', 'noindex');
  next();
}

module.exports = noIndex;
