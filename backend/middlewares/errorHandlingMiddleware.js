// backend/middlewares/errorHandler.js
export default function errorHandler(err, req, res, next) {
  // Normalize error object
  const error = err || {};
  const message = error.message || 'Internal server error';

  // Map custom error codes to HTTP statuses
  const codeToStatus = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INVALID_INPUT: 400,
    USER_EXISTS: 409,
    INVALID_CREDENTIALS: 401,
    INSUFFICIENT_STOCK: 409,
    NO_REFRESH: 401,
    INVALID_REFRESH: 401,
    INVALID_TOKEN: 401,
    // add more mappings as needed
  };

  // If error has a numeric status, prefer it
  let status = (typeof error.status === 'number' && error.status) || null;

  // Else map known codes
  if (!status && error.code && typeof error.code === 'string') {
    status = codeToStatus[error.code] || null;
  }

  // Default to 500
  status = status || 500;

  // Log full error server-side for debugging/monitoring
  // Keep the log format compact and informative
  console.error(`[Error] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ->`, {
    message: error.message,
    code: error.code,
    status,
    stack: error.stack,
  });

  // In production do not send stack traces to clients
  const payload = { error: message };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = error.stack;
    payload.code = error.code;
  }

  res.status(status).json(payload);
}
