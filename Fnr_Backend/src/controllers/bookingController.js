const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const CourtMaintenance = require('../models/Court');
const Court = require('../models/Court');
const { normalizeTime, doTimesOverlap, getTimeRange } = require('../middleware/timeUtils');
const { log } = require('../middleware/logger'); // Updated import

const getBookings = asyncHandler(async (req, res) => {
  try {
    log('FETCHING_BOOKINGS');

    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_BOOKING_ACCESS_ATTEMPT');
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

    log(`RETRIEVED_BOOKINGS_${bookings.length}`);
    res.status(200).json({
      bookings,
      pagination: {
        total: totalBookings,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      },
    });
  } catch (error) {
    log(`ERROR_FETCHING_BOOKINGS_${error.message}`);
    throw error;
  }
});

const getTodayBookingsByTime = asyncHandler(async (req, res) => {
  try {
    log('FETCHING_TODAY_BOOKINGS');

    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_ACCESS_ATTEMPT');
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
      let playerName = booking.name;

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

    log(`RETRIEVED_TODAY_BOOKINGS_${formattedBookings.length}`);
    res.status(200).json(formattedBookings);
  } catch (error) {
    log(`ERROR_FETCHING_TODAY_BOOKINGS_${error.message}`);
    throw error;
  }
});

const createBooking = asyncHandler(async (req, res) => {
  try {
    log('CREATING_NEW_BOOKING');

    const { court } = req.body;

    const courtStatus = await Court.findOne({ number: court });
    if (courtStatus && !courtStatus.isActive) {
      log(`BOOKING_ATTEMPT_INACTIVE_COURT_${court}`);
      return res.status(400).json({
        message: `Court ${court} is currently inactive. Please select another court.`,
      });
    }

    const maintenance = await CourtMaintenance.findOne({
      court,
      status: 'maintenance',
    });

    if (maintenance) {
      log(`BOOKING_ATTEMPT_MAINTENANCE_COURT_${court}`);
      return res.status(400).json({
        message: `Court ${court} is currently under maintenance until ${maintenance.expectedEndDate.toLocaleDateString()}. Please select another court.`,
        maintenanceDetails: maintenance,
      });
    }

    const { date, startTime, duration, paymentMethod, bookingType, players, name, totalAmount, advancePayment } = req.body;

    if (!court || !date || !startTime || !duration || !bookingType) {
      log('MISSING_BASE_FIELDS_BOOKING');
      return res.status(400).json({ message: "Please provide all required base fields: court, date, startTime, duration, bookingType" });
    }
    if (!['general', 'member'].includes(bookingType)) return res.status(400).json({ message: "Booking type must be 'general' or 'member'" });

    if (typeof court !== "number" || court < 1 || court > 5) {
      log('INVALID_COURT_NUMBER');
      return res.status(400).json({ message: "Court number must be between 1 and 5" });
    }
    if (typeof duration !== "number" || duration < 1 || duration > 24) {
      log('INVALID_DURATION');
      return res.status(400).json({ message: "Duration must be between 1 and 24 hours" });
    }

    const normalizedStartTime = normalizeTime(startTime);
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate.toDateString() === today.toDateString()) {
      const now = new Date();
      const [hours, minutes] = normalizedStartTime.split(':').map(Number);
      const bookingStart = new Date(bookingDate);
      bookingStart.setHours(hours, minutes, 0, 0);

      if (bookingStart < now) {
        log(`INVALID_START_TIME_PAST_${startTime}`);
        return res.status(400).json({
          message: `Please select a valid start time. ${startTime} is in the past. Current time is ${now.toLocaleTimeString()}.`,
        });
      }
    }

    const existingBookings = await Booking.find({ court, date, status: { $ne: 'cancelled' } });
    for (const booking of existingBookings) {
      if (doTimesOverlap(normalizedStartTime, duration, booking.startTime, booking.duration)) {
        const timeRange = getTimeRange(booking.startTime, booking.duration);
        log(`COURT_ALREADY_BOOKED_${court}_${timeRange}`);
        return res.status(400).json({
          message: `Court ${court} is already booked from ${timeRange}`,
          existingBooking: { startTime: booking.startTime, duration: booking.duration, timeRange },
        });
      }
    }

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
      if (!paymentMethod || !['Cash', 'UPI', 'Card', 'other'].includes(paymentMethod)) return res.status(400).json({ message: "Valid payment method (Cash, UPI, Card, other) is required for general booking" });

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
          description: `ADVANCE_PAYMENT_FOR_${court}`,
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
      log(`DEDUCTED_HOURS_${duration}_FROM_MEMBER_${member.email}`);
    }

    const booking = await Booking.create(bookingData);

    if (bookingType === 'general' && advancePayment > 0) {
      await Transaction.updateOne(
          { reference: bookingData._id, description: `ADVANCE_PAYMENT_FOR_${court}` },
          { reference: booking._id }
      );
    }

    log(`BOOKING_CREATED_COURT_${court}_${date}`);
    res.status(201).json(booking);
  } catch (error) {
    log(`ERROR_CREATING_BOOKING_${error.message}`);
    throw error;
  }
});

const markBookingAsPaid = asyncHandler(async (req, res) => {
  try {
    log(`MARKING_BOOKING_AS_PAID_${req.params.id}`);

    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_MARK_AS_PAID_ATTEMPT');
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    const { paymentMethod } = req.body;
    if (!paymentMethod || !['Cash', 'UPI', 'Card', 'other'].includes(paymentMethod)) {
      return res.status(400).json({ message: "Valid payment method (Cash, UPI, Card, other) is required" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      log(`BOOKING_NOT_FOUND_${req.params.id}`);
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
      log('UNAUTHORIZED_MARK_AS_PAID_ATTEMPT');
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
      description: `FINAL_PAYMENT_FOR_COURT_${booking.court}`,
      paymentMethod: paymentMethod,
      reference: booking._id,
      referenceModel: 'Booking',
      recordedBy: req.user.id,
    });

    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod;
    await booking.save();

    log(`BOOKING_MARKED_AS_PAID_${req.params.id}`);
    res.status(200).json(booking);
  } catch (error) {
    log(`ERROR_MARKING_BOOKING_AS_PAID_${error.message}`);
    throw error;
  }
});

const updateBooking = asyncHandler(async (req, res) => {
  try {
    log(`UPDATING_BOOKING_${req.params.id}`);

    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_BOOKING_UPDATE_ATTEMPT');
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      log(`BOOKING_NOT_FOUND_${req.params.id}`);
      res.status(404);
      throw new Error("Booking not found");
    }
    if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
      log('UNAUTHORIZED_BOOKING_UPDATE_ATTEMPT');
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
      log('NO_VALID_FIELDS_TO_UPDATE');
      return res.status(400).json({ message: "No valid fields provided for update" });
    }
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    log(`BOOKING_UPDATED_${req.params.id}`);
    res.status(200).json(updatedBooking);
  } catch (error) {
    log(`ERROR_UPDATING_BOOKING_${error.message}`);
    throw error;
  }
});

const deleteBooking = asyncHandler(async (req, res) => {
  try {
    log(`DELETING_BOOKING_${req.params.id}`);

    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_BOOKING_DELETION_ATTEMPT');
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      log(`BOOKING_NOT_FOUND_${req.params.id}`);
      res.status(404);
      throw new Error("Booking not found");
    }
    if (booking.user.toString() !== req.user.id.toString() && !['admin', 'manager'].includes(req.user.role)) {
      log('UNAUTHORIZED_BOOKING_DELETION_ATTEMPT');
      res.status(403);
      throw new Error("User not authorized to delete this booking");
    }
    if (booking.bookingType === 'member') {
      const member = await Member.findOne({ _id: { $in: booking.players } });
      if (member) {
        member.hoursRemaining += booking.duration;
        member.hoursUsed -= booking.duration;
        await member.save();
        log(`RETURNED_HOURS_${booking.duration}_TO_MEMBER`);
      }
    }
    await booking.deleteOne();
    log(`BOOKING_DELETED_${req.params.id}`);
    res.status(200).json({ message: "Booking deleted", id: req.params.id });
  } catch (error) {
    log(`ERROR_DELETING_BOOKING_${error.message}`);
    throw error;
  }
});

const updateCourtStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      log('UNAUTHORIZED_COURT_STATUS_UPDATE_ATTEMPT');
      return res.status(403).json({ message: "Not authorized. Only admins and managers can update court status." });
    }

    if (typeof isActive !== 'boolean') {
      log('INVALID_COURT_STATUS_VALUE');
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

    log(`COURT_${id}_STATUS_UPDATED_${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    res.status(200).json({
      message: `Court ${id} status updated successfully`,
      court: {
        number: court.number,
        isActive: court.isActive
      }
    });
  } catch (error) {
    log(`ERROR_UPDATING_COURT_STATUS_${error.message}`);
    throw error;
  }
});

const getCourtStatus = asyncHandler(async (req, res) => {
  try {
    log('FETCHING_COURT_STATUSES');

    const courts = await Court.find().sort({ number: 1 });

    const allCourts = Array.from({ length: 5 }, (_, i) => i + 1).map(number => {
      const existingCourt = courts.find(c => c.number === number);
      return existingCourt || {
        number,
        isActive: true
      };
    });

    log('COURT_STATUSES_RETRIEVED');
    res.status(200).json(allCourts);
  } catch (error) {
    log(`ERROR_FETCHING_COURT_STATUSES_${error.message}`);
    throw error;
  }
});

const getFutureBookings = asyncHandler(async (req, res) => {
  try {
    log('FETCHING_FUTURE_BOOKINGS');

    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_FUTURE_BOOKINGS_ACCESS_ATTEMPT');
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

    log(`RETRIEVED_FUTURE_BOOKINGS_${futureBookings.length}`);
    res.status(200).json(futureBookings);
  } catch (error) {
    log(`ERROR_FETCHING_FUTURE_BOOKINGS_${error.message}`);
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