import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import User from '../models/User.js';

// Guard Layer: Enforces valid authorization headers or credentials before allowing access
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract Bearer token matrix from standard incoming request headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication failed. Missing operational token parameters.', 401));
  }

  // 2. Verify token signature against environment secrets
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Verify user still exists in the database
  const currentUser = await User.findById(decoded.id).select('+isActive');
  if (!currentUser) {
    return next(new AppError('The user associated with this active token no longer exists.', 401));
  }

  // 4. Verify user account hasn't been disabled by administration
  if (!currentUser.isActive) {
    return next(new AppError('This user account footprint has been suspended.', 403));
  }

  // 5. Verify user hasn't changed their password since the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password recently altered. Token revoked. Please log in again.', 401));
  }

  // Inject user identity directly into the request payload loop
  req.user = currentUser;
  next();
});

// Access Layer: Permits route execution exclusively for designated administrative roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access Denied. Insufficient administrative clearances.', 403));
    }
    next();
  };
};