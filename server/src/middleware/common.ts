/** Shared Express middleware: request ids and logging, rate limiters, 404 and the central error handler. */
import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import type { Config } from '../config';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const requestContext: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    // Log the route path only (no query string / body) to avoid leaking coordinates or personal text.
    logger.info('request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Math.round(Number(process.hrtime.bigint() - start) / 1e6),
      userKind: req.user ? (req.user.demo ? 'demo' : 'user') : 'anon',
    });
  });
  next();
};

const limitHandler =
  (message: string): RequestHandler =>
  (_req, res) => {
    res.status(429).json({ error: { code: 'RATE_LIMITED', message } });
  };

export function createLimiters(config: Config) {
  const base = { standardHeaders: true, legacyHeaders: false } as const;
  return {
    general: rateLimit({
      ...base,
      windowMs: 60_000,
      limit: config.rateLimits.generalPerMin,
      handler: limitHandler('Too many requests. Please slow down and try again shortly.'),
    }),
    ai: rateLimit({
      ...base,
      windowMs: 60_000,
      limit: config.rateLimits.aiPerMin,
      handler: limitHandler('You are asking the assistant very quickly. Please wait a moment and try again.'),
    }),
    write: rateLimit({
      ...base,
      windowMs: 3_600_000,
      limit: config.rateLimits.writePerHour,
      handler: limitHandler('Submission limit reached. Please try again later.'),
    }),
  };
}

export const notFound: RequestHandler = (_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found.'));

// Express identifies error middleware by arity, so all four parameters are required.

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details, requestId: req.requestId } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Some inputs are invalid.', requestId: req.requestId } });
    return;
  }
  // body-parser errors (bad JSON, too large)
  if (typeof err === 'object' && err && 'status' in err && (err as { status: number }).status === 400) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body.', requestId: req.requestId } });
    return;
  }
  if (typeof err === 'object' && err && 'status' in err && (err as { status: number }).status === 413) {
    res.status(413).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body too large.', requestId: req.requestId } });
    return;
  }
  logger.error('unhandled error', { requestId: req.requestId, message: err instanceof Error ? err.message : String(err) });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.', requestId: req.requestId } });
};
