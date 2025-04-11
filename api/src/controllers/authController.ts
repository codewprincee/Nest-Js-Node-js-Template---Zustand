import { Request, Response, NextFunction } from "express";
import User, { UserRole } from "../models/User";
import {
  generateToken,
  saveToken,
  refreshAccessToken,
  logout,
} from "../services/authService";
import { AppError, AuthRequest } from "../types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { ApiResponse, logger } from "../utils";

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, role, fcmToken } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const fcmTokens = fcmToken ? [fcmToken] : [];

    user = new User({
      name,
      email,
      password,
      role: role || UserRole.USER,
      fcmTokens,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: "5 days" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, fcmToken } = req.body;
    console.log(email, password, fcmToken);

    let user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    // if (!isMatch) {
    //   return res.status(400).json({ message: 'Invalid credentials' });
    // }

    // Update FCM token if provided
    if (fcmToken && !user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.password = undefined;

    return ApiResponse.success(res, {
      message: "Login successful", 
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: user,
      },
    });
  } catch (err: any) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    // Generate new access token
    const { accessToken } = await refreshAccessToken(refreshToken);

    res.status(200).json({
      status: "success",
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    // Invalidate the refresh token
    await logout(refreshToken);

    res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        user: req?.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update FCM token for a user
 * @route   PUT /api/v1/auth/fcm-token
 * @access  Private
 */
export const updateFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user?.id; // Using optional chaining

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only add token if it's not already in the array
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.json({ message: "FCM token updated successfully" });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Add a function to remove FCM token
export const removeFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user?.id; // Using optional chaining

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fcmTokens = user.fcmTokens.filter((token) => token !== fcmToken);
    await user.save();

    res.json({ message: "FCM token removed successfully" });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
