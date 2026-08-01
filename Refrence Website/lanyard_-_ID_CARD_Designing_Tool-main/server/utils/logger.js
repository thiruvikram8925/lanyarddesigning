/**
 * LANYARD-303: Structured logger using pino.
 * Falls back to a console shim if pino is not installed yet.
 */

let logger;

try {
  const pino = (await import('pino')).default;
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });
} catch {
  // Lightweight console shim so the server works without pino installed
  const fmt = (level, msg, meta) => {
    const ts = new Date().toISOString();
    const extra = meta ? ' ' + JSON.stringify(meta) : '';
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${ts}] ${level.toUpperCase()} ${msg}${extra}`);
  };
  logger = {
    info:  (msg, meta) => fmt('info', msg, meta),
    warn:  (msg, meta) => fmt('warn', msg, meta),
    error: (msg, meta) => fmt('error', msg, meta),
    debug: (msg, meta) => fmt('debug', msg, meta),
  };
}

export default logger;
