import { Request, Response, NextFunction } from 'express';
import { IUser } from '../types';
import { asyncHandler, AppError } from './errorHandler';
import { getUserFromToken } from '../services/authService';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    // Get user from token
    const user = await getUserFromToken(token);
    
    if (!user) {
      return next(new AppError('User not found', 401));
    }
    
    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('Not authorized to access this route', 401));
  }
});

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Implement role-based authorization
    // For now, just pass through
    next();
  };
};
