const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for developer
  console.log(err.stack);

  // Mongoose bad ObjectId (e.g., trying to find a hospital with an invalid ID format)
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose duplicate key (e.g., registering with an email that already exists)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose validation error (e.g., missing a required field)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new Error(message);
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;