const winston = require('winston');
const mongoose = require('mongoose');
const Log = require('../models/Log');

// Define log format
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Enhanced saveLogToDB function with better error handling
const saveLogToDB = async (level, message, method, endpoint, statusCode, user = null) => {
  try {
    const log = await Log.create({
      level,
      message,
      method,
      endpoint,
      statusCode,
      user,
    });
    return log;
  } catch (error) {
    console.error('Error saving log to database:', error.message);
    logger.error(`Failed to save log: ${error.message}`);
    return null;
  }
};

// Enhanced request logger middleware with conditional logging
const requestLogger = async (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl } = req;

  // Log only for specific critical endpoints or admin actions
  if (originalUrl.startsWith('/api/logs') || method === 'POST' || method === 'DELETE') {
    await saveLogToDB('info', 'Request received', method, originalUrl, null, req.user?.id);
  }

  // Capture response using response finish event
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const logMessage = `Response sent - Status: ${res.statusCode}, Duration: ${duration}ms`;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    // Log only for critical endpoints or errors
    if (originalUrl.startsWith('/api/logs') || res.statusCode >= 400 || method === 'POST' || method === 'DELETE') {
      await saveLogToDB(logLevel, logMessage, method, originalUrl, res.statusCode, req.user?.id);
    }
  });

  next();
};

// Error logger function
const logError = async (error, req, userId = null) => {
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    code: error.code,
  };

  await saveLogToDB(
      'error',
      `Error: ${error.message}`,
      req.method,
      req.originalUrl,
      error.statusCode || 500,
      userId
  );

  logger.error('Error details:', errorDetails);
};

module.exports = {
  logger,
  requestLogger,
  saveLogToDB,
  logError,
};