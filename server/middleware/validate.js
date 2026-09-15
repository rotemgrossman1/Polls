const { BadRequestError } = require('../utils/httpErrors');

const SOURCES = ['params', 'query', 'body'];

const defaultError = () => new BadRequestError();

// Validates request parts against Zod schemas and replaces them with the parsed values,
// so controllers only see validated input. `error` builds the error sent on failure.
function validate(schemas, { error = defaultError } = {}) {
  return (req, res, next) => {
    for (const source of SOURCES) {
      const schema = schemas[source];
      if (schema) {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
          const err = error();
          // Issue paths only, never the submitted values; logged by the error handler.
          err.details = result.error.issues.map((issue) => `${source}.${issue.path.join('.')}: ${issue.code}`);
          return next(err);
        }

        // Express 5 exposes req.query through a getter, so redefine instead of assigning.
        Object.defineProperty(req, source, {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    }

    return next();
  };
}

module.exports = validate;
