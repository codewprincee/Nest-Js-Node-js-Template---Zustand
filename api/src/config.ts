import dotenv from 'dotenv';

// Load environment variables
dotenv.config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development'
});

// JWT configuration
export const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'your-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Server configuration
export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const API_VERSION = process.env.API_VERSION || 'v1';

// Database configuration
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afer-health';

// FCM configuration
export const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || ''; 