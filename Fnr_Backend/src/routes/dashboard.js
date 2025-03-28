const express = require('express');
const router = express.Router();
const {getDashboardStats} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Add middleware to check if user is admin or manager
const checkAdminManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized to access this resource');
  }
};

router.get('/stats', protect, checkAdminManager, getDashboardStats);


module.exports = router;