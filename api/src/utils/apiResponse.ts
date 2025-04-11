import { Response } from 'express';

export interface ApiResponseOptions {
  message?: string;
  data?: any;
  statusCode?: number;
  success?: boolean;
  error?: any;
  meta?: any;
}

/**
 * Utility class for standardized API responses
 */
export class ApiResponse {
  /**
   * Send a success response
   */
  static success(
    res: Response,
    {
      message = 'Operation successful',
      data = null,
      statusCode = 200,
      meta = null
    }: ApiResponseOptions = {}
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta && { meta })
    });
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    {
      message = 'An error occurred',
      error = null,
      statusCode = 500,
      data = null
    }: ApiResponseOptions = {}
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(error && { error: process.env.NODE_ENV === 'development' ? error : undefined }),
      ...(data && { data })
    });
  }

  /**
   * Send a 201 Created response
   */
  static created(
    res: Response,
    {
      message = 'Resource created successfully',
      data = null,
      meta = null
    }: ApiResponseOptions = {}
  ): Response {
    return this.success(res, { message, data, statusCode: 201, meta });
  }

  /**
   * Send a 404 Not Found response
   */
  static notFound(
    res: Response,
    {
      message = 'Resource not found',
      error = null
    }: ApiResponseOptions = {}
  ): Response {
    return this.error(res, { message, error, statusCode: 404 });
  }

  /**
   * Send a 400 Bad Request response
   */
  static badRequest(
    res: Response,
    {
      message = 'Bad request',
      error = null,
      data = null
    }: ApiResponseOptions = {}
  ): Response {
    return this.error(res, { message, error, statusCode: 400, data });
  }

  /**
   * Send a 401 Unauthorized response
   */
  static unauthorized(
    res: Response,
    {
      message = 'Unauthorized',
      error = null
    }: ApiResponseOptions = {}
  ): Response {
    return this.error(res, { message, error, statusCode: 401 });
  }

  /**
   * Send a 403 Forbidden response
   */
  static forbidden(
    res: Response,
    {
      message = 'Forbidden',
      error = null
    }: ApiResponseOptions = {}
  ): Response {
    return this.error(res, { message, error, statusCode: 403 });
  }
} 