const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Member = require('../models/Member');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const Membership = require('../models/Membership');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { saveLogToDB } = require('../middleware/logger');

// ==================== Dashboard Functions ====================

const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching dashboard stats', req.method, req.originalUrl, null, req.user?.id);

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [courts, membershipStats, bookingStats, revenueStats] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            date: { $gte: todayStart, $lte: next24Hours },
          }
        },
        {
          $group: {
            _id: '$court',
            bookings: { $push: '$$ROOT' }
          }
        }
      ]),
      Member.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [
              { $match: { membershipStatus: 'active' } },
              { $count: 'count' }
            ],
            expiringSoon: [
              {
                $match: {
                  membershipStatus: 'active',
                  membershipEndDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: { date: { $gte: todayStart, $lte: todayEnd } }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: {
            date: { $gte: todayStart, $lte: todayEnd },
            status: 'confirmed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $multiply: ["$duration", 500] } }
          }
        }
      ])
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    const response = {
      courts: courts.length > 0 ? courts : "No bookings for today",
      membershipStats: membershipStats[0] || { total: 0, active: 0, expiringSoon: 0 },
      bookingStats: bookingStats.length > 0 ? bookingStats : "No bookings today",
      totalRevenue
    };

    await saveLogToDB('info', 'Dashboard stats retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(response);
  } catch (error) {
    await saveLogToDB('error', `Error fetching dashboard stats: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

// ==================== Booking Functions ====================

const getBookings = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching all bookings', req.method, req.originalUrl, null, req.user?.id);

    const bookings = await Booking.find()
        .populate('user', 'name email')
        .populate('players', 'name')
        .sort({ date: 1, startTime: 1 });

    await saveLogToDB('info', `Retrieved ${bookings.length} bookings`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(bookings);
  } catch (error) {
    await saveLogToDB('error', `Error fetching bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getFutureBookings = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching future bookings', req.method, req.originalUrl, null, req.user?.id);

    const { timeframe = '24h' } = req.query;
    const hours = timeframe === '6h' ? 6 : timeframe === '12h' ? 12 : 24;

    const bookings = await Booking.find({
      date: {
        $gte: new Date(),
        $lte: new Date(Date.now() + hours * 60 * 60 * 1000)
      }
    })
        .populate('user', 'name email')
        .sort({ date: 1, startTime: 1 });

    await saveLogToDB('info', `Retrieved ${bookings.length} future bookings`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(bookings);
  } catch (error) {
    await saveLogToDB('error', `Error fetching future bookings: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const createBooking = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Creating new booking', req.method, req.originalUrl, null, req.user?.id);

    const { court, date, startTime, duration, players, paymentMethod, price } = req.body;

    if (!court || !date || !startTime || !duration || !paymentMethod || price === undefined) {
      await saveLogToDB('warn', 'Missing required fields for booking', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: "Please provide all required fields, including price" });
    }

    const booking = await Booking.create({
      user: req.user.id,
      court,
      date,
      startTime,
      duration,
      price,
      paymentMethod,
      players: players.map(player => new mongoose.Types.ObjectId(player)),
      status: "confirmed",
    });

    await Transaction.create({
      type: "income",
      entryType: "IN",
      category: "booking",
      amount: price,
      description: `Court ${court} booking for ${date} at ${startTime}`,
      paymentMethod,
      reference: booking._id,
      referenceModel: "Booking",
      recordedBy: req.user.id,
    });

    await saveLogToDB('info', `Booking created successfully: Court ${court} for ${date}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(booking);
  } catch (error) {
    await saveLogToDB('error', `Error creating booking: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const updateBooking = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Updating booking: ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      await saveLogToDB('warn', `Booking not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: "Booking not found" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await saveLogToDB('info', `Booking updated successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(updatedBooking);
  } catch (error) {
    await saveLogToDB('error', `Error updating booking: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const deleteBooking = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Deleting booking: ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      await saveLogToDB('warn', `Booking not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: "Booking not found" });
    }

    await booking.deleteOne();
    await saveLogToDB('info', `Booking deleted successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({ message: "Booking deleted", id: req.params.id });
  } catch (error) {
    await saveLogToDB('error', `Error deleting booking: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

// ==================== Member Functions ====================

const getMembers = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching all members', req.method, req.originalUrl, null, req.user?.id);

    const members = await Member.find()
        .populate('user', 'name email')
        .populate('membershipType', 'name');

    await saveLogToDB('info', `Retrieved ${members.length} members`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(members);
  } catch (error) {
    await saveLogToDB('error', `Error fetching members: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getMemberProfile = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching member profile', req.method, req.originalUrl, null, req.user?.id);

    const member = await Member.findOne({ user: req.params.id })
        .populate('user', 'name email')
        .populate('membershipType', 'name');

    if (!member) {
      await saveLogToDB('warn', 'Member profile not found', req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: "Member profile not found" });
    }

    await saveLogToDB('info', 'Member profile retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(member);
  } catch (error) {
    await saveLogToDB('error', `Error fetching member profile: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const createMember = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Creating new member', req.method, req.originalUrl, null, req.user?.id);

    const { email, membership, phone, address, emergencyContact, paymentMethod } = req.body;

    if (!email || !membership || !phone || !paymentMethod) {
      await saveLogToDB('warn', 'Missing required fields for member creation', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await saveLogToDB('warn', `User not found: ${email}`, req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: "User not found with this email" });
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
      email,
      membership,
      phone,
      address,
      emergencyContact,
      paymentMethod,
      hoursRemaining: membershipDetails.totalHours,
      membershipStartDate,
      membershipEndDate,
      membershipStatus: "active",
    });

    await Transaction.create({
      type: 'income',
      entryType: 'IN',
      category: 'membership',
      amount: membershipDetails.price,
      description: `New membership creation - ${membershipDetails.name}`,
      paymentMethod,
      reference: newMember._id,
      referenceModel: 'Member',
      recordedBy: req.user.id
    });

    await saveLogToDB('info', `Member created successfully: ${email}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(newMember);
  } catch (error) {
    await saveLogToDB('error', `Error creating member: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const updateMember = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Updating member: ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);

    const member = await Member.findById(req.params.id);
    if (!member) {
      await saveLogToDB('warn', `Member not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: "Member not found" });
    }

    const updatedMember = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await saveLogToDB('info', `Member updated successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(updatedMember);
  } catch (error) {
    await saveLogToDB('error', `Error updating member: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const deleteMember = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Deleting member: ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);

    const member = await Member.findById(req.params.id);
    if (!member) {
      await saveLogToDB('warn', `Member not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: "Member not found" });
    }

    await member.deleteOne();
    await saveLogToDB('info', `Member deleted successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({ message: "Member deleted", id: req.params.id });
  } catch (error) {
    await saveLogToDB('error', `Error deleting member: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

// ==================== Inventory Functions ====================

const getInventoryStatus = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching inventory status', req.method, req.originalUrl, null, req.user?.id);

    const inventory = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          items: {
            $push: {
              id: '$_id',
              name: '$item',
              total: '$quantity',
              available: {
                $subtract: ['$quantity', { $ifNull: ['$inUse', 0] }]
              },
              inUse: { $ifNull: ['$inUse', 0] },
              condition: '$condition'
            }
          }
        }
      }
    ]);

    await saveLogToDB('info', 'Inventory status retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(inventory);
  } catch (error) {
    await saveLogToDB('error', `Error fetching inventory status: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const addInventoryItem = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Adding new inventory item', req.method, req.originalUrl, null, req.user?.id);

    const { item, category, quantity, condition, notes, price, paymentMethod } = req.body;

    if (!item || !category || !quantity || !condition || !price || !paymentMethod) {
      await saveLogToDB('warn', 'Missing required fields for inventory item', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const inventoryItem = await Inventory.create({
      item,
      category,
      quantity,
      condition,
      notes,
      price,
      paymentMethod,
      purchaseDate: new Date()
    });

    await Transaction.create({
      type: 'expense',
      entryType: 'OUT',
      category: 'inventory',
      amount: price * quantity,
      description: `Purchase of ${quantity} ${item}(s)`,
      paymentMethod,
      reference: inventoryItem._id,
      referenceModel: 'Inventory',
      recordedBy: req.user.id
    });

    await saveLogToDB('info', `Added new inventory item: ${item}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(inventoryItem);
  } catch (error) {
    await saveLogToDB('error', `Error adding inventory item: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const updateInventoryItem = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await saveLogToDB('info', `Updating inventory item: ${id}`, req.method, req.originalUrl, null, req.user?.id);

    const item = await Inventory.findById(id);
    if (!item) {
      await saveLogToDB('warn', `Inventory item not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
      res.status(404);
      throw new Error('Inventory item not found');
    }

    const updatedItem = await Inventory.findByIdAndUpdate(id, req.body, { new: true });

    await saveLogToDB('info', `Updated inventory item: ${id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(updatedItem);
  } catch (error) {
    await saveLogToDB('error', `Error updating inventory item: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const deleteInventoryItem = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await saveLogToDB('info', `Deleting inventory item: ${id}`, req.method, req.originalUrl, null, req.user?.id);

    const item = await Inventory.findById(id);
    if (!item) {
      await saveLogToDB('warn', `Inventory item not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
      res.status(404);
      throw new Error('Inventory item not found');
    }

    await item.deleteOne();

    await saveLogToDB('info', `Deleted inventory item: ${id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({ id });
  } catch (error) {
    await saveLogToDB('error', `Error deleting inventory item: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

// in-use items
const markItemsInUse = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    await saveLogToDB('info', `Marking items as in-use: ${id}`, req.method, req.originalUrl, null, req.user?.id);

    if (!quantity || quantity <= 0) {
      await saveLogToDB('warn', 'Invalid quantity specified', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Please provide a valid quantity');
    }

    const item = await Inventory.findById(id);
    if (!item) {
      await saveLogToDB('warn', `Inventory item not found: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
      res.status(404);
      throw new Error('Inventory item not found');
    }

    if (item.available < quantity) {
      await saveLogToDB('warn', 'Insufficient available quantity', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error(`Only ${item.available} items available`);
    }

    item.inUse += quantity;
    await item.save();

    await saveLogToDB('info', `Marked ${quantity} items as in-use`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(item);
  } catch (error) {
    await saveLogToDB('error', `Error marking items as in-use: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

// ==================== Court Management Functions ====================

const updateCourtStatus = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Updating court status for court ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);

    const { status, isActive } = req.body;

    await saveLogToDB('info', `Court status updated successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      message: 'Court status updated successfully',
      court: { id: req.params.id, status, isActive }
    });
  } catch (error) {
    await saveLogToDB('error', `Error updating court status: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

// ==================== Membership Functions ====================

const createMembership = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Creating new membership', req.method, req.originalUrl, null, req.user?.id);

    const { name, description, features, totalHours, durationDays, price } = req.body;

    if (!name || !description || !totalHours || !durationDays || !price) {
      await saveLogToDB('warn', 'Missing required fields for membership creation', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const membership = await Membership.create({
      name,
      description,
      features,
      totalHours,
      durationDays,
      price,
      createdBy: req.user.id,
    });

    await saveLogToDB('info', `Membership created successfully: ${name}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(membership);
  } catch (error) {
    await saveLogToDB('error', `Error creating membership: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getExpiringMemberships = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching expiring memberships', req.method, req.originalUrl, null, req.user?.id);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringMembers = await Member.find({
      membershipEndDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      },
      membershipStatus: 'active'
    })
        .populate('user', 'name email')
        .populate('membershipType', 'name')
        .populate('membershipPlan');

    await saveLogToDB('info', `Retrieved ${expiringMembers.length} expiring memberships`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(expiringMembers);
  } catch (error) {
    await saveLogToDB('error', `Error fetching expiring memberships: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getMemberRenewalHistory = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Fetching renewal history for member: ${req.params.memberId}`, req.method, req.originalUrl, null, req.user?.id);

    const member = await Member.findById(req.params.memberId)
        .populate({
          path: 'renewalHistory',
          populate: {
            path: 'previousPlan newPlan',
            select: 'name price durationDays'
          }
        });

    if (!member) {
      await saveLogToDB('error', 'Member not found', req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: 'Member not found' });
    }

    await saveLogToDB('info', 'Member renewal history retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(member.renewalHistory);
  } catch (error) {
    await saveLogToDB('error', `Error fetching member renewal history: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const renewMembership = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Renewing membership for member: ${req.params.memberId}`, req.method, req.originalUrl, null, req.user?.id);

    const member = await Member.findById(req.params.memberId);
    if (!member) {
      await saveLogToDB('error', 'Member not found', req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: 'Member not found' });
    }

    const { newPlanId, paymentMethod } = req.body;
    await member.renew(newPlanId);

    // Create transaction for renewal
    const newPlan = await Membership.findById(newPlanId);
    await Transaction.create({
      type: 'income',
      entryType: 'IN',
      category: 'membership',
      amount: newPlan.price,
      description: `Membership renewal - ${newPlan.name}`,
      paymentMethod,
      reference: member._id,
      referenceModel: 'Member',
      recordedBy: req.user.id
    });

    await saveLogToDB('info', 'Membership renewed successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      message: 'Membership renewed successfully',
      member: await member.populate('membershipType membershipPlan')
    });
  } catch (error) {
    await saveLogToDB('error', `Error renewing membership: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getMembershipStats = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching membership statistics', req.method, req.originalUrl, null, req.user?.id);

    const stats = await Member.aggregate([
      {
        $group: {
          _id: '$membershipType',
          totalMembers: { $sum: 1 },
          activeMembers: {
            $sum: {
              $cond: [{ $eq: ['$membershipStatus', 'active'] }, 1, 0]
            }
          },
          expiredMembers: {
            $sum: {
              $cond: [{ $eq: ['$membershipStatus', 'expired'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'membershiptypes',
          localField: '_id',
          foreignField: '_id',
          as: 'typeInfo'
        }
      },
      {
        $unwind: '$typeInfo'
      }
    ]);

    await saveLogToDB('info', 'Membership statistics retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(stats);
  } catch (error) {
    await saveLogToDB('error', `Error fetching membership statistics: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

//  =============  Transactions   =============

const getFinancialOverview = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching financial overview', req.method, req.originalUrl, null, req.user?.id);

    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);

    const [income, expenses, memberBookings] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            type: 'income',
            paymentMethod: { $ne: 'membership' },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            type: 'expense',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: {
            isMembershipBooking: true,
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            hoursUsed: { $sum: '$duration' }
          }
        }
      ])
    ]);

    const response = {
      income,
      expenses,
      memberBookings: memberBookings[0] || { count: 0, hoursUsed: 0 },
      summary: {
        totalIncome: income.reduce((acc, curr) => acc + curr.total, 0),
        totalExpenses: expenses.reduce((acc, curr) => acc + curr.total, 0),
        netProfit: income.reduce((acc, curr) => acc + curr.total, 0) - expenses.reduce((acc, curr) => acc + curr.total, 0)
      }
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

    const {
      startDate,
      endDate,
      type,
      entryType,
      category,
      paymentMethod,
      search,
      page = 1,
      limit = 10
    } = req.query;
    const query = {
      ...getDateFilter(startDate, endDate)
    };

    if (type) query.type = type;
    if (entryType) query.entryType = entryType;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (search) query.description = { $regex: search, $options: 'i' };

    const transactions = await Transaction.find(query)
        .populate('recordedBy', 'name')
        .populate({
          path: 'reference',
          populate: {
            path: 'user',
            select: 'name email',
            strictPopulate: false
          }
        })
        .sort({ date: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    await saveLogToDB('info', 'Transaction history retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    await saveLogToDB('error', `Error fetching transaction history: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const addManualTransaction = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Adding manual transaction', req.method, req.originalUrl, null, req.user?.id);

    const {
      type,
      category,
      amount,
      description,
      paymentMethod,
      date
    } = req.body;

    if (!type || !category || !amount || !description) {
      await saveLogToDB('error', 'Missing required fields for manual transaction', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    if (!['income', 'expense'].includes(type)) {
      await saveLogToDB('error', 'Invalid transaction type', req.method, req.originalUrl, 400, req.user?.id);
      res.status(400);
      throw new Error('Invalid transaction type');
    }

    const transaction = await Transaction.create({
      type,
      entryType: type === 'income' ? 'IN' : 'OUT',
      category,
      amount,
      description,
      paymentMethod: paymentMethod || 'cash',
      date: date || new Date(),
      recordedBy: req.user.id
    });

    await saveLogToDB('info', 'Manual transaction added successfully', req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json(transaction);
  } catch (error) {
    await saveLogToDB('error', `Error adding manual transaction: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});


module.exports = {
  getDashboardStats,

  getBookings,
  getFutureBookings,
  createBooking,
  updateBooking,
  deleteBooking,

  getMembers,
  getMemberProfile,
  createMember,
  updateMember,
  deleteMember,

  getInventoryStatus,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  markItemsInUse,

  updateCourtStatus,

  createMembership,
  getExpiringMemberships,
  getMemberRenewalHistory,
  renewMembership,
  getMembershipStats,

  getFinancialOverview,
  getTransactionHistory,
  addManualTransaction,
};