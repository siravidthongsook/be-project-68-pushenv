function createError(message, statusCode = 500, details = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

module.exports = createError;
