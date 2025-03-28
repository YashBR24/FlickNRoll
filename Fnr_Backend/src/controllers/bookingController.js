// // bookingController.js
// const mongoose = require('mongoose');
// const asyncHandler = require('express-async-handler');
// const Booking = require('../models/Booking');
// const Member = require('../models/Member');
// const Transaction = require('../models/Transaction');
// const CourtMaintenance = require('../models/Court');
// const Court = require('../models/Court');
// const { normalizeTime, doTimesOverlap, getTimeRange } = require('../middleware/timeUtils');
// const { saveLogToDB } = require('../middleware/logger');
//
// const getNextTransactionNumber = asyncHandler(async () => {
//   try {
//     const latestTransaction = await Transaction.findOne().sort({ number: -1 }).limit(1);
//     const nextNumber = latestTransaction ? latestTransaction.number + 1 : 1;
//     await saveLogToDB('info', `Generated next transaction number: ${nextNumber}`, 'GET', '/api/transactions/next', null, null);
//     return nextNumber;
//   } catch (error) {
//     await saveLogToDB('error', `Error getting next transaction number: ${error.message}`, 'GET', '/api/transactions/next', 500, null);
//     throw error;
//   }
// });
//
// const getBookings = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching bookings', req.method, req.originalUrl, null, req.user?.id);
//
//     if (!req.user || !req.user.id) {
//       await saveLogToDB('warn', 'Unauthorized booking access attempt', req.method, req.originalUrl, 401, null);
//       res.status(401);
//       throw new Error("Not authorized, user not found");
//     }
//
//     const { startDate, endDate, status, court } = req.query;
//
//     const params = {
//       ...(startDate && endDate && {
//         date: {
//           $gte: new Date(startDate),
//           $lte: new Date(endDate).setHours(23, 59, 59, 999)
//         }
//       }),
//       ...(status && { status }),
//       ...(court && { court: parseInt(court) }),
//     };
//
//     if (req.user.role.toLowerCase() === 'member') {
//       params.user = req.user.id;
//     }
//
//     const bookings = await Booking.find(params)
//         .populate("user", "name email")
//         .populate({
//           path: "players",
//           select: "name email user",
//           populate: {
//             path: "user",
//             select: "name email"
//           }
//         })
//         .sort({ date: -1, startTime: -1 });
//
//     const totalBookings = await Booking.countDocuments(params);
//
//     await saveLogToDB('info', `Successfully retrieved ${bookings.length} bookings`, req.method, req.originalUrl, 200, req.user.id);
//
//     res.status(200).json({
//       bookings,
//       pagination: {
//         total: totalBookings,
//         page: parseInt(req.query.page) || 1,
//         limit: parseInt(req.query.limit) || 10,
//       },
//     });
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const getTodayBookingsByTime = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching today\'s bookings', req.method, req.originalUrl, null, req.user?.id);
//
//     if (!req.user || !req.user.id) {
//       await saveLogToDB('warn', 'Unauthorized access attempt', req.method, req.originalUrl, 401, null);
//       res.status(401);
//       throw new Error("Not authorized, user not found");
//     }
//
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const endOfDay = new Date(today);
//     endOfDay.setHours(23, 59, 59, 999);
//
//     const bookings = await Booking.find({
//       date: { $gte: today, $lte: endOfDay },
//       user: req.user.id,
//       status: { $ne: 'pending' }
//     })
//         .populate({
//           path: 'players',
//           select: 'name email user',
//           populate: {
//             path: 'user',
//             select: 'name email'
//           }
//         })
//         .sort({ startTime: 1 });
//
//     const formattedBookings = await Promise.all(bookings.map(async (booking) => {
//       let playerName = booking.name; // Default to general booking name
//
//       if (booking.bookingType === 'member' && booking.players.length > 0) {
//         const player = booking.players[0];
//         // Try to get name from different possible sources
//         playerName = player.user?.name || player.name || 'Unknown Member';
//       }
//
//       const actions = booking.status === 'confirmed' ? ['Edit Booking', 'Cancel Booking'] : [];
//
//       return {
//         _id: booking._id.toString(),
//         date: booking.date.toISOString().split('T')[0],
//         time: booking.startTime || 'N/A',
//         courtNumber: booking.court || 0,
//         playerName: playerName || 'N/A',
//         paymentMethod: booking.paymentMethod || 'N/A',
//         action: actions
//       };
//     }));
//
//     await saveLogToDB('info', `Retrieved ${formattedBookings.length} bookings for today`, req.method, req.originalUrl, 200, req.user.id);
//     res.status(200).json(formattedBookings);
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching today\'s bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const createBooking = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Creating new booking', req.method, req.originalUrl, null, req.user?.id);
//
//     const { court } = req.body;
//
//     // Check if court exists and is active
//     const courtStatus = await Court.findOne({ number: court });
//     if (courtStatus && !courtStatus.isActive) {
//       await saveLogToDB('warn', `Booking attempted for inactive court ${court}`, req.method, req.originalUrl, 400, req.user.id);
//       return res.status(400).json({
//         message: `Court ${court} is currently inactive. Please select another court.`,
//       });
//     }
//
//     // Check if court is under maintenance
//     const maintenance = await CourtMaintenance.findOne({
//       court,
//       status: 'maintenance',
//     });
//
//     if (maintenance) {
//       await saveLogToDB('warn', `Booking attempted for court ${court} under maintenance`, req.method, req.originalUrl, 400, req.user.id);
//       return res.status(400).json({
//         message: `Court ${court} is currently under maintenance until ${maintenance.expectedEndDate.toLocaleDateString()}. Please select another court.`,
//         maintenanceDetails: maintenance,
//       });
//     }
//
//     const { date, startTime, duration, paymentMethod, bookingType, players, name, totalAmount, advancePayment } = req.body;
//
//     if (!court || !date || !startTime || !duration || !bookingType) {
//       await saveLogToDB('warn', 'Booking creation failed - Missing base fields', req.method, req.originalUrl, 400, req.user.id);
//       return res.status(400).json({ message: "Please provide all required base fields: court, date, startTime, duration, bookingType" });
//     }
//     if (!['general', 'member'].includes(bookingType)) return res.status(400).json({ message: "Booking type must be 'general' or 'member'" });
//
//     if (typeof court !== "number" || court < 1 || court > 5) {
//       await saveLogToDB('warn', 'Invalid court number', req.method, req.originalUrl, 400, req.user.id);
//       return res.status(400).json({ message: "Court number must be between 1 and 5" });
//     }
//     if (typeof duration !== "number" || duration < 1 || duration > 24) {
//       await saveLogToDB('warn', 'Invalid duration', req.method, req.originalUrl, 400, req.user.id);
//       return res.status(400).json({ message: "Duration must be between 1 and 24 hours" });
//     }
//
//     const normalizedStartTime = normalizeTime(startTime);
//     const bookingDate = new Date(date);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Reset time for date comparison
//
//     // Validate startTime if booking is for today
//     if (bookingDate.toDateString() === today.toDateString()) {
//       const now = new Date();
//       const [hours, minutes] = normalizedStartTime.split(':').map(Number);
//       const bookingStart = new Date(bookingDate);
//       bookingStart.setHours(hours, minutes, 0, 0);
//
//       if (bookingStart < now) {
//         await saveLogToDB('warn', `Invalid start time ${startTime} for today - time is in the past`, req.method, req.originalUrl, 400, req.user.id);
//         return res.status(400).json({
//           message: `Please select a valid start time. ${startTime} is in the past. Current time is ${format(now, 'hh:mm a')}.`,
//         });
//       }
//     }
//
//     const existingBookings = await Booking.find({ court, date, status: { $ne: 'cancelled' } });
//     for (const booking of existingBookings) {
//       if (doTimesOverlap(normalizedStartTime, duration, booking.startTime, booking.duration)) {
//         const timeRange = getTimeRange(booking.startTime, booking.duration);
//         await saveLogToDB('warn', `Court ${court} already booked from ${timeRange}`, req.method, req.originalUrl, 400, req.user.id);
//         return res.status(400).json({
//           message: `Court ${court} is already booked from ${timeRange}`,
//           existingBooking: { startTime: booking.startTime, duration: booking.duration, timeRange },
//         });
//       }
//     }
//
//     let finalPaymentMethod = paymentMethod;
//     let bookingData = {
//       user: req.user.id,
//       court,
//       date,
//       startTime: normalizedStartTime,
//       duration,
//       bookingType,
//       status: 'confirmed',
//     };
//
//     if (bookingType === 'general') {
//       if (!name) return res.status(400).json({ message: "Player name is required for general booking" });
//       if (totalAmount === undefined || totalAmount <= 0) return res.status(400).json({ message: "Total amount is required and must be a positive number for general booking" });
//       if (advancePayment === undefined || advancePayment < 0) return res.status(400).json({ message: "Advance payment is required and must be non-negative for general booking" });
//       if (advancePayment > totalAmount) return res.status(400).json({ message: "Advance payment cannot exceed total amount" });
//       if (!paymentMethod || !['Cash', 'UPI', 'Card', 'other'].includes(paymentMethod)) return res.status(400).json({ message: "Valid payment method (Cash, UPI, Card, other) is required for general booking" });
//
//       bookingData.name = name;
//       bookingData.totalAmount = totalAmount;
//       bookingData.advancePayment = advancePayment;
//       bookingData.paymentMethod = paymentMethod;
//       bookingData.paymentStatus = advancePayment === totalAmount ? 'paid' : 'partially_paid';
//
//       if (advancePayment > 0) {
//         const transactionNumber = await getNextTransactionNumber();
//         const tempBookingId = new mongoose.Types.ObjectId();
//         await Transaction.create({
//           number: transactionNumber,
//           type: 'income',
//           entryType: 'IN',
//           category: 'booking',
//           amount: advancePayment,
//           description: `Advance payment for court ${court} booking by ${name} on ${date} at ${normalizedStartTime}`,
//           paymentMethod: paymentMethod,
//           reference: tempBookingId,
//           referenceModel: 'Booking',
//           recordedBy: req.user.id,
//         });
//         bookingData._id = tempBookingId;
//       }
//     } else {
//       if (!players || !Array.isArray(players) || players.length === 0) {
//         return res.status(400).json({ message: "Players array is required for member booking" });
//       }
//       let member = null;
//       for (const playerId of players) {
//         const foundMember = await Member.findOne({ _id: playerId });
//         if (foundMember) {
//           member = foundMember;
//           break;
//         }
//       }
//       if (!member) return res.status(400).json({ message: "No valid member found for member booking" });
//       if (member.isExpired()) return res.status(400).json({ message: "Member's membership has expired. Please renew your membership." });
//       if (member.membershipStatus !== 'active') return res.status(400).json({ message: "Member's membership is not active." });
//       if (member.hoursRemaining === 0) return res.status(400).json({ message: "Your membership hours are exhausted. Please renew your membership or select general booking." });
//       if (!member.hasEnoughHours(duration)) return res.status(400).json({ message: `Insufficient hours: ${member.hoursRemaining} hours left. Renew your membership or select general booking.` });
//
//       await member.deductHours(duration);
//       bookingData.players = players.map(player => player.toString());
//       bookingData.totalAmount = 0;
//       bookingData.advancePayment = 0;
//       bookingData.paymentMethod = 'Member';
//       bookingData.paymentStatus = 'paid';
//       await saveLogToDB('info', `Deducted ${duration} hours from member ${member.email}`, req.method, req.originalUrl, null, req.user.id);
//     }
//
//     const booking = await Booking.create(bookingData);
//
//     if (bookingType === 'general' && advancePayment > 0) {
//       await Transaction.updateOne(
//           { reference: bookingData._id, description: `Advance payment for court ${court} booking by ${name} on ${date} at ${normalizedStartTime}` },
//           { reference: booking._id }
//       );
//     }
//
//     await saveLogToDB('info', `Booking created: Court ${court} for ${date}`, req.method, req.originalUrl, 201, req.user.id);
//     res.status(201).json(booking);
//   } catch (error) {
//     await saveLogToDB('error', `Booking creation error: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const markBookingAsPaid = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', `Marking booking ${req.params.id} as paid`, req.method, req.originalUrl, null, req.user?.id);
//     if (!req.user || !req.user.id) {
//       await saveLogToDB('warn', 'Unauthorized mark as paid attempt', req.method, req.originalUrl, 401, null);
//       return res.status(401).json({ message: "Not authorized, user not found" });
//     }
//
//     const { paymentMethod } = req.body;
//     if (!paymentMethod || !['Cash', 'UPI', 'Card', 'other'].includes(paymentMethod)) {
//       return res.status(400).json({ message: "Valid payment method (Cash, UPI, Card, other) is required" });
//     }
//
//     const booking = await Booking.findById(req.params.id);
//     if (!booking) {
//       await saveLogToDB('warn', `Booking not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user.id);
//       return res.status(404).json({ message: "Booking not found" });
//     }
//     if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
//       await saveLogToDB('warn', 'Unauthorized mark as paid attempt', req.method, req.originalUrl, 403, req.user.id);
//       return res.status(403).json({ message: "User not authorized to mark this booking as paid" });
//     }
//     if (booking.bookingType !== 'general') {
//       return res.status(400).json({ message: "Only general bookings can be marked as paid" });
//     }
//     if (booking.paymentStatus === 'paid') {
//       return res.status(400).json({ message: "Booking is already fully paid" });
//     }
//
//     const remainingAmount = booking.totalAmount - booking.advancePayment;
//     if (remainingAmount <= 0) {
//       return res.status(400).json({ message: "No remaining amount to pay" });
//     }
//
//     const transactionNumber = await getNextTransactionNumber();
//     await Transaction.create({
//       number: transactionNumber,
//       type: 'income',
//       entryType: 'IN',
//       category: 'booking',
//       amount: remainingAmount,
//       description: `Final payment for court ${booking.court} booking by ${booking.name} on ${booking.date.toISOString().split('T')[0]} at ${booking.startTime}`,
//       paymentMethod: paymentMethod,
//       reference: booking._id,
//       referenceModel: 'Booking',
//       recordedBy: req.user.id,
//     });
//
//     booking.paymentStatus = 'paid';
//     booking.paymentMethod = paymentMethod;
//     await booking.save();
//
//     await saveLogToDB('info', `Booking ${req.params.id} marked as paid`, req.method, req.originalUrl, 200, req.user.id);
//     res.status(200).json(booking);
//   } catch (error) {
//     await saveLogToDB('error', `Error marking booking as paid: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const updateBooking = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', `Updating booking ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);
//     if (!req.user || !req.user.id) {
//       await saveLogToDB('warn', 'Unauthorized booking update attempt', req.method, req.originalUrl, 401, null);
//       res.status(401);
//       throw new Error("Not authorized, user not found");
//     }
//     const booking = await Booking.findById(req.params.id);
//     if (!booking) {
//       await saveLogToDB('warn', `Booking not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user.id);
//       res.status(404);
//       throw new Error("Booking not found");
//     }
//     if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
//       await saveLogToDB('warn', 'Unauthorized booking update attempt', req.method, req.originalUrl, 403, req.user.id);
//       res.status(403);
//       throw new Error("User not authorized to update this booking");
//     }
//     const { court, date, startTime, duration, paymentMethod, status } = req.body;
//     const updateData = {};
//     if (court !== undefined && (typeof court === "number" && court >= 1 && court <= 5)) updateData.court = court;
//     if (date) updateData.date = new Date(date);
//     if (startTime) updateData.startTime = startTime;
//     if (duration !== undefined && (typeof duration === "number" && duration >= 1 && duration <= 24)) updateData.duration = duration;
//     if (paymentMethod && ['Cash', 'UPI', 'Card', 'Member', 'other'].includes(paymentMethod)) updateData.paymentMethod = paymentMethod;
//     if (status && ['confirmed', 'cancelled'].includes(status)) updateData.status = status;
//     if (Object.keys(updateData).length === 0) {
//       await saveLogToDB('warn', 'No valid fields to update', req.method, req.originalUrl, 400, req.user.id);
//       return res.status(400).json({ message: "No valid fields provided for update" });
//     }
//     const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
//     await saveLogToDB('info', `Booking updated successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user.id);
//     res.status(200).json(updatedBooking);
//   } catch (error) {
//     await saveLogToDB('error', `Booking update error: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const deleteBooking = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', `Deleting booking ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);
//     if (!req.user || !req.user.id) {
//       await saveLogToDB('warn', 'Unauthorized booking deletion attempt', req.method, req.originalUrl, 401, null);
//       res.status(401);
//       throw new Error("Not authorized, user not found");
//     }
//     const booking = await Booking.findById(req.params.id);
//     if (!booking) {
//       await saveLogToDB('warn', `Booking not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user.id);
//       res.status(404);
//       throw new Error("Booking not found");
//     }
//     if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
//       await saveLogToDB('warn', 'Unauthorized booking deletion attempt', req.method, req.originalUrl, 403, req.user.id);
//       res.status(403);
//       throw new Error("User not authorized to delete this booking");
//     }
//     if (booking.bookingType === 'member') {
//       const member = await Member.findOne({ _id: { $in: booking.players } });
//       if (member) {
//         member.hoursRemaining += booking.duration;
//         member.hoursUsed -= booking.duration;
//         await member.save();
//         await saveLogToDB('info', `Returned ${booking.duration} hours to member account`, req.method, req.originalUrl, null, req.user.id);
//       }
//     }
//     await booking.deleteOne();
//     await saveLogToDB('info', `Booking deleted successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user.id);
//     res.status(200).json({ message: "Booking deleted", id: req.params.id });
//   } catch (error) {
//     await saveLogToDB('error', `Booking deletion error: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const updateCourtStatus = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isActive } = req.body;
//
//     if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
//       await saveLogToDB('warn', 'Unauthorized court status update attempt', req.method, req.originalUrl, 403, req.user?.id);
//       return res.status(403).json({ message: "Not authorized. Only admins and managers can update court status." });
//     }
//
//     if (typeof isActive !== 'boolean') {
//       await saveLogToDB('warn', 'Invalid court status value', req.method, req.originalUrl, 400, req.user.id);
//       return res.status(400).json({ message: "isActive must be a boolean value" });
//     }
//
//     let court = await Court.findOne({ number: parseInt(id) });
//
//     if (!court) {
//       // Create court if it doesn't exist
//       court = await Court.create({
//         number: parseInt(id),
//         isActive,
//         lastUpdatedBy: req.user.id
//       });
//     } else {
//       court.isActive = isActive;
//       court.lastUpdatedBy = req.user.id;
//       await court.save();
//     }
//
//     await saveLogToDB('info', `Court ${id} status updated to ${isActive ? 'active' : 'inactive'}`, req.method, req.originalUrl, 200, req.user.id);
//     res.status(200).json({
//       message: `Court ${id} status updated successfully`,
//       court: {
//         number: court.number,
//         isActive: court.isActive
//       }
//     });
//   } catch (error) {
//     await saveLogToDB('error', `Error updating court status: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const getCourtStatus = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching court statuses', req.method, req.originalUrl, null, req.user?.id);
//
//     const courts = await Court.find().sort({ number: 1 });
//
//     // Include any courts that don't have records (default to active)
//     const allCourts = Array.from({ length: 5 }, (_, i) => i + 1).map(number => {
//       const existingCourt = courts.find(c => c.number === number);
//       return existingCourt || {
//         number,
//         isActive: true
//       };
//     });
//
//     await saveLogToDB('info', 'Court statuses retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
//     res.status(200).json(allCourts);
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching court statuses: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
// const getFutureBookings = asyncHandler(async (req, res) => {
//   try {
//     await saveLogToDB('info', 'Fetching future bookings', req.method, req.originalUrl, null, req.user?.id);
//
//     if (!req.user || !req.user.id) {
//       await saveLogToDB('warn', 'Unauthorized future bookings access attempt', req.method, req.originalUrl, 401, null);
//       res.status(401);
//       throw new Error("Not authorized, user not found");
//     }
//
//     const today = new Date();
//     today.setHours(23, 59, 59, 999); // Set to end of today for comparison
//
//     const futureBookings = await Booking.find({
//       date: { $gt: today },
//       status: { $ne: 'cancelled' }, // Exclude cancelled bookings
//     })
//         .populate("user", "name email")
//         .populate({
//           path: "players",
//           select: "name email user",
//           populate: {
//             path: "user",
//             select: "name email",
//           },
//         })
//         .sort({ date: 1, startTime: 1 }); // Sort by date ascending
//
//     await saveLogToDB('info', `Retrieved ${futureBookings.length} future bookings`, req.method, req.originalUrl, 200, req.user.id);
//     res.status(200).json(futureBookings);
//   } catch (error) {
//     await saveLogToDB('error', `Error fetching future bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
//     throw error;
//   }
// });
//
//
//
//
// module.exports = {
//   getBookings,
//   getTodayBookingsByTime,
//   createBooking,
//   updateBooking,
//   deleteBooking,
//   markBookingAsPaid,
//   updateCourtStatus,
//   getCourtStatus,
//   getFutureBookings,
// };

// bookingController.js
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const CourtMaintenance = require('../models/Court');
const Court = require('../models/Court');
const { normalizeTime, doTimesOverlap, getTimeRange } = require('../middleware/timeUtils');
const { saveLogToDB } = require('../middleware/logger');

const getBookings = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching bookings', req.method, req.originalUrl, null, req.user?.id);

    if (!req.user || !req.user.id) {
      await saveLogToDB('warn', 'Unauthorized booking access attempt', req.method, req.originalUrl, 401, null);
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    const { startDate, endDate, status, court } = req.query;

    const params = {
      ...(startDate && endDate && {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate).setHours(23, 59, 59, 999)
        }
      }),
      ...(status && { status }),
      ...(court && { court: parseInt(court) }),
    };

    if (req.user.role.toLowerCase() === 'member') {
      params.user = req.user.id;
    }

    const bookings = await Booking.find(params)
        .populate("user", "name email")
        .populate({
          path: "players",
          select: "name email user",
          populate: {
            path: "user",
            select: "name email"
          }
        })
        .sort({ date: -1, startTime: -1 });

    const totalBookings = await Booking.countDocuments(params);

    await saveLogToDB('info', `Successfully retrieved ${bookings.length} bookings`, req.method, req.originalUrl, 200, req.user.id);

    res.status(200).json({
      bookings,
      pagination: {
        total: totalBookings,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      },
    });
  } catch (error) {
    await saveLogToDB('error', `Error fetching bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getTodayBookingsByTime = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching today\'s bookings', req.method, req.originalUrl, null, req.user?.id);

    if (!req.user || !req.user.id) {
      await saveLogToDB('warn', 'Unauthorized access attempt', req.method, req.originalUrl, 401, null);
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      date: { $gte: today, $lte: endOfDay },
      user: req.user.id,
      status: { $ne: 'pending' }
    })
        .populate({
          path: 'players',
          select: 'name email user',
          populate: {
            path: 'user',
            select: 'name email'
          }
        })
        .sort({ startTime: 1 });

    const formattedBookings = await Promise.all(bookings.map(async (booking) => {
      let playerName = booking.name; // Default to general booking name

      if (booking.bookingType === 'member' && booking.players.length > 0) {
        const player = booking.players[0];
        playerName = player.user?.name || player.name || 'Unknown Member';
      }

      const actions = booking.status === 'confirmed' ? ['Edit Booking', 'Cancel Booking'] : [];

      return {
        _id: booking._id.toString(),
        date: booking.date.toISOString().split('T')[0],
        time: booking.startTime || 'N/A',
        courtNumber: booking.court || 0,
        playerName: playerName || 'N/A',
        paymentMethod: booking.paymentMethod || 'N/A',
        action: actions
      };
    }));

    await saveLogToDB('info', `Retrieved ${formattedBookings.length} bookings for today`, req.method, req.originalUrl, 200, req.user.id);
    res.status(200).json(formattedBookings);
  } catch (error) {
    await saveLogToDB('error', `Error fetching today\'s bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const createBooking = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Creating new booking', req.method, req.originalUrl, null, req.user?.id);

    const { court } = req.body;

    // Check if court exists and is active
    const courtStatus = await Court.findOne({ number: court });
    if (courtStatus && !courtStatus.isActive) {
      await saveLogToDB('warn', `Booking attempted for inactive court ${court}`, req.method, req.originalUrl, 400, req.user.id);
      return res.status(400).json({
        message: `Court ${court} is currently inactive. Please select another court.`,
      });
    }

    // Check if court is under maintenance
    const maintenance = await CourtMaintenance.findOne({
      court,
      status: 'maintenance',
    });

    if (maintenance) {
      await saveLogToDB('warn', `Booking attempted for court ${court} under maintenance`, req.method, req.originalUrl, 400, req.user.id);
      return res.status(400).json({
        message: `Court ${court} is currently under maintenance until ${maintenance.expectedEndDate.toLocaleDateString()}. Please select another court.`,
        maintenanceDetails: maintenance,
      });
    }

    const { date, startTime, duration, paymentMethod, bookingType, players, name, totalAmount, advancePayment } = req.body;

    if (!court || !date || !startTime || !duration || !bookingType) {
      await saveLogToDB('warn', 'Booking creation failed - Missing base fields', req.method, req.originalUrl, 400, req.user.id);
      return res.status(400).json({ message: "Please provide all required base fields: court, date, startTime, duration, bookingType" });
    }
    if (!['general', 'member'].includes(bookingType)) return res.status(400).json({ message: "Booking type must be 'general' or 'member'" });

    if (typeof court !== "number" || court < 1 || court > 5) {
      await saveLogToDB('warn', 'Invalid court number', req.method, req.originalUrl, 400, req.user.id);
      return res.status(400).json({ message: "Court number must be between 1 and 5" });
    }
    if (typeof duration !== "number" || duration < 1 || duration > 24) {
      await saveLogToDB('warn', 'Invalid duration', req.method, req.originalUrl, 400, req.user.id);
      return res.status(400).json({ message: "Duration must be between 1 and 24 hours" });
    }

    const normalizedStartTime = normalizeTime(startTime);
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for date comparison

    // Validate startTime if booking is for today
    if (bookingDate.toDateString() === today.toDateString()) {
      const now = new Date();
      const [hours, minutes] = normalizedStartTime.split(':').map(Number);
      const bookingStart = new Date(bookingDate);
      bookingStart.setHours(hours, minutes, 0, 0);

      if (bookingStart < now) {
        await saveLogToDB('warn', `Invalid start time ${startTime} for today - time is in the past`, req.method, req.originalUrl, 400, req.user.id);
        return res.status(400).json({
          message: `Please select a valid start time. ${startTime} is in the past. Current time is ${now.toLocaleTimeString()}.`,
        });
      }
    }

    const existingBookings = await Booking.find({ court, date, status: { $ne: 'cancelled' } });
    for (const booking of existingBookings) {
      if (doTimesOverlap(normalizedStartTime, duration, booking.startTime, booking.duration)) {
        const timeRange = getTimeRange(booking.startTime, booking.duration);
        await saveLogToDB('warn', `Court ${court} already booked from ${timeRange}`, req.method, req.originalUrl, 400, req.user.id);
        return res.status(400).json({
          message: `Court ${court} is already booked from ${timeRange}`,
          existingBooking: { startTime: booking.startTime, duration: booking.duration, timeRange },
        });
      }
    }

    let finalPaymentMethod = paymentMethod;
    let bookingData = {
      user: req.user.id,
      court,
      date,
      startTime: normalizedStartTime,
      duration,
      bookingType,
      status: 'confirmed',
    };

    if (bookingType === 'general') {
      if (!name) return res.status(400).json({ message: "Player name is required for general booking" });
      if (totalAmount === undefined || totalAmount <= 0) return res.status(400).json({ message: "Total amount is required and must be a positive number for general booking" });
      if (advancePayment === undefined || advancePayment < 0) return res.status(400).json({ message: "Advance payment is required and must be non-negative for general booking" });
      if (advancePayment > totalAmount) return res.status(400).json({ message: "Advance payment cannot exceed total amount" });
      if (!paymentMethod || !['Cash', 'UPI', 'Card', 'other'].includes(paymentMethod)) return res.status(400).json({ message: "Valid payment method (Cash, UPI, Card, other) is required for general­­ general booking" });

      bookingData.name = name;
      bookingData.totalAmount = totalAmount;
      bookingData.advancePayment = advancePayment;
      bookingData.paymentMethod = paymentMethod;
      bookingData.paymentStatus = advancePayment === totalAmount ? 'paid' : 'partially_paid';

      if (advancePayment > 0) {
        const tempBookingId = new mongoose.Types.ObjectId();
        await Transaction.create({
          type: 'income',
          entryType: 'IN',
          category: 'booking',
          amount: advancePayment,
          description: `Advance payment for court ${court} booking by ${name} on ${date} at ${normalizedStartTime}`,
          paymentMethod: paymentMethod,
          reference: tempBookingId,
          referenceModel: 'Booking',
          recordedBy: req.user.id,
        });
        bookingData._id = tempBookingId;
      }
    } else {
      if (!players || !Array.isArray(players) || players.length === 0) {
        return res.status(400).json({ message: "Players array is required for member booking" });
      }
      let member = null;
      for (const playerId of players) {
        const foundMember = await Member.findOne({ _id: playerId });
        if (foundMember) {
          member = foundMember;
          break;
        }
      }
      if (!member) return res.status(400).json({ message: "No valid member found for member booking" });
      if (member.isExpired()) return res.status(400).json({ message: "Member's membership has expired. Please renew your membership." });
      if (member.membershipStatus !== 'active') return res.status(400).json({ message: "Member's membership is not active." });
      if (member.hoursRemaining === 0) return res.status(400).json({ message: "Your membership hours are exhausted. Please renew your membership or select general booking." });
      if (!member.hasEnoughHours(duration)) return res.status(400).json({ message: `Insufficient hours: ${member.hoursRemaining} hours left. Renew your membership or select general booking.` });

      await member.deductHours(duration);
      bookingData.players = players.map(player => player.toString());
      bookingData.totalAmount = 0;
      bookingData.advancePayment = 0;
      bookingData.paymentMethod = 'Member';
      bookingData.paymentStatus = 'paid';
      await saveLogToDB('info', `Deducted ${duration} hours from member ${member.email}`, req.method, req.originalUrl, null, req.user.id);
    }

    const booking = await Booking.create(bookingData);

    if (bookingType === 'general' && advancePayment > 0) {
      await Transaction.updateOne(
          { reference: bookingData._id, description: `Advance payment for court ${court} booking by ${name} on ${date} at ${normalizedStartTime}` },
          { reference: booking._id }
      );
    }

    await saveLogToDB('info', `Booking created: Court ${court} for ${date}`, req.method, req.originalUrl, 201, req.user.id);
    res.status(201).json(booking);
  } catch (error) {
    await saveLogToDB('error', `Booking creation error: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const markBookingAsPaid = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Marking booking ${req.params.id} as paid`, req.method, req.originalUrl, null, req.user?.id);
    if (!req.user || !req.user.id) {
      await saveLogToDB('warn', 'Unauthorized mark as paid attempt', req.method, req.originalUrl, 401, null);
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    const { paymentMethod } = req.body;
    if (!paymentMethod || !['Cash', 'UPI', 'Card', 'other'].includes(paymentMethod)) {
      return res.status(400).json({ message: "Valid payment method (Cash, UPI, Card, other) is required" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      await saveLogToDB('warn', `Booking not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user.id);
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
      await saveLogToDB('warn', 'Unauthorized mark as paid attempt', req.method, req.originalUrl, 403, req.user.id);
      return res.status(403).json({ message: "User not authorized to mark this booking as paid" });
    }
    if (booking.bookingType !== 'general') {
      return res.status(400).json({ message: "Only general bookings can be marked as paid" });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: "Booking is already fully paid" });
    }

    const remainingAmount = booking.totalAmount - booking.advancePayment;
    if (remainingAmount <= 0) {
      return res.status(400).json({ message: "No remaining amount to pay" });
    }

    await Transaction.create({
      type: 'income',
      entryType: 'IN',
      category: 'booking',
      amount: remainingAmount,
      description: `Final payment for court ${booking.court} booking by ${booking.name} on ${booking.date.toISOString().split('T')[0]} at ${booking.startTime}`,
      paymentMethod: paymentMethod,
      reference: booking._id,
      referenceModel: 'Booking',
      recordedBy: req.user.id,
    });

    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod;
    await booking.save();

    await saveLogToDB('info', `Booking ${req.params.id} marked as paid`, req.method, req.originalUrl, 200, req.user.id);
    res.status(200).json(booking);
  } catch (error) {
    await saveLogToDB('error', `Error marking booking as paid: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const updateBooking = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Updating booking ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);
    if (!req.user || !req.user.id) {
      await saveLogToDB('warn', 'Unauthorized booking update attempt', req.method, req.originalUrl, 401, null);
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      await saveLogToDB('warn', `Booking not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user.id);
      res.status(404);
      throw new Error("Booking not found");
    }
    if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
      await saveLogToDB('warn', 'Unauthorized booking update attempt', req.method, req.originalUrl, 403, req.user.id);
      res.status(403);
      throw new Error("User not authorized to update this booking");
    }
    const { court, date, startTime, duration, paymentMethod, status } = req.body;
    const updateData = {};
    if (court !== undefined && (typeof court === "number" && court >= 1 && court <= 5)) updateData.court = court;
    if (date) updateData.date = new Date(date);
    if (startTime) updateData.startTime = startTime;
    if (duration !== undefined && (typeof duration === "number" && duration >= 1 && duration <= 24)) updateData.duration = duration;
    if (paymentMethod && ['Cash', 'UPI', 'Card', 'Member', 'other'].includes(paymentMethod)) updateData.paymentMethod = paymentMethod;
    if (status && ['confirmed', 'cancelled'].includes(status)) updateData.status = status;
    if (Object.keys(updateData).length === 0) {
      await saveLogToDB('warn', 'No valid fields to update', req.method, req.originalUrl, 400, req.user.id);
      return res.status(400).json({ message: "No valid fields provided for update" });
    }
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    await saveLogToDB('info', `Booking updated successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user.id);
    res.status(200).json(updatedBooking);
  } catch (error) {
    await saveLogToDB('error', `Booking update error: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const deleteBooking = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Deleting booking ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);
    if (!req.user || !req.user.id) {
      await saveLogToDB('warn', 'Unauthorized booking deletion attempt', req.method, req.originalUrl, 401, null);
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      await saveLogToDB('warn', `Booking not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user.id);
      res.status(404);
      throw new Error("Booking not found");
    }
    if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
      await saveLogToDB('warn', 'Unauthorized booking deletion attempt', req.method, req.originalUrl, 403, req.user.id);
      res.status(403);
      throw new Error("User not authorized to delete this booking");
    }
    if (booking.bookingType === 'member') {
      const member = await Member.findOne({ _id: { $in: booking.players } });
      if (member) {
        member.hoursRemaining += booking.duration;
        member.hoursUsed -= booking.duration;
        await member.save();
        await saveLogToDB('info', `Returned ${booking.duration} hours to member account`, req.method, req.originalUrl, null, req.user.id);
      }
    }
    await booking.deleteOne();
    await saveLogToDB('info', `Booking deleted successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user.id);
    res.status(200).json({ message: "Booking deleted", id: req.params.id });
  } catch (error) {
    await saveLogToDB('error', `Booking deletion error: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const updateCourtStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      await saveLogToDB('warn', 'Unauthorized court status update attempt', req.method, req.originalUrl, 403, req.user?.id);
      return res.status(403).json({ message: "Not authorized. Only admins and managers can update court status." });
    }

    if (typeof isActive !== 'boolean') {
      await saveLogToDB('warn', 'Invalid court status value', req.method, req.originalUrl, 400, req.user.id);
      return res.status(400).json({ message: "isActive must be a boolean value" });
    }

    let court = await Court.findOne({ number: parseInt(id) });

    if (!court) {
      court = await Court.create({
        number: parseInt(id),
        isActive,
        lastUpdatedBy: req.user.id
      });
    } else {
      court.isActive = isActive;
      court.lastUpdatedBy = req.user.id;
      await court.save();
    }

    await saveLogToDB('info', `Court ${id} status updated to ${isActive ? 'active' : 'inactive'}`, req.method, req.originalUrl, 200, req.user.id);
    res.status(200).json({
      message: `Court ${id} status updated successfully`,
      court: {
        number: court.number,
        isActive: court.isActive
      }
    });
  } catch (error) {
    await saveLogToDB('error', `Error updating court status: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getCourtStatus = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching court statuses', req.method, req.originalUrl, null, req.user?.id);

    const courts = await Court.find().sort({ number: 1 });

    const allCourts = Array.from({ length: 5 }, (_, i) => i + 1).map(number => {
      const existingCourt = courts.find(c => c.number === number);
      return existingCourt || {
        number,
        isActive: true
      };
    });

    await saveLogToDB('info', 'Court statuses retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(allCourts);
  } catch (error) {
    await saveLogToDB('error', `Error fetching court statuses: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getFutureBookings = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching future bookings', req.method, req.originalUrl, null, req.user?.id);

    if (!req.user || !req.user.id) {
      await saveLogToDB('warn', 'Unauthorized future bookings access attempt', req.method, req.originalUrl, 401, null);
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const futureBookings = await Booking.find({
      date: { $gt: today },
      status: { $ne: 'cancelled' },
    })
        .populate("user", "name email")
        .populate({
          path: "players",
          select: "name email user",
          populate: {
            path: "user",
            select: "name email",
          },
        })
        .sort({ date: 1, startTime: 1 });

    await saveLogToDB('info', `Retrieved ${futureBookings.length} future bookings`, req.method, req.originalUrl, 200, req.user.id);
    res.status(200).json(futureBookings);
  } catch (error) {
    await saveLogToDB('error', `Error fetching future bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

module.exports = {
  getBookings,
  getTodayBookingsByTime,
  createBooking,
  updateBooking,
  deleteBooking,
  markBookingAsPaid,
  updateCourtStatus,
  getCourtStatus,
  getFutureBookings,
};