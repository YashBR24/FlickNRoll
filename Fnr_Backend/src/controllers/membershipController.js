const asyncHandler = require('express-async-handler');
const Membership = require('../models/Membership');
const Member = require('../models/Member');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { log } = require('../middleware/logger'); // Updated import

const createMembership = asyncHandler(async (req, res) => {
  try {
    log('CREATING_NEW_MEMBERSHIP');

    const { name, description, features, totalHours, durationDays, price } = req.body;

    if (!name || !description || !totalHours || !durationDays || !price) {
      log('MISSING_REQUIRED_FIELDS_MEMBERSHIP_CREATION');
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const existingMembership = await Membership.findOne({ name });
    if (existingMembership) {
      log(`MEMBERSHIP_ALREADY_EXISTS_${name}`);
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

    log(`MEMBERSHIP_CREATED_${name}`);
    res.status(201).json({
      message: 'Membership created successfully',
      membership,
    });
  } catch (error) {
    log(`ERROR_CREATING_MEMBERSHIP_${error.message}`);
    throw error;
  }
});

const getMemberships = asyncHandler(async (req, res) => {
  try {
    log('FETCHING_ALL_MEMBERSHIPS');
    const memberships = await Membership.find({ isActive: true });
    log(`RETRIEVED_MEMBERSHIPS_${memberships.length}`);
    res.status(200).json(memberships);
  } catch (error) {
    log(`ERROR_FETCHING_MEMBERSHIPS_${error.message}`);
    throw error;
  }
});

const updateMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedMembership = await Membership.findByIdAndUpdate(id, req.body, { new: true });
  if (!updatedMembership) {
    log(`MEMBERSHIP_NOT_FOUND_${id}`);
    return res.status(404).json({ message: 'Membership not found' });
  }
  log(`MEMBERSHIP_UPDATED_${id}`);
  res.status(200).json(updatedMembership);
});

const getMembershipHistory = asyncHandler(async (req, res) => {
  try {
    const { memberId } = req.params;
    log(`FETCHING_MEMBERSHIP_HISTORY_${memberId}`);

    // Validate memberId format
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      log(`INVALID_MEMBER_ID_${memberId}`);
      return res.status(400).json({ message: 'Invalid member ID format' });
    }

    // Fetch member with fully populated renewalHistory
    const member = await Member.findById(memberId)
        .populate({
          path: 'renewalHistory.previousPlan',
          select: 'membership price durationDays',
        })
        .populate({
          path: 'renewalHistory.newPlan',
          select: 'membership price durationDays',
        });

    if (!member) {
      log(`MEMBER_NOT_FOUND_${memberId}`);
      return res.status(404).json({ message: 'Member not found' });
    }

    log(`MEMBERSHIP_HISTORY_RETRIEVED_${memberId}`);
    res.status(200).json(member.renewalHistory);
  } catch (error) {
    log(`ERROR_FETCHING_MEMBERSHIP_HISTORY_${error.message}`);
    throw error;
  }
});

const deleteMembership = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    log(`ATTEMPTING_DELETE_MEMBERSHIP_${id}`);

    // Validate membership ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      log(`INVALID_MEMBERSHIP_ID_${id}`);
      return res.status(400).json({ message: 'Invalid membership ID format' });
    }

    // Check if membership exists
    const membership = await Membership.findById(id);
    if (!membership) {
      log(`MEMBERSHIP_NOT_FOUND_${id}`);
      return res.status(404).json({ message: 'Membership not found' });
    }

    // Check if any members are currently using this membership
    const activeMembers = await Member.find({ currentMembership: id });
    if (activeMembers.length > 0) {
      log(`CANNOT_DELETE_MEMBERSHIP_${membership.name}_USED_BY_${activeMembers.length}_MEMBERS`);
      return res.status(400).json({
        message: `Cannot delete membership '${membership.name}' as it is currently assigned to ${activeMembers.length} member(s)`,
      });
    }

    // Soft delete by setting isActive to false (assuming your model supports this)
    const deletedMembership = await Membership.findByIdAndUpdate(
        id,
        { isActive: false, deletedAt: new Date() },
        { new: true }
    );

    log(`MEMBERSHIP_DELETED_${membership.name}`);
    res.status(200).json({
      message: `Membership '${membership.name}' deleted successfully`,
      membership: deletedMembership,
    });
  } catch (error) {
    log(`ERROR_DELETING_MEMBERSHIP_${error.message}`);
    throw error;
  }
});

module.exports = {
  createMembership,
  getMemberships,
  updateMembership,
  getMembershipHistory,
  deleteMembership,
};