jest.mock('../../utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const errorHandler = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const { NotFoundError, UnauthorizedError } = require('../../utils/httpErrors');

function mockReq() {
  return { method: 'POST', originalUrl: '/api/polls?x=1', user: { id: 'user-1' } };
}

function mockRes() {
  const res = { headersSent: false };
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('errorHandler', () => {
  test('sends an AppError with its status and public message', () => {
    const res = mockRes();
    errorHandler(new NotFoundError('Poll not found'), mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'Poll not found' });
  });

  test('uses the default message of each AppError subclass', () => {
    const res = mockRes();
    errorHandler(new UnauthorizedError(), mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'Authentication required' });
  });

  test('maps malformed JSON to 400', () => {
    const res = mockRes();
    const err = Object.assign(new Error('Unexpected token'), { type: 'entity.parse.failed' });
    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'Invalid request' });
  });

  test('maps an oversized body to 413', () => {
    const res = mockRes();
    const err = Object.assign(new Error('request entity too large'), { type: 'entity.too.large' });
    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'Request too large' });
  });

  test('hides unexpected errors behind a generic 500 and logs them with context', () => {
    const res = mockRes();
    const err = new Error('relation "polls" does not exist');
    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'Something went wrong' });
    const body = JSON.stringify(res.json.mock.calls[0][0]);
    expect(body).not.toContain('relation');
    expect(body).not.toContain('stack');
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/api/polls', userId: 'user-1', err }),
      'Unhandled error',
    );
  });

  test('delegates to Express when headers were already sent', () => {
    const res = mockRes();
    res.headersSent = true;
    const next = jest.fn();
    const err = new Error('late failure');
    errorHandler(err, mockReq(), res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});
