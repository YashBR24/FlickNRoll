const express = require('express');
const router = express.Router();
const {
  getFinancialOverview,
  getTransactionHistory,
  getPaymentAnalytics,
  recordTransaction,
  getCategoryAnalysis,
  addManualTransaction,
  downloadReport,
  getCurrentBalance,
  getTotalIn,
  getTotalOut
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// First apply protection middleware
router.use(protect);

// Then apply role check middleware for admin/manager routes
router.use(roleCheck('admin', 'manager'));

// Financial overview
router.get('/financial-overview', getFinancialOverview);

// Transaction history
router.get('/transactions', getTransactionHistory);

// Payment analytics
router.get('/payment-analytics', getPaymentAnalytics);

// Record transaction
router.post('/transactions', recordTransaction);

// Category analysis
router.get('/category-analysis', getCategoryAnalysis);

// Manual transaction
router.post('/manual-transaction', addManualTransaction);

// Download report
router.get('/download', downloadReport);

// Balance endpoints
router.get('/current-balance', getCurrentBalance);
router.get('/total-in', getTotalIn);
router.get('/total-out', getTotalOut);

module.exports = router;