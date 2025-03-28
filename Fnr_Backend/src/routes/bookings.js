const express = require('express');
const router = express.Router();
const {
  getBookings,
  getTodayBookingsByTime,
  createBooking,
  updateBooking,
  deleteBooking,
  markBookingAsPaid,
    getCourtStatus,
    updateCourtStatus,
  getFutureBookings,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getBookings)
    .post(createBooking);

router.route('/today')
    .get(getTodayBookingsByTime);

router.route('/:id')
    .put(updateBooking)
    .delete(deleteBooking);

router.put('/:id/mark-as-paid', markBookingAsPaid);

router.get('/courts/status', getCourtStatus);
router.put('/courts/:id/status', updateCourtStatus);
router.get('/future', getFutureBookings);

module.exports = router;