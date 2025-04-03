// controllers/logController.js
const asyncHandler = require('express-async-handler');
const Log = require('../models/Log');
const { log } = require('../middleware/logger');

const getLogs = asyncHandler(async (req, res) => {
  if (!req.user) {
    log('UNAUTHORIZED_LOG_ACCESS_ATTEMPT_NO_USER');
    return res.status(401).json({ message: 'Not authorized, no user found' });
  }

  if (req.user.role !== 'admin') {
    log(`UNAUTHORIZED_LOG_ACCESS_ATTEMPT_${req.user.role}`);
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  log(`FETCHING_ALL_LOGS_${req.user.name}`);
  const logs = await Log.find()
      .sort({ timestamp: -1 })
      .limit(100);

  res.status(200).json(logs);
});


module.exports = { getLogs };