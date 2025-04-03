// routes/logRoutes.js
const express = require('express');
const { getLogs } = require('../controllers/logController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, adminOnly, getLogs);
// router.get('/recent-activities', protect, adminOnly, getRecentActivities);

module.exports = router;