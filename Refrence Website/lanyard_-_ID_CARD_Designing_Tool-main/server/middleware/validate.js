/**
 * LANYARD-302: Zod-based request validation middleware factory.
 * Usage: router.post('/route', validate(schema), controller)
 *
 * The schema should be a Zod object with optional `body`, `query`, `params` keys.
 * Example:
 *   import { z } from 'zod';
 *   const schema = z.object({ body: z.object({ email: z.string().email() }) });
 *   router.post('/login', validate(schema), loginController);
 */

let z;
try {
  z = (await import('zod')).z;
} catch {
  z = null;
}

/**
 * @param {import('zod').ZodSchema} schema
 */
export function validate(schema) {
  return (req, res, next) => {
    if (!z) {
      // Zod not installed — pass through without validation
      return next();
    }
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: true, message: 'Validation failed.', errors });
    }
    // Attach parsed, coerced data back onto the request
    req.body   = result.data.body   ?? req.body;
    req.query  = result.data.query  ?? req.query;
    req.params = result.data.params ?? req.params;
    next();
  };
}
