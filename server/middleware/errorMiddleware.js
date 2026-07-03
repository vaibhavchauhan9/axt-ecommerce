import AppError from '../utils/appError.js';

const handleCastErrorDB = (err) => {
  const message = `Invalid path format: ${err.path} parameter value "${err.value}" is malformed.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const extractValue = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate value exception: ${extractValue}. Please map alternative parameter credentials.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation error matrix: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid digital signature. Please login again.', 401);

const handleJWTExpiredError = () => new AppError('Authentication state expired. Request dynamic token rotation.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted execution exceptions: return formatted messaging block
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Structural programming error or system resource failure: log context privately
    console.error('[CRITICAL RUNTIME ERROR]:', err);
    res.status(500).json({
      status: 'error',
      message: 'A critical server configuration anomaly occurred.',
    });
  }
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Normalize JWT errors to a proper 401 AppError in every environment,
  // so the client's 401-based refresh-token interceptor can catch them.
  let normalizedErr = err;
  if (normalizedErr.name === 'JsonWebTokenError') normalizedErr = handleJWTError();
  if (normalizedErr.name === 'TokenExpiredError') normalizedErr = handleJWTExpiredError();

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(normalizedErr, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(normalizedErr);
    error.message = normalizedErr.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};