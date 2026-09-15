const { z } = require('zod');
const validate = require('../../middleware/validate');
const { BadRequestError, NotFoundError } = require('../../utils/httpErrors');

const bodySchema = z.strictObject({ name: z.string().trim().min(1) });
const paramsSchema = z.object({ id: z.uuid() });
const querySchema = z.object({ page: z.coerce.number().int().min(1) });

// Mimics Express 5, where req.query is a getter on the prototype.
function mockReq({ body, params = {}, query = {} } = {}) {
  const proto = {
    get query() {
      return query;
    },
  };
  return Object.assign(Object.create(proto), { body, params });
}

function run(middleware, req) {
  const next = jest.fn();
  middleware(req, {}, next);
  return next;
}

describe('validate', () => {
  test('replaces the body with the parsed value', () => {
    const req = mockReq({ body: { name: '  Ada  ' } });
    const next = run(validate({ body: bodySchema }), req);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ada' });
  });

  test('replaces a getter-only query with the parsed value', () => {
    const req = mockReq({ query: { page: '2' } });
    const next = run(validate({ query: querySchema }), req);

    expect(next).toHaveBeenCalledWith();
    expect(req.query).toEqual({ page: 2 });
  });

  test('passes a 400 BadRequestError with issue paths but no values', () => {
    const req = mockReq({ body: { name: '   ', secret: 'hunter2' } });
    const next = run(validate({ body: bodySchema }), req);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.status).toBe(400);
    expect(err.publicMessage).toBe('Invalid request');
    expect(err.details.join(' ')).toContain('body.name');
    expect(JSON.stringify(err.details)).not.toContain('hunter2');
  });

  test('rejects a missing body', () => {
    const next = run(validate({ body: bodySchema }), mockReq());

    expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
  });

  test('uses a custom error when given', () => {
    const req = mockReq({ params: { id: 'nope' } });
    const middleware = validate(
      { params: paramsSchema },
      { error: () => new NotFoundError('Poll not found') },
    );
    const next = run(middleware, req);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.publicMessage).toBe('Poll not found');
  });

  test('stops at the first invalid source', () => {
    const req = mockReq({ params: { id: 'nope' }, body: { name: 'Ada ' } });
    const next = run(validate({ params: paramsSchema, body: bodySchema }), req);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ name: 'Ada ' });
  });
});
