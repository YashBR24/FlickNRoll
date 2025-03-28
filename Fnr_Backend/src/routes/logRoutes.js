const express = require('express');
const { getLogs, getRecentActivities} = require('../controllers/logController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Apply both protect and adminOnly middleware
router.get('/', protect, adminOnly, getLogs);
router.get('/recent-activities', protect, adminOnly, getRecentActivities);

module.exports = router;