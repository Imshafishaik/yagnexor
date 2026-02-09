import rateLimit from 'express-rate-limit';
import Joi from 'joi';

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500'), // Increased to 200 requests
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    req.validatedBody = value;
    next();
  };
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.message === 'Database not initialized') {
    return res.status(500).json({ error: 'Database connection error' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}
