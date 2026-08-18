// GLOBAL ERROR HANDLER (Prevents server crashes)
exports.errorHandler = (err, req, res, next) => {
  console.error('🚨 UNHANDLED ERROR:', err.message);
  console.error('Stack:', err.stack);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Invalid data provided',
      details: Object.keys(err.errors).map(key => err.errors[key].message),
    });
  }

  // Mongoose duplicate key errors
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'A record with this information already exists',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Session expired. Please log in again.',
    });
  }

  // Default server error (500)
  res.status(err.statusCode || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error. Please try again.'
      : err.message,
  });
};

// 404 HANDLER (For undefined routes)
exports.notFound = (req, res, next) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
};