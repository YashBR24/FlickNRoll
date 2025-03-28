const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  setPassword,
  checkVerificationToken,
} = require('../controllers/authController');

// Public routes (no authentication required)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email', verifyEmail); // GET for token in query params
router.post('/forgot-password', requestPasswordReset); // Updated to use requestPasswordReset
router.post('/reset-password', resetPassword);
router.post('/set-password', setPassword);
router.get('/check-token/:token', checkVerificationToken);

module.exports = router;