const asyncHandler = require('express-async-handler');
const Member = require('../models/Member');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Membership = require('../models/Membership');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { saveLogToDB } = require('../middleware/logger');

const getUpcomingBookings = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching upcoming bookings', req.method, req.originalUrl, null, req.user?.id);

    const bookings = await Booking.find({
      user: req.user.id,
      date: { $gte: new Date() },
      status: { $ne: 'cancelled' }
    })
        .sort({ date: 1, startTime: 1 })
        .populate('players', 'name')
        .select('court date startTime duration status');

    await saveLogToDB('info', `Retrieved ${bookings.length} upcoming bookings`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(bookings);
  } catch (error) {
    await saveLogToDB('error', `Error fetching upcoming bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getTodayBookings = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching today\'s bookings', req.method, req.originalUrl, null, req.user?.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $ne: 'cancelled' }
    })
        .sort({ startTime: 1 })
        .populate('players', 'name')
        .select('court date startTime duration status');

    await saveLogToDB('info', `Retrieved ${bookings.length} bookings for today`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(bookings);
  } catch (error) {
    await saveLogToDB('error', `Error fetching today's bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getAvailableCourts = asyncHandler(async (req, res) => {
  try {
    const { date, startTime, duration = 1 } = req.query;
    await saveLogToDB('info', `Checking court availability for date: ${date}, time: ${startTime}`, req.method, req.originalUrl, null, req.user?.id);

    if (!date || !startTime) {
      await saveLogToDB('warn', 'Missing date or start time for court availability check', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Please provide date and start time');
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = startTimeInMinutes + duration * 60;

    const existingBookings = await Booking.find({
      date: new Date(date),
      status: { $ne: 'cancelled' }
    }).select('court startTime duration');

    const bookedCourts = new Set();
    existingBookings.forEach((booking) => {
      const [bookedHour, bookedMin] = booking.startTime.split(':').map(Number);
      const bookedStart = bookedHour * 60 + bookedMin;
      const bookedEnd = bookedStart + booking.duration * 60;

      if (!(endTimeInMinutes <= bookedStart || startTimeInMinutes >= bookedEnd)) {
        bookedCourts.add(booking.court);
      }
    });

    const totalCourts = 5;
    const availableCourts = Array.from({ length: totalCourts }, (_, i) => i + 1)
        .filter(courtNumber => !bookedCourts.has(courtNumber));

    await saveLogToDB('info', `Found ${availableCourts.length} available courts`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      date,
      startTime,
      duration,
      availableCourts,
      totalCourts,
      bookedCourts: Array.from(bookedCourts)
    });
  } catch (error) {
    await saveLogToDB('error', `Error checking court availability: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const createBooking = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Creating new booking', req.method, req.originalUrl, null, req.user?.id);

    const { court, date, startTime, duration, players } = req.body;

    if (!court || !date || !startTime || !duration) {
      await saveLogToDB('warn', 'Missing required fields for booking', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if the user is a member
    const member = await Member.findOne({ user: req.user.id });
    let isMembershipBooking = false;
    let price = duration * 500; // Default price for non-members

    if (member && member.membershipStatus === 'active') {
      if (member.hoursRemaining >= duration) {
        isMembershipBooking = true;
        price = 0;
        await member.deductHours(duration);
      } else {
        await saveLogToDB('warn', 'Insufficient hours for booking', req.method, req.originalUrl, 400, req.user?.id);
        return res.status(400).json({
          message: `Insufficient hours remaining. You have ${member.hoursRemaining} hours left`,
          hoursRemaining: member.hoursRemaining
        });
      }
    }

    const booking = await Booking.create({
      user: req.user.id,
      court,
      date,
      startTime,
      duration,
      price,
      isMembershipBooking,
      players: players || [],
      status: "confirmed"
    });

    if (!isMembershipBooking) {
      await Transaction.create({
        type: "income",
        entryType: "IN",
        category: "booking",
        amount: price,
        description: `Court ${court} booking for ${date} at ${startTime}`,
        paymentMethod: "Card", // Default payment method
        reference: booking._id,
        referenceModel: "Booking",
        recordedBy: req.user.id
      });
    }

    await saveLogToDB('info', `Booking created successfully: Court ${court} for ${date}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(booking);
  } catch (error) {
    await saveLogToDB('error', `Error creating booking: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getMemberProfile = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching member profile', req.method, req.originalUrl, null, req.user?.id);

    const member = await Member.findOne({ user: req.user.id })
        .populate('user', 'name email')
        .populate('membership', 'name description features totalHours durationDays price');

    if (!member) {
      await saveLogToDB('info', 'No member profile found', req.method, req.originalUrl, 200, req.user?.id);
      return res.status(200).json({
        message: "No member profile found",
        isRegistered: false
      });
    }

    // Get booking statistics
    const [totalBookings, recentBookings] = await Promise.all([
      Booking.countDocuments({ user: req.user.id, status: 'confirmed' }),
      Booking.countDocuments({
        user: req.user.id,
        status: 'confirmed',
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const response = {
      isRegistered: true,
      member,
      stats: {
        totalBookings,
        recentBookings,
        averageBookingsPerMonth: (recentBookings / 1).toFixed(1), // Last 30 days
        hoursRemaining: member.hoursRemaining,
        hoursUsed: member.hoursUsed,
        membershipStatus: member.membershipStatus,
        daysUntilExpiry: Math.ceil((new Date(member.membershipEndDate) - new Date()) / (1000 * 60 * 60 * 24))
      }
    };

    await saveLogToDB('info', 'Member profile retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(response);
  } catch (error) {
    await saveLogToDB('error', `Error fetching member profile: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const upgradeToMember = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Upgrading user to member', req.method, req.originalUrl, null, req.user?.id);

    const { email, membership, phone, address, emergencyContact, paymentMethod } = req.body;

    if (!email || !membership || !phone || !paymentMethod) {
      await saveLogToDB('warn', 'Missing required fields for member upgrade', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await saveLogToDB('warn', `User not found: ${email}`, req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: "User not found with this email" });
    }

    const existingMember = await Member.findOne({ user: user._id });
    if (existingMember) {
      await saveLogToDB('warn', `User already has a membership: ${email}`, req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: "User already has a membership" });
    }

    const membershipDetails = await Membership.findById(membership);
    if (!membershipDetails) {
      await saveLogToDB('warn', 'Membership plan not found', req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: "Membership not found" });
    }

    const membershipStartDate = new Date();
    const membershipEndDate = new Date();
    membershipEndDate.setDate(membershipStartDate.getDate() + membershipDetails.durationDays);

    const newMember = await Member.create({
      user: user._id,
      membership,
      phone,
      address,
      emergencyContact,
      hoursRemaining: membershipDetails.totalHours,
      membershipStartDate,
      membershipEndDate,
      membershipStatus: "active"
    });

    // Create transaction record for membership purchase
    await Transaction.create({
      type: 'income',
      entryType: 'IN',
      category: 'membership',
      amount: membershipDetails.price,
      description: `New membership purchase - ${membershipDetails.name}`,
      paymentMethod,
      reference: newMember._id,
      referenceModel: 'Member',
      recordedBy: req.user?.id || user._id,
      date: new Date()
    });

    await saveLogToDB('info', `Member created successfully: ${email}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json({
      message: "Member created successfully",
      member: await newMember.populate(['user', 'membership'])
    });
  } catch (error) {
    await saveLogToDB('error', `Error creating member: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

module.exports = {
  getUpcomingBookings,
  getTodayBookings,
  getAvailableCourts,
  createBooking,
  getMemberProfile,
  upgradeToMember
};