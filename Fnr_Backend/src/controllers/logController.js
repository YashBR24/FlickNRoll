const asyncHandler = require('express-async-handler');
const Log = require('../models/Log');
const { saveLogToDB } = require('../middleware/logger');

const getLogs = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      await saveLogToDB('warn', 'Unauthorized log access attempt - no user', req.method, req.originalUrl, 401, null);
      return res.status(401).json({ message: 'Not authorized, no user found' });
    }

    if (req.user.role !== 'admin') {
      await saveLogToDB('warn', `Unauthorized log access attempt by ${req.user.role}`, req.method, req.originalUrl, 403, req.user?.id);
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Log only the successful admin access (once per session or significant action)
    await saveLogToDB('info', `Admin ${req.user.name} accessed logs`, req.method, req.originalUrl, 200, req.user?.id);

    const logs = await Log.find()
        .sort({ timestamp: -1 })
        .limit(100)
        .populate('user', 'name email');

    res.status(200).json(logs);
  } catch (error) {
    await saveLogToDB('error', `Error fetching logs: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getRecentActivities = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      await saveLogToDB('warn', 'Unauthorized recent activity access attempt - no user', req.method, req.originalUrl, 401, null);
      return res.status(401).json({ message: 'Not authorized, no user found' });
    }

    if (req.user.role !== 'admin') {
      await saveLogToDB('warn', `Unauthorized recent activity access attempt by ${req.user.role}`, req.method, req.originalUrl, 403, req.user?.id);
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Define high-priority log criteria
    const highPriorityCriteria = [
      // Failed login attempts
      { level: 'warn', message: { $regex: /Failed login attempt/i } },
      // User registration
      { level: 'info', message: { $regex: /Registration initiated/i } },
      // Member creation
      { level: 'info', message: { $regex: /Member created successfully/i } },
      // Successful login
      { level: 'info', message: { $regex: /User logged in successfully/i } },
      // Password reset initiated
      { level: 'info', message: { $regex: /Password reset initiated/i } },
      // Password reset successful
      { level: 'info', message: { $regex: /Password reset successful/i } },
      // User promotion
      { level: 'info', message: { $regex: /User promoted successfully/i } },
      // Significant errors (e.g., system-critical failures)
      { level: 'error', message: { $regex: /(Error creating|Error updating|Error deleting)/i } },
    ];

    const recentActivities = await Log.find({
      $or: highPriorityCriteria,
    })
        .sort({ timestamp: -1 }) // Most recent first
        .limit(10) // Limit to 10 recent activities
        .populate('user', 'name email')
        .lean();

    // Format the response for frontend
    const formattedActivities = recentActivities.map(log => {
      const timeAgo = Math.round((new Date() - new Date(log.timestamp)) / (1000 * 60)); // Minutes ago
      let type = 'system';
      if (log.message.match(/login/i)) type = log.level === 'warn' ? 'security' : 'user';
      else if (log.message.match(/member/i)) type = 'member';
      else if (log.message.match(/registration/i)) type = 'user';
      else if (log.message.match(/password/i)) type = 'security';
      else if (log.level === 'error') type = 'error';

      return {
        id: log._id,
        type,
        message: log.message,
        time: timeAgo < 60 ? `${timeAgo} minutes ago` : `${Math.round(timeAgo / 60)} hours ago`,
        user: log.user ? `${log.user.name} (${log.user.email})` : 'System',
      };
    });

    await saveLogToDB('info', `Admin ${req.user.name} accessed recent activities`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(formattedActivities);
  } catch (error) {
    await saveLogToDB('error', `Error fetching recent activities: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});


module.exports = { getLogs, getRecentActivities};