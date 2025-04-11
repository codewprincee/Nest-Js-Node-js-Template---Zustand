import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../types';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: (req as any).user?._id
  });

  // Handle different types of errors
  if (err instanceof AppError) {
    // Our custom application error
    return ApiResponse.error(res, {
      message: err.message,
      statusCode: err.statusCode,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    // Mongoose validation error
    const errors = Object.values(err.errors).map(val => val.message);
    return ApiResponse.badRequest(res, {
      message: 'Validation Error',
      error: errors
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    // Mongoose cast error (e.g., invalid ID)
    return ApiResponse.badRequest(res, {
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    // Mongoose duplicate key error
    const field = Object.keys((err as any).keyValue)[0];
    return ApiResponse.badRequest(res, {
      message: `Duplicate field value: ${field}. Please use another value.`
    });
  }

  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    // JWT errors
    return ApiResponse.unauthorized(res, {
      message: 'Invalid or expired token'
    });
  }

  // If we got this far, it's an unknown error
  // Only send error details in development
  const errorDetails = process.env.NODE_ENV === 'development' 
    ? { stack: err.stack } 
    : {};
  
  return ApiResponse.error(res, {
    message: err.message || 'Internal Server Error',
    error: errorDetails
  });
};

/**
 * Handle 404 Not Found routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  return ApiResponse.notFound(res, {
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Handler for uncaught exceptions and unhandled promise rejections
 */
export const setupUncaughtHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    
    // Give the logger time to log the error before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', { 
      reason,
      promise,
      stack: (reason instanceof Error) ? reason.stack : undefined
    });
    
    // We don't exit the process here to allow the application to continue running
  });
}; 