/**
 * Consistent API response format across all endpoints
 */

const success = (res, data, statusCode = 200, message = null) => {
  const payload = { success: true, data };
  if (message) payload.message = message;
  return res.status(statusCode).json(payload);
};

const error = (res, message, statusCode = 400, details = null) => {
  const payload = { success: false, error: { message, code: statusCode } };
  if (details) payload.error.details = details;
  return res.status(statusCode).json(payload);
};

const created = (res, data, message = 'Resource created') => {
  return success(res, data, 201, message);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 500);
};

module.exports = { success, error, created, notFound, unauthorized, forbidden, serverError };
