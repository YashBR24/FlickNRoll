// with email configration of user side like we have create a member aslo member is create in user data base.
const asyncHandler = require('express-async-handler');
const Member = require('../models/Member');
const User = require('../models/User');
const Membership = require('../models/Membership');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { log } = require('../middleware/logger');
const crypto = require('crypto');
const { sendEmail } = require('../config/emailConfig');
const jwt = require('jsonwebtoken');
const VerificationToken = require('../models/VerificationToken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const getMembers = asyncHandler(async (req, res) => {
  try {
    log('FETCHING_ALL_MEMBERS');
    if (!req.user) {
      log('UNAUTHORIZED_ACCESS_ATTEMPT');
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    const members = await Member.find()
        .populate('user', 'name email')
        .populate('membership', 'name totalHours')
        .select('hoursRemaining membershipStartDate membershipEndDate email phone address emergencyContact membershipStatus manualStatusOverride');

    for (const member of members) {
      const isExpired = new Date() > member.membershipEndDate;
      const hasNoHours = member.hoursRemaining <= 0;
      if (!member.manualStatusOverride) {
        if ((isExpired || hasNoHours) && member.membershipStatus !== 'inactive') {
          member.membershipStatus = 'inactive';
          await member.save();
        } else if (!isExpired && !hasNoHours && member.membershipStatus !== 'active') {
          member.membershipStatus = 'active';
          await member.save();
        }
      }
    }

    log(`RETRIEVED_MEMBERS_${members.length}`);
    res.status(200).json(members);
  } catch (error) {
    log(`ERROR_FETCHING_MEMBERS_${error.message}`);
    throw error;
  }
});

const getMemberProfile = asyncHandler(async (req, res) => {
  try {
    log('FETCHING_MEMBER_PROFILE');
    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_PROFILE_ACCESS_ATTEMPT');
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    const member = await Member.findOne({ user: req.user.id })
        .populate('user', 'name email')
        .populate('membership', 'name totalHours');
    if (!member) {
      log(`MEMBER_PROFILE_NOT_FOUND_${req.user.id}`);
      return res.status(404).json({
        message: 'Member profile not found. Please create a profile first.',
        suggestion: 'Use POST /api/members to create a profile.',
      });
    }
    log('MEMBER_PROFILE_RETRIEVED');
    res.status(200).json(member);
  } catch (error) {
    log(`ERROR_FETCHING_MEMBER_PROFILE_${error.message}`);
    throw error;
  }
});

const createMember = asyncHandler(async (req, res) => {
  let user = null; // Declare user outside try block
  try {
    log('CREATING_NEW_MEMBER');
    console.log('req.user:', req.user);
    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_MEMBER_CREATION_ATTEMPT');
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    const { name, email, membership, phoneNumber, dateOfBirth, gender, address, emergencyContact, paymentMethod } = req.body;

    console.log('Input validation starting...');
    if (!email || !membership || !phoneNumber || !paymentMethod || !dateOfBirth || !gender) {
      log('MISSING_REQUIRED_FIELDS_MEMBER_CREATION');
      return res.status(400).json({
        message: 'Please provide all required fields: email, membership, phoneNumber, paymentMethod, dateOfBirth, gender'
      });
    }

    console.log('Checking for existing user...');
    user = await User.findOne({ email });
    let userName = name;

    if (user) {
      userName = user.name;
      log(`LINKING_EXISTING_USER_${email}`);
    } else {
      console.log('Validating name for new user...');
      if (!name || typeof name !== 'string' || name.trim() === '') {
        log('NAME_REQUIRED_FOR_NEW_USER');
        return res.status(400).json({ message: 'Name is required when creating a new user' });
      }

      const tempPassword = crypto.randomBytes(20).toString('hex');
      console.log('Creating new user...');
      user = await User.create({
        name: name.trim(),
        email,
        password: tempPassword,
        phoneNumber,
        dateOfBirth,
        gender,
        isVerified: true,
        role: 'user',
      });

      console.log('Creating verification token...');
      const resetToken = crypto.randomBytes(32).toString('hex');
      await VerificationToken.create({
        email,
        token: resetToken,
        password: tempPassword,
        name: name.trim(),
        role: 'user',
      });

      const resetUrl = `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`;
      const emailContent = `
        <h1>Welcome to Pickleball Club!</h1>
        <p>Hello ${name},</p>
        <p>Your account has been created. Please set your password by clicking the link below:</p>
        <p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Set Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn’t expect this email, please contact our support team.</p>
      `;
      console.log('Sending email...');
      const emailSent = await sendEmail(email, 'Set Your Password', emailContent);
      if (!emailSent) {
        log(`FAILED_TO_SEND_PASSWORD_SETUP_EMAIL_${email}`);
        console.log('Email sending failed, but proceeding with member creation...');
      }
    }

    console.log('Checking for existing member...');
    const existingMember = await Member.findOne({ user: user._id });
    if (existingMember) {
      log(`MEMBER_ALREADY_EXISTS_${email}`);
      return res.status(400).json({ message: 'A membership already exists for this user' });
    }

    console.log('Fetching membership details...');
    const membershipDetails = await Membership.findById(membership);
    if (!membershipDetails) {
      log(`MEMBERSHIP_PLAN_NOT_FOUND_${membership}`);
      if (!userName && user) await User.findByIdAndDelete(user._id); // Cleanup only if user was created
      return res.status(404).json({ message: 'Membership not found' });
    }

    const membershipStartDate = new Date();
    const membershipEndDate = new Date();
    membershipEndDate.setDate(membershipStartDate.getDate() + membershipDetails.durationDays);

    console.log('Creating new member...');
    const newMember = await Member.create({
      user: user._id,
      name: userName.trim(),
      email,
      membership,
      phoneNumber, // Match schema field name
      dateOfBirth, // Add required field
      gender,      // Add required field
      address,
      emergencyContact,
      paymentMethod,
      hoursRemaining: membershipDetails.totalHours,
      membershipStartDate,
      membershipEndDate,
      membershipStatus: 'active',
    });

    console.log('Creating transaction with recordedBy:', req.user.id);
    await Transaction.create({
      type: 'income',
      entryType: 'IN',
      category: 'membership',
      amount: membershipDetails.price,
      description: `NEW_MEMBERSHIP_PURCHASE_BY-${membershipDetails.name}`,
      paymentMethod,
      reference: newMember._id,
      referenceModel: 'Member',
      recordedBy: req.user.id,
      date: new Date(),
    });

    log(`MEMBER_CREATED_${email}`);
    res.status(201).json({
      message: userName === name ? 'Member created successfully. Password setup email sent.' : 'Member linked to existing user successfully.',
      member: newMember,
    });
  } catch (error) {
    console.log('Error caught:', error.message);
    if (user && user._id) { // Only attempt cleanup if user was created
      const memberExists = await Member.findOne({ user: user._id });
      if (!memberExists) {
        await User.findByIdAndDelete(user._id);
        log(`CLEANUP_USER_${user._id}`);
      }
    }
    log(`ERROR_CREATING_MEMBER_${error.message}`);
    throw error;
  }
});
const updateMember = asyncHandler(async (req, res) => {
  try {
    log(`UPDATING_MEMBER_${req.params.id}`);
    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_UPDATE_ATTEMPT');
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    const member = await Member.findById(req.params.id).populate('user', 'name email');
    if (!member) {
      log(`MEMBER_NOT_FOUND_${req.params.id}`);
      return res.status(404).json({ message: 'Member not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      log(`UNAUTHORIZED_UPDATE_ATTEMPT_${req.user.role}`);
      return res.status(403).json({ message: 'User not authorized' });
    }

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
      memberUpdateData.manualStatusOverride = true;
    }
    if (req.body.name) memberUpdateData.name = req.body.name.trim();

    const updatedMember = await Member.findByIdAndUpdate(
        req.params.id,
        memberUpdateData,
        { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (req.body.name) {
      const user = await User.findById(member.user._id);
      if (user) {
        user.name = req.body.name.trim();
        await user.save();
        log(`USER_NAME_UPDATED_${user.name}_${user._id}`);
      }
    }

    log(`MEMBER_UPDATED_${req.params.id}`);
    res.status(200).json(updatedMember);
  } catch (error) {
    log(`ERROR_UPDATING_MEMBER_${error.message}`);
    throw error;
  }
});

const deleteMember = asyncHandler(async (req, res) => {
  try {
    log(`DELETING_MEMBER_${req.params.id}`);
    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_DELETE_ATTEMPT');
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    const member = await Member.findById(req.params.id);
    if (!member) {
      log(`MEMBER_NOT_FOUND_${req.params.id}`);
      return res.status(404).json({ message: 'Member not found' });
    }

    if (member.user.toString() !== req.user.id && req.user.role !== 'admin') {
      log(`UNAUTHORIZED_DELETE_ATTEMPT_${req.user.role}`);
      return res.status(403).json({ message: 'User not authorized' });
    }

    const user = await User.findById(member.user);
    if (user) {
      user.role = 'user';
      await user.save();
      log(`USER_ROLE_UPDATED_${user._id}`);
    }

    await member.deleteOne();

    log(`MEMBER_DELETED_${req.params.id}`);
    res.status(200).json({ message: 'Member removed' });
  } catch (error) {
    log(`ERROR_DELETING_MEMBER_${error.message}`);
    throw error;
  }
});

const renewMember = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { newMembershipId, paymentMethod } = req.body;

    log(`RENEWING_MEMBERSHIP_${id}`);
    if (!req.user || !req.user.id) {
      log('UNAUTHORIZED_RENEWAL_ATTEMPT');
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      log(`INVALID_MEMBER_ID_${id}`);
      return res.status(400).json({ message: 'Invalid member ID format' });
    }

    const member = await Member.findById(id);
    if (!member) {
      log(`MEMBER_NOT_FOUND_${id}`);
      return res.status(404).json({ message: 'Member not found' });
    }

    if (!newMembershipId || !paymentMethod) {
      log('MISSING_REQUIRED_FIELDS_RENEWAL');
      return res.status(400).json({ message: 'Please provide newMembershipId and paymentMethod' });
    }

    if (!mongoose.Types.ObjectId.isValid(newMembershipId)) {
      log(`INVALID_MEMBERSHIP_ID_${newMembershipId}`);
      return res.status(400).json({ message: 'Invalid membership ID' });
    }

    const newMembership = await Membership.findById(newMembershipId);
    if (!newMembership) {
      log(`NEW_MEMBERSHIP_NOT_FOUND_${newMembershipId}`);
      return res.status(404).json({ message: 'New membership plan not found' });
    }

    const updatedMember = await member.renew(newMembershipId);
    updatedMember.membershipStatus = 'active';
    await updatedMember.save();

    // Debug: Log before Transaction.create
    console.log('Creating transaction with recordedBy:', req.user.id);
    await Transaction.create({
      type: 'income',
      entryType: 'IN',
      category: 'membership',
      amount: newMembership.price || 0,
      description: `MEMBERSHIP_RENEWAL_BY-${newMembership.name || 'Unknown'}`,
      paymentMethod: paymentMethod || 'cash',
      reference: member._id,
      referenceModel: 'Member',
      recordedBy: req.user.id, // Explicitly use req.user.id
      date: new Date(),
    });

    log('MEMBERSHIP_RENEWED');
    res.status(200).json({
      message: 'Membership renewed successfully',
      member: updatedMember,
    });
  } catch (error) {
    log(`ERROR_RENEWING_MEMBERSHIP_${error.message}`);
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