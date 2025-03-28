const express = require('express');
const router = express.Router();
const {
  getDashboardStats,

  getBookings,
  getFutureBookings,
  createBooking,
  updateBooking,
  deleteBooking,

  getMembers,
  getMemberProfile,
  createMember,
  updateMember,
  deleteMember,

  getInventoryStatus,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  markItemsInUse,

  updateCourtStatus,

  createMembership,
  getExpiringMemberships,
  getMemberRenewalHistory,
  renewMembership,
  getMembershipStats,
    
  getFinancialOverview,
  getTransactionHistory,
  addManualTransaction
} = require('../controllers/managerController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Apply authentication and role check for managers/admins
router.use(protect);
router.use(roleCheck('manager', 'admin'));

// Dashboard routes
router.get('/dashboard-stats', getDashboardStats);

// Booking routes
router.route('/bookings')
    .get(getBookings)
    .post(createBooking);
router.get('/future-bookings', getFutureBookings);
router.route('/bookings/:id')
    .put(updateBooking)
    .delete(deleteBooking);

// Member routes
router.route('/members')
    .get(getMembers)
    .post(createMember);
router.get('/members/:id', getMemberProfile);
router.route('/members/:id')
    .put(updateMember)
    .delete(deleteMember);

// Inventory routes
router.route('/inventory-status')
    .get(getInventoryStatus)
    .post(addInventoryItem);
router.route('/inventory/:id')
    .put(updateInventoryItem)
    .delete(deleteInventoryItem);
router.post('/inventory/:id/in-use', markItemsInUse);

// Court management
router.put('/courts/:id', updateCourtStatus);

// Membership management
router.post('/memberships', createMembership);
router.get('/expiring-memberships', getExpiringMemberships);
router.get('/members/:memberId/renewal-history', getMemberRenewalHistory);
router.post('/members/:memberId/renew', renewMembership);
router.get('/membership-stats', getMembershipStats);

// Financial routes
router.get('/financial-overview', getFinancialOverview);
router.get('/transactions', getTransactionHistory);
router.post('/manual-transaction', addManualTransaction);

module.exports = router;