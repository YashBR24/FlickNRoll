const { logger, saveLogToDB } = require('../middleware/logger'); // ✅ Ensure correct path

const requestLogger = (req, res, next) => {
  const { method, originalUrl } = req;

  logger.info(`${method} ${originalUrl} - Request received`);
  saveLogToDB('info', `Request received`, method, originalUrl, null, req.user?.id);

  res.on('finish', () => {
    logger.info(`${method} ${originalUrl} - Response status: ${res.statusCode}`);
    saveLogToDB('info', `Response status: ${res.statusCode}`, method, originalUrl, res.statusCode, req.user?.id);
  });

  next();
};

module.exports = requestLogger;
