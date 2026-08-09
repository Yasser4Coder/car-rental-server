export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const parsed = schema.parse(req[source]);

    // Express 5 exposes req.query (and sometimes params) as getter-only.
    if (source === 'query' || source === 'params') {
      Object.defineProperty(req, source, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[source] = parsed;
    }

    next();
  };
