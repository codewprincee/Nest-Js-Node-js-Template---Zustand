import { Request } from 'express';
import { Document } from 'mongoose';
import { UserRole } from '../models/User';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string | undefined;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: 'user' | 'admin';
  fcmTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  generateAuthToken(): string;
  generateRefreshToken(): string;
  comparePassword(password: string): Promise<boolean>;
}

export interface IToken extends Document {
  userId: string;
  token: string;
  type: 'refresh' | 'access' | 'reset';
  expiresAt: Date;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
} 