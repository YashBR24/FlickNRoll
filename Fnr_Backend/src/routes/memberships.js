const express = require('express');
const router = express.Router();
const {
  createMembership,
  getMemberships,
  updateMembership,
  getMembershipHistory,
  deleteMembership
} = require('../controllers/membershipController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Public routes
router.get('/', getMemberships);

// Protected routes
router.use(protect);

// Admin/Manager only routes
router.post('/', roleCheck('admin', 'manager'), createMembership);

router.put('/:id', updateMembership);
router.get('/history/:memberId', getMembershipHistory);
router.delete('/:id', deleteMembership);

module.exports = router;