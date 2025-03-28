const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberProfile,
  createMember,
  updateMember,
  deleteMember,
  renewMember,
} = require('../controllers/memberController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getMembers)
    .post(protect, createMember);

router.get('/profile', protect, getMemberProfile);

router.route('/:id')
    .put(protect, updateMember)
    .delete(protect, deleteMember);

router.post('/:id/renew', protect, renewMember); // New route

module.exports = router;