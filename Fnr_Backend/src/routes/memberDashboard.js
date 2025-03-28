const express = require('express');
const router = express.Router();
const {
  getUpcomingBookings,
  getAvailableCourts,
  createBooking,
  getMemberProfile,
  upgradeToMember,
  getTodayBookings
} = require('../controllers/memberDashboardController');
const { protect } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.get('/booking', getUpcomingBookings);
router.get('/bookings', getTodayBookings);
router.get('/available-courts', getAvailableCourts);
router.post('/book-court', createBooking);
router.get('/profile', getMemberProfile);
router.post('/upgrade', upgradeToMember);

module.exports = router;