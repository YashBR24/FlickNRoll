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
  getTotalOut,
    getRevenueOverview,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// First apply protection middleware
router.use(protect);

// Then apply role check middleware for admin/manager routes
router.use(roleCheck('admin', 'manager'));

router.get('/financial-overview', getFinancialOverview);
router.get('/transactions', getTransactionHistory);
router.get('/payment-analytics', getPaymentAnalytics);
router.post('/transactions', recordTransaction);
router.get('/category-analysis', getCategoryAnalysis);
router.post('/manual-transaction', addManualTransaction);
router.get('/download', downloadReport);
router.get('/revenue-overview', getRevenueOverview)

// Balance endpoints
router.get('/current-balance', getCurrentBalance);
router.get('/total-in', getTotalIn);
router.get('/total-out', getTotalOut);

module.exports = router;