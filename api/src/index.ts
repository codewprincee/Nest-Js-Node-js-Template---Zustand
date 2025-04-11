import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Import routes and middlewares
import apiRoutes from './routes';
import { 
  errorHandler, 
  notFoundHandler, 
  setupUncaughtHandlers,
  requestLogger,
  addRequestId
} from './middlewares';

// Import utils
import { logger } from './utils';

// Set up process handlers for uncaught exceptions and unhandled rejections
setupUncaughtHandlers();

// Load environment variables
const environment = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${environment}` });

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB with crash prevention
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch(err => {
    logger.error('Failed to connect to MongoDB:', { error: err.message, stack: err.stack });
  });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('Reconnected to MongoDB');
});

// Add request ID middleware before any other middleware
app.use(addRequestId);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'ok',
    environment,
    mongoStatus,
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', apiRoutes);

// Handle 404 routes
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${environment} mode on port ${PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log(`PORT: ${PORT}`);
function gracefulShutdown() {
  logger.info('SIGTERM/SIGINT received. Shutting down gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    mongoose.connection.close(false)
      .then(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error during MongoDB connection close:', { error: err.message });
        process.exit(1);
      });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

export default app;
