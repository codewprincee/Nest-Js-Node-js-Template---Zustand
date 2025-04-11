import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { AppError, AuthRequest } from '../types';
import { UserRole } from '../models/User';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1) Get token from header
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access', 401));
    }

    // 2) Verify token
    const user = await verifyToken(token, 'access');
    
    // 3) Attach user to request object
    req.user = {
      id: user._id,
      role: user.role as UserRole
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
}; 