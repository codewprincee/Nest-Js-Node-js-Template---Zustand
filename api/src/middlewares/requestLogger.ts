import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Create a custom morgan token for request ID
morgan.token('id', (req: Request) => {
  return (req as any).id;
});

// Create a custom morgan token for user ID
morgan.token('user', (req: Request) => {
  return (req as any).user ? (req as any).user._id : 'anonymous';
});

// Create a custom morgan token for request body
morgan.token('body', (req: Request) => {
  const body = {...req.body};
  
  // Remove sensitive data
  if (body.password) body.password = '[FILTERED]';
  if (body.refreshToken) body.refreshToken = '[FILTERED]';
  if (body.accessToken) body.accessToken = '[FILTERED]';
  
  return JSON.stringify(body);
});

// Create a custom morgan token for response time using type assertion to bypass type checking
(morgan as any).token('response-time', (req: any, res: any, arg?: string) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  
  const digits = typeof arg !== 'undefined' ? parseInt(arg, 10) : 3;
  return ms.toFixed(digits);
});

// Custom format string
const morganFormat = ':method :url :status :response-time ms - :res[content-length] - :user - :body';

// Generate a unique ID for each request
export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  (req as any).id = id;
  
  // Set start time for timing
  (req as any)._startAt = process.hrtime();
  res.on('finish', () => {
    (res as any)._startAt = process.hrtime();
  });
  
  next();
};

// Create a stream object with a 'write' function that will be used by morgan
const stream = {
  // Use the http severity
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Development logger with console output
export const developmentLogger = morgan(morganFormat, {
  stream: stream,
  skip: (req, res) => res.statusCode < 400 // Only log errors in production
});

// Production logger with minimal output
export const productionLogger = morgan('combined', {
  stream: stream,
  skip: (req, res) => res.statusCode < 400 // Only log errors in production
});

// Export the appropriate logger based on environment
export const requestLogger = process.env.NODE_ENV === 'development' 
  ? developmentLogger 
  : productionLogger; 