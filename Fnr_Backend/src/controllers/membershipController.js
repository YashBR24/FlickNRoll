const asyncHandler = require('express-async-handler');
const Membership = require('../models/Membership');
const Member = require('../models/Member');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { saveLogToDB } = require('../middleware/logger');

const createMembership = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Creating new membership', req.method, req.originalUrl, null, req.user?.id);

    const { name, description, features, totalHours, durationDays, price } = req.body;

    if (!name || !description || !totalHours || !durationDays || !price) {
      await saveLogToDB('warn', 'Missing required fields for membership creation', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const existingMembership = await Membership.findOne({ name });
    if (existingMembership) {
      return res.status(400).json({ message: "Membership with this name already exists" });
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
    res.status(201).json({
      message: 'Membership created successfully',
      membership,
    });
  } catch (error) {
    await saveLogToDB('error', `Error creating membership: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const getMemberships = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching all memberships', req.method, req.originalUrl, null, req.user?.id);
    const memberships = await Membership.find({ isActive: true });
    await saveLogToDB('info', `Retrieved ${memberships.length} memberships`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json(memberships);
  } catch (error) {
    await saveLogToDB('error', `Error fetching memberships: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const updateMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedMembership = await Membership.findByIdAndUpdate(id, req.body, { new: true });
  if (!updatedMembership) return res.status(404).json({ message: 'Membership not found' });
  res.status(200).json(updatedMembership);
});
// Add to exports and routes: router.put('/:id', protect, updateMembership);
const getMembershipHistory = asyncHandler(async (req, res) => {
  try {
    const { memberId } = req.params;
    await saveLogToDB('info', `Fetching membership history for member: ${memberId}`, req.method, req.originalUrl, null, req.user?.id);

    // Validate memberId format
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      await saveLogToDB('error', 'Invalid member ID format', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'Invalid member ID format' });
    }

    // Fetch member with fully populated renewalHistory
    const member = await Member.findById(memberId)
      .populate({
        path: 'renewalHistory.previousPlan',  
        select: 'membership price durationDays'  
      })
      .populate({
        path: 'renewalHistory.newPlan',  
        select: 'membership price durationDays' 
      });

    if (!member) {
      await saveLogToDB('error', 'Member not found', req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: 'Member not found' });
    }

    await saveLogToDB('info', 'Membership history retrieved successfully', req.method, req.originalUrl, 200, req.user?.id);

    res.status(200).json(member.renewalHistory);
  } catch (error) {
    await saveLogToDB('error', `Error fetching membership history: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const deleteMembership = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await saveLogToDB('info', `Attempting to delete membership with ID: ${id}`, req.method, req.originalUrl, null, req.user?.id);

    // Validate membership ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await saveLogToDB('error', 'Invalid membership ID format', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'Invalid membership ID format' });
    }

    // Check if membership exists
    const membership = await Membership.findById(id);
    if (!membership) {
      await saveLogToDB('warn', `Membership not found for ID: ${id}`, req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: 'Membership not found' });
    }

    // Check if any members are currently using this membership
    const activeMembers = await Member.find({ currentMembership: id });
    if (activeMembers.length > 0) {
      await saveLogToDB('warn', `Cannot delete membership ${membership.name} - used by ${activeMembers.length} members`, req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({
        message: `Cannot delete membership '${membership.name}' as it is currently assigned to ${activeMembers.length} member(s)`
      });
    }

    // Soft delete by setting isActive to false (assuming your model supports this)
    // Alternatively, use .deleteOne() for hard delete
    const deletedMembership = await Membership.findByIdAndUpdate(
        id,
        { isActive: false, deletedAt: new Date() },
        { new: true }
    );

    await saveLogToDB('info', `Membership deleted successfully: ${membership.name}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      message: `Membership '${membership.name}' deleted successfully`,
      membership: deletedMembership
    });
  } catch (error) {
    await saveLogToDB('error', `Error deleting membership: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

module.exports = {
  createMembership,
  getMemberships,
  updateMembership,
  getMembershipHistory,
  deleteMembership
};