import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, FileText, ArrowUpRight, ArrowDownRight, Plus, ChevronLeft, ChevronRight, 
  Search, Filter, Wallet, X, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment-timezone';
import api from '../utils/api';

const Reports = () => {
  const [currentMonth, setCurrentMonth] = useState(moment().tz('Asia/Kolkata').toDate());
  const [startDate, setStartDate] = useState(moment().tz('Asia/Kolkata').startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().tz('Asia/Kolkata').endOf('month').format('YYYY-MM-DD'));
  const [transactionType, setTransactionType] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [allTransactions, setAllTransactions] = useState([]); // Store all fetched transactions
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTransaction, setManualTransaction] = useState({
    type: 'income',
    category: 'transactions',
    amount: '',
    description: '',
    paymentMethod: 'Cash',
    date: moment().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm'),
  });
  const [stats, setStats] = useState({
    currentBalance: 0,
    totalIn: 0,
    totalOut: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchAllTransactions(), fetchStats()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  // Fetch all transactions for the selected date range
  const fetchAllTransactions = async () => {
    const response = await api.get('/api/reports/transactions', {
      params: {
        fromDate: startDate,
        toDate: endDate,
        sort: 'date',
        order: 'desc',
      },
    });
    setAllTransactions(response.data.transactions || []);
  };

  const fetchStats = async () => {
    try {
      const [balanceRes, totalInRes, totalOutRes] = await Promise.all([
        api.get('/api/reports/current-balance', {
          // params: { startDate, endDate },
        }),
        api.get('/api/reports/total-in', {
          params: { startDate, endDate },
        }),
        api.get('/api/reports/total-out', {
          params: { startDate, endDate },
        }),
      ]);
      setStats({
        currentBalance: balanceRes.data.currentBalance || 0,
        totalIn: totalInRes.data.totalIn || 0,
        totalOut: totalOutRes.data.totalOut || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        currentBalance: 0,
        totalIn: 0,
        totalOut: 0,
      });
    }
  };

  // Filter and paginate transactions locally
  const filteredTransactions = useMemo(() => {
    let result = [...allTransactions];

    // Apply transaction type filter
    if (transactionType !== 'ALL') {
      result = result.filter((t) => t.type === transactionType);
    }

    // Apply payment method filter
    if (paymentMethod !== 'ALL') {
      result = result.filter((t) => t.paymentMethod === paymentMethod);
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((t) =>
        t.description.toLowerCase().includes(lowerSearch) ||
        t.amount.toString().includes(lowerSearch)
      );
    }

    return result;
  }, [allTransactions, transactionType, paymentMethod, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / recordsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, currentPage, recordsPerPage]);

  const handleExportPDF = async () => {
    try {
      const response = await api.get('/api/reports/download', {
        params: { startDate, endDate, reportType: 'financial' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${startDate}-to-${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF.');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualTransaction.type || !manualTransaction.category || !manualTransaction.amount || !manualTransaction.description || !manualTransaction.paymentMethod) {
      alert('Please fill in all required fields.');
      return;
    }

    const transactionToSubmit = {
      ...manualTransaction,
      date: moment(manualTransaction.date).tz('Asia/Kolkata').toISOString(),
    };

    try {
      await api.post('/api/reports/manual-transaction', transactionToSubmit);
      setShowManualModal(false);
      setManualTransaction({
        type: 'income',
        category: 'transactions',
        amount: '',
        description: '',
        paymentMethod: 'Cash',
        date: moment().tz('Asia/Kolkata').format('YYYY-MM-DDTHH:mm'),
      });
      await Promise.all([fetchAllTransactions(), fetchStats()]);
    } catch (error) {
      console.error('Error adding manual transaction:', error);
      alert('Failed to add manual transaction.');
    }
  };

  const clearFilters = () => {
    setTransactionType('ALL');
    setPaymentMethod('ALL');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => moment(prevMonth).tz('Asia/Kolkata').subtract(1, 'months').toDate());
    setStartDate(moment(currentMonth).tz('Asia/Kolkata').subtract(1, 'months').startOf('month').format('YYYY-MM-DD'));
    setEndDate(moment(currentMonth).tz('Asia/Kolkata').subtract(1, 'months').endOf('month').format('YYYY-MM-DD'));
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => moment(prevMonth).tz('Asia/Kolkata').add(1, 'months').toDate());
    setStartDate(moment(currentMonth).tz('Asia/Kolkata').add(1, 'months').startOf('month').format('YYYY-MM-DD'));
    setEndDate(moment(currentMonth).tz('Asia/Kolkata').add(1, 'months').endOf('month').format('YYYY-MM-DD'));
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
        <p>Loading reports...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto">
      <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }} className="text-3xl font-bold text-gray-800 mb-8">
        Financial Reports
      </motion.h1>

      {/* Export and Add Transaction Buttons */}
      <div className="flex justify-end mb-6 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportPDF}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Export PDF
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowManualModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Transaction
        </motion.button>
      </div>

      {/* Stats Cards */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} whileHover={{ scale: 1.02 }} className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Current Balance</p>
              <p className="text-2xl font-semibold text-gray-800">{formatCurrency(stats.currentBalance)}</p>
            </div>
            <Wallet className="h-10 w-10 text-blue-500" />
          </div>
        </motion.div>
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} whileHover={{ scale: 1.02 }} className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total In</p>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.totalIn)}</p>
            </div>
            <ArrowUpRight className="h-10 w-10 text-green-500" />
          </div>
        </motion.div>
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} whileHover={{ scale: 1.02 }} className="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Out</p>
              <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.totalOut)}</p>
            </div>
            <ArrowDownRight className="h-10 w-10 text-red-500" />
          </div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-xl bg-white shadow-lg overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              >
                <option value="ALL">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Member">Member</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 pl-10"
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 pl-10"
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePreviousMonth}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Month
              </button>
              <span className="font-medium">
                {moment(currentMonth).tz('Asia/Kolkata').format('MMMM YYYY')}
              </span>
              <button
                onClick={handleNextMonth}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                Next Month
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Transaction Table */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-xl bg-white shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={recordsPerPage}
                onChange={(e) => {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">records per page</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600">#</th>
                  <th className="text-left py-3 px-4 text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 text-gray-600">Method</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-3 px-4 text-center text-gray-500">No transactions found.</td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-800">{(currentPage - 1) * recordsPerPage + index + 1}</td>
                      <td className="py-3 px-4 text-gray-600">{moment(transaction.date).tz('Asia/Kolkata').format('DD/MM/YYYY, hh:mm A')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {transaction.entryType || (transaction.type === 'income' ? 'IN' : 'OUT')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">{formatCurrency(transaction.amount)}</td>
                      <td className="py-3 px-4 text-gray-600">{transaction.description}</td>
                      <td className="py-3 px-4 text-gray-600">{transaction.paymentMethod}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center py-4 mt-4">
            <div className="text-sm text-gray-600">
              Showing {paginatedTransactions.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0} to {Math.min(currentPage * recordsPerPage, filteredTransactions.length)} of {filteredTransactions.length} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Manual Transaction Modal */}
      <AnimatePresence>
        {showManualModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowManualModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Add Manual Transaction</h3>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={manualTransaction.type}
                    onChange={(e) => setManualTransaction({ ...manualTransaction, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={manualTransaction.category}
                    onChange={(e) => setManualTransaction({ ...manualTransaction, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  >
                    <option value="booking">Booking</option>
                    <option value="inventory">Inventory</option>
                    <option value="transactions">Transactions</option>
                    <option value="membership">Membership</option>
                    <option value="other">Other</option>
                  </select>
                </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={manualTransaction.amount}
                    onChange={(e) => setManualTransaction({ ...manualTransaction, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={manualTransaction.description}
                    onChange={(e) => setManualTransaction({ ...manualTransaction, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={manualTransaction.paymentMethod}
                    onChange={(e) => setManualTransaction({ ...manualTransaction, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Member">Member</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={manualTransaction.date}
                    onChange={(e) => setManualTransaction({ ...manualTransaction, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Transaction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Reports;