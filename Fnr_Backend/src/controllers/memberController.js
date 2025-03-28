const asyncHandler = require('express-async-handler');
const Member = require('../models/Member');
const User = require('../models/User');
const Membership = require('../models/Membership');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { saveLogToDB } = require('../middleware/logger');
const crypto = require('crypto');
const { sendEmail } = require('../config/emailConfig');
const jwt = require('jsonwebtoken');
const VerificationToken = require('../models/VerificationToken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Get next transaction number with proper error handling
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

const getMembers = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', 'Fetching all members', req.method, req.originalUrl, null, req.user?.id);
    const members = await Member.find()
        .populate('user', 'name email')
        .populate('membership', 'name totalHours')
        .select('hoursRemaining membershipStartDate membershipEndDate email phone address emergencyContact membershipStatus manualStatusOverride');

    // Update status if hours are depleted or expired, but respect manual overrides
    for (const member of members) {
      const isExpired = new Date() > member.membershipEndDate;
      const hasNoHours = member.hoursRemaining <= 0;

      if (!member.manualStatusOverride) { // Only update if not manually overridden
        if ((isExpired || hasNoHours) && member.membershipStatus !== 'inactive') {
          member.membershipStatus = 'inactive';
          await member.save();
        } else if (!isExpired && !hasNoHours && member.membershipStatus !== 'active') {
          member.membershipStatus = 'active';
          await member.save();
        }
      }
    }

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
    if (!req.user || !req.user.id) {
      await saveLogToDB('warn', 'Unauthorized profile access attempt', req.method, req.originalUrl, 401, null);
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    const member = await Member.findOne({ user: req.user.id })
        .populate('user', 'name email')
        .populate('membership', 'name totalHours');
    if (!member) {
      await saveLogToDB('warn', 'Member profile not found', req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({
        message: 'Member profile not found. Please create a profile first.',
        suggestion: 'Use POST /api/members to create a profile.',
      });
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

    const { name, email, membership, phone, address, emergencyContact, paymentMethod } = req.body;

    // Validate required fields
    if (!email || !membership || !phone || !paymentMethod) {
      await saveLogToDB('warn', 'Missing required fields for member creation', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'Please provide all required fields: email, membership, phone, paymentMethod' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    let userName = name;

    if (user) {
      // If user exists, use their name and skip creating a new user
      userName = user.name;
      await saveLogToDB('info', `Linking existing user with email: ${email}`, req.method, req.originalUrl, null, req.user?.id);
    } else {
      // If user doesn’t exist, require name for new user creation
      if (!name || typeof name !== 'string' || name.trim() === '') {
        await saveLogToDB('warn', 'Name required for new user creation', req.method, req.originalUrl, 400, req.user?.id);
        return res.status(400).json({ message: 'Name is required when creating a new user' });
      }

      // Generate a temporary password
      let tempPassword;
      try {
        tempPassword = crypto.randomBytes(20).toString('hex');
        if (!tempPassword || typeof tempPassword !== 'string' || tempPassword.trim() === '') {
          throw new Error('Failed to generate a valid temporary password');
        }
      } catch (error) {
        await saveLogToDB('error', `Error generating temporary password: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
        return res.status(500).json({ message: 'Failed to generate temporary password' });
      }

      // Create new user with verified status
      user = await User.create({
        name: name.trim(),
        email,
        password: tempPassword,
        isVerified: true,
        role: 'user',
      });

      // Generate and save verification token for password setup
      const resetToken = crypto.randomBytes(32).toString('hex');
      await VerificationToken.create({
        email,
        token: resetToken,
        password: tempPassword,
        name: name.trim(),
        role: 'user',
      });

      // Send password setup email
      const resetUrl = `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`;
      const emailContent = `
        <h1>Welcome to Pickleball Club!</h1>
        <p>Hello ${name},</p>
        <p>Your account has been created. Please set your password by clicking the link below:</p>
        <p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Set Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn’t expect this email, please contact our support team.</p>
      `;
      const emailSent = await sendEmail(email, 'Set Your Password', emailContent);

      if (!emailSent) {
        await saveLogToDB('error', `Failed to send password setup email to: ${email}`, req.method, req.originalUrl, 500, req.user?.id);
        console.error('Failed to send password setup email');
      }
    }

    // Check if member already exists for this user
    const existingMember = await Member.findOne({ user: user._id });
    if (existingMember) {
      await saveLogToDB('warn', `Member already exists for user: ${email}`, req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'A membership already exists for this user' });
    }

    const membershipDetails = await Membership.findById(membership);
    if (!membershipDetails) {
      await saveLogToDB('warn', 'Membership plan not found', req.method, req.originalUrl, 404, req.user?.id);
      if (!userName) await User.findByIdAndDelete(user._id); // Cleanup if new user was created
      return res.status(404).json({ message: 'Membership not found' });
    }

    const membershipStartDate = new Date();
    const membershipEndDate = new Date();
    membershipEndDate.setDate(membershipStartDate.getDate() + membershipDetails.durationDays);

    // Create member
    const newMember = await Member.create({
      user: user._id,
      name: userName.trim(),
      email,
      membership,
      phone,
      address,
      emergencyContact,
      paymentMethod,
      hoursRemaining: membershipDetails.totalHours,
      membershipStartDate,
      membershipEndDate,
      membershipStatus: 'active',
    });

    // Create transaction record
    // const transactionNumber = await getNextTransactionNumber();
    await Transaction.create({
      // number: transactionNumber,
      type: 'income',
      entryType: 'IN',
      category: 'membership',
      amount: membershipDetails.price,
      description: `New membership purchase - ${membershipDetails.name}`,
      paymentMethod,
      reference: newMember._id,
      referenceModel: 'Member',
      recordedBy: req.user?.id || user._id,
      date: new Date(),
    });

    await saveLogToDB('info', `Member created successfully for user: ${email}`, req.method, req.originalUrl, 201, req.user?.id);
    res.status(201).json({
      message: userName === name ? 'Member created successfully. Password setup email sent.' : 'Member linked to existing user successfully.',
      member: newMember,
    });
  } catch (error) {
    // Cleanup: Delete the user if created and no member was created
    if (user && user._id && !await Member.findOne({ user: user._id })) {
      await User.findByIdAndDelete(user._id);
    }
    console.error('Error in createMember:', error);
    await saveLogToDB('error', `Error creating member: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    res.status(500).json({ message: error.message });
  }
});

const updateMember = asyncHandler(async (req, res) => {
  try {
    await saveLogToDB('info', `Updating member: ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);

    const member = await Member.findById(req.params.id).populate('user', 'name email');
    if (!member) {
      await saveLogToDB('warn', `Member not found: ${req.params.id}`, req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: 'Member not found' });
    }

    if (!req.user) {
      await saveLogToDB('warn', 'User not found for member update', req.method, req.originalUrl, 401, null);
      return res.status(401).json({ message: 'User not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      await saveLogToDB('warn', 'Unauthorized member update attempt', req.method, req.originalUrl, 401, req.user?.id);
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Prepare update data for Member
    const memberUpdateData = {};
    if (req.body.phone) memberUpdateData.phone = req.body.phone;
    if (req.body.address) memberUpdateData.address = req.body.address;
    if (req.body.emergencyContact) {
      memberUpdateData.emergencyContact = {
        contactName: req.body.emergencyContact.contactName || member.emergencyContact?.contactName,
        contactNumber: req.body.emergencyContact.contactNumber || member.emergencyContact?.contactNumber,
      };
    }
    if (req.body.membershipStatus) {
      memberUpdateData.membershipStatus = req.body.membershipStatus;
      memberUpdateData.manualStatusOverride = true; // Set to true when status is manually updated
    }
    if (req.body.name) memberUpdateData.name = req.body.name.trim(); // Add name to Member update

    // Update the Member document
    const updatedMember = await Member.findByIdAndUpdate(
        req.params.id,
        memberUpdateData,
        { new: true, runValidators: true }
    ).populate('user', 'name email');

    // Update the associated User document if name is provided
    if (req.body.name) {
      const user = await User.findById(member.user._id);
      if (user) {
        user.name = req.body.name.trim();
        await user.save();
        await saveLogToDB('info', `User name updated to: ${user.name} for user: ${user._id}`, req.method, req.originalUrl, null, req.user?.id);
      } else {
        await saveLogToDB('warn', `Associated user not found for member: ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);
      }
    }

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
      return res.status(404).json({ message: 'Member not found' });
    }

    if (!req.user) {
      await saveLogToDB('warn', 'User not found for member deletion', req.method, req.originalUrl, 401, null);
      return res.status(401).json({ message: 'User not found' });
    }

    if (member.user.toString() !== req.user.id && req.user.role !== 'admin') {
      await saveLogToDB('warn', 'Unauthorized member deletion attempt', req.method, req.originalUrl, 401, req.user?.id);
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update the associated user (optional: set role to 'user')
    const user = await User.findById(member.user);
    if (user) {
      user.role = 'user'; // Set role to 'user' (or leave it unchanged if preferred)
      await user.save();
      await saveLogToDB('info', `User role updated to 'user' for user: ${user._id}`, req.method, req.originalUrl, null, req.user?.id);
    } else {
      await saveLogToDB('warn', `Associated user not found for member: ${req.params.id}`, req.method, req.originalUrl, null, req.user?.id);
    }

    // Delete only the member document
    await member.deleteOne();

    await saveLogToDB('info', `Member deleted successfully: ${req.params.id}`, req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({ message: 'Member removed' });
  } catch (error) {
    await saveLogToDB('error', `Error deleting member: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

const renewMember = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { newMembershipId, paymentMethod } = req.body;

    await saveLogToDB('info', `Renewing membership for member: ${id}`, req.method, req.originalUrl, null, req.user?.id);
    console.log('Renew member request body:', { newMembershipId, paymentMethod });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await saveLogToDB('error', 'Invalid member ID format', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'Invalid member ID format' });
    }

    const member = await Member.findById(id);
    if (!member) {
      await saveLogToDB('error', 'Member not found', req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: 'Member not found' });
    }

    if (!newMembershipId || !paymentMethod) {
      await saveLogToDB('error', 'Missing required fields', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'Please provide newMembershipId and paymentMethod' });
    }

    if (!mongoose.Types.ObjectId.isValid(newMembershipId)) {
      await saveLogToDB('error', 'Invalid membership ID', req.method, req.originalUrl, 400, req.user?.id);
      return res.status(400).json({ message: 'Invalid membership ID' });
    }

    const newMembership = await Membership.findById(newMembershipId);
    if (!newMembership) {
      await saveLogToDB('error', 'New membership plan not found', req.method, req.originalUrl, 404, req.user?.id);
      return res.status(404).json({ message: 'New membership plan not found' });
    }

    const updatedMember = await member.renew(newMembershipId);
    updatedMember.membershipStatus = 'active';
    await updatedMember.save();

    console.log('Member renewed successfully:', updatedMember);

    // const transactionNumber = await getNextTransactionNumber();

    const transactionData = {
      // number: transactionNumber,
      type: 'income',
      entryType: 'IN',
      category: 'membership',
      amount: newMembership.price || 0,
      description: `Membership renewal - ${newMembership.name || 'Unknown'}`,
      paymentMethod: paymentMethod || 'cash',
      reference: member._id,
      referenceModel: 'Member',
      recordedBy: req.user?.id || mongoose.Types.ObjectId('default_user_id'),
      date: new Date(),
    };
    console.log('Attempting to create transaction with data:', transactionData);

    try {
      const transaction = await Transaction.create(transactionData);
      console.log('Transaction created for renewal:', transaction);
      await saveLogToDB('info', `Transaction created for renewal: ${transaction._id}`, req.method, req.originalUrl, 200, req.user?.id);
    } catch (transactionError) {
      console.error('Failed to create transaction for renewal:', transactionError);
      await saveLogToDB('error', `Transaction creation failed: ${transactionError.message}`, req.method, req.originalUrl, 500, req.user?.id);
      return res.status(500).json({
        message: 'Membership renewed, but transaction creation failed',
        error: transactionError.message,
      });
    }

    await saveLogToDB('info', 'Membership renewed successfully', req.method, req.originalUrl, 200, req.user?.id);
    res.status(200).json({
      message: 'Membership renewed successfully',
      member: updatedMember,
    });
  } catch (error) {
    console.error('Renew member error:', error);
    await saveLogToDB('error', `Error renewing membership: ${error.message}`, req.method, req.originalUrl, 500, req.user?.id);
    throw error;
  }
});

module.exports = {
  getMembers,
  getMemberProfile,
  createMember,
  updateMember,
  deleteMember,
  renewMember,
};