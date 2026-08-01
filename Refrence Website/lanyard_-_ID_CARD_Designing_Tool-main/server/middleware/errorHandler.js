/**
 * LANYARD-303: Global Express error handler.
 * Catches all errors passed via next(err) or thrown in async routes.
 * Returns a consistent JSON shape and avoids leaking stack traces in production.
 */
import logger from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(message, {
    status,
    method: req.method,
    url: req.originalUrl,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(status).json({
    error: true,
    message,
    // Only expose stack in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
