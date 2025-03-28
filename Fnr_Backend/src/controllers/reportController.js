// const asyncHandler = require('express-async-handler');
// const PDFDocument = require('pdfkit');
// const Booking = require('../models/Booking');
// const Member = require('../models/Member');
// const Inventory = require('../models/Inventory');
// const Transaction = require('../models/Transaction');
// const { saveLogToDB } = require('../middleware/logger');
// const moment = require('moment-timezone');
//
//
// process.env.TZ = 'Asia/Kolkata';
//
// const getISTDate = () => {
//   const istDate = moment().tz('Asia/Kolkata').toDate();
//   // console.log('Generated IST Date:', istDate); // Log to verify
//   // return istDate;
// };
//
// const getDateFilter = (startDate, endDate) => {
//   if (!startDate || !endDate) return {};
//   const start = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toDate();
//   const end = moment.tz(`${endDate}T23:59:59.999`, 'Asia/Kolkata').toDate();
//   return {
//     date: {
//       $gte: start,
//       $lte: end,
//     },
//   };
// };
//
// // const getNextTransactionNumber = asyncHandler(async () => {
// //   try {
// //     const latestTransaction = await Transaction.findOne().sort({ number: -1 }).limit(1);
// //     const nextNumber = latestTransaction ? latestTransaction.number + 1 : 1;
// //     console.log('Next transaction number generated:', nextNumber);
// //     await saveLogToDB('info', `Generated next transaction number: ${nextNumber}`, 'GET', '/api/transactions/next', null, null);
// //     return nextNumber;
// //   } catch (error) {
// //     console.error('Error getting next transaction number:', error);
// //     await saveLogToDB('error', `Error getting next transaction number: ${error.message}`, 'GET', '/api/transactions/next', 500, null);
// //     throw error;
// //   }
// // });
//
// const getFinancialOverview = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching financial overview', req.method, req.originalUrl, null, req.user?.id);
//     const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
//
//     const [income, expenses, memberBookings] = await Promise.all([
//       Transaction.aggregate([
//         { $match: { type: 'income', paymentMethod: { $ne: 'membership' }, ...dateFilter } },
//         { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
//       ]),
//       Transaction.aggregate([
//         { $match: { type: 'expense', ...dateFilter } },
//         { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
//       ]),
//       Booking.aggregate([
//         { $match: { isMembershipBooking: true, ...dateFilter } },
//         { $group: { _id: null, count: { $sum: 1 }, hoursUsed: { $sum: '$duration' } } },
//       ]),
//     ]);
//
//     const response = {
//       income,
//       expenses,
//       memberBookings: memberBookings[0] || { count: 0, hoursUsed: 0 },
//       summary: {
//         totalIncome: income.reduce((acc, curr) => acc + curr.total, 0),
//         totalExpenses: expenses.reduce((acc, curr) => acc + curr.total, 0),
//         netProfit: income.reduce((acc, curr) => acc + curr.total, 0) - expenses.reduce((acc, curr) => acc + curr.total, 0),
//       },
//     };
//
//     await saveLogToDB('info', 'Financial overview retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
//     res.status(200).json(response);
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching financial overview: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const getTransactionHistory = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching transaction history', req.method, req.originalUrl, null, req.user?.id);
//
//     const { startDate, endDate, type, category, search, paymentMethod, fromDate, toDate, page = 1, limit = 15, sort = 'date', order = 'desc' } = req.query;
//     const query = {};
//
//     if (startDate && endDate) {
//       query.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(`${endDate}T23:59:59.999Z`),
//       };
//     }
//
//     if (fromDate) {
//       query.date = query.date || {};
//       query.date.$gte = new Date(fromDate);
//     }
//     if (toDate) {
//       query.date = query.date || {};
//       query.date.$lte = new Date(`${toDate}T23:59:59.999Z`);
//     }
//
//     if (type && type !== 'ALL') query.type = type; // 'income' or 'expense'
//     if (category && category !== 'ALL') query.category = category.toLowerCase(); // Match lowercase options
//     if (search) query.description = { $regex: search, $options: 'i' };
//     if (paymentMethod && paymentMethod !== 'ALL') query.paymentMethod = paymentMethod; // Filter by paymentMethod
//
//     console.log('Transaction query:', query);
//
//     const sortOptions = {};
//     sortOptions[sort] = order === 'desc' ? -1 : 1; // Default to descending order by date if 'desc'
//
//     const transactions = await Transaction.find(query)
//         .populate('recordedBy', 'name')
//         .populate({
//           path: 'reference',
//           populate: { path: 'user', select: 'name email', strictPopulate: false },
//         })
//         .sort(sortOptions) // Sort dynamically, defaulting to { date: -1 }
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit));
//
//     const total = await Transaction.countDocuments(query);
//
//     await saveLogToDB('info', 'Transaction history retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
//     res.status(200).json({
//       transactions,
//       pagination: { total, currentPage: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) },
//     });
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching transaction history: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const getPaymentAnalytics = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching payment analytics', req.method, req.originalUrl, null, req.user?.id);
//
//     const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
//
//     const analytics = await Transaction.aggregate([
//       { $match: { type: 'income', ...dateFilter } },
//       { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
//     ]);
//
//     const memberBookings = await Booking.aggregate([
//       { $match: { isMembershipBooking: true, ...dateFilter } },
//       { $group: { _id: null, count: { $sum: 1 }, hoursUsed: { $sum: '$duration' } } },
//     ]);
//
//     await saveLogToDB('info', 'Payment analytics retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
//     res.status(200).json({
//       paymentAnalytics: analytics,
//       membershipBookings: { count: memberBookings[0]?.count || 0, amount: 'Included in membership' },
//     });
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching payment analytics: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const recordTransaction = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Recording new transaction', req.method, req.originalUrl, null, req.user?.id);
//
//     const { type, category, amount, description, paymentMethod, reference, referenceModel, date } = req.body;
//
//     if (!type || !category || !amount || !description) {
//       await saveLogToDB('error', 'Missing required fields for transaction', req.method, req.originalUrl, 400, req.user?.id);
//       res.status(400);
//       throw new Error('Missing required fields');
//     }
//
//     if (category === 'booking' && reference) {
//       const booking = await Booking.findById(reference);
//       if (!booking) {
//         await saveLogToDB('error', 'Booking not found', req.method, req.originalUrl, 404, req.user?.id);
//         return res.status(404).json({ message: 'Booking not found' });
//       }
//
//       const member = await Member.findOne({ user: booking.user });
//       if (member && member.membershipStatus === 'active') {
//         await saveLogToDB('info', 'Member booking recorded - no financial transaction needed', req.method, req.originalUrl, 200, req.user?.id);
//         return res.status(200).json({
//           message: 'Member booking recorded - no financial transaction needed',
//           booking,
//         });
//       }
//     }
//
//     const transactionDate = date && moment(date).isValid() ? moment.tz(date, 'Asia/Kolkata').toDate() : getISTDate();
//
//     const transaction = await Transaction.create({
//       type,
//       entryType: type === 'income' ? 'IN' : 'OUT',
//       category,
//       amount,
//       description,
//       paymentMethod,
//       reference,
//       referenceModel,
//       date: transactionDate,
//       recordedBy: req.user.id,
//     });
//
//     console.log('Transaction saved with date:', transaction.date);
//     await saveLogToDB('info', `Transaction recorded successfully at ${moment(transactionDate).format('YYYY-MM-DD HH:mm:ss')}`, req.method, req.originalUrl, 201, req.user?.id);
//     res.status(201).json(transaction);
//   } catch (error) {
//     await saveLogToDB('error', `Error recording transaction: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const getCategoryAnalysis = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching category analysis', req.method, req.originalUrl, null, req.user?.id);
//
//     const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
//
//     const categoryAnalysis = await Transaction.aggregate([
//       { $match: dateFilter },
//       { $group: { _id: { type: '$type', category: '$category', paymentMethod: '$paymentMethod' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
//       { $group: { _id: '$_id.type', categories: { $push: { category: '$_id.category', paymentMethod: '$_id.paymentMethod', total: '$total', count: '$count' } } } },
//     ]);
//
//     const memberBookingStats = await Booking.aggregate([
//       { $match: { isMembershipBooking: true, ...dateFilter } },
//       { $group: { _id: null, totalBookings: { $sum: 1 }, totalHours: { $sum: '$duration' } } },
//     ]);
//
//     await saveLogToDB('info', 'Category analysis retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
//     res.status(200).json({
//       categoryAnalysis,
//       membershipBookings: memberBookingStats[0] || { totalBookings: 0, totalHours: 0 },
//     });
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching category analysis: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const addManualTransaction = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Adding manual transaction', req.method, req.originalUrl, null, req.user?.id);
//
//     const { type, amount, description, paymentMethod, date, reference } = req.body;
//
//     if (!type  || !amount || !description) {
//       await saveLogToDB('error', 'Missing required fields for manual transaction', req.method, req.originalUrl, 400, req.user?.id);
//       res.status(400);
//       throw new Error('Please provide all required fields: type, amount, description');
//     }
//
//     if (!['income', 'expense'].includes(type)) {
//       await saveLogToDB('error', 'Invalid transaction type', req.method, req.originalUrl, 400, req.user?.id);
//       res.status(400);
//       throw new Error('Invalid transaction type. Must be "income" or "expense"');
//     }
//
//     // const transactionNumber = await getNextTransactionNumber();
//     const transactionDate = date && moment(date).isValid() ? moment.tz(date, 'Asia/Kolkata').toDate() : getISTDate(); // Use provided date if valid, else current IST
//
//     const transactionData = {
//       // number: transactionNumber,
//       type,
//       entryType: type === 'income' ? 'IN' : 'OUT',
//       category:'transactions',
//       amount,
//       description,
//       paymentMethod: paymentMethod || 'cash',
//       date: transactionDate,
//       recordedBy: req.user.id,
//     };
//
//     if (reference) {
//       transactionData.reference = reference;
//     }
//
//     const transaction = await Transaction.create(transactionData);
//
//     console.log('Manual transaction saved with date:', transaction.date); // Log to verify
//     await saveLogToDB('info', `Manual transaction added successfully with number ${transactionNumber} at ${moment(transactionDate).format('YYYY-MM-DD HH:mm:ss')}`, req.method, req.originalUrl, 201, req.user?.id);
//     res.status(201).json(transaction);
//   } catch (error) {
//     console.error('Error in addManualTransaction:', error);
//     await saveLogToDB('error', `Error adding manual transaction: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const downloadReport = asyncHandler(async (req, res) => {
//   try {
//     const { startDate, endDate, reportType = 'financial' } = req.query;
//
//     if (!startDate || !endDate) {
//       await saveLogToDB('warn', 'Report download attempt without date range', req.method, req.originalUrl, 400, req.user?.id);
//       return res.status(400).json({ message: 'Please provide start and end dates' });
//     }
//
//     const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
//     const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
//
//     const doc = new PDFDocument({ size: 'A4', margin: 40 });
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=report-${formattedStartDate}-to-${formattedEndDate}.pdf`);
//     doc.pipe(res);
//
//     // Declare transactions at a higher scope
//     let transactions = [];
//
//     // Header
//     doc.fillColor('#2c3e50')
//         .fontSize(24)
//         .text('Pickleball Club Report', 50, 50, { align: 'center' });
//     doc.fillColor('#7f8c8d')
//         .fontSize(12)
//         .text(`Report Period: ${formattedStartDate} to ${formattedEndDate}`, { align: 'center' });
//     doc.moveDown(2);
//
//     if (reportType === 'financial') {
//       transactions = await Transaction.find({
//         date: {
//           $gte: new Date(startDate),
//           $lte: new Date(`${endDate}T23:59:59.999Z`),
//         },
//       }).sort({ date: 1 });
//
//       // Transaction Table
//       if (transactions.length > 0) {
//         doc.fillColor('#2980b9')
//             .fontSize(16)
//             .text('Transaction List', { underline: true });
//         doc.moveDown(0.5);
//
//         const tableTop = doc.y;
//         const columnWidths = [100, 70, 80, 80, 200];
//         let currentY = tableTop;
//
//         // Table Header
//         doc.fillColor('#ffffff')
//             .rect(50, currentY, 530, 20)
//             .fill('#3498db');
//         doc.fillColor('#ffffff')
//             .fontSize(10)
//             .text('Date', 50, currentY + 5)
//             .text('Type', 150, currentY + 5)
//             .text('Category', 220, currentY + 5)
//             .text('Amount', 300, currentY + 5)
//             .text('Description', 380, currentY + 5);
//         currentY += 20;
//
//         // Table Rows
//         transactions.forEach((t, index) => {
//           if (currentY + 20 > doc.page.height - 80) {
//             doc.addPage();
//             currentY = 50;
//             doc.fillColor('#3498db')
//                 .fontSize(16)
//                 .text('Transaction List (Continued)', { underline: true });
//             doc.moveDown(0.5);
//             doc.fillColor('#ffffff')
//                 .rect(50, currentY + 20, 530, 20)
//                 .fill('#3498db');
//             doc.fillColor('#ffffff')
//                 .fontSize(10)
//                 .text('Date', 50, currentY + 25)
//                 .text('Type', 150, currentY + 25)
//                 .text('Category', 220, currentY + 25)
//                 .text('Amount', 300, currentY + 25)
//                 .text('Description', 380, currentY + 25);
//             currentY += 40;
//           }
//
//           const rowColor = index % 2 === 0 ? '#ecf0f1' : '#ffffff';
//           doc.fillColor(rowColor)
//               .rect(50, currentY, 530, 20)
//               .fill();
//           doc.fillColor('#2c3e50')
//               .fontSize(9)
//               .text(moment(t.date).format('YYYY-MM-DD'), 50, currentY + 5)
//               .text(t.type.toUpperCase(), 150, currentY + 5)
//               .text(t.category || 'Uncategorized', 220, currentY + 5)
//               .text(`$${(t.amount || 0).toFixed(2)}`, 300, currentY + 5)
//               .text(t.description || '', 380, currentY + 5, { width: 150, ellipsis: true });
//           currentY += 20;
//         });
//         doc.moveDown(2);
//       } else {
//         doc.fillColor('#2c3e50')
//             .fontSize(12)
//             .text('No transactions found for this period.', { align: 'center' });
//         doc.moveDown(2);
//       }
//
//       // Calculate summaries
//       const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => {
//         if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 };
//         acc[t.category].total += t.amount || 0;
//         acc[t.category].count += 1;
//         return acc;
//       }, {});
//
//       const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
//         if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 };
//         acc[t.category].total += t.amount || 0;
//         acc[t.category].count += 1;
//         return acc;
//       }, {});
//
//       // Summary Table Function
//       const drawSummaryTable = (title, data, color) => {
//         if (doc.y + 100 > doc.page.height - 80) doc.addPage();
//         doc.fillColor(color)
//             .fontSize(16)
//             .text(title, { underline: true });
//         doc.moveDown(0.5);
//
//         const tableTop = doc.y;
//         doc.fillColor('#ffffff')
//             .rect(50, tableTop, 300, 20)
//             .fill(color);
//         doc.fillColor('#ffffff')
//             .fontSize(10)
//             .text('Category', 50, tableTop + 5)
//             .text('Total', 200, tableTop + 5)
//             .text('Transactions', 270, tableTop + 5);
//
//         let currentY = tableTop + 20;
//         Object.entries(data).forEach(([category, { total, count }], index) => {
//           if (currentY + 20 > doc.page.height - 80) {
//             doc.addPage();
//             currentY = 50;
//           }
//           const rowColor = index % 2 === 0 ? '#ecf0f1' : '#ffffff';
//           doc.fillColor(rowColor)
//               .rect(50, currentY, 300, 20)
//               .fill();
//           doc.fillColor('#2c3e50')
//               .fontSize(9)
//               .text(category, 50, currentY + 5)
//               .text(`$${total.toFixed(2)}`, 200, currentY + 5)
//               .text(count.toString(), 270, currentY + 5);
//           currentY += 20;
//         });
//         doc.moveDown(2);
//       };
//
//       drawSummaryTable('Income Summary', income, '#27ae60');
//       drawSummaryTable('Expense Summary', expenses, '#c0392b');
//
//       // Membership Usage
//       const memberBookings = await Booking.aggregate([
//         {
//           $match: {
//             date: {
//               $gte: new Date(startDate),
//               $lte: new Date(`${endDate}T23:59:59.999Z`),
//             },
//             isMembershipBooking: true,
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             count: { $sum: 1 },
//             hoursUsed: { $sum: '$duration' },
//           },
//         },
//       ]).catch(() => []);
//
//       if (doc.y + 80 > doc.page.height - 80) doc.addPage();
//       doc.fillColor('#8e44ad')
//           .fontSize(16)
//           .text('Membership Usage', { underline: true });
//       doc.moveDown(0.5);
//       const memberData = memberBookings[0] || { count: 0, hoursUsed: 0 };
//       doc.fillColor('#ecf0f1')
//           .rect(50, doc.y, 300, 40)
//           .fill();
//       doc.fillColor('#2c3e50')
//           .fontSize(11)
//           .text(`Total Member Bookings: ${memberData.count}`, 60, doc.y + 10)
//           .text(`Total Hours Used: ${memberData.hoursUsed}`, 60, doc.y + 25);
//       doc.moveDown(2);
//
//       // Financial Summary
//       const totalIncome = Object.values(income).reduce((sum, data) => sum + data.total, 0);
//       const totalExpenses = Object.values(expenses).reduce((sum, data) => sum + data.total, 0);
//       const netProfit = totalIncome - totalExpenses;
//
//       if (doc.y + 100 > doc.page.height - 80) doc.addPage();
//       doc.fillColor('#d35400')
//           .fontSize(16)
//           .text('Financial Summary', { underline: true });
//       doc.moveDown(0.5);
//       doc.fillColor('#ecf0f1')
//           .rect(50, doc.y, 300, 60)
//           .fill();
//       doc.fillColor('#2c3e50')
//           .fontSize(11)
//           .text(`Total Income: $${totalIncome.toFixed(2)}`, 60, doc.y + 10)
//           .text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 60, doc.y + 25)
//           .text(`Net Profit: $${netProfit.toFixed(2)}`, 60, doc.y + 40);
//     }
//
//     // Footer - Ensure it fits on the last page
//     if (doc.y + 30 > doc.page.height - 40) doc.addPage();
//     doc.fillColor('#7f8c8d')
//         .fontSize(10)
//         .text(`Generated on ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 50, doc.page.height - 50, { align: 'center' });
//
//     doc.end();
//
//     // Use the scoped transactions variable
//     await saveLogToDB('info', `Report downloaded successfully for period ${startDate} to ${endDate} with ${transactions.length} transactions`, req.method, req.originalUrl, 200, req.user?.id);
//   } catch (error) {
//     console.error('Error in downloadReport:', error);
//     if (!res.headersSent) {
//       res.status(500).json({ message: 'Error generating report', error: error.message });
//     }
//     await saveLogToDB('error', `Error generating report: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//   }
// });
//
// const getCurrentBalance = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching current balance', req.method, req.originalUrl, null, req.user?.id);
//
//     const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
//
//     const [totalIn, totalOut] = await Promise.all([
//       Transaction.aggregate([
//         { $match: { type: 'income', ...dateFilter } },
//         { $group: { _id: null, total: { $sum: '$amount' } } },
//       ]),
//       Transaction.aggregate([
//         { $match: { type: 'expense', ...dateFilter } },
//         { $group: { _id: null, total: { $sum: '$amount' } } },
//       ]),
//     ]);
//
//     const balance = (totalIn[0]?.total || 0) - (totalOut[0]?.total || 0);
//
//     await saveLogToDB('info', 'Current balance retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
//     res.status(200).json({ currentBalance: balance });
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching current balance: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const getTotalIn = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching total in', req.method, req.originalUrl, null, req.user?.id);
//
//     const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
//
//     const totalIn = await Transaction.aggregate([
//       { $match: { type: 'income', ...dateFilter } },
//       { $group: { _id: null, total: { $sum: '$amount' } } },
//     ]);
//
//     await saveLogToDB('info', 'Total in retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
//     res.status(200).json({ totalIn: totalIn[0]?.total || 0 });
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching total in: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const getTotalOut = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching total out', req.method, req.originalUrl, null, req.user?.id);
//
//     const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
//
//     const totalOut = await Transaction.aggregate([
//       { $match: { type: 'expense', ...dateFilter } },
//       { $group: { _id: null, total: { $sum: '$amount' } } },
//     ]);
//
//     await saveLogToDB('info', 'Total out retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
//     res.status(200).json({ totalOut: totalOut[0]?.total || 0 });
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching total out: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// module.exports = {
//   getFinancialOverview,
//   getTransactionHistory,
//   getPaymentAnalytics,
//   recordTransaction,
//   getCategoryAnalysis,
//   addManualTransaction,
//   downloadReport,
//   getCurrentBalance,
//   getTotalIn,
//   getTotalOut,
// };


const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const Member = require('../models/Member');
const Inventory = require('../models/Inventory');
const Transaction = require('../models/Transaction');
const { saveLogToDB } = require('../middleware/logger');
const moment = require('moment-timezone');

process.env.TZ = 'Asia/Kolkata';

const getISTDate = () => {
  const istDate = moment().tz('Asia/Kolkata').toDate();
  return istDate;
};

const getDateFilter = (startDate, endDate) => {
  if (!startDate || !endDate) return {};
  const start = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toDate();
  const end = moment.tz(`${endDate}T23:59:59.999`, 'Asia/Kolkata').toDate();
  return {
    date: {
      $gte: start,
      $lte: end,
    },
  };
};

const getFinancialOverview = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching financial overview', req.method, req.originalUrl, null, req.user?.id);
    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);

    const [income, expenses, memberBookings] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'income', paymentMethod: { $ne: 'membership' }, ...dateFilter } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'expense', ...dateFilter } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { isMembershipBooking: true, ...dateFilter } },
        { $group: { _id: null, count: { $sum: 1 }, hoursUsed: { $sum: '$duration' } } },
      ]),
    ]);

    const response = {
      income,
      expenses,
      memberBookings: memberBookings[0] || { count: 0, hoursUsed: 0 },
      summary: {
        totalIncome: income.reduce((acc, curr) => acc + curr.total, 0),
        totalExpenses: expenses.reduce((acc, curr) => acc + curr.total, 0),
        netProfit: income.reduce((acc, curr) => acc + curr.total, 0) - expenses.reduce((acc, curr) => acc + curr.total, 0),
      },
    };

    await saveLogToDB('info', 'Financial overview retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(response);
  } catch (error) {
    await saveLogToDB('error', `Error fetching financial overview: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getTransactionHistory = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching transaction history', req.method, req.originalUrl, null, req.user?.id);

    const { startDate, endDate, type, category, search, paymentMethod, fromDate, toDate, page = 1, limit = 15, sort = 'date', order = 'desc' } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    if (fromDate) {
      query.date = query.date || {};
      query.date.$gte = new Date(fromDate);
    }
    if (toDate) {
      query.date = query.date || {};
      query.date.$lte = new Date(`${toDate}T23:59:59.999Z`);
    }

    if (type && type !== 'ALL') query.type = type;
    if (category && category !== 'ALL') query.category = category.toLowerCase();
    if (search) query.description = { $regex: search, $options: 'i' };
    if (paymentMethod && paymentMethod !== 'ALL') query.paymentMethod = paymentMethod;

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(query)
        .populate('recordedBy', 'name')
        .populate({
          path: 'reference',
          populate: { path: 'user', select: 'name email', strictPopulate: false },
        })
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    await saveLogToDB('info', 'Transaction history retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      transactions,
      pagination: { total, currentPage: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) },
    });
  } catch (error) {
    await saveLogToDB('error', `Error fetching transaction history: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getPaymentAnalytics = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching payment analytics', req.method, req.originalUrl, null, req.user?.id);

    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);

    const analytics = await Transaction.aggregate([
      { $match: { type: 'income', ...dateFilter } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const memberBookings = await Booking.aggregate([
      { $match: { isMembershipBooking: true, ...dateFilter } },
      { $group: { _id: null, count: { $sum: 1 }, hoursUsed: { $sum: '$duration' } } },
    ]);

    await saveLogToDB('info', 'Payment analytics retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      paymentAnalytics: analytics,
      membershipBookings: { count: memberBookings[0]?.count || 0, amount: 'Included in membership' },
    });
  } catch (error) {
    await saveLogToDB('error', `Error fetching payment analytics: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const recordTransaction = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Recording new transaction', req.method, req.originalUrl, null, req.user?.id);

    const { type, category, amount, description, paymentMethod, reference, referenceModel, date } = req.body;

    if (!type || !category || !amount || !description) {
      await saveLogToDB('error', 'Missing required fields for transaction', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Missing required fields');
    }

    if (category === 'booking' && reference) {
      const booking = await Booking.findById(reference);
      if (!booking) {
        await saveLogToDB('error', 'Booking not found', req.method, req.originalUrl, 404, req.user?.id);
        return res.status(404).json({ message: 'Booking not found' });
      }

      const member = await Member.findOne({ user: booking.user });
      if (member && member.membershipStatus === 'active') {
        await saveLogToDB('info', 'Member booking recorded - no financial transaction needed', req.method, req.originalUrl, 200, req.user?.id);
        return res.status(200).json({
          message: 'Member booking recorded - no financial transaction needed',
          booking,
        });
      }
    }

    const transactionDate = date && moment(date).isValid() ? moment.tz(date, 'Asia/Kolkata').toDate() : getISTDate();

    const transaction = await Transaction.create({
      type,
      entryType: type === 'income' ? 'IN' : 'OUT',
      category,
      amount,
      description,
      paymentMethod,
      reference,
      referenceModel,
      date: transactionDate,
      recordedBy: req.user.id,
    });

    await saveLogToDB('info', `Transaction recorded successfully at ${moment(transactionDate).format('YYYY-MM-DD HH:mm:ss')}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(transaction);
  } catch (error) {
    await saveLogToDB('error', `Error recording transaction: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getCategoryAnalysis = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching category analysis', req.method, req.originalUrl, null, req.user?.id);

    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);

    const categoryAnalysis = await Transaction.aggregate([
      { $match: dateFilter },
      { $group: { _id: { type: '$type', category: '$category', paymentMethod: '$paymentMethod' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.type', categories: { $push: { category: '$_id.category', paymentMethod: '$_id.paymentMethod', total: '$total', count: '$count' } } } },
    ]);

    const memberBookingStats = await Booking.aggregate([
      { $match: { isMembershipBooking: true, ...dateFilter } },
      { $group: { _id: null, totalBookings: { $sum: 1 }, totalHours: { $sum: '$duration' } } },
    ]);

    await saveLogToDB('info', 'Category analysis retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      categoryAnalysis,
      membershipBookings: memberBookingStats[0] || { totalBookings: 0, totalHours: 0 },
    });
  } catch (error) {
    await saveLogToDB('error', `Error fetching category analysis: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const addManualTransaction = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Adding manual transaction', req.method, req.originalUrl, null, req.user?.id);

    const { type, amount, description, paymentMethod, date, reference } = req.body;

    if (!type || !amount || !description) {
      await saveLogToDB('error', 'Missing required fields for manual transaction', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Please provide all required fields: type, amount, description');
    }

    if (!['income', 'expense'].includes(type)) {
      await saveLogToDB('error', 'Invalid transaction type', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Invalid transaction type. Must be "income" or "expense"');
    }

    const transactionDate = date && moment(date).isValid() ? moment.tz(date, 'Asia/Kolkata').toDate() : getISTDate();

    const transactionData = {
      type,
      entryType: type === 'income' ? 'IN' : 'OUT',
      category: 'transactions',
      amount,
      description,
      paymentMethod: paymentMethod || 'cash',
      date: transactionDate,
      recordedBy: req.user.id,
    };

    if (reference) {
      transactionData.reference = reference;
    }

    const transaction = await Transaction.create(transactionData);

    await saveLogToDB('info', `Manual transaction added successfully at ${moment(transactionDate).format('YYYY-MM-DD HH:mm:ss')}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(transaction);
  } catch (error) {
    await saveLogToDB('error', `Error adding manual transaction: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const downloadReport = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'financial' } = req.query;

    if (!startDate || !endDate) {
      await saveLogToDB('warn', 'Report download attempt without date range', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'Please provide start and end dates' });
    }

    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${formattedStartDate}-to-${formattedEndDate}.pdf`);
    doc.pipe(res);

    let transactions = [];

    doc.fillColor('#2c3e50')
        .fontSize(24)
        .text('Pickleball Club Report', 50, 50, { align: 'center' });
    doc.fillColor('#7f8c8d')
        .fontSize(12)
        .text(`Report Period: ${formattedStartDate} to ${formattedEndDate}`, { align: 'center' });
    doc.moveDown(2);

    if (reportType === 'financial') {
      transactions = await Transaction.find({
        date: {
          $gte: new Date(startDate),
          $lte: new Date(`${endDate}T23:59:59.999Z`),
        },
      }).sort({ date: 1 });

      if (transactions.length > 0) {
        doc.fillColor('#2980b9')
            .fontSize(16)
            .text('Transaction List', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const columnWidths = [100, 70, 80, 80, 200];
        let currentY = tableTop;

        doc.fillColor('#ffffff')
            .rect(50, currentY, 530, 20)
            .fill('#3498db');
        doc.fillColor('#ffffff')
            .fontSize(10)
            .text('Date', 50, currentY + 5)
            .text('Type', 150, currentY + 5)
            .text('Category', 220, currentY + 5)
            .text('Amount', 300, currentY + 5)
            .text('Description', 380, currentY + 5);
        currentY += 20;

        transactions.forEach((t, index) => {
          if (currentY + 20 > doc.page.height - 80) {
            doc.addPage();
            currentY = 50;
            doc.fillColor('#3498db')
                .fontSize(16)
                .text('Transaction List (Continued)', { underline: true });
            doc.moveDown(0.5);
            doc.fillColor('#ffffff')
                .rect(50, currentY + 20, 530, 20)
                .fill('#3498db');
            doc.fillColor('#ffffff')
                .fontSize(10)
                .text('Date', 50, currentY + 25)
                .text('Type', 150, currentY + 25)
                .text('Category', 220, currentY + 25)
                .text('Amount', 300, currentY + 25)
                .text('Description', 380, currentY + 25);
            currentY += 40;
          }

          const rowColor = index % 2 === 0 ? '#ecf0f1' : '#ffffff';
          doc.fillColor(rowColor)
              .rect(50, currentY, 530, 20)
              .fill();
          doc.fillColor('#2c3e50')
              .fontSize(9)
              .text(moment(t.date).format('YYYY-MM-DD'), 50, currentY + 5)
              .text(t.type.toUpperCase(), 150, currentY + 5)
              .text(t.category || 'Uncategorized', 220, currentY + 5)
              .text(`$${(t.amount || 0).toFixed(2)}`, 300, currentY + 5)
              .text(t.description || '', 380, currentY + 5, { width: 150, ellipsis: true });
          currentY += 20;
        });
        doc.moveDown(2);
      } else {
        doc.fillColor('#2c3e50')
            .fontSize(12)
            .text('No transactions found for this period.', { align: 'center' });
        doc.moveDown(2);
      }

      const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 };
        acc[t.category].total += t.amount || 0;
        acc[t.category].count += 1;
        return acc;
      }, {});

      const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 };
        acc[t.category].total += t.amount || 0;
        acc[t.category].count += 1;
        return acc;
      }, {});

      const drawSummaryTable = (title, data, color) => {
        if (doc.y + 100 > doc.page.height - 80) doc.addPage();
        doc.fillColor(color)
            .fontSize(16)
            .text(title, { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.fillColor('#ffffff')
            .rect(50, tableTop, 300, 20)
            .fill(color);
        doc.fillColor('#ffffff')
            .fontSize(10)
            .text('Category', 50, tableTop + 5)
            .text('Total', 200, tableTop + 5)
            .text('Transactions', 270, tableTop + 5);

        let currentY = tableTop + 20;
        Object.entries(data).forEach(([category, { total, count }], index) => {
          if (currentY + 20 > doc.page.height - 80) {
            doc.addPage();
            currentY = 50;
          }
          const rowColor = index % 2 === 0 ? '#ecf0f1' : '#ffffff';
          doc.fillColor(rowColor)
              .rect(50, currentY, 300, 20)
              .fill();
          doc.fillColor('#2c3e50')
              .fontSize(9)
              .text(category, 50, currentY + 5)
              .text(`$${total.toFixed(2)}`, 200, currentY + 5)
              .text(count.toString(), 270, currentY + 5);
          currentY += 20;
        });
        doc.moveDown(2);
      };

      drawSummaryTable('Income Summary', income, '#27ae60');
      drawSummaryTable('Expense Summary', expenses, '#c0392b');

      const memberBookings = await Booking.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(startDate),
              $lte: new Date(`${endDate}T23:59:59.999Z`),
            },
            isMembershipBooking: true,
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            hoursUsed: { $sum: '$duration' },
          },
        },
      ]).catch(() => []);

      if (doc.y + 80 > doc.page.height - 80) doc.addPage();
      doc.fillColor('#8e44ad')
          .fontSize(16)
          .text('Membership Usage', { underline: true });
      doc.moveDown(0.5);
      const memberData = memberBookings[0] || { count: 0, hoursUsed: 0 };
      doc.fillColor('#ecf0f1')
          .rect(50, doc.y, 300, 40)
          .fill();
      doc.fillColor('#2c3e50')
          .fontSize(11)
          .text(`Total Member Bookings: ${memberData.count}`, 60, doc.y + 10)
          .text(`Total Hours Used: ${memberData.hoursUsed}`, 60, doc.y + 25);
      doc.moveDown(2);

      const totalIncome = Object.values(income).reduce((sum, data) => sum + data.total, 0);
      const totalExpenses = Object.values(expenses).reduce((sum, data) => sum + data.total, 0);
      const netProfit = totalIncome - totalExpenses;

      if (doc.y + 100 > doc.page.height - 80) doc.addPage();
      doc.fillColor('#d35400')
          .fontSize(16)
          .text('Financial Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fillColor('#ecf0f1')
          .rect(50, doc.y, 300, 60)
          .fill();
      doc.fillColor('#2c3e50')
          .fontSize(11)
          .text(`Total Income: $${totalIncome.toFixed(2)}`, 60, doc.y + 10)
          .text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 60, doc.y + 25)
          .text(`Net Profit: $${netProfit.toFixed(2)}`, 60, doc.y + 40);
    }

    if (doc.y + 30 > doc.page.height - 40) doc.addPage();
    doc.fillColor('#7f8c8d')
        .fontSize(10)
        .text(`Generated on ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 50, doc.page.height - 50, { align: 'center' });

    doc.end();

    await saveLogToDB('info', `Report downloaded successfully for period ${startDate} to ${endDate} with ${transactions.length} transactions`, req.method, req.originalUrl, 200, req.user?.id);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating report', error: error.message });
    }
    await saveLogToDB('error', `Error generating report: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
  }
});

const getCurrentBalance = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching current balance', req.method, req.originalUrl, null, req.user?.id);

    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);

    const [totalIn, totalOut] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'income', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'expense', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const balance = (totalIn[0]?.total || 0) - (totalOut[0]?.total || 0);

    await saveLogToDB('info', 'Current balance retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({ currentBalance: balance });
  } catch (error) {
    await saveLogToDB('error', `Error fetching current balance: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getTotalIn = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching total in', req.method, req.originalUrl, null, req.user?.id);

    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);

    const totalIn = await Transaction.aggregate([
      { $match: { type: 'income', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    await saveLogToDB('info', 'Total in retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({ totalIn: totalIn[0]?.total || 0 });
  } catch (error) {
    await saveLogToDB('error', `Error fetching total in: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getTotalOut = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching total out', req.method, req.originalUrl, null, req.user?.id);

    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);

    const totalOut = await Transaction.aggregate([
      { $match: { type: 'expense', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    await saveLogToDB('info', 'Total out retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({ totalOut: totalOut[0]?.total || 0 });
  } catch (error) {
    await saveLogToDB('error', `Error fetching total out: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

module.exports = {
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
};