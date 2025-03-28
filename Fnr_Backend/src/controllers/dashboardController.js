const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Member = require('../models/Member');
const User = require('../models/User');
const Court = require('../models/Court'); // Import the Court model
const { saveLogToDB } = require('../middleware/logger');

const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching dashboard statistics', req.method, req.originalUrl, null, req.user?.id);

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const totalCourts = 5;

    // Fetch court statuses
    const courts = await Court.find().sort({ number: 1 });
    const allCourts = Array.from({ length: totalCourts }, (_, i) => i + 1).map(number => {
      const existingCourt = courts.find(c => c.number === number);
      return existingCourt || { number, isActive: true };
    });

    // Get active bookings
    const activeBookings = await Booking.find({
      date: now.toISOString().split("T")[0],
      status: "confirmed"
    });

    const activeCourts = new Set();
    activeBookings.forEach((booking) => {
      const [hours, minutes] = booking.startTime.split(":").map(Number);
      const bookingStart = hours * 60 + minutes;
      const bookingEnd = bookingStart + booking.duration * 60;

      // Check if the court is active (not under maintenance)
      const court = allCourts.find(c => c.number === booking.court);
      if (court && court.isActive && currentTime >= bookingStart && currentTime < bookingEnd) {
        activeCourts.add(booking.court);
      }
    });

    // Count total available courts (not under maintenance)
    const availableCourts = allCourts.filter(court => court.isActive).length;

    const activeMembers = await Member.countDocuments({ membershipStatus: "active" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalRevenue: { $sum: { $multiply: ["$duration", 500] } } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const stats = {
      activeCourts: `${activeCourts.size}/${availableCourts}`, // Update to use availableCourts
      members: activeMembers,
      revenue: totalRevenue
    };

    await saveLogToDB('info', 'Dashboard statistics retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(stats);
  } catch (error) {
    await saveLogToDB('error', `Error fetching dashboard stats: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

module.exports = {
  getDashboardStats
};