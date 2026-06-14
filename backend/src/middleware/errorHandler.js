const { serverError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);

  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 422,
        details,
      },
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: {
        message: 'Resource already exists',
        code: 409,
      },
    });
  }

  return serverError(res, err.message || 'An unexpected error occurred');
};

const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      code: 404,
    },
  });
};

module.exports = { errorHandler, notFoundHandler };
