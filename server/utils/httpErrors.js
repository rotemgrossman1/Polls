// Errors with a status and a message that is safe to show to clients.
class AppError extends Error {
  constructor(status, publicMessage) {
    super(publicMessage);
    this.name = this.constructor.name;
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Invalid request') {
    super(400, message);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

module.exports = { AppError, BadRequestError, UnauthorizedError, NotFoundError };
