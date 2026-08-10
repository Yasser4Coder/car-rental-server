import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      details: err.flatten(),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Each photo must be 10MB or smaller',
      LIMIT_FILE_COUNT: 'You can upload at most 8 photos at once',
      LIMIT_UNEXPECTED_FILE: 'Unexpected upload field',
    };
    return res.status(400).json({
      message: messages[err.code] || `Upload error: ${err.message}`,
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}
