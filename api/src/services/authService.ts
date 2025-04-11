import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Token, User } from '../models';
import { IUser, AppError } from '../types';

// Generate JWT token
export const generateToken = (userId: string, type: 'access' | 'refresh'): Promise<string> => {
  const secretKey = type === 'access' 
    ? process.env.JWT_ACCESS_SECRET! 
    : process.env.JWT_REFRESH_SECRET!;
  
  const expiresIn = type === 'access' 
    ? process.env.JWT_ACCESS_EXPIRES_IN || '15m' 
    : process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return new Promise((resolve, reject) => {
    // Using any to work around TypeScript's strict typing
    (jwt.sign as any)(
      { id: userId },
      secretKey,
      { expiresIn },
      (err: any, token: string) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });
};

// Save refresh token to database
export const saveToken = async (userId: string, token: string, type: 'refresh' | 'access' | 'reset', expiresIn: string): Promise<void> => {
  // Calculate expiry date
  const expiresAt = new Date();
  if (expiresIn.endsWith('d')) {
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn.slice(0, -1)));
  } else if (expiresIn.endsWith('h')) {
    expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn.slice(0, -1)));
  } else if (expiresIn.endsWith('m')) {
    expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expiresIn.slice(0, -1)));
  }

  // Invalidate existing tokens of the same type
  if (type === 'refresh') {
    await Token.updateMany(
      { userId, type, isValid: true },
      { isValid: false }
    );
  }

  // Create new token
  await Token.create({
    userId,
    token,
    type,
    expiresAt,
    isValid: true
  });
};

// Verify and validate token
export const verifyToken = async (token: string, type: 'access' | 'refresh'): Promise<IUser> => {
  try {
    // First verify the JWT signature
    const secretKey = type === 'access' 
      ? process.env.JWT_ACCESS_SECRET! 
      : process.env.JWT_REFRESH_SECRET!;

    // Using any to work around TypeScript's strict typing
    const decoded = (jwt.verify as any)(token, secretKey) as { id: string };

    // Check if token exists in database (for refresh tokens)
    if (type === 'refresh') {
      const tokenDoc = await Token.findOne({ 
        token, 
        type,
        isValid: true,
        expiresAt: { $gt: new Date() }
      });

      if (!tokenDoc) {
        throw new AppError('Invalid or expired token', 401);
      }
    }

    // Get the user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired token', 401);
  }
};

// Generate new access token using refresh token
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  try {
    // Verify the refresh token
    const user = await verifyToken(refreshToken, 'refresh');
    
    // Generate new access token
    const accessToken = await generateToken(user._id, 'access');
    
    return { accessToken };
  } catch (error) {
    throw new AppError('Failed to refresh access token', 401);
  }
};

// Logout - invalidate refresh token
export const logout = async (refreshToken: string): Promise<void> => {
  await Token.findOneAndUpdate(
    { token: refreshToken, type: 'refresh' },
    { isValid: false }
  );
}; 