import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let errors = err.errors;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Please check the highlighted fields.';
    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  } else if (err.name === 'CastError') {
    status = 404;
    message = 'The requested resource was not found.';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `That ${field} is already in use.`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session is invalid or has expired.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body contains invalid JSON.';
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    message,
    ...(errors ? { errors } : {}),
    ...(!env.isProduction && status >= 500 ? { stack: err.stack } : {}),
  });
};
